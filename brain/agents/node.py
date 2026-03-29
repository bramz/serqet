import json
import re
import base64
import os
from langgraph.graph import StateGraph, END
from langchain_core.messages import AIMessage, SystemMessage, HumanMessage
from agents.state import AgentState
from agents.loader import get_agent_for_intent
from providers.factory import get_llm
from utils.parser import parse_content, extract_action_and_clean
from utils.vision import encode_image
from core.memory import memory_engine
from tools import ALL_TOOLS

TOOL_MAP = {t.name: t for t in ALL_TOOLS}

def agent_node(state: AgentState):
    query = state["messages"][-1].content
    user_id = state.get("user_id", "user")
    session_id = state.get("session_id", "default")
    file_path = state.get("file_path")
    
    # memory recall
    context = memory_engine.recall(query, session_id=session_id) 
    agent = get_agent_for_intent(query)
    print(f" [BRAIN] Specialist: {agent.name} | Session: {session_id} ")

    voice_hint = ""
    if file_path and file_path.lower().endswith(('.webm', '.mp3', '.wav')):
        voice_hint = "\nIMPORTANT: This is a VOCAL COMMAND. Listen to the audio and act as the most appropriate specialist (Finance, Health, Jobs, or Research)."


    # allowed tools
    allowed_tools = [t for t in ALL_TOOLS if t.name in agent.allowed_tools]
    llm = get_llm("gemini")
    llm_with_tools = llm.bind_tools(allowed_tools) if allowed_tools else llm
    
    try:
        system_modifier = ""
        if user_id == "SYSTEM_CORE":
            system_modifier = "\n\nCRITICAL: You are running in AUTONOMOUS MODE. Be extremely concise. " \
                            "Execute tools immediately without asking for permission. " \
                            "Summarize results as a system log entry."
            sys_prompt = f"{agent.get_system_prompt()}{system_modifier}\n\nCONTEXT:\n{memory_engine.recall(query, state['session_id'])}"
        else:
            sys_prompt = f"{agent.get_system_prompt()}{voice_hint}\n\nCONTEXT:\n{context or 'None'}"
            
        prompt_stack = [SystemMessage(content=sys_prompt)]
        prompt_stack.extend(state["messages"][:-1])

        if file_path and os.path.exists(file_path):
            ext = os.path.splitext(file_path)[1].lower()
            b64_data = encode_image(file_path)
            
            content_parts = [{"type": "text", "text": query}]

            if ext in [".wav", ".mp3", ".webm", ".ogg"]:
                print(f"[AUDIO] Ingesting Audio for Gemini: {file_path}")
                content_parts.append({
                    "type": "media", 
                    "mime_type": f"audio/{ext[1:] if ext != '.webm' else 'webm'}", 
                    "data": b64_data
                })
            elif ext == ".pdf":
                content_parts.append({"type": "media", "mime_type": "application/pdf", "data": b64_data})
            else:
                content_parts.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_data}"}})
            
            prompt_stack.append(HumanMessage(content=content_parts))

        response = llm_with_tools.invoke(prompt_stack)
        
        if hasattr(response, 'tool_calls') and len(response.tool_calls) > 0:
            t_call = response.tool_calls[0]
            tool_name = t_call['name']
            tool_args = t_call['args']
            
            print(f" [BRAIN] Executing {tool_name} ")
            target_func = TOOL_MAP.get(tool_name)
            
            if target_func:
                tool_output = target_func.invoke(tool_args)
                # state["file_path"] = None

                if "rsi" in tool_output:
                    print(f" [BRAIN] Indicators computed. Chaining to decision logic ")
                    state["messages"].append(response)
                    state["messages"].append(HumanMessage(content=f"INDICATORS: {tool_output}. Use 'generate_trading_signal' to save the result."))
                    return agent_node(state)
                
                if tool_output.get("action") == "market_scout_initiated":
                    search_result = TOOL_MAP["web_research"].invoke({"query": tool_output["search_query"]})
                    state["messages"].append(response)
                    state["messages"].append(HumanMessage(content=f"SEARCH DATA: {search_result['findings']}. Call 'launch_venture' with a business plan."))
                    return agent_node(state)

                if tool_name == "web_research":
                    print(" [BRAIN] Synthesizing Research Report ")
                    synth_p = f"QUERY: {tool_args.get('query')}\nDATA: {tool_output.get('findings')}\nTASK: Format to clean Markdown."
                    clean_res = get_llm("gemini").invoke(synth_p)
                    clean_markdown = parse_content(clean_res.content)
                    
                    if agent.name == "arbiter":
                        state["messages"].append(response)
                        state["messages"].append(HumanMessage(content=f"INTEL: {clean_markdown}. Now call 'launch_venture'."))
                        return agent_node(state)

                    return {
                        "messages": [AIMessage(content=clean_markdown)], 
                        "action": "execute_web_research",
                        "tool_data": {"query": tool_args.get('query'), "findings": clean_markdown}
                    }

                return {
                    "messages": [response], 
                    "action": f"execute_{tool_name}",
                    "tool_data": tool_output
                }

        text = parse_content(response.content)
        clean_text, action = extract_action_and_clean(text)
    
        if agent.name == "arbiter" and not action and len(clean_text) > 150:
            print(" [BRAIN] Arbiter talked too much. Extracting JSON... ")
            ext_p = f"Extract JSON (name, category, strategy, projected_roi, platform) from: {clean_text}"
            ext_res = get_llm("gemini").invoke(ext_p)
            try:
                raw_json = parse_content(ext_res.content).replace('```json', '').replace('```', '').strip()
                return {
                    "messages": [AIMessage(content=clean_text)], 
                    "action": "execute_launch_venture", 
                    "tool_data": json.loads(raw_json)
                }
            except: pass

        # archive interaction to ltm
        if clean_text:
            memory_engine.archive(f"User: {query} | Serqet: {clean_text}", metadata={"session_id": session_id})

        return {"messages": [AIMessage(content=clean_text)], "action": action}

    except Exception as e:
        print(f"!!! [BRAIN PANIC]: {str(e)} !!!")
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