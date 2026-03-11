from .research import ResearchAgent
from .finance import FinanceAgent
from .health import HealthAgent
from .tasks import TasksAgent
from .base import SerqetAgent
from .manager import ManagerAgent

AGENT_MAP = {
    "research": ResearchAgent(),
    "finance": FinanceAgent(),
    "health": HealthAgent(),
    "tasks": TasksAgent(),
    "manager": ManagerAgent()
}

def get_agent_for_intent(query: str) -> SerqetAgent:
    query = query.lower()
    if any(w in query for w in ["research", "search", "news"]):
        return AGENT_MAP["research"]
    if any(w in query for w in ["kraken", "portfolio", "btc", "spent"]):
        return AGENT_MAP["finance"]
    if any(w in query for w in ["ate", "workout", "calories", "gym"]):
        return AGENT_MAP["health"]
    if any(w in query for w in ["task", "todo", "plan"]):
        return AGENT_MAP["tasks"]
    
    return SerqetAgent()