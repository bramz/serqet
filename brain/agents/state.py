from typing import TypedDict, List, Any, Optional
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: List[BaseMessage]
    session_id: str
    file_path: Optional[str]
    action: Optional[str]
    tool_data: Optional[Any]