import os
import uvicorn
from typing import Annotated, TypedDict
from fastapi import FastAPI
from pydantic import BaseModel
from langgraph.graph import StateGraph, END

class AgentState(TypedDict):
    """The state of our conversation/thought process."""
    user_query: str
    category: str
    response: str
    action_required: str | None

class IntentRequest(BaseModel):
    user_id: str
    query: str

class IntentResponse(BaseModel):
    status: str
    message: str
    action: str | None = None
    data: dict | None = None


def classifier_node(state: AgentState):
    """
      Decide what the user is talking about
      In a production version, this would be an LLM call:
      Which module does this query belong to: [Social, Finance, Task, General]?
    """
    query = state["user_query"].lower()
    
    category = "general"
    if any(word in query for word in ["post", "tweet", "social", "instagram"]):
        category = "social"
    elif any(word in query for word in ["money", "spent", "budget", "bank"]):
        category = "finance"
    elif any(word in query for word in ["todo", "task", "remind"]):
        category = "task"
        
    return {"category": category}

def orchestrator_node(state: AgentState):
    """Generate a response based on the category."""
    category = state["category"]
    query = state["user_query"]
    
    responses = {
        "social": f"I've opened your social media hub. Ready to draft a post about '{query}'?",
        "finance": "Accessing your encrypted ledgers. Would you like a summary of this week's spending?",
        "task": f"Adding '{query}' to your high-priority list. Want me to set a deadline?",
        "general": f"You said: '{query}'. How can I help you manage your life today?"
    }
    
    return {
        "response": responses.get(category, "I'm not sure how to handle that yet."),
        "action_required": f"view_{category}" if category != "general" else None
    }


# Build graph
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("classifier", classifier_node)
workflow.add_node("orchestrator", orchestrator_node)

# Set flow: start -> classifier -> orchestrator -> end
workflow.set_entry_point("classifier")
workflow.add_edge("classifier", "orchestrator")
workflow.add_edge("orchestrator", END)

# Compile the graph
serqet_brain = workflow.compile()


# FastAPI
app = FastAPI(title="Serqet OS Brain")

@app.post("/brain/v1/process_intent")
async def process_intent(req: IntentRequest) -> IntentResponse:
    # Initialize the state
    initial_state = {
        "user_query": req.query,
        "category": "unknown",
        "response": "",
        "action_required": None
    }
    
    # Run the graph
    final_output = serqet_brain.invoke(initial_state)
    
    return IntentResponse(
        status="success",
        message=final_output["response"],
        action=final_output["action_required"]
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)