from fastapi import FastAPI
from schemas.request import IntentRequest
from agents.serqet_graph import build_graph
from langchain_core.messages import HumanMessage, AIMessage
import uvicorn

app = FastAPI()
serqet_brain = build_graph()

@app.post("/brain/v1/process_intent")
async def process_intent(req: IntentRequest):
    # Prepare history
    messages = []
    for m in req.history:
        msg_type = HumanMessage if m.role == "user" else AIMessage
        messages.append(msg_type(content=m.text))
    messages.append(HumanMessage(content=req.query))
    
    result = serqet_brain.invoke({"messages": messages, "action": None, "tool_data": None})
    
    last_msg = result["messages"][-1]
    return {
        "status": "success",
        "message": last_msg.content if last_msg.content else "Action processing...",
        "action": result["action"],
        "data": result.get("tool_data")
    }

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)