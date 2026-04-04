from .specialists import (
    ArbiterAgent, ResearchAgent, FinanceAgent, JobAgent,
    HealthAgent, TasksAgent, ManagerAgent, VanguardAgent,
    GhostAgent, OracleAgent, BuilderAgent
)
from .base import SerqetAgent

def get_agent_for_intent(query: str) -> SerqetAgent:
    q = query.lower()
    
    # Priority 1: High-Stakes Operations
    if any(w in q for w in ["scout", "venture", "niche", "revenue", "profit", "arbitrage"]):
        return ArbiterAgent()
    
    if any(w in q for w in ["security", "privacy", "leak", "vulnerability", "audit"]):
        return VanguardAgent()

    # Priority 2: Standard Modules
    if any(w in q for w in ["kraken", "portfolio", "btc", "eth", "trade", "signal", "spent"]):
        return FinanceAgent()
    
    if any(w in q for w in ["resume", "cv", "job", "career", "hiring", "apply"]):
        return JobAgent()
    
    if any(w in q for w in ["research", "search", "ddg", "find information", "news"]):
        return ResearchAgent()
    
    if any(w in q for w in ["ate", "workout", "calories", "gym", "meal"]):
        return HealthAgent()

    # Priority 3: Meta & Learning
    if any(w in q for w in ["oracle", "learn", "summarize docs", "documentation"]):
        return OracleAgent()
        
    if any(w in q for w in ["code", "refactor", "build feature", "automation engine"]):
        return BuilderAgent()

    if any(w in q for w in ["social", "tweet", "post", "ghost"]):
        return GhostAgent()

    if any(w in q for w in ["task", "todo", "plan", "remind"]):
        return TasksAgent()
    
    # Default to Manager/CoS
    return ManagerAgent()