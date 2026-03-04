import re
from langgraph.graph import StateGraph, END
from langchain_core.messages import AIMessage, SystemMessage
from agents.state import AgentState
from agents.loader import get_agent_for_intent
from providers.factory import get_llm
from utils.parser import parse_content

# Tool Imports
from tools.social import create_social_draft
from tools.finance import record_expense, sync_portfolio, get_portfolio_summary
from tools.tasks import create_task
from tools.jobs import track_job_application
from tools.health import record_meal, record_workout
from tools.research import web_research

TOOL_LIST = [
    create_social_draft, record_expense, create_task, 
    track_job_application, record_meal, record_workout, 
    sync_portfolio, get_portfolio_summary, web_research
]

def agent_node(state: AgentState):
    query = state["messages"][-1].content
    
    # Identify and load the specialist
    agent = get_agent_for_intent(query)
    print(f"--- [SERQET KERNEL] Booting Specialist: {agent.name} ---")

    allowed_tools = [t for t in TOOL_LIST if t.name in agent.allowed_tools]
    
    llm = get_llm("gemini")
    if allowed_tools:
        llm = llm.bind_tools(allowed_tools)
    
    try:
        sys_msg = SystemMessage(content=agent.get_system_prompt())
        response = llm.invoke([sys_msg] + state["messages"])
        
        if hasattr(response, 'tool_calls') and response.tool_calls:
            t_call = response.tool_calls[0]
            print(f"--- [TOOL] Specialist Executing: {t_call['name']} ---")
            return {
                "messages": [response], 
                "action": f"execute_{t_call['name']}",
                "tool_data": t_call['args']
            }
        
        text = parse_content(response.content)
        action_match = re.search(r"ACTION:\s*(view_\w+)", text)
        action = action_match.group(1) if action_match else None
        
        # If Research agent failed to call tool, force it
        if agent.name == "research" and not action:
            return {
                "messages": [AIMessage(content="Kernel forced search override.")],
                "action": "execute_web_research",
                "tool_data": {"query": query}
            }

        clean_text = re.sub(r"ACTION:\s*view_\w+", "", text).strip()
        return {
            "messages": [AIMessage(content=clean_text)],
            "action": action
        }

    except Exception as e:
        print(f"!!! KERNEL PANIC: {e} !!!")
        return {"messages": [AIMessage(content="I've encountered a core error.")]}

def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("serqet", agent_node)
    workflow.set_entry_point("serqet")
    workflow.add_edge("serqet", END)
    return workflow.compile()