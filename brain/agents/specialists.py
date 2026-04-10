from .base import SerqetAgent
 
_SLUGS = [
    "arbiter", "researcher", "finance", "jobs", "health",
    "tasks", "manager", "vanguard", "ghost", "oracle", "builder",
]
 
def make_agent(slug: str) -> SerqetAgent:
    """Return a SerqetAgent for the given slug."""
    if slug not in _SLUGS:
        raise ValueError(f"Unknown agent slug: {slug!r}")
    return SerqetAgent(slug)
 
# Named aliases kept for backwards-compat if other modules import them
ArbiterAgent   = lambda: make_agent("arbiter")
ResearchAgent  = lambda: make_agent("researcher")
FinanceAgent   = lambda: make_agent("finance")
JobAgent       = lambda: make_agent("jobs")
HealthAgent    = lambda: make_agent("health")
TasksAgent     = lambda: make_agent("tasks")
ManagerAgent   = lambda: make_agent("manager")
VanguardAgent  = lambda: make_agent("vanguard")
GhostAgent     = lambda: make_agent("ghost")
OracleAgent    = lambda: make_agent("oracle")
BuilderAgent   = lambda: make_agent("builder")
