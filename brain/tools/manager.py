from langchain_core.tools import tool

@tool
def ask_user_question(question_text: str, category: str):
    """
    Use this tool to proactively ask the user a question about their day.
    Categories: 'productivity', 'health', 'finance'.
    """
    return {
        "action": "db_log_unanswered_question",
        "question": question_text,
        "category": category
    }