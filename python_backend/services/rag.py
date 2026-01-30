import chromadb
import json
import uuid
from datetime import datetime, date
from decimal import Decimal
from services.llm import llm_service
from services.db import db

# -----------------------------
# CHROMA INITIALIZATION
# -----------------------------
chroma_client = chromadb.PersistentClient(path="./chroma_db")

collection = chroma_client.get_or_create_collection(
    name="storeai_products",
    metadata={"hnsw:space": "cosine"}
)

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


class RAGService:

    # -----------------------------
    # ENTRY POINT
    # -----------------------------
    async def process_query(self, user_query: str, history: list = []):
        query = user_query.lower().strip().replace("!", "")
        print(f"[RAG] Processing Query: {query} (History Length: {len(history)})")

        # Refine query for context if history exists
        refined_query = await self._refine_query(query, history) if history else query
        print(f"[RAG] Refined Query: {refined_query}")

        # Greeting check on the RAW query to avoid refined queries triggering it
        greeting_response = self._handle_greetings(query)
        if greeting_response:
            return greeting_response

        intent = self._route_intent(refined_query)

        context_data = None
        source = None

        if intent == "SQL":
            context_data, source = await self._handle_sql(refined_query)

            # SQL fallback to vector
            if not context_data:
                context_data, source = await self._handle_vector(refined_query)

        else:
            context_data, source = await self._handle_vector(refined_query)

        # SAFETY
        if not context_data or context_data.strip() == "":
            # Fallback to pure conversational if no data found but it's a follow-up
            if history:
                 return await self._synthesize_answer(user_query, "No specific new data records found for this follow-up.", "CONVERSATION", history)

            return {
                "response": "I couldn’t find matching data in your store records. Could you please specify which products or dates you're interested in?",
                "source": "NONE",
                "context": ""
            }

        return await self._synthesize_answer(user_query, context_data, source, history)

    # -----------------------------
    # QUERY REFINEMENT
    # -----------------------------
    async def _refine_query(self, query: str, history: list) -> str:
        try:
            # We only need the last few messages for context
            last_msgs = history[-4:]
            prompt = f"""
Given the conversation history and the newest question, rewrite the newest question into a standalone search query.
The standalone query should contain all context (product names, timeframes, categories) mentioned previously.
If the question is already standalone, return it as is.

History:
{last_msgs}

New Question: {query}

Standalone Query:"""
            refined = await llm_service.generate_response(prompt)
            if "[SYSTEM OVERLOAD]" in refined or not refined:
                 return query
            return refined.strip().replace('"', '')
        except:
            return query

    # -----------------------------
    # GREETING
    # -----------------------------
    def _handle_greetings(self, query: str):
        greetings = ["hello", "hi", "hey", "greetings", "good morning", "good evening", "who are you"]
        
        # Check if query is EXACTLY a greeting (or very close)
        if query in greetings or (len(query) < 4 and any(g in query for g in ["hi", "hey"])):
            print(f"[DEBUG] Greeting matched for: {query}")
            return {
                "response": (
                    "Greetings! I am your StoreAI Assistant. "
                    "I am currently synchronized with your store's live data to help you oversee Inventory, Sales, and Resource Allocation. "
                    "What part of your business shall we look at together today?"
                ),
                "source": "HEURISTIC",
                "context": "Persona: Supportive Business Assistant"
            }
        return None

    # -----------------------------
    # ROUTER
    # -----------------------------
    def _route_intent(self, query: str) -> str:
        # Keywords that strongly suggest data lookup
        sql_keywords = [
            # Inventory
            "low stock", "reorder", "minimum stock", "stock alert", "running out", "stock critical", "below threshold", "stockout",
            "overstock", "excess stock", "surplus", "dead stock", "slow moving", "non moving",
            "turnover", "days on hand", "stock coverage", "stock ageing", "inventory health",
            "warehouse", "location", "variance", "mismatch",
            # Expiry
            "expired", "near expiry", "expiring soon", "batch expiry", "shelf life",
            # Sales
            "sales", "revenue", "profit", "loss", "margin", "top selling", "best seller", "growth", "trend",
            # Purchase/Supplier
            "purchase order", "po", "pending po", "approved po", "cancelled po", "supplier", "vendor", "on time delivery",
            # Finance
            "payment", "overdue", "invoice", "receivables", "payables", "cash flow", "balance sheet", "p&l", "expense", "cost",
            "bank reconciliation", "gst", "tax", "liability",
            # HR
            "headcount", "joiners", "exits", "attrition", "attendance", "absenteeism", "late coming", "leave", "holiday",
            "payroll", "salary", "overtime", "deductions", "reimbursements", "performance", "appraisal", "performer", "training",
            # Ops
            "anomaly", "spike", "drop", "outlier", "duplicate", "data issue", "missing data", "sync", "failed job", "background task",
            "exception list",
            # Executive/NLP
            "business summary", "overview", "store health", "risks", "red flags", "watchlist", "bottlenecks", "kpi", "metrics",
            "insights", "forecast", "demand", "attention", "changed"
        ]

        # Common SQL terms
        core_sql_terms = [
            "count", "total", "sum", "average", "avg", "how many", "how much", "top", "best", "worst", "highest", "lowest", "show", "list"
        ]

        combined_keywords = sql_keywords + core_sql_terms
        
        if any(k in query.lower() for k in combined_keywords):
            print("[RAG] Intent: SQL")
            return "SQL"

        print("[RAG] Intent: VECTOR")
        return "VECTOR"

    # -----------------------------
    # SQL HANDLER
    # -----------------------------
    async def _handle_sql(self, query: str):
        try:
            sql_prompt = self._build_sql_prompt(query)
            raw_response = await llm_service.generate_response(sql_prompt)
            
            # Robust SQL extraction from Markdown
            import re
            sql_match = re.search(r"```sql\n?(.*?)\n?```", raw_response, re.DOTALL | re.IGNORECASE)
            if sql_match:
                sql = sql_match.group(1).strip()
            else:
                sql = raw_response.replace("```sql", "").replace("```", "").strip()

            # Architecture Safety Check (Read Only)
            forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "TRUNCATE", "ALTER", "[SYSTEM OVERLOAD]"]
            if not sql or any(word in sql.upper() for word in forbidden):
                print(f"[RAG] SQL Safety Blocked or Invalid: {sql}")
                return None, None

            print(f"[RAG] Generated SQL: {sql}")

            rows = await db.fetch_rows(sql)
            if not rows:
                return None, None

            # ---- NUMERIC POLISH ----
            if len(rows) == 1 and len(rows[0]) == 1:
                val = list(rows[0].values())[0]
                # Still return as JSON list for the UI renderer to be consistent
                context_data = json.dumps([{"value": val}], cls=CustomEncoder)
                return context_data, "SQL"

            context_data = json.dumps([dict(r) for r in rows[:15]], cls=CustomEncoder)
            return context_data, "SQL"

        except Exception as e:
            print(f"[RAG] SQL failed → {e}")
            return None, None

    # -----------------------------
    # VECTOR HANDLER
    # -----------------------------
    async def _handle_vector(self, query: str):
        try:
            numeric_words = ["year", "total", "sum", "revenue", "sales", "profit"]
            if any(w in query.lower() for w in numeric_words):
                return None, None

            embedding = await llm_service.get_embedding(query)
            if not embedding:
                return None, None

            results = collection.query(query_embeddings=[embedding], n_results=5)

            metas = results["metadatas"][0]
            if not metas:
                 return None, None

            # Return as JSON string for consistent UI table rendering
            return json.dumps(metas, cls=CustomEncoder), "VECTOR"
        except Exception as e:
            print(f"[RAG] Vector query failed → {e}")
            return None, None

    # -----------------------------
    # SYNTHESIS
    # -----------------------------
    async def _synthesize_answer(self, user_query, context_data, source, history):
        try:
            # Format history for the prompt
            history_str = ""
            if history:
                history_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in history[-5:]])

            final_prompt = f"""
ROLE: You are the StoreAI Lead AI Product Architect. 
You are an expert in Inventory Management, Resource Allocation, and Operational Telemetry.
You are briefing a business owner with a tone that is professional, highly intelligent, yet warm and partner-like.

CURRENT TASK: 
Synthesize raw store data into a strategic business insight.

CONTEXTUAL DATA ({source}):
{context_data}

CONVERSATION HISTORY (FOR CONTINUITY):
{history_str if history_str else "New conversation started."}

USER QUESTION: "{user_query}"

CONSTRAINTS:
1. DO NOT simply list the data. Briefly interpret it for the business owner in a helpful, calm tone.
2. If this is a follow-up, reference the previous context naturally.
3. DATA VISIBILITY: If you are presenting a list of products, stock levels, or sales, use MARKDOWN TABLES for better readability.
4. TONE: Be professional and reassuring. Avoid using words like "Critical," "Alert," "Alarming," or "Discrepancy" unless it's a genuine emergency. If stock is negative, suggest it might be a pending restock or data entry update.
5. FINANCIAL CONTEXT: Mention the positive impact of data-driven decisions on "Financial Health."
6. End with a "Strategic Next Step" suggesting a specific follow-up query.

RESPONSE:"""

            response = await llm_service.generate_response(final_prompt)

            if "[SYSTEM OVERLOAD]" in response:
                return {
                    "response": "I've retrieved the latest readings from your store telemetry. Here is the structured summary for your review.",
                    "source": source,
                    "context": context_data
                }

            return {"response": response, "source": source, "context": context_data}

        except Exception as e:
            print(f"Synthesis Error: {e}")
            return {
                "response": "Strategic Insight: I've retrieved the following telemetry from your inventory records. How shall we proceed with this allocation?",
                "source": source,
                "context": context_data
            }

    # -----------------------------
    # SQL PROMPT
    # -----------------------------
    def _build_sql_prompt(self, query: str) -> str:
        return f"""
You are the StoreAI Strategic Analysis Engine (PostgreSQL Expert).

Generate SAFE READONLY SQL based on this schema:

CORE TABLES:
- "Product"(id, "sku", name, price, "stockQuantity", "lowStockThreshold")
- "Category"(id, name)
- "Sale"(id, "invoiceNo", "totalAmount", "taxAmount", "gstAmount", "dueDate", "isPaid", "createdAt")
- "SaleItem"(id, "saleId", "productId", "quantity", "unitPrice")

FINANCE & ACCOUNTING:
- "SalesReturn"(id, "saleId", "totalRefund", "transportDeduction", "gstDeduction", "condition")
- "Daybook"(id, "date", "type", "description", "debit", "credit", "status")
- "RecurringExpense"(id, name, "baseAmount", "category", "isActive")
- "GSTLog"(id, "type", "amount", "isPaid")

HR, PAYROLL & CRM:
- "Employee"(id, "employeeId", designation, salary, "joinedAt", "leftAt", "isDeleted")
- "Attendance"(id, "employeeId", date, status)
- "Payroll"(id, "employeeId", month, year, "totalPayout")
- "Department"(id, name)
- "Customer"(id, name, email)

SQL RULES:
1. Double quotes for ALL identifiers: SELECT "totalAmount" FROM "Sale".
2. Revenue → SUM(debit) FROM "Daybook" WHERE type='INCOME'.
3. Expenses/Outflow → SUM(credit) FROM "Daybook" WHERE type='EXPENSE'.
4. Returns → SUM("totalRefund") FROM "SalesReturn".
5. Liability Aging → Count/Sum "totalAmount" FROM "Sale" WHERE "isPaid" = false AND "dueDate" < CURRENT_DATE.
6. GST Liability → Sum "gstAmount" (from Sale) vs Input tax.
7. Inventory Turnover → (COGS / Average Inventory) - use total sales / current stock value as proxy if needed.
8. Attrition → Count "leftAt" / Count total employees.
9. Top Performers → Employee with highest sales (Sale joined with Employee) or lowest absenteeism.
10. Case-insensitive: Use ILIKE '%term%'.
11. Return RAW SQL ONLY inside a code block.

Question: "{query}"
"""


rag_service = RAGService()
