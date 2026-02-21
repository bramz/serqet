import os
import re
from typing import Annotated, TypedDict, List, Any, Optional
from fastapi import FastAPI
from pydantic import BaseModel
import uvicorn
import dotenv

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_community.chat_models import ChatOllama
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage, BaseMessage
from langgraph.graph import StateGraph, END
from langchain_core.tools import tool

dotenv.load_dotenv()
os.environ["GOOGLE_API_KEY"] = os.getenv("GEMINI_API_KEY")

app = FastAPI()

# Tools require docstrings
@tool
def create_social_draft(content: str, platform: str = "x"):
    """
    Creates a draft for a social media post. 
    Call this when the user wants to write, draft, or prepare a post for X, Twitter, or LinkedIn.
    """
    return {"action": "db_save_draft", "content": content, "platform": platform}

@tool
def record_expense(amount: float, category: str, description: str):
    """
    Records a financial expense. 
    Call this when the user mentions spending money, buying something, or paying a bill.
    """
    return {"action": "db_record_expense", "amount": amount, "category": category, "description": description}

@tool
def create_task(title: str, due_date: str = "Tomorrow"):
    """
    Creates a new task or to-do item.
    Use this when the user wants to remember to do something, 
    especially following up on jobs or social posts.
    """
    return {"action": "db_create_task", "title": title, "due_date": due_date}

@tool
def track_job_application(company: str, role: str, status: str, link: str = "", salary_range: str = ""):
    """
    Tracks a new job application.
    Call this when the user says they applied for a job or found a job they like.
    """
    return {
        "action": "db_track_job",
        "company": company,
        "role": role,
        "status": status,
        "link": link,
        "salary_range": salary_range
    }

class Message(BaseModel):
    role: str
    text: str

class IntentRequest(BaseModel):
    user_id: str
    query: str
    history: List[Message] = []

class AgentState(TypedDict):
    messages: List[BaseMessage]
    action: Optional[str]
    tool_data: Optional[Any] # Added to carry tool arguments back to gateway

gemini_llm = ChatGoogleGenerativeAI(
    model="gemini-3-flash-preview", 
    version="v1beta", 
    temperature=0.3,
    max_retries=1
)

local_llm = ChatOllama(model="llama3.2:3b", temperature=0.2)

def parse_content(content) -> str:
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and 'text' in item:
                return item['text']
    return str(content)

def agent_node(state: AgentState):
    system_instruction = SystemMessage(content=(
        "You are Serqet, a 2026-era personal assistant. "
        "Logic: If a tool is needed, call it. If not, respond concisely. "
        "Always include 'ACTION: view_<module>' if navigating manually."
    ))
    
    full_prompt = [system_instruction] + state["messages"]
    llm_with_tool = gemini_llm.bind_tools(
        [
            create_social_draft, 
            record_expense,
            create_task,
            track_job_application
        ]
    )

    try:
        print("Attempting Gemini...")
        response = llm_with_tool.invoke(full_prompt)
    
        # Use a tool
        if hasattr(response, 'tool_calls') and response.tool_calls:
            tool_call = response.tool_calls[0]
            print(f"Tool Call Detected: {tool_call['name']}")
            return {
                "messages": [response], 
                "action": f"execute_{tool_call['name']}",
                "tool_data": tool_call['args']
            }
        
        # Normal conversational response
        text = parse_content(response.content)
        action = None
        action_match = re.search(r"ACTION:\s*(view_\w+)", text)
        if action_match:
            action = action_match.group(1)

        clean_message = re.sub(r"ACTION:\s*view_\w+", "", text).strip()
        return {"messages": [AIMessage(content=clean_message)], "action": action, "tool_data": None}

    except Exception as e:
        print(f"Gemini failed: {e}")

    # Fallback to Ollama
    try:
        print("Falling back to local Ollama...")
        response = local_llm.invoke(full_prompt)
        text = response.content
        # Ollama doesn't support tool calling as easily in this setup, 
        # so we just parse the text for view actions.
        action = None
        if "view_social" in text: action = "view_social"
        elif "view_finance" in text: action = "view_finance"
        elif "view_task" in text: action = "view_task"
        elif "view_jobs" in text: action = "view_jobs"
        
        return {"messages": [response], "action": action, "tool_data": None}
    except Exception as e:
        print(f"Ollama failed: {e}")

    error_msg = AIMessage(content="Cognitive engines are offline. Check your connection.")
    return {"messages": [error_msg], "action": None, "tool_data": None}


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
    
    result = serqet_brain.invoke({"messages": messages, "action": None, "tool_data": None})
    last_msg_obj = result["messages"][-1]
    content = last_msg_obj.content if last_msg_obj.content else "Processing requested action..."
    print(result.get("tool_data"))
    return {
        "status": "success",
        "message": content,
        "action": result["action"],
        "data": result.get("tool_data") # This is vital for Go to save to DB
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)