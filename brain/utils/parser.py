def parse_content(content) -> str:
    if isinstance(content, list):
        for item in content:
            if isinstance(item, dict) and 'text' in item:
                return item['text']
    return str(content)