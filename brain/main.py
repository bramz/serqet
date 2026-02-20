import os
import re
from typing import Annotated, TypedDict, List
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage
from langgraph.graph import StateGraph, END

dotenv.load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

app = FastAPI()

gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview", 
    version="v1beta", # preview models require vibeta
    temperature=0.3,
    max_retries=1,
    google_api_key=os.getenv("GEMINI_API_KEY")
)
local_llm = ChatOllama(model="llama3.2:3b", temperature=0.2)

class Message(BaseModel):
    role: str
    text: str

class IntentRequest(BaseModel):
    user_id: str
    query: str
    history: List[Message] = []

class AgentState(TypedDict):
    messages: List[HumanMessage | AIMessage | SystemMessage]
    action: str | None

def parse_content(content) -> str:
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and 'text' in item:
                return item['text']
    return str(content)

def agent_node(state: AgentState):
    system_instruction = SystemMessage(content=(
        "You are Serqet, a 2026-era Personal OS Assistant. "
        "You have access to Social, Finance, and Task modules. "
        "Logic: Always include 'ACTION: view_<module>' if navigating. "
        "Be lightning-fast and concise."
    ))
    
    full_prompt = [system_instruction] + state["messages"]
    action = None

    try:
        print("Attempting gemini")
        response = gemini_llm.invoke(full_prompt)
        text = parse_content(response.content)
        action_match = re.search(r"ACTION:\s*(view_\w+)", text)
        if action_match:
            action = action_match.group(1)

        clean_message = re.sub(r"ACTION:\s*view_\w+", "", text).strip()

        print(f"Gemini response: {text}, action: {action}")
        return {"messages": [AIMessage(content=clean_message)], "action": extract_action(action)}
    except Exception as e:
        print(f"Gemini failed: {e}")

    try:
        print("Falling back to local ollama")
        response = local_llm.invoke(full_prompt)
        return {"messages": [response], "action": extract_action(response.content)}
    except Exception as e:
        print(f"Ollama failed: {e}")

    error_msg = AIMessage(content="I'm having trouble connecting to my cognitive engines.")
    return {"messages": [error_msg], "action": None}


def extract_action(content: str):
    if "view_social" in content: return "view_social"
    if "view_finance" in content: return "view_finance"
    if "view_task" in content: return "view_task"
    return None


workflow = StateGraph(AgentState)
workflow.add_node("serqet", agent_node)
workflow.set_entry_point("serqet")
workflow.add_edge("serqet", END)
serqet_brain = workflow.compile()

@app.post("/brain/v1/process_intent")
async def process_intent(req: IntentRequest):
    messages = []
    for m in req.history:
        role_map = {"user": HumanMessage, "serqet": AIMessage}
        messages.append(role_map.get(m.role, HumanMessage)(content=m.text))
    
    messages.append(HumanMessage(content=req.query))
    
    result = serqet_brain.invoke({"messages": messages, "action": None})
    last_msg = result["messages"][-1].content
    
    return {
        "status": "success",
        "message": last_msg,
        "action": result["action"]
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)