from .base import SerqetAgent

class ArbiterAgent(SerqetAgent):
    def __init__(self): super().__init__("arbiter")

class ResearchAgent(SerqetAgent):
    def __init__(self): super().__init__("researcher")

class FinanceAgent(SerqetAgent):
    def __init__(self): super().__init__("finance")

class JobAgent(SerqetAgent):
    def __init__(self): super().__init__("jobs")

class HealthAgent(SerqetAgent):
    def __init__(self): super().__init__("health")

class TasksAgent(SerqetAgent):
    def __init__(self): super().__init__("tasks")

class ManagerAgent(SerqetAgent):
    def __init__(self): super().__init__("manager")

class VanguardAgent(SerqetAgent):
    def __init__(self): super().__init__("vanguard")

class GhostAgent(SerqetAgent):
    def __init__(self): super().__init__("ghost")

class OracleAgent(SerqetAgent):
    def __init__(self): super().__init__("oracle")

class BuilderAgent(SerqetAgent):
    def __init__(self): super().__init__("builder")