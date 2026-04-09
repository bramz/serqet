import os
import functools
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatOllama
 
load_dotenv()
 
# Validate required keys at startup rather than silently ignoring them
_GOOGLE_KEY = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
if not _GOOGLE_KEY:
    import warnings
    warnings.warn("[LLM] GOOGLE_API_KEY / GEMINI_API_KEY not set — Gemini calls will fail")
 
@functools.lru_cache(maxsize=4)
def get_llm(provider: str = "gemini"):
    """
    Cached LLM factory.  Calling get_llm('gemini') twice returns the
    same instance instead of constructing a new HTTP client each time.
    """
    if provider == "gemini":
        return ChatGoogleGenerativeAI(
            model="gemini-2.0-flash",
            temperature=0.3,
            max_retries=2,
        )
    if provider == "ollama":
        return ChatOllama(model="llama3.2:3b", temperature=0.2)
    raise ValueError(f"Unknown provider: {provider!r}")
