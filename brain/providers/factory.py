import os
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatOllama

load_dotenv()
os.getenv("GOOGLE_API_KEY")

def get_llm(provider="gemini"):
    if provider == "gemini":
        return ChatGoogleGenerativeAI(
            model="gemini-3-flash-preview",
            # version="v1beta",
            temperature=0.3,
            max_retries=1
        )
    return ChatOllama(model="llama3.2:3b", temperature=0.2)