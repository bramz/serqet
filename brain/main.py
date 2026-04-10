import uvicorn
import logging
import os
import uuid
from fastapi import FastAPI
from schemas.request import IntentRequest
from agents.node import build_graph
from langchain_core.messages import HumanMessage, AIMessage
from core.memory import memory_engine
from utils.voice import generate_speech_async

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("serqet-brain")

app = FastAPI(title="Serqet OS Brain", version="1.2.0")

serqet_brain = build_graph()

UPLOAD_DIR = os.path.abspath("../gateway/uploads")


def _extract_display_text(last_msg, action: str, tool_data: dict | None) -> str:
    """
    Derive a human-readable string from the last graph message.

    Cases:
      1. Tool-call response   — last_msg.content is empty / a list of tool blocks.
                                Return a status string so Go always gets something.
      2. Multipart content    — pull the first text part (vision / audio uploads).
      3. Plain string         — return as-is.
    """
    # When the brain executed a tool the LLM message carries tool-use blocks,
    # not prose.  Build a status string from the action name instead.
    if action.startswith("execute_"):
        action_label = action.replace("execute_", "").replace("_", " ").title()
        if tool_data:
            # Surface a meaningful field if present
            label = (
                tool_data.get("name")
                or tool_data.get("title")
                or tool_data.get("query")
                or action_label
            )
            return f"Executing {action_label}: {label}"
        return f"Executing {action_label}…"

    content = last_msg.content

    # Multipart (vision / audio)
    if hasattr(content, "__iter__") and not isinstance(content, str):
        for part in content:
            if isinstance(part, dict) and part.get("type") == "text":
                text = part.get("text", "").strip()
                if text:
                    return text
        return "Processing visual/audio data…"

    return content.strip() if content else "Executing OS module…"


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
            "user_id": getattr(req, "user_id", "user"),
            "file_path": req.file_path,
            "action": None,
            "tool_data": None,
            "_loop": False,
        }

        logger.info("[BRAIN] Processing Session: %s", req.session_id)

        result = serqet_brain.invoke(initial_state)

        last_msg   = result["messages"][-1]
        action_val = result.get("action") or ""
        action_str = str(action_val)
        tool_data  = result.get("tool_data")

        display_text = _extract_display_text(last_msg, action_str, tool_data)

        # Only synthesise speech for conversational (non-tool) responses
        audio_url = None
        if display_text and not action_str.startswith("execute_"):
            try:
                voice_filename = f"speech_{uuid.uuid4().hex}.mp3"
                voice_save_path = os.path.join(UPLOAD_DIR, voice_filename)
                success = await generate_speech_async(display_text, voice_save_path)
                if success:
                    audio_url = f"/uploads/{voice_filename}"
                    logger.info("[VOICE] Free Neural Synthesis: %s", audio_url)
            except Exception as ve:
                logger.error("[VOICE ERROR] Synthesis failed: %s", ve)

        return {
            "status":     "success",
            "message":    display_text,
            "audio_url":  audio_url,
            "action":     action_val,
            "data":       tool_data,
            "session_id": req.session_id,
        }

    except Exception as e:
        logger.error("!!! [BRAIN PANIC] !!!: %s", e, exc_info=True)
        return {
            "status":  "error",
            "message": f"Neural Link Error: {str(e)}",
            "action":  None,
            "data":    None,
        }


@app.get("/health")
async def health():
    return {"status": "online", "engine": "gemini-2.0-flash"}


@app.get("/brain/v1/memory/stats")
async def get_memory_stats():
    count = memory_engine.get_count()
    return {"vector_count": count}


if __name__ == "__main__":
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    uvicorn.run(app, host="0.0.0.0", port=8000)