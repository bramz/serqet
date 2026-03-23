from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str
    text: str

class IntentRequest(BaseModel):
    user_id: str
    session_id: str = "default"
    query: str
    file_path: Optional[str] = None
    history: List[Message] = []