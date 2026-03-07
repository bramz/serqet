from .research import ResearchAgent
from .finance import FinanceAgent
from .health import HealthAgent
from .base import SerqetAgent

AGENT_MAP = {
    "research": ResearchAgent(),
    "finance": FinanceAgent(),
    "health": HealthAgent(),
}

def get_agent_for_intent(query: str) -> SerqetAgent:
    query = query.lower()
    if any(w in query for w in ["research", "search", "price", "gold", "news"]):
        return AGENT_MAP["research"]
    if any(w in query for w in ["kraken", "portfolio", "btc", "spent"]):
        return AGENT_MAP["finance"]
    if any(w in query for w in ["ate", "workout", "calories", "gym"]):
        return AGENT_MAP["health"]
    
    return SerqetAgent()