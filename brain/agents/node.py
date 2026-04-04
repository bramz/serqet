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
    raw_query = state["messages"][-1].content
    query = str(raw_query) if raw_query else "Analyze current system state"
    
    session_id = state.get("session_id", "default")
    user_id = state.get("user_id", "user")
    file_path = state.get("file_path")
    
    agent = get_agent_for_intent(query)
    
    try:
        context = memory_engine.recall(query, session_id=session_id)
    except:
        context = ""

    allowed_tools = [t for t in ALL_TOOLS if t.name in agent.allowed_tools]
    llm = get_llm("gemini").bind_tools(allowed_tools) if allowed_tools else get_llm("gemini")
    
    try:
        system_modifier = ""
        if user_id == "SYSTEM_CORE":
            system_modifier = "\n\nCRITICAL: AUTONOMOUS MODE. Execute tools immediately. Be concise."
            
        sys_prompt = f"{agent.get_system_prompt()}{system_modifier}\n\nLIFETIME_CONTEXT: {context}"
        
        prompt_stack = [SystemMessage(content=sys_prompt)]
        prompt_stack.extend(state["messages"][:-1])

        if file_path and os.path.exists(file_path):
            ext = os.path.splitext(file_path)[1].lower()
            b64_data = encode_image(file_path)
            
            content_parts = [{"type": "text", "text": query}]
            if ext in [".wav", ".mp3", ".webm", ".ogg"]:
                content_parts.append({"type": "media", "mime_type": f"audio/{ext[1:] if ext != '.webm' else 'webm'}", "data": b64_data})
            elif ext == ".pdf":
                content_parts.append({"type": "media", "mime_type": "application/pdf", "data": b64_data})
            else:
                content_parts.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64_data}"}})
            
            prompt_stack.append(HumanMessage(content=content_parts))
        else:
            prompt_stack.append(HumanMessage(content=query))

        response = llm.invoke(prompt_stack)
        
        if hasattr(response, 'tool_calls') and len(response.tool_calls) > 0:
            t_call = response.tool_calls[0]
            tool_name = t_call['name']
            tool_args = t_call['args']
            target_func = TOOL_MAP.get(tool_name)
            
            if target_func:
                tool_output = target_func.invoke(tool_args)

                if "rsi" in tool_output or tool_output.get("action") == "market_scout_initiated":
                    state["messages"].append(response)
                    state["messages"].append(HumanMessage(content=f"DATA_RECIEVED: {tool_output}. Execute next step."))
                    return agent_node(state)

                if tool_name == "web_research":
                    synth_p = f"QUERY: {tool_args.get('query')}\nDATA: {tool_output.get('findings')}\nTASK: Format to clean Markdown."
                    clean_res = get_llm("gemini").invoke(synth_p)
                    clean_markdown = parse_content(clean_res.content)
                    if agent.name == "arbiter":
                        state["messages"].append(response)
                        state["messages"].append(HumanMessage(content=f"INTEL: {clean_markdown}. Call 'launch_venture'."))
                        return agent_node(state)
                    return {"messages": [AIMessage(content=clean_markdown)], "action": "execute_web_research", "tool_data": {"query": tool_args.get('query'), "findings": clean_markdown}}

                if tool_name == "launch_venture":
                    state["messages"].append(response)
                    state["messages"].append(HumanMessage(content=f"Venture '{tool_output.get('name')}' saved. As the Task agent, generate a roadmap for it."))
                    return agent_node(state)

                return {"messages": [response], "action": f"execute_{tool_name}", "tool_data": tool_output}

        text = parse_content(response.content)
        clean_text, action = extract_action_and_clean(text)

        if agent.name in ["jobs", "ghost", "arbiter"] and not action and len(clean_text) > 200:
            print(f"[BRAIN] {agent.name} produced content without tool. Forcing Action Center Save")
            
            extraction_prompt = f"""
            The agent produced this draft but didn't save it. Extract it into JSON.
            TEXT: {clean_text}
            JSON Format: {{"title": "Descriptive Title", "type": "Job_App or Email", "content": "The full text", "priority": "Medium"}}
            """
            ext_res = get_llm("gemini").invoke(extraction_prompt)
            try:
                import json
                data = json.loads(parse_content(ext_res.content).replace('```json', '').replace('```', '').strip())
                return {
                    "messages": [AIMessage(content=clean_text)],
                    "action": "execute_submit_for_review",
                    "tool_data": data
                }
            except:
                pass

        if agent.name == "arbiter" and not action and len(clean_text) > 150:
            ext_p = f"Extract business JSON (name, category, strategy, projected_roi, platform) from: {clean_text}"
            ext_res = get_llm("gemini").invoke(ext_p)
            try:
                raw_json = parse_content(ext_res.content).replace('```json', '').replace('```', '').strip()
                return {"messages": [AIMessage(content=clean_text)], "action": "execute_launch_venture", "tool_data": json.loads(raw_json)}
            except: pass

        if clean_text:
            memory_engine.archive(f"User: {query} | Serqet: {clean_text}", metadata={"session_id": session_id})

        return {"messages": [AIMessage(content=clean_text)], "action": action}

    except Exception as e:
        print(f"!!! BRAIN PANIC: {str(e)}")
        return trigger_ai_fallback(query, state, "system")

def trigger_ai_fallback(query: str, state: AgentState, context: str = "general"):
    llm = get_llm("gemini")
    fallback_res = llm.invoke([SystemMessage(content=f"Module {context} failure. Respond manually to: {query}")] + state["messages"])
    return {"messages": [fallback_res], "action": None}

def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("serqet", agent_node)
    workflow.set_entry_point("serqet")
    workflow.add_edge("serqet", END)
    return workflow.compile()