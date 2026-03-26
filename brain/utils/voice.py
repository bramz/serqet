import os
import base64
import requests
from dotenv import load_dotenv

load_dotenv()

# Use the REST API to avoid SDK dependency issues on Python 3.14
def generate_speech(text: str, output_path: str):
    """Converts text to speech using Google's REST API."""
    api_key = os.getenv("GEMINI_API_KEY") # Use your cloud API key
    url = f"https://texttospeech.googleapis.com/v1/text:synthesize?key={api_key}"

    clean_text = text.replace("#", "").replace("*", "").replace("`", "").strip()

    payload = {
        "input": {"text": clean_text},
        "voice": {
            "languageCode": "en-US",
            "name": "en-US-Neural2-F"
        },
        "audioConfig": {
            "audioEncoding": "MP3",
            "pitch": 0,
            "speakingRate": 1.05
        }
    }

    response = requests.post(url, json=payload)
    
    if response.status_code == 200:
        audio_content = response.json().get("audioContent")
        with open(output_path, "wb") as out:
            out.write(base64.b64decode(audio_content))
        return output_path
    else:
        raise Exception(f"TTS API Error: {response.text}")