# StoreAI Release Document (v2.2.0 - Stable)
**Release Note:** "The Intelligence Alignment Update"
**Launch Date:** 2026-02-04
**Build Status:** ✅ PASS (Regression Suite 10/10)

---

## 1. Executive Summary
Release v2.2.0 represents the final alignment of the AI Intelligence Layer with enterprise security and operational standards. This release resolves critical flaws in SQL safety, enhances the AI's "General Intelligence" conversational capabilities, and establishes a rock-solid automated regression baseline for future development.

---

## 2. Scope Completion Matrix (vs. FRD)

| FRD ID | Feature Requirement | Status | Completion Updates (v2.2.0) |
| :--- | :--- | :--- | :--- |
| **FRD-01** | Multi-Tenant Data Isolation | **100%** | Hardened tenant-locking in both Node.js and Python (AI) paths. |
| **FRD-02** | FIFO Inventory Deduction | **100%** | Full implementation of batch-level tracking with `StockLedger` audit. |
| **FRD-03** | Automated Finance Ledger | **100%** | Real-time posting of GST and Sales/Purchase entries to Daybook. |
| **FRD-04** | AI Natural Language SQL | **100%** | **CRITICAL UPDATE**: Resolved false-positive blocking of columns (e.g., `createdAt`) via regex word boundaries. |
| **FRD-05** | HR & Attendance Links | **100%** | Attendance logs correctly influence payout calculations in Payroll service. |
| **FRD-06** | Vector Knowledge Base | **100%** | Transitioned to **Local ONNX** embeddings for cost-efficiency and privacy. |
| **FRD-07** | General Assistant Mode | **100%** | **NEW**: Dedicated routing for out-of-scope queries with premium, brand-aware responses. |
| **FRD-08** | Multi-Warehouse Ops | **100%** | Support for cross-warehouse stock query and inventory summary. |
| **FRD-09** | System Dashboard | **100%** | High-speed aggregations for Sales vs. Targets and Stock Health. |
| **FRD-10** | Automated Audit Trail | **100%** | Mandatory `ActivityLog` capture for all write operations. |

---

## 3. Notable Bug Fixes & Improvements

### 🔧 **AI Engine (Python Backend)**
- **SQL Safety Fix**: Introduced `\b` word boundaries in the SQLValidator to prevent legitimate column names (like `createdAt`) from being flagged as `CREATE` commands.
- **Intent Priority Logic**: Optimized the `IntentRouter` to check for General Intelligence *before* SQL keywords, preventing geography/general questions from hitting the database engine.
- **Source Labeling**: Refined the UI to show `General Intelligence` vs `Knowledge Base` labels for improved user trust.

### 🎨 **UI/UX (Frontend)**
- **Telemetry Suppression**: The "Telemetry Data Signal" detail box is now dynamically hidden for non-business (General Intelligence) queries to keep the interface clean.
- **Assistant Persona**: Updated the AI brand persona to "Premium Enterprise Assistant," offering a more sophisticated and helpful tone for high-level conversations.

---

## 4. Quality Assurance Results
The release has been validated using the `qa_ai_regression.py` suite.

- **Total Test Cases**: 10
- **Passed**: 10
- **Failed**: 0
- **Performance**: Average Intent classification latency = 340ms.

---

## 5. Deployment Instructions
1. **Database**: No schema changes required for v2.2.0.
2. **Environment**: Ensure `GROQ_API_KEY` is present in the environment for LLM synthesis.
3. **Build**: Run `npm run build` in `main/client` and `npx tsc` in `main/server`.
4. **AI Proxy**: Start Python backend via `uvicorn main:app --port 8000`.

---

**Release Approved By:**
StoreAI Chief Automation Architect
*2026-02-04*
