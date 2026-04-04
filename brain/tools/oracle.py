from langchain_core.tools import tool
from typing import Annotated, Dict, Any

@tool
def archive_knowledge_node(topic: str, content: str, tags: str = "") -> Dict[str, Any]:
    """Saves a technical summary or 'cheat sheet' to the Oracle knowledge base."""
    return {"action": "db_save_knowledge", "topic": topic, "content": content, "tags": tags}

@tool
def submit_for_review(
    action_type: Annotated[str, "Type: 'Job_App', 'Email', or 'Social'"],
    title: Annotated[str, "Short descriptive title of the action"],
    content: Annotated[str, "The full body of the draft or application data"],
    priority: Annotated[str, "Priority: 'High', 'Medium', 'Low'"] = "Medium"
):
    """
    Saves a completed draft to the Executive Action Queue for user approval.
    If you have multiple items (like 3 jobs), call this tool multiple times.
    """
    return {
        "action": "execute_submit_for_review",
        "type": action_type,
        "title": title,
        "content": content,
        "priority": priority
    }