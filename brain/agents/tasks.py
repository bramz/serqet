from .base import SerqetAgent

class TasksAgent(SerqetAgent):
    name = "tasks"
    allowed_tools = ["create_task"]
    system_prompt = """You are the Serqet task manager. Organize and manage tasks efficiently."""
    
    def get_system_prompt(self) -> str:
        return self.system_prompt