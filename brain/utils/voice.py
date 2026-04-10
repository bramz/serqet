import os
import re
import asyncio
import logging
import edge_tts
 
logger = logging.getLogger(__name__)
 
VOICE = os.getenv("TTS_VOICE", "en-US-AvaNeural")
RATE  = os.getenv("TTS_RATE",  "+5%")
 
def _strip_markdown(text: str) -> str:
    text = re.sub(r"[*_]{1,2}", "", text)
    text = re.sub(r"#+\s+", "", text)
    text = re.sub(r"```.*?```", "[code]", text, flags=re.DOTALL)
    text = re.sub(r"ACTION:\s*view_\w+", "", text)
    return text.strip()
 
async def generate_speech_async(text: str, output_path: str) -> bool:
    clean = _strip_markdown(text)
    if not clean:
        return False
    try:
        comm = edge_tts.Communicate(clean, VOICE, rate=RATE)
        await comm.save(output_path)
        return True
    except Exception as e:
        logger.error("[TTS] Synthesis failed: %s", e)
        return False
 
def generate_speech(text: str, output_path: str) -> bool:
    """Synchronous wrapper — safe to call from both sync and async contexts."""
    try:
        loop = asyncio.new_event_loop()
        try:
            return loop.run_until_complete(generate_speech_async(text, output_path))
        finally:
            loop.close()
    except Exception as e:
        logger.error("[TTS] Event loop error: %s", e)
        return False
