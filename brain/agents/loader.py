from .research import ResearchAgent
from .finance import FinanceAgent
from .health import HealthAgent
from .tasks import TasksAgent
from .base import SerqetAgent
from .manager import ManagerAgent
from .arbiter import ArbiterAgent

AGENT_MAP = {
    "research": ResearchAgent(),
    "finance": FinanceAgent(),
    "health": HealthAgent(),
    "tasks": TasksAgent(),
    "manager": ManagerAgent(),
    "arbiter": ArbiterAgent(),
}

def get_agent_for_intent(query: str) -> SerqetAgent:
    query = query.lower()

    if any(w in query for w in ["scout", "venture", "niche", "arbitrage", "opportunity", "revenue"]):
        print("[LOADER] Routing to ARBITER agent")        
        return AGENT_MAP["arbiter"]

    if any(w in query for w in ["research", "search", "news"]):
        print("[LOADER] Routing to RESEARCH agent")
        return AGENT_MAP["research"]
    
    if any(w in query for w in ["kraken", "portfolio", "btc", "spent"]):
        print("[LOADER] Routing to FINANCE agent")
        return AGENT_MAP["finance"]
    
    if any(w in query for w in ["ate", "workout", "calories", "gym"]):
        print("[LOADER] Routing to HEALTH agent")
        return AGENT_MAP["health"]
    
    if any(w in query for w in ["task", "todo", "plan"]):
        print("[LOADER] Routing to TASK agent")
        return AGENT_MAP["tasks"]
    
    if any(w in query for w in ["resume", "cv", "career", "job", "apply", "hiring"]):
        print("[LOADER] Routing to JOB agent")
        return AGENT_MAP["jobs"]
    
    return SerqetAgent()