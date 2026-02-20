# AI Orchestration Sanity and Integration Report
**Date:** February 20, 2026  
**Environment:** `d:\Training\working\Store-AI`  
**Runtime:** Python 3.11 venv (`.venv`)

## Summary
Sanity and integration checks were executed for the new orchestration path (`/api/ai/orchestrate`) and passed after resolving dependency and graph-construction issues.

## Executed checks

### 1. Syntax validation
- Command:
  - `python -m py_compile python_backend/services/ai_orchestration.py python_backend/main.py`
- Result: PASS

### 2. Service-level orchestration sanity test
- Scope:
  - Route classification for `store`, `external`, `hybrid`
  - Response source mapping
- Method:
  - Monkeypatched `rag_service.process_query` and `llm_service.generate_response` for deterministic offline behavior
- Result: PASS (`SERVICE_TEST_PASS`)

### 3. API integration test (`/api/ai/orchestrate`)
- Scope:
  - JWT-authenticated request handling
  - Endpoint response contract validation
- Method:
  - `httpx.ASGITransport` against FastAPI app
  - Monkeypatched orchestration service for deterministic response
- Result: PASS (`API_TEST_PASS`)

## Issues found and fixes applied

### A. Dependency conflict (initial)
- Issue:
  - `langchain` required newer `pydantic` than previous pin.
  - `crewai` conflicted with core `chromadb==0.4.22`.
- Fix:
  - Updated core requirement to `pydantic>=2.8.2,<3.0.0`.
  - Kept CrewAI out of core runtime dependencies.
  - Added isolated worker dependency file:
    - `python_backend/requirements.crewai-worker.txt`

### B. LangGraph node/state naming conflict
- Issue:
  - Graph node ID `route` conflicted with state key `route`.
- Fix:
  - Renamed graph node IDs to `route_step`, `store_step`, `external_step`, `synthesis_step`.

### C. Windows console Unicode logging noise
- Issue:
  - Emoji/mojibake log strings generated `UnicodeEncodeError` in cp1252 console.
- Fix:
  - Normalized affected log lines in `python_backend/main.py` to ASCII-safe messages.

## Final status
- Orchestration feature: READY for controlled rollout.
- Core runtime install path: STABLE.
- CrewAI: supported as optional isolated worker runtime.
