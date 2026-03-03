from langchain_community.tools import DuckDuckGoSearchRun
from langchain_core.tools import tool

ddg_search = DuckDuckGoSearchRun()

@tool
def web_research(query: str):
    """
    Searches the live web for the latest information. 
    Use this for news, job listings, crypto trends, or general research.
    """
    try:
        results = ddg_search.run(query)
        return {
            "action": "db_save_research",
            "query": query,
            "findings": str(results)
        }
    except Exception as e:
        return {"error": f"Search failed: {str(e)}"}