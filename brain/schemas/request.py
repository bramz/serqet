from pydantic import BaseModel
from typing import List

class Message(BaseModel):
    role: str
    text: str

class IntentRequest(BaseModel):
    user_id: str
    query: str
    history: List[Message] = []