import json
import logging
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

logger = logging.getLogger(__name__)
TOOL_MAP = {t.name: t for t in ALL_TOOLS}


def _build_directive(agent) -> str:
    return (
        f"\n\n[BRAIN_DIRECTIVE]: Role={agent.slug.upper()}. "
        f"Tools={', '.join(agent.allowed_tools) or 'none'}. "
        "MANDATORY: You are an autonomous agent. "
        "Call all necessary tools in sequence. "
        "Always use 'submit_for_review' to persist draft data."
    )


def _build_human_message(query: str, file_path: str | None) -> HumanMessage:
    if not file_path or not os.path.exists(file_path):
        return HumanMessage(content=query)

    ext = os.path.splitext(file_path)[1].lower()
    b64 = encode_image(file_path)
    content_parts: list = [{"type": "text", "text": query}]

    if ext in {".wav", ".mp3", ".webm", ".ogg"}:
        mime = "audio/webm" if ext == ".webm" else f"audio/{ext[1:]}"
        content_parts.append({"type": "media", "mime_type": mime, "data": b64})
    elif ext == ".pdf":
        content_parts.append({"type": "media", "mime_type": "application/pdf", "data": b64})
    else:
        content_parts.append({"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{b64}"}})

    return HumanMessage(content=content_parts)


def _build_prompt_stack(agent, context: str, state: AgentState) -> list:
    query = str(state["messages"][-1].content) or "System Refresh"
    user_id = state.get("user_id", "user")
    directive = _build_directive(agent)

    if user_id == "SYSTEM_CORE":
        sys_content = f"{agent.get_system_prompt()}{directive}\n\nAUTONOMOUS MODE."
    else:
        sys_content = f"{agent.get_system_prompt()}{directive}\n\nLIFETIME_CONTEXT: {context}"

    stack = [SystemMessage(content=sys_content)]
    stack.extend(state["messages"][:-1])
    stack.append(_build_human_message(query, state.get("file_path")))
    return stack


def _run_tool(tool_name: str, tool_args: dict, agent_slug: str) -> dict:
    """Execute a single tool and return a normalised result dict."""
    tool = TOOL_MAP[tool_name]
    output = tool.invoke(tool_args)

    if tool_name == "web_research":
        synth = get_llm("gemini").invoke(
            f"DATA: {output.get('findings')}\nTASK: Synthesize clean Markdown for {agent_slug}."
        )
        markdown = parse_content(synth.content)
        return {
            "action": "execute_web_research",
            "data": {"query": tool_args.get("query"), "findings": markdown},
            "needs_followup": agent_slug in {"arbiter", "jobs"},
            "followup_tool": "launch_venture" if agent_slug == "arbiter" else "submit_for_review",
            "markdown": markdown,
        }

    if "rsi" in output or output.get("action") == "market_scout_initiated":
        return {"action": f"execute_{tool_name}", "data": output, "needs_followup": True}

    return {"action": f"execute_{tool_name}", "data": output}


def _try_shadow_extract(agent_slug: str, clean_text: str) -> dict | None:
    """
    For arbiter and jobs agents, extract structured JSON from a plain-text
    response and force it into the DB.  Returns a final state dict or None.
    """
    if agent_slug == "arbiter":
        prompt = (
            f"Extract business JSON (name, category, strategy, projected_roi, platform) "
            f"from: {clean_text}"
        )
        action = "execute_launch_venture"
    elif agent_slug == "jobs":
        prompt = (
            f"Extract JSON (title, type, content, priority) from: {clean_text}. type='Job_App'."
        )
        action = "execute_submit_for_review"
    else:
        return None

    try:
        ext_res = get_llm("gemini").invoke(prompt)
        raw_json = (
            parse_content(ext_res.content)
            .replace("```json", "")
            .replace("```", "")
            .strip()
        )
        tool_data = json.loads(raw_json)
        logger.info("[BRAIN] Shadow extract succeeded for agent '%s'", agent_slug)
        return {"action": action, "tool_data": tool_data}
    except Exception as exc:
        logger.warning("[BRAIN] Shadow extract failed for '%s': %s", agent_slug, exc)
        return None


def agent_node(state: AgentState) -> dict:
    query = str(state["messages"][-1].content) or "System Refresh"
    session_id = state.get("session_id", "default")

    agent = get_agent_for_intent(query)
    logger.info("[BRAIN] specialist=%s session=%s", agent.slug, session_id)

    # Memory recall — never crash the whole request on memory failure
    try:
        context = memory_engine.recall(query, session_id=session_id)
    except Exception as e:
        logger.warning("[MEMORY] Recall failed: %s", e)
        context = ""

    allowed_tools = [t for t in ALL_TOOLS if t.name in agent.allowed_tools]
    llm = get_llm("gemini")
    llm_with_tools = llm.bind_tools(allowed_tools) if allowed_tools else llm

    try:
        prompt = _build_prompt_stack(agent, context, state)
        response = llm_with_tools.invoke(prompt)

        if getattr(response, "tool_calls", None):
            logger.info("[BRAIN] %d tool call(s) detected", len(response.tool_calls))
            final_action, final_data = None, None

            for call in response.tool_calls:
                name, args = call["name"], call["args"]

                if name not in agent.allowed_tools:
                    logger.warning("[SECURITY] Blocked: %s", name)
                    continue

                logger.info("[BRAIN] Executing tool: %s", name)
                result = _run_tool(name, args, agent.slug)

                if result.get("needs_followup"):
                    # Signal the graph to loop back via state flag — no recursion
                    new_msgs = list(state["messages"]) + [response]
                    if result.get("followup_tool"):
                        new_msgs.append(HumanMessage(
                            content=(
                                f"INTEL: {result['markdown']}\n\n"
                                f"Call '{result['followup_tool']}' NOW to save this to the DB."
                            )
                        ))
                    else:
                        new_msgs.append(HumanMessage(
                            content=f"DATA_RECEIVED: {result['data']}. Execute the next step."
                        ))
                    return {
                        "messages": new_msgs,
                        "action": None,
                        "tool_data": None,
                        "_loop": True,
                    }

                final_action = result["action"]
                final_data = result["data"]

            return {
                "messages": [response],   # delta only — LangGraph appends to existing list
                "action": final_action,
                "tool_data": final_data,
                "_loop": False,
            }

        text = parse_content(response.content)
        clean_text, action = extract_action_and_clean(text)

        # Shadow extract: force DB save for arbiter/jobs when no tool was called
        if not action and len(clean_text) > 150:
            extracted = _try_shadow_extract(agent.slug, clean_text)
            if extracted:
                return {
                    "messages": [AIMessage(content=clean_text)],
                    "_loop": False,
                    **extracted,
                }

        if clean_text:
            try:
                memory_engine.archive(
                    f"User: {query} | Serqet: {clean_text}",
                    metadata={"session_id": session_id, "agent": agent.slug},
                )
            except Exception as e:
                logger.warning("[MEMORY] Archive failed: %s", e)

        return {
            "messages": [AIMessage(content=clean_text)],
            "action": action,
            "_loop": False,
        }

    except Exception as e:
        logger.error("[BRAIN PANIC] %s", e, exc_info=True)
        return _fallback(query, state)


def _fallback(query: str, state: AgentState) -> dict:
    try:
        llm = get_llm("gemini")
        res = llm.invoke(
            [SystemMessage(content=f"Error recovery. User request: {query}")]
            + state["messages"]
        )
        return {"messages": [res], "action": None, "_loop": False}
    except Exception as e:
        logger.error("[FALLBACK FAILED] %s", e)
        return {
            "messages": [AIMessage(content="System error. Please try again.")],
            "action": None,
            "_loop": False,
        }


def _should_loop(state: AgentState) -> str:
    """
    Route back to the agent node if a followup is needed.
    Returns the _loop flag as a state update to clear it — never mutate state directly.
    """
    if state.get("_loop"):
        return "agent"
    return "end"


def build_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("agent", agent_node)
    workflow.set_entry_point("agent")
    workflow.add_conditional_edges(
        "agent",
        _should_loop,
        {"agent": "agent", "end": END},
    )
    return workflow.compile()