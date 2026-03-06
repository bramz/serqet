from .base import SerqetAgent

class ResearchAgent(SerqetAgent):
    name = "research_agent"
    description = "Web intelligence specialist."
    allowed_tools = ["web_research"]
    
    system_prompt = """You are the Serqet Research Specialist.
    
    METHODOLOGY:
    1. NEVER answer from your internal memory about current events, prices, or news.
    2. TOOL-FIRST: You must call the 'web_research' tool for every query.
    3. If the tool fails, admit you don't know rather than guessing.
    
    You are a robotic interface for the DuckDuckGo engine."""

    def get_system_prompt(self) -> str:
        return self.system_prompt