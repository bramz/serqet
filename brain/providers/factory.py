import os
import types
import functools
import logging
import warnings

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatOllama

load_dotenv()

logger = logging.getLogger(__name__)

_GOOGLE_KEY = os.getenv("GEMINI_API_KEY")
if not _GOOGLE_KEY:
    warnings.warn("[LLM] GOOGLE_API_KEY / GEMINI_API_KEY not set — Gemini calls will fail")

# Models in priority order.
# To verify which models your API key can see, run this once in a separate script
# (do NOT import google.generativeai in this file — it is deprecated):
#
#   python - <<'EOF'
#   import google.genai as genai, os
#   client = genai.Client(api_key=os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY"))
#   for m in client.models.list():
#       print(m.name)
#   EOF
#
GEMINI_MODELS: list[str] = [
    "gemini-3-flash-preview",
    "gemini-3-pro-preview",
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
]


def _disable_sdk_retry(llm: ChatGoogleGenerativeAI) -> None:
    """
    The google-genai SDK retries 429s via tenacity inside BaseApiClient._request:

        return retry(self._request_once, http_request, stream)   # line ~1230

    The retry object is not a simple attribute — it's resolved and called inline,
    so patching _retry / retry on the instance has no effect.  The only reliable
    fix is to replace _request itself with a version that calls _request_once
    directly, skipping the retry wrapper entirely.
    """
    try:
        api_client = llm.client._api_client

        def _request_no_retry(self_inner, http_request, http_options, stream=False):
            return self_inner._request_once(http_request, stream)

        # Bind as an instance method so `self` resolves to api_client
        api_client._request = types.MethodType(_request_no_retry, api_client)
        logger.debug("[LLM] SDK retry disabled for model '%s'", llm.model)
    except Exception as exc:
        logger.warning(
            "[LLM] Could not disable SDK retry (SDK internals may have changed): %s", exc
        )


def _make_gemini(model: str) -> ChatGoogleGenerativeAI:
    llm = ChatGoogleGenerativeAI(
        model=model,
        temperature=0.3,
        max_retries=0,  # disables LangChain's retry layer
    )
    _disable_sdk_retry(llm)
    return llm


def _is_quota_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "resource_exhausted" in msg or "429" in msg or "quota" in msg


def _is_not_found_error(exc: Exception) -> bool:
    msg = str(exc).lower()
    return "not_found" in msg or "404" in msg


class RotatingGemini:
    """
    Wraps multiple Gemini model instances and rotates through them when a
    RESOURCE_EXHAUSTED (429) error is hit.  Models that return 404 are
    permanently evicted from the rotation on first encounter.
    """

    def __init__(self, models: list[str] = GEMINI_MODELS) -> None:
        self._models: list[str] = list(models)
        self._clients: list[ChatGoogleGenerativeAI] = [_make_gemini(m) for m in self._models]
        self._index: int = 0

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    @property
    def _current(self) -> ChatGoogleGenerativeAI:
        return self._clients[self._index]

    def _rotate(self) -> None:
        self._index = (self._index + 1) % len(self._clients)
        logger.warning("[LLM] Rotated to Gemini model: %s", self._models[self._index])

    def _evict_current(self) -> None:
        """Permanently remove a 404 model from the pool."""
        if len(self._clients) <= 1:
            raise RuntimeError("[LLM] No Gemini models remaining after eviction.")
        evicted = self._models[self._index]
        self._clients.pop(self._index)
        self._models.pop(self._index)
        self._index = self._index % len(self._clients)
        logger.error("[LLM] Evicted unavailable model '%s'. Remaining: %s", evicted, self._models)

    def _try_all(self, method: str, *args, **kwargs):
        last_exc: Exception | None = None
        for _ in range(len(self._clients)):
            if not self._clients:
                break
            try:
                return getattr(self._current, method)(*args, **kwargs)
            except Exception as exc:
                if _is_quota_error(exc):
                    logger.warning("[LLM] Quota hit on '%s' — rotating.", self._models[self._index])
                    self._rotate()
                    last_exc = exc
                elif _is_not_found_error(exc):
                    self._evict_current()
                    last_exc = exc
                else:
                    raise  # auth errors, malformed requests, etc. — surface immediately
        raise RuntimeError("[LLM] All Gemini models exhausted or unavailable.") from last_exc

    async def _try_all_async(self, method: str, *args, **kwargs):
        last_exc: Exception | None = None
        for _ in range(len(self._clients)):
            if not self._clients:
                break
            try:
                return await getattr(self._current, method)(*args, **kwargs)
            except Exception as exc:
                if _is_quota_error(exc):
                    logger.warning("[LLM] Quota hit on '%s' — rotating.", self._models[self._index])
                    self._rotate()
                    last_exc = exc
                elif _is_not_found_error(exc):
                    self._evict_current()
                    last_exc = exc
                else:
                    raise
        raise RuntimeError("[LLM] All Gemini models exhausted or unavailable.") from last_exc

    # ------------------------------------------------------------------
    # Quota-sensitive call paths — go through rotation logic
    # ------------------------------------------------------------------

    def invoke(self, *args, **kwargs):
        return self._try_all("invoke", *args, **kwargs)

    def stream(self, *args, **kwargs):
        return self._try_all("stream", *args, **kwargs)

    async def ainvoke(self, *args, **kwargs):
        return await self._try_all_async("ainvoke", *args, **kwargs)

    async def astream(self, *args, **kwargs):
        return await self._try_all_async("astream", *args, **kwargs)

    # ------------------------------------------------------------------
    # Everything else (bind_tools, with_config, with_structured_output …)
    # proxied transparently to the currently active client
    # ------------------------------------------------------------------

    def __getattr__(self, name: str):
        return getattr(self._current, name)


# ------------------------------------------------------------------
# Public factory
# ------------------------------------------------------------------

_rotating_gemini: RotatingGemini | None = None


@functools.lru_cache(maxsize=4)
def get_llm(provider: str = "gemini"):
    """
    Cached LLM factory.  Calling get_llm('gemini') twice returns the same
    RotatingGemini instance instead of constructing new HTTP clients each time.
    """
    global _rotating_gemini
    if provider == "gemini":
        if _rotating_gemini is None:
            _rotating_gemini = RotatingGemini()
        return _rotating_gemini
    if provider == "ollama":
        return ChatOllama(model="llama3.2:3b", temperature=0.2)
    raise ValueError(f"Unknown provider: {provider!r}")
