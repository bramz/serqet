import re

def parse_content(content) -> str:
    """
    Extracts raw text from various AI response formats.
    Handles Gemini's multimodal list format and standard strings.
    """
    if isinstance(content, list):
        text_parts = []
        for item in content:
            if isinstance(item, dict) and 'text' in item:
                text_parts.append(item['text'])
        return "".join(text_parts)
    
    return str(content)

def extract_action_and_clean(text: str):
    """
    Identifies 'ACTION: view_x' commands for the Dashboard navigation,
    then strips them from the text so the user doesn't see technical tags.
    
    Returns: (clean_text, action_string)
    """
    if not text:
        return "", None

    action_pattern = r"(?i)ACTION:\s*(view_\w+)"
    
    match = re.search(action_pattern, text)
    action = None
    
    if match:
        action = match.group(1).lower() # e.g., "view_finance"
        
    clean_text = re.sub(action_pattern, "", text).strip()
    
    clean_text = clean_text.strip()
    
    return clean_text, action