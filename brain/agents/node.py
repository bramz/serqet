import re
from langgraph.graph import StateGraph, END
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from agents.state import AgentState
from agents.loader import get_agent_for_intent
from providers.factory import get_llm
from utils.parser import parse_content, extract_action_and_clean
from core.memory import memory_engine
from tools import ALL_TOOLS

TOOL_MAP = {t.name: t for t in ALL_TOOLS}

def agent_node(state: AgentState):
    query = state["messages"][-1].content
    session_id = state.get("session_id", "default")
    
    context = memory_engine.recall(query, session_id=session_id) 
    agent = get_agent_for_intent(query)
    
    allowed_tools = [t for t in ALL_TOOLS if t.name in agent.allowed_tools]
    llm = get_llm("gemini")
    llm_with_tools = llm.bind_tools(allowed_tools) if allowed_tools else llm
    
    try:
        sys_prompt = f"{agent.get_system_prompt()}\n\nSESSION CONTEXT:\n{context or 'None'}"
        response = llm_with_tools.invoke([SystemMessage(content=sys_prompt)] + state["messages"])
        
        if hasattr(response, 'tool_calls') and response.tool_calls:
            t_call = response.tool_calls[0]
            tool_name = t_call['name']
            tool_args = t_call['args']
            
            print(f"--- [KERNEL] Specialist Requesting: {tool_name} ---")
            target_func = TOOL_MAP.get(tool_name)
            
            if target_func:
                tool_output = target_func.invoke(tool_args)
                
                if "candles" in tool_output or "findings" in tool_output and tool_name == "web_research":
                    print(f"[BRAIN] Intermediate data received from {tool_name}. Re-invoking...")
                    
                    state["messages"].append(response)
                    state["messages"].append(HumanMessage(content=f"SYSTEM DATA RECEIVED: {tool_output}. Please proceed with the next step of your instructions."))
                    
                    return agent_node(state)

                return {
                    "messages": [response], 
                    "action": f"execute_{tool_name}",
                    "tool_data": tool_output
                }
        
        text = parse_content(response.content)
        clean_text, action = extract_action_and_clean(text)
        
        if clean_text:
            memory_engine.archive(f"User: {query} | Serqet: {clean_text}", {"session_id": session_id})

        return {"messages": [AIMessage(content=clean_text)], "action": action}

    except Exception as e:
        print(f"!!! [KERNEL PANIC]: {e} !!!")
        return trigger_ai_fallback(query, state, "neural_link")

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