from langchain_chroma import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

class LongtermMemory:
    def __init__(self):
        self.embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001")
        self.vector_store = Chroma(
            collection_name="serqet_life_data",
            embedding_function=self.embeddings,
            persist_directory="./chroma_db"
        )

    def store_event(self, text: str, metadata: dict):
        """Vectorizes and stores a life event (a post, a meal, a trade)."""
        self.vector_store.add_texts(texts=[text], metadatas=[metadata])

    def recall(self, query: str, k=5):
        """Search for relevant past context."""
        return self.vector_store.similarity_search(query, k=k)

memory_engine = LongtermMemory()