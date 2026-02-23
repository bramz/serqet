import re
from langgraph.graph import StateGraph, END
from langchain_core.messages import AIMessage, SystemMessage
from agents.state import AgentState
from providers.factory import get_llm
from tools.social import create_social_draft
from tools.finance import record_expense
from tools.tasks import create_task
from tools.jobs import track_job_application
from tools.health import record_meal, record_workout
from utils.parser import parse_content

# Registry of all tools
TOOL_LIST = [create_social_draft, record_expense, create_task, track_job_application, record_meal, record_workout]

def agent_node(state: AgentState):
    llm = get_llm("gemini").bind_tools(TOOL_LIST)
    
    system_instruction = SystemMessage(content=(
            "You are Serqet, a 2026-era personal assistant. "
            "Logic: If a tool is needed, call it. If not, respond concisely. "
            "Always include 'ACTION: view_<module>' if navigating manually. "
            "IMPORTANT RULES: "
            "1. If the user mentions eating, food, or calories, YOU MUST USE the 'record_meal' tool. "
            "2. If the user mentions working out or exercise, YOU MUST USE the 'record_workout' tool. "
    ))
    
    try:
        response = llm.invoke([system_instruction] + state["messages"])
        
        # Tool execution branch
        if hasattr(response, 'tool_calls') and response.tool_calls:
            tool_call = response.tool_calls[0]
            return {
                "messages": [response], 
                "action": f"execute_{tool_call['name']}",
                "tool_data": tool_call['args']
            }
        
        # Navigation branch
        text = parse_content(response.content)
        action_match = re.search(r"ACTION:\s*(view_\w+)", text)
        action = action_match.group(1) if action_match else None

        # Double check: Did the AI talk about food but forgot the tool?
        if any(word in text.lower() for word in ["ate", "calories", "meal", "food"]):
            print("--- BRAIN WARNING: AI missed a health tool call! ---")
            
        return {
            "messages": [AIMessage(content=re.sub(r"ACTION:\s*view_\w+", "", text).strip())],
            "action": action
        }
    except Exception as e:
        print(f"Error in agent_node: {e}")

def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("serqet", agent_node)
    workflow.set_entry_point("serqet")
    workflow.add_edge("serqet", END)
    return workflow.compile()