from langchain_core.tools import tool

@tool
def log_security_issue(issue: str, severity: str):
    """Vanguard: Records a privacy risk or data exposure found during research."""
    return {"action": "db_log_security", "issue": issue, "severity": severity}
