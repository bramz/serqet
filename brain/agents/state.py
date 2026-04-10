from typing import Any, Optional
from typing_extensions import TypedDict
from langchain_core.messages import BaseMessage


class AgentState(TypedDict, total=False):
    messages:   list[BaseMessage]
    session_id: str
    user_id:    str
    file_path:  Optional[str]
    action:     Optional[str]
    tool_data:  Optional[dict[str, Any]]
    _loop:      bool          # internal routing flag