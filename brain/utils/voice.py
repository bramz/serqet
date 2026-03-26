import os
import re
import edge_tts
import asyncio

def clean_markdown(text: str) -> str:
    """Removes markdown symbols so the TTS doesn't try to 'speak' them."""
    text = text.replace("**", "").replace("__", "").replace("*", "").replace("_", "")
    text = re.sub(r'#+\s+', '', text)
    text = re.sub(r'```.*?```', '[code content]', text, flags=re.DOTALL)
    text = re.sub(r'ACTION:\s*view_\w+', '', text)
    return text.strip()

async def generate_speech_async(text: str, output_path: str):
    """The actual async worker for Edge TTS."""
    # Female: en-US-AvaNeural, en-US-EmmaNeural
    # Male: en-US-AndrewNeural, en-US-BrianNeural
    VOICE = "en-US-AvaNeural" 
    
    clean_text = clean_markdown(text)
    
    if not clean_text:
        return False

    communicate = edge_tts.Communicate(clean_text, VOICE, rate="+5%")
    await communicate.save(output_path)
    return True

def generate_speech(text: str, output_path: str) -> bool:
    """Synchronous wrapper for the async speech generator."""
    try:
        try:
            loop = asyncio.get_event_loop()
        except RuntimeError:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            
        if loop.is_running():
            return False 
        else:
            return loop.run_until_complete(generate_speech_async(text, output_path))
    except Exception as e:
        print(f"[TTS ERROR] {e}")
        return False