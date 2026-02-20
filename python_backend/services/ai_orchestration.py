"""
AI orchestration service for StoreAI.
Combines in-store intelligence (RAG) and optional outside-world context.
Supports optional LangChain, LangGraph, and CrewAI integrations.
"""

from __future__ import annotations

import asyncio
import json
import os
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional, TypedDict

from services.rag import rag_service
from services.llm import llm_service


try:
    from langgraph.graph import END, StateGraph
except Exception:
    END = None
    StateGraph = None

try:
    from crewai import Agent, Crew, Process, Task
except Exception:
    Agent = None
    Crew = None
    Process = None
    Task = None


class OrchestrationState(TypedDict, total=False):
    query: str
    history: List[Any]
    tenant_id: Optional[str]
    role: Optional[str]
    route: str
    store_response: str
    external_response: str
    final_response: str
    source: str
    mode: str


@dataclass
class OrchestrationResult:
    response: str
    source: str
    route: str
    mode: str
    metadata: Dict[str, Any]


class LLMOpsLogger:
    """Minimal structured event logger for observability."""

    def __init__(self, log_path: Optional[str] = None):
        if log_path:
            self.log_path = Path(log_path)
        else:
            self.log_path = Path(__file__).resolve().parents[1] / "logs" / "llmops_events.jsonl"
        self.log_path.parent.mkdir(parents=True, exist_ok=True)

    def emit(self, event: str, payload: Dict[str, Any]) -> None:
        try:
            record = {
                "timestamp_utc": datetime.now(timezone.utc).isoformat(),
                "event": event,
                **payload,
            }
            with self.log_path.open("a", encoding="utf-8") as f:
                f.write(json.dumps(record, ensure_ascii=True) + "\n")
        except Exception:
            # Logging failure must never break user-facing inference.
            return


class AIOrchestrationService:
    STORE_KEYWORDS = {
        "stock", "inventory", "product", "sku", "sales", "revenue", "ledger",
        "supplier", "purchase", "profit", "margin", "employee", "attendance",
        "finance", "tenant", "order", "gst", "payroll", "warehouse", "store",
    }
    EXTERNAL_KEYWORDS = {
        "market", "competitor", "industry", "trend", "regulation", "news",
        "outside", "global", "economic", "inflation", "rbi", "sebi", "weather",
        "exchange rate", "policy", "customer behavior", "benchmark",
    }

    def __init__(self):
        self.logger = LLMOpsLogger()
        self._graph = self._build_graph()

    def _route_query(self, query: str) -> str:
        q = query.lower()
        has_store = any(k in q for k in self.STORE_KEYWORDS)
        has_external = any(k in q for k in self.EXTERNAL_KEYWORDS)
        if has_store and has_external:
            return "hybrid"
        if has_external:
            return "external"
        return "store"

    async def _store_node(self, state: OrchestrationState) -> OrchestrationState:
        res = await rag_service.process_query(
            state["query"],
            state.get("history", []),
            tenant_id=state.get("tenant_id"),
            role=state.get("role"),
        )
        state["store_response"] = res.response
        return state

    async def _external_node(self, state: OrchestrationState) -> OrchestrationState:
        prompt = (
            "Provide concise external-world business context that can help a retail store decision.\n"
            "If live data is unavailable, clearly label assumptions as estimated.\n"
            f"User query: {state['query']}\n"
            "Output: bullet points with practical impact."
        )
        state["external_response"] = await llm_service.generate_response(prompt)
        return state

    async def _synthesis_node(self, state: OrchestrationState) -> OrchestrationState:
        route = state.get("route", "store")
        store_response = state.get("store_response", "")
        external_response = state.get("external_response", "")

        if route == "store":
            state["final_response"] = store_response
            state["source"] = "STORE_RAG"
            return state
        if route == "external":
            state["final_response"] = external_response
            state["source"] = "EXTERNAL_CONTEXT"
            return state

        prompt = (
            "You are an enterprise AI orchestrator.\n"
            "Merge the following two inputs into one clear answer for a store operator.\n"
            "1) Internal store intelligence:\n"
            f"{store_response}\n\n"
            "2) Outside-world context:\n"
            f"{external_response}\n\n"
            "Rules: prioritize internal facts, then enrich with external context, "
            "and end with 2-3 action items."
        )
        state["final_response"] = await llm_service.generate_response(prompt)
        state["source"] = "HYBRID"
        return state

    def _build_graph(self):
        if StateGraph is None or END is None:
            return None

        graph = StateGraph(OrchestrationState)

        async def route_node(state: OrchestrationState) -> OrchestrationState:
            state["route"] = self._route_query(state["query"])
            return state

        def choose_route(state: OrchestrationState) -> str:
            return state.get("route", "store")

        graph.add_node("route_step", route_node)
        graph.add_node("store_step", self._store_node)
        graph.add_node("external_step", self._external_node)
        graph.add_node("synthesis_step", self._synthesis_node)

        graph.set_entry_point("route_step")
        graph.add_conditional_edges(
            "route_step",
            choose_route,
            {
                "store": "store_step",
                "external": "external_step",
                "hybrid": "store_step",
            },
        )
        graph.add_edge("store_step", "external_step")
        graph.add_edge("external_step", "synthesis_step")
        graph.add_edge("synthesis_step", END)

        return graph.compile()

    async def _run_crew(self, base_result: OrchestrationResult) -> OrchestrationResult:
        if Crew is None or Agent is None or Task is None or Process is None:
            return base_result

        if not os.getenv("OPENAI_API_KEY"):
            return base_result

        try:
            analyst = Agent(
                role="Store Analyst",
                goal="Extract key operational signals",
                backstory="Expert in inventory and retail workflows.",
                allow_delegation=False,
                verbose=False,
            )
            strategist = Agent(
                role="Strategy Analyst",
                goal="Turn signals into concrete actions",
                backstory="Expert in business outcomes and risk.",
                allow_delegation=False,
                verbose=False,
            )
            task = Task(
                description=(
                    "Refine this answer into a practical business recommendation with "
                    "priority, risk, and next steps:\n\n"
                    f"{base_result.response}"
                ),
                expected_output="A concise recommendation with prioritized actions.",
                agent=strategist,
            )
            crew = Crew(
                agents=[analyst, strategist],
                tasks=[task],
                process=Process.sequential,
                verbose=False,
            )
            output = await asyncio.to_thread(crew.kickoff)
            return OrchestrationResult(
                response=str(output),
                source=f"{base_result.source}+CREW",
                route=base_result.route,
                mode="crew",
                metadata={**base_result.metadata, "crew_used": True},
            )
        except Exception:
            return base_result

    async def orchestrate(
        self,
        query: str,
        history: Optional[List[Any]] = None,
        tenant_id: Optional[str] = None,
        role: Optional[str] = None,
        mode: str = "auto",
    ) -> OrchestrationResult:
        started = time.perf_counter()
        history = history or []
        route = self._route_query(query)
        state: OrchestrationState = {
            "query": query,
            "history": history,
            "tenant_id": tenant_id,
            "role": role,
            "route": route,
            "mode": mode,
        }

        if self._graph is not None and mode in {"auto", "langgraph"}:
            final_state = await self._graph.ainvoke(state)
        else:
            if route in {"store", "hybrid"}:
                state = await self._store_node(state)
            if route in {"external", "hybrid"}:
                state = await self._external_node(state)
            final_state = await self._synthesis_node(state)

        result = OrchestrationResult(
            response=final_state.get("final_response", "No response generated."),
            source=final_state.get("source", "UNKNOWN"),
            route=route,
            mode="langgraph" if self._graph is not None and mode in {"auto", "langgraph"} else "fallback",
            metadata={"langgraph_enabled": self._graph is not None},
        )

        if mode == "crew":
            result = await self._run_crew(result)

        elapsed_ms = round((time.perf_counter() - started) * 1000, 2)
        self.logger.emit(
            "orchestration_run",
            {
                "mode": result.mode,
                "route": result.route,
                "source": result.source,
                "latency_ms": elapsed_ms,
                "tenant_id": tenant_id,
                "success": bool(result.response),
            },
        )
        return result


ai_orchestration_service = AIOrchestrationService()
