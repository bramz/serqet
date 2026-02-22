from langchain_core.tools import tool

@tool
def track_job_application(company: str, role: str, status: str, link: str = "", salary_range: str = ""):
    """
    Tracks a new job application.
    Call this when the user says they applied for a job or found a job they like.
    """
    return {
        "action": "db_track_job",
        "company": company,
        "role": role,
        "status": status,
        "link": link,
        "salary_range": salary_range
    }