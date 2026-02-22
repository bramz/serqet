from typing import TypedDict, List, Optional, Any
from langchain_core.messages import BaseMessage


class AgentState(TypedDict):
    messages: List[BaseMessage]
    action: Optional[str]
    tool_data: Optional[Any] # Added to carry tool arguments back to gateway