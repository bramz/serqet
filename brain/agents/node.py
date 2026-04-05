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
    query = str(raw_query) if raw_query else "System Refresh"
    session_id = state.get("session_id", "default")
    user_id = state.get("user_id", "user")
    file_path = state.get("file_path")
    
    agent = get_agent_for_intent(query)
    # DEBUG: Use slug for internal logic checks
    print(f" [BRAIN] specialist: {agent.slug} ({agent.name}) | Session: {session_id} ")

    try:
        context = memory_engine.recall(query, session_id=session_id)
    except:
        context = ""

    allowed_tool_names = agent.allowed_tools
    allowed_tools = [t for t in ALL_TOOLS if t.name in allowed_tool_names]
    
    llm = get_llm("gemini")
    llm_with_tools = llm.bind_tools(allowed_tools) if allowed_tools else llm
    
    try:
        brain_directive = f"\n\n[BRAIN_DIRECTIVE]: Role={agent.slug.upper()}. " \
                           f"Tools={', '.join(allowed_tool_names)}. " \
                           f"MANDATORY: Use 'submit_for_review' to save."

        if user_id == "SYSTEM_CORE":
            sys_prompt = f"{agent.get_system_prompt()}{brain_directive}\n\nAUTONOMOUS MODE."
        else:
            sys_prompt = f"{agent.get_system_prompt()}{brain_directive}\n\nLIFETIME_CONTEXT: {context}"
        
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

        response = llm_with_tools.invoke(prompt_stack)
        
        #  TOOL BRANCH 
        if hasattr(response, 'tool_calls') and len(response.tool_calls) > 0:
            t_call = response.tool_calls[0]
            tool_name = t_call['name']
            
            if tool_name not in allowed_tool_names:
                state["messages"].append(AIMessage(content=f"Access Denied: {tool_name}"))
                return agent_node(state)

            target_func = TOOL_MAP.get(tool_name)
            if target_func:
                tool_output = target_func.invoke(t_call['args'])

                if tool_name == "web_research":
                    synth_p = f"DATA: {tool_output.get('findings')}\nTASK: Synthesize clean Markdown for {agent.slug}."
                    clean_res = get_llm("gemini").invoke(synth_p)
                    clean_markdown = parse_content(clean_res.content)
                    
                    # FIX: Use agent.slug here instead of agent.name
                    if agent.slug == "arbiter" or agent.slug == "jobs":
                        state["messages"].append(response)
                        instr = "launch_venture" if agent.slug == "arbiter" else "submit_for_review"
                        state["messages"].append(HumanMessage(content=f"INTEL: {clean_markdown}\n\nCall '{instr}' NOW to save this to the DB."))
                        return agent_node(state) 
                    
                    return {"messages": [AIMessage(content=clean_markdown)], "action": "execute_web_research", "tool_data": {"query": tool_args.get('query'), "findings": clean_markdown}}

                if "rsi" in tool_output or tool_output.get("action") == "market_scout_initiated":
                    state["messages"].append(response)
                    state["messages"].append(HumanMessage(content=f"DATA: {tool_output}. Execute next tool."))
                    return agent_node(state)

                return {"messages": [response], "action": f"execute_{tool_name}", "tool_data": tool_output}

        #  SHADOW SAVE (Safety Net) 
        text = parse_content(response.content)
        clean_text, action = extract_action_and_clean(text)
    
        # FIX: Check agent.slug
        if agent.slug == "arbiter" and not action and len(clean_text) > 150:
            print(" [BRAIN] FORCING VENTURE SAVE ")
            ext_p = f"Extract business JSON (name, category, strategy, projected_roi, platform) from: {clean_text}"
            ext_res = get_llm("gemini").invoke(ext_p)
            try:
                raw_json = parse_content(ext_res.content).replace('```json', '').replace('```', '').strip()
                return {"messages": [AIMessage(content=clean_text)], "action": "execute_launch_venture", "tool_data": json.loads(raw_json)}
            except: pass

        if agent.slug == "jobs" and not action and len(clean_text) > 150:
            print(" [BRAIN] FORCING JOB ACTION SAVE ")
            ext_p = f"Extract JSON (title, type, content, priority) from: {clean_text}. type='Job_App'."
            ext_res = get_llm("gemini").invoke(ext_p)
            try:
                raw_json = parse_content(ext_res.content).replace('```json', '').replace('```', '').strip()
                return {"messages": [AIMessage(content=clean_text)], "action": "execute_submit_for_review", "tool_data": json.loads(raw_json)}
            except: pass

        if clean_text:
            memory_engine.archive(f"User: {query} | Serqet: {clean_text}", metadata={"session_id": session_id, "agent": agent.slug})

        return {"messages": [AIMessage(content=clean_text)], "action": action}

    except Exception as e:
        print(f"!!! [BRAIN PANIC]: {str(e)} !!!")
        return trigger_ai_fallback(query, state, "BRAIN")

def trigger_ai_fallback(query: str, state: AgentState, context: str = "general"):
    llm = get_llm("gemini")
    fallback_res = llm.invoke([SystemMessage(content=f"Error in {context}. User request: {query}")] + state["messages"])
    return {"messages": [fallback_res], "action": None}

def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("serqet", agent_node)
    workflow.set_entry_point("serqet")
    workflow.add_edge("serqet", END)
    return workflow.compile()