import re
from langgraph.graph import StateGraph, END
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from agents.state import AgentState
from agents.loader import get_agent_for_intent
from providers.factory import get_llm
from utils.parser import parse_content, extract_action_and_clean
from core.memory import memory_engine
# Tool Registry
from tools.social import create_social_draft
from tools.finance import record_expense, sync_portfolio, get_portfolio_summary
from tools.tasks import create_task
from tools.jobs import track_job_application
from tools.health import record_meal, record_workout
from tools.research import web_research

TOOL_MAP = {
    "create_social_draft": create_social_draft,
    "record_expense": record_expense,
    "create_task": create_task,
    "track_job_application": track_job_application,
    "record_meal": record_meal,
    "record_workout": record_workout,
    "sync_portfolio": sync_portfolio,
    "get_portfolio_summary": get_portfolio_summary,
    "web_research": web_research
}
TOOL_LIST = list(TOOL_MAP.values())

def agent_node(state: AgentState):
    query = state["messages"][-1].content
    
    # 1. LIFETIME MEMORY HOOK (Ready for ChromaDB integration)
    context = memory_engine.recall(query) 
    
    # 2. BOOT SPECIALIST
    agent = get_agent_for_intent(query)
    print(f"--- [SERQET KERNEL] Specialist: {agent.name} ---")

    # 3. SANDBOX TOOLS
    allowed_tools = [t for t in TOOL_LIST if t.name in agent.allowed_tools]
    llm = get_llm("gemini")
    llm_with_tools = llm.bind_tools(allowed_tools) if allowed_tools else llm
    
    try:
        # 4. EXECUTION ATTEMPT
        sys_msg = SystemMessage(content=agent.get_system_prompt())
        response = llm_with_tools.invoke([sys_msg] + state["messages"])
        
        # 5. TOOL EXECUTION BRANCH
        if hasattr(response, 'tool_calls') and response.tool_calls:
            t_call = response.tool_calls[0]
            tool_name = t_call['name']
            tool_args = t_call['args']
            
            print(f"--- [KERNEL] Executing {tool_name} in Python... ---")
            
            # Find the function and run it
            target_func = TOOL_MAP.get(tool_name)
            if target_func:
                tool_output = target_func.invoke(tool_args)
                
                # Check for Tool Failures (e.g., DDG returning nothing)
                if tool_output.get("findings") == "NOT_FOUND" or not tool_output:
                    print(f"--- [KERNEL] Tool {tool_name} failed. Running AI Fallback... ---")
                    return trigger_ai_fallback(query, state, tool_name)

                # SUCCESS: Hand off results to Go Gateway
                return {
                    "messages": [response], 
                    "action": f"execute_{tool_name}",
                    "tool_data": tool_output
                }
        
        # 6. CONVERSATION & NAVIGATION BRANCH
        text = parse_content(response.content)
        
        # Manual Override for Research (Preventing Hallucinations)
        if agent.name == "research" and "ACTION: view_research" not in text:
            print("--- [KERNEL] Research logic skipped tool. Forcing Fallback. ---")
            return trigger_ai_fallback(query, state, "research")

        clean_text, action = extract_action_and_clean(text)
        
        # If the AI gave a totally empty response, don't return nothing
        if not clean_text and not action:
            return trigger_ai_fallback(query, state)

        return {
            "messages": [AIMessage(content=clean_text)],
            "action": action
        }

    except Exception as e:
        print(f"!!! KERNEL PANIC: {e} !!!")
        return trigger_ai_fallback(query, state, "system_error")

def trigger_ai_fallback(query: str, state: AgentState, context: str = "general"):
    """The safety net that ensures Serqet always responds intelligently."""
    llm = get_llm("gemini")
    
    fallback_prompt = f"""
    The user requested: '{query}'
    The system's {context} module failed or was unable to find live data.
    
    TASK: Provide a high-quality response from your internal training data.
    - If this is research: Summarize what you know but prefix it with [INTERNAL KNOWLEDGE].
    - If this is productivity: Suggest a logical next step.
    - Stay concise and helpful.
    """
    
    fallback_res = llm.invoke([SystemMessage(content=fallback_prompt)] + state["messages"])
    
    # If the user wanted research, make sure it saves to the DB even on fallback
    action = "execute_web_research" if context == "research" or "research" in query.lower() else None
    tool_data = {"query": query, "findings": fallback_res.content} if action else None

    return {
        "messages": [fallback_res],
        "action": action,
        "tool_data": tool_data
    }

def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("serqet", agent_node)
    workflow.set_entry_point("serqet")
    workflow.add_edge("serqet", END)
    return workflow.compile()