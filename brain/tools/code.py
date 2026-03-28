from langchain_core.tools import tool

@tool
def document_code_logic(file_name: str, language: str, code: str, description: str):
    """Builder: Saves a code refactor or new feature logic for Serqet's own expansion."""
    return {"action": "db_save_code", "file_name": file_name, "language": language, "code": code, "description": description}
