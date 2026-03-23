from .base import SerqetAgent

class HealthAgent(SerqetAgent):
    name = "health"
    allowed_tools = [
        "record_meal",
        "record_workout"
    ]
    
    def get_system_prompt(self) -> str:
        return "You are the Serqet Bio-Analyst. Track nutrition and fitness precisely."