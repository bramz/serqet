import os
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

class LongtermMemory:
    def __init__(self):
        try:
            self.embeddings = GoogleGenerativeAIEmbeddings(
                model="gemini-embedding-001", # gemini-embedding-001 is the embedding-capable model
                # version="v1",
                google_api_key=os.getenv("GEMINI_API_KEY")
            )
            
            self.vector_store = Chroma(
                collection_name="serqet_life_data",
                embedding_function=self.embeddings,
                persist_directory="./chroma_db"
            )
            print("[MEMORY] Subsystem Online")
        except Exception as e:
            print(f"[MEMORY INIT CRITICAL ERROR]: {e}")
            self.vector_store = None

    def archive(self, text: str, metadata: dict = None):
        if not self.vector_store: return
        
        metadata = metadata or {}
        if "session_id" not in metadata: metadata["session_id"] = "default"

        try:
            self.vector_store.add_texts(texts=[text], metadatas=[metadata])
            print(f"[MEMORY] Archived context for session: {metadata['session_id']}")
        except Exception as e:
            print(f"[MEMORY ERROR] Archive failed: {e}")

    def recall(self, query: str, session_id: str, k: int = 3):
        if not self.vector_store: return ""
        
        try:
            results = self.vector_store.similarity_search(
                query, 
                k=k, 
                filter={"session_id": session_id}
            )
            return "\n".join([res.page_content for res in results])
        except Exception as e:
            print(f"[MEMORY ERROR] Recall failed: {e}")
            return ""

memory_engine = LongtermMemory()