import os
from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

class LongtermMemory:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="text-embedding-004", 
            task_type="retrieval_document"
        )
        
        self.vector_store = Chroma(
            collection_name="serqet_life_data",
            embedding_function=self.embeddings,
            persist_directory="./chroma_db"
        )

    def archive(self, text: str, metadata: dict = None):
        """Vectorizes and stores a life event."""
        print(f"--- [MEMORY] Archiving: {text[:50]}... ---")
        self.vector_store.add_texts(texts=[text], metadatas=[metadata or {}])

    def recall(self, query: str, k=3):
        """Search for relevant past context and return as a string."""
        try:
            results = self.vector_store.similarity_search(query, k=k)
            if not results:
                return ""
            return "\n".join([res.page_content for res in results])
        except Exception as e:
            print(f"--- [MEMORY ERROR] Recall failed: {e} ---")
            return ""

# Initialize global instance
memory_engine = LongtermMemory()