"""
Intent router — maps a user query to the most relevant specialist.
Keyword matching is intentionally simple; upgrade to embedding-based
similarity if false-positives become a problem.
"""
from .base import SerqetAgent
from .specialists import make_agent
 
# (keywords, slug) — evaluated top-to-bottom, first match wins
_RULES: list[tuple[list[str], str]] = [
    # High-stakes / finance
    (["scout", "venture", "niche", "revenue", "profit", "arbitrage"], "arbiter"),
    (["security", "privacy", "leak", "vulnerability", "audit"], "vanguard"),
    (["kraken", "portfolio", "btc", "eth", "trade", "signal", "spent", "expense", "salary"], "finance"),
    # Career
    (["resume", "cv", "job", "career", "hiring", "apply", "interview"], "jobs"),
    # Knowledge / code
    (["research", "search", "find information", "news", "ddg"], "researcher"),
    (["code", "refactor", "build feature", "automation engine", "debug"], "builder"),
    (["oracle", "learn", "summarize docs", "documentation", "explain"], "oracle"),
    # Personal
    (["ate", "calories", "gym", "meal", "workout", "protein", "nutrition"], "health"),
    (["social", "tweet", "post", "ghost", "draft", "linkedin", "thread"], "ghost"),
    (["task", "todo", "plan", "remind", "checklist"], "tasks"),
]
 
def get_agent_for_intent(query: str) -> SerqetAgent:
    q = query.lower()
    for keywords, slug in _RULES:
        if any(kw in q for kw in keywords):
            return make_agent(slug)
    return make_agent("manager")  # default
