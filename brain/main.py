import uvicorn
import logging
import os
import uuid
from fastapi import FastAPI, HTTPException
from schemas.request import IntentRequest
from agents.node import build_graph
from langchain_core.messages import HumanMessage, AIMessage
from core.memory import memory_engine
from utils.voice import generate_speech, generate_speech_async

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("serqet-brain")

app = FastAPI(title="Serqet OS Brain", version="1.2.0")

serqet_brain = build_graph()

UPLOAD_DIR = os.path.abspath("../gateway/uploads")

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
            "file_path": req.file_path,
            "action": None,
            "tool_data": None
        }
        
        logger.info(f"[BRAIN] Processing Session: {req.session_id}")
        
        result = serqet_brain.invoke(initial_state)
        
        last_msg = result["messages"][-1]
        
        action_val = result.get("action")
        action_str = str(action_val) if action_val else ""
        
        if hasattr(last_msg.content, '__iter__') and not isinstance(last_msg.content, str):
            display_text = "Processing visual/audio data..."
            for part in last_msg.content:
                if isinstance(part, dict) and part.get("type") == "text":
                    display_text = part.get("text", "")
        else:
            display_text = last_msg.content if last_msg.content else "Executing OS module..."

        audio_url = None
        if display_text and not action_str.startswith("execute_"):
            try:
                voice_filename = f"speech_{uuid.uuid4().hex}.mp3"
                voice_save_path = os.path.join(UPLOAD_DIR, voice_filename)
                
                success = await generate_speech_async(display_text, voice_save_path)
                
                if success:
                    audio_url = f"/uploads/{voice_filename}"
                    logger.info(f"[VOICE] Free Neural Synthesis: {audio_url}")
            except Exception as ve:
                logger.error(f"[VOICE ERROR] Synthesis failed: {ve}")

        return {
            "status": "success",
            "message": display_text,
            "audio_url": audio_url,
            "action": action_val,
            "data": result.get("tool_data"),
            "session_id": req.session_id
        }

    except Exception as e:
        logger.error(f"!!! [BRAIN PANIC] !!!: {str(e)}")
        return {
            "status": "error",
            "message": f"Neural Link Error: {str(e)}",
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
    if not os.path.exists(UPLOAD_DIR):
        os.makedirs(UPLOAD_DIR, exist_ok=True)
        
    uvicorn.run(app, host="0.0.0.0", port=8000)