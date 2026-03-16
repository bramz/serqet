import uvicorn
import logging
from fastapi import FastAPI, HTTPException
from schemas.request import IntentRequest
from agents.node import build_graph
from langchain_core.messages import HumanMessage, AIMessage
from core.memory import memory_engine

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("serqet-brain")

app = FastAPI(title="Serqet OS Brain", version="1.0.0")

serqet_brain = build_graph()

@app.post("/brain/v1/process_intent")
async def process_intent(req: IntentRequest):
    try:
        messages = []
        for m in req.history:
            if m.role == "user":
                messages.append(HumanMessage(content=m.text))
            else:
                messages.append(AIMessage(content=m.text))
        
        messages.append(HumanMessage(content=req.query))
        
        initial_state = {
            "messages": messages,
            "session_id": req.session_id,
            "action": None,
            "tool_data": None
        }
        
        logger.info(f"Processing Session: {req.session_id}")
        
        result = serqet_brain.invoke(initial_state)
        last_msg = result["messages"][-1]
        display_text = last_msg.content if last_msg.content else "Executing requested module..."

        return {
            "status": "success",
            "message": display_text,
            "action": result.get("action"),
            "data": result.get("tool_data"),
            "session_id": req.session_id
        }

    except Exception as e:
        logger.error(f"!!! [BRAIN PANIC] !!!: {str(e)}")
        return {
            "status": "error",
            "message": "I've encountered a neural link error. Attempting to reset context...",
            "action": None,
            "data": None
        }

@app.get("/health")
async def health():
    return {"status": "online", "engine": "gemini-3-flash-preview"}

@app.get("/brain/v1/memory/stats")
async def get_memory_stats():
    count = memory_engine.get_count()
    return {"vector_count": count}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)