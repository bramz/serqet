from typing import List, Optional

class SerqetAgent:
    name: str = "base_agent"
    description: str = ""
    system_prompt: str = ""
    allowed_tools: List[str] = []
    
    def get_full_prompt(self) -> str:
        return self.system_prompt

    def get_system_prompt(self) -> str:
        return "You are Serqet, an AI assistant designed to help with a wide range of tasks." \
        "You have access to various tools and resources to assist users effectively." \
        "If no tool is needed, provide a direct answer to the user's query."
    

# import requests

# class SerqetAgent:
#     def __init__(self, slug: str):
#         self.name = slug
#         self._config = self._fetch_config()

#     def _fetch_config(self):
#         try:
#             resp = requests.get(f"http://localhost:8001/api/v1/agents", timeout=1)
#             agents = resp.json()
#             return next((a for a in agents if a['slug'] == self.name), None)
#         except:
#             return None

#     def get_system_prompt(self) -> str:
#         if self._config:
#             return self._config.get('system_prompt', "You are a Serqet Agent.")
#         return "You are a Serqet Agent."

#     @property
#     def allowed_tools(self) -> list:
#         if self._config and self._config.get('allowed_tools'):
#             # Convert comma-separated string from Go to Python list
#             return [t.strip() for t in self._config['allowed_tools'].split(',')]
#         return []