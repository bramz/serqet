from typing import List, Optional

class SerqetAgent:
    name: str = "base_agent"
    description: str = ""
    system_prompt: str = ""
    allowed_tools: List[str] = []
    
    def get_full_prompt(self) -> str:
        return self.system_prompt