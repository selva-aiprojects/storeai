import chromadb
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
                    "Greetings! I am your StoreAI Lead Product Architect [v2.0]. "
                    "I am here to help you optimize your Inventory and Resource Management strategy through real-time telemetry and data-driven insights. "
                    "How can I assist you in streamlining your operations or maximizing your resource efficiency today?"
                ),
                "source": "HEURISTIC",
                "context": "Agent Persona: Inventory & Resource Management Architect"
            }
        return None

    # -----------------------------
    # ROUTER
    # -----------------------------
    def _route_intent(self, query: str) -> str:
        # Keywords that strongly suggest data lookup
        sql_keywords = [
            "count", "total", "sum", "average", "avg",
            "revenue", "sales", "profit", "loss", "value",
            "year", "month", "week", "today", "yesterday", "daily",
            "overspend", "spending", "expense",
            "how many", "how much",
            "top", "best", "worst", "highest", "lowest",
            "salary", "payroll", "attendance", "employee", "staff", "department",
            "return", "refund", "daybook", "ledger", "p&l", "profit", "loss", "liability", "aging", "gst", "tax",
            "report", "analytics", "summary", "stock level", "financial health", "recurring", "rent", "electricity"
        ]

        if any(k in query.lower() for k in sql_keywords):
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
            forbidden = ["DROP", "DELETE", "UPDATE", "INSERT", "TRUNCATE", "ALTER"]
            if any(word in sql.upper() for word in forbidden):
                print(f"[SECURITY ALERT] LLM generated dangerous SQL: {sql}")
                return None, None

            print(f"[RAG] Generated SQL: {sql}")

            rows = await db.fetch_rows(sql)
            if not rows:
                return None, None

            # ---- NUMERIC POLISH ----
            if len(rows) == 1 and len(rows[0]) == 1:
                val = list(rows[0].values())[0]
                context_data = f"Value Found: {val}"
                return context_data, "SQL"

            context_data = "\n".join([str(dict(r)) for r in rows[:15]])
            return context_data, "SQL"

        except Exception as e:
            print(f"[RAG] SQL failed → {e}")
            return None, None

    # -----------------------------
    # VECTOR HANDLER
    # -----------------------------
    async def _handle_vector(self, query: str):

        numeric_words = ["year", "total", "sum", "revenue", "sales", "profit"]
        if any(w in query.lower() for w in numeric_words):
            return None, None

        embedding = await llm_service.get_embedding(query)
        if not embedding:
            return None, None

        results = collection.query(query_embeddings=[embedding], n_results=5)

        metas = results["metadatas"][0]

        # ---- DUPLICATE CLEAN ----
        seen = set()
        lines = []
        for m in metas:
            key = m.get("name")
            if key and key not in seen:
                seen.add(key)
                lines.append(
                    f"- {m['name']} ({m['category']}) - ${m['price']} | Stock: {m['stock']}"
                )

        if not lines:
             return None, None

        return "\n".join(lines), "VECTOR"

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
1. DO NOT simply list the data. INTERPRET it for the business owner.
2. If this is a follow-up, reference the previous context (e.g., "Building on our discussion about...")
3. Use a "pleasing and professional" tone. Avoid being a generic chatbot. Incorporate financial keywords like "Aging Analysis" or "GST Compliance" naturally where relevant.
4. If no data is found (Source: NONE), explain specifically what resource data we're missing and suggest related metrics you CAN check (e.g., "I don't see Sales Returns yet, but I can check your overall sales health").
5. End every response with a "Strategic Next Step" question or suggestion.
6. FINANCIAL INTELLIGENCE: Always mention the impact on "Financial Health" if the query relates to costs, returns, or revenue.

RESPONSE:"""

            response = await llm_service.generate_response(final_prompt)

            if "[SYSTEM OVERLOAD]" in response:
                return {
                    "response": "Architectural alert: I'm currently processing complex data streams. Here is the raw telemetry signal I've intercepted for you.",
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
- "Employee"(id, "employeeId", designation, salary)
- "Attendance"(id, "employeeId", date, status)
- "Payroll"(id, "employeeId", month, year, "totalPayout")
- "Department"(id, name)
- "Customer"(id, name, email)

SQL RULES:
1. Double quotes for ALL identifiers: SELECT "totalAmount" FROM "Sale".
2. Revenue → SUM(debit) FROM "Daybook" WHERE type='INCOME'.
3. Expenses/Outflow → SUM(credit) FROM "Daybook" WHERE type='EXPENSE'.
4. Returns → SUM("totalRefund") FROM "SalesReturn".
5. Liability Aging → Count/Sum "totalAmount" FROM "Sale" WHERE "isPaid" = false.
6. GST Liability → Sum "gstAmount" (from Sale) vs Input tax.
7. Return RAW SQL ONLY.
8. Case-insensitive: Use ILIKE '%term%'.
9. For Daybook, "debit" is money IN, "credit" is money OUT.

Question: "{query}"
"""


rag_service = RAGService()
