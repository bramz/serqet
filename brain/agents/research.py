from .base import SerqetAgent

class ResearchAgent(SerqetAgent):
    name = "researcher"
    allowed_tools = ["web_research"] # ONLY web research
    
    def get_system_prompt(self) -> str:
        return "You are the Serqet Research Specialist. Use 'web_research' to find factual information."