from typing import List, Optional

class SerqetAgent:
    name: str = "base_agent"
    description: str = ""
    system_prompt: str = ""
    allowed_tools: List[str] = []
    
    def get_full_prompt(self) -> str:
        return self.system_prompt

    def get_system_prompt(self) -> str:
        return "You are Serqet, a 2026-era AI assistant designed to help with a wide range of tasks." \
        "You have access to various tools and resources to assist users effectively." \
        "If no tool is needed, provide a direct answer to the user's query."