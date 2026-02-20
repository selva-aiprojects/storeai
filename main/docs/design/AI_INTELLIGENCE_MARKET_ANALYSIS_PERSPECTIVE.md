# AI Intelligence and Market Analysis Perspective
**Date:** February 20, 2026  
**Scope:** StoreAI internal intelligence + outside-world market relevance

## 1. Why this architecture
Store operations need two kinds of intelligence at the same time:
- Internal truth: inventory, sales, margin, procurement, HR, and finance data from tenant-scoped ERP systems.
- External relevance: market trend, regulation, macro shifts, competitor pressure, and sentiment context.

A single-model answer without orchestration usually overweights one side. StoreAI now uses a routing-first orchestration approach to preserve internal accuracy while injecting external context only when useful.

## 2. How AI tools are used

### LangChain
- Used as the composition layer for prompt-driven reasoning and future tool integration.
- Standardizes chains around query transformation, synthesis, and output shaping.

### LangGraph
- Used as workflow runtime for deterministic orchestration steps:
  - Route query (`store`, `external`, `hybrid`)
  - Run internal intelligence path (RAG/SQL-backed)
  - Run external context path (LLM-guided context generation)
  - Synthesize final action-oriented answer
- Provides stateful, inspectable execution over a graph instead of opaque monolithic prompts.

### CrewAI (optional, isolated runtime)
- Used for multi-agent post-processing when advanced strategy narratives are needed.
- Recommended for asynchronous/offline refinement or premium analyst workflows.
- Kept optional because its dependency chain currently conflicts with the core RAG runtime dependency pins.

### LLMOps
- Every orchestration call emits structured events into JSONL logs.
- Captured fields: mode, route, source, latency, tenant context, success.
- Enables KPI tracking for response quality and operational reliability.

## 3. Decision model: internal-first, market-aware

### Route: `store`
Use when query is operational and tenant-specific (stock, reorder, SKU movement, margin, payroll, compliance).
Result policy:
- Prioritize data-grounded facts from StoreAI systems.
- Avoid external narrative unless explicitly requested.

### Route: `external`
Use when query is market-first (industry shifts, policy trend, macro conditions, competitor benchmark).
Result policy:
- Provide directional context and assumptions.
- Mark inferred or non-live elements clearly.

### Route: `hybrid`
Use when decisions require both (for example: "reorder plan based on current stock and market price movement").
Result policy:
- Start from internal facts.
- Enrich with market implications.
- End with actionable recommendations.

## 4. Market analysis output expectations
For decision usefulness, outputs should include:
- Demand-side signal: likely customer behavior shift.
- Supply-side signal: procurement risk, lead-time, or pricing pressure.
- Financial effect: margin risk/upside and cash-flow implications.
- Action plan: prioritized next 2-3 actions with clear operational impact.

## 5. Governance and realism controls
- Tenant isolation remains mandatory for internal data paths.
- SQL safety guardrails stay active for all text-to-SQL flows.
- External context must be treated as augmentative unless verified with explicit sources.
- Low-confidence responses should present assumptions, not fabricated certainty.

## 6. Operating model recommendation
1. Keep core `/api/chat` for standard in-store assistance and transactional support.
2. Use `/api/ai/orchestrate` for decisions that require market-aware intelligence.
3. Introduce CrewAI-based strategic refinement as a separate worker service once production dependency boundaries are finalized.

## 7. Outcome
This architecture raises realism and data relevance by combining deterministic store intelligence with controlled market context, while preserving operational safety, observability, and tenant correctness.
