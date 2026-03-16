from typing import TypedDict, List, Any, Optional
from langchain_core.messages import BaseMessage

class AgentState(TypedDict):
    messages: List[BaseMessage]
    session_id: str              # NEW: Track session context in the graph
    action: Optional[str]
    tool_data: Optional[Any]