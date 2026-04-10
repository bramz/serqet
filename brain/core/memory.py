import os
import logging
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

logger = logging.getLogger(__name__)


class LongtermMemory:
    def __init__(self):
        try:
            self._embeddings = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",   # embedding-001 was deprecated
                task_type="retrieval_document",       # optimises vectors for similarity search
                google_api_key=os.getenv("GEMINI_API_KEY")
            )
            self._store = Chroma(
                collection_name="serqet_life_data",
                embedding_function=self._embeddings,
                persist_directory="./chroma_db",
            )
            logger.info("[MEMORY] Subsystem online")
        except Exception as e:
            logger.error("[MEMORY] Init failed: %s", e)
            self._store = None

    @property
    def _ok(self) -> bool:
        return self._store is not None

    def archive(self, text: str, metadata: dict | None = None) -> None:
        if not self._ok:
            return
        meta = {"session_id": "default", **(metadata or {})}
        try:
            self._store.add_texts(texts=[text], metadatas=[meta])
        except Exception as e:
            logger.warning("[MEMORY] Archive failed: %s", e)

    def recall(self, query: str, session_id: str, k: int = 3) -> str:
        if not self._ok:
            return ""
        try:
            # Use retrieval_query task type at search time for best accuracy
            query_embeddings = GoogleGenerativeAIEmbeddings(
                model="models/text-embedding-004",
                task_type="retrieval_query",
                google_api_key=os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY"),
            )
            results = self._store.similarity_search_by_vector(
                embedding=query_embeddings.embed_query(query),
                k=k,
                filter={"session_id": session_id},
            )
            return "\n".join(r.page_content for r in results)
        except Exception as e:
            logger.warning("[MEMORY] Recall failed: %s", e)
            return ""

    def get_count(self) -> int:
        if not self._ok:
            return 0
        try:
            return self._store._collection.count()
        except Exception as e:
            logger.warning("[MEMORY] Count failed: %s", e)
            return 0


memory_engine = LongtermMemory()