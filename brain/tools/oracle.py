from langchain_core.tools import tool
from typing import Dict, Any

@tool
def archive_knowledge_node(topic: str, content: str, tags: str = "") -> Dict[str, Any]:
    """Saves a technical summary or 'cheat sheet' to the Oracle knowledge base."""
    return {"action": "db_save_knowledge", "topic": topic, "content": content, "tags": tags}
