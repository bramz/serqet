from langchain_core.tools import tool

@tool
def create_task(title: str, due_date: str = "Tomorrow"):
    """
    Creates a new task or to-do item.
    Use this when the user wants to remember to do something, 
    especially following up on jobs or social posts.
    """
    return {"action": "db_create_task", "title": title, "due_date": due_date}