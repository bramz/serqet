from langchain_core.tools import tool

@tool
def create_social_draft(content: str, platform: str = "x"):
    """Creates a draft for a social media post for X, Twitter, Facebook or LinkedIn."""
    return {"action": "db_save_draft", "content": content, "platform": platform}