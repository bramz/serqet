from pydantic import BaseModel
from typing import List, Optional

class Message(BaseModel):
    role: str
    text: str

class IntentRequest(BaseModel):
    user_id: str
    session_id: str = "default"
    query: str
    history: List[Message] = []