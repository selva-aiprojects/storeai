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
    async def process_query(self, user_query: str):
        query = user_query.lower().strip().replace("!", "")
        print(f"[RAG] Processing Query: {query}")

        greeting_response = self._handle_greetings(query)
        if greeting_response:
            return greeting_response

        intent = self._route_intent(query)

        context_data = None
        source = None

        if intent == "SQL":
            context_data, source = await self._handle_sql(query)

            # SQL fallback to vector
            if not context_data:
                context_data, source = await self._handle_vector(query)

        else:
            context_data, source = await self._handle_vector(query)

        # SAFETY
        if not context_data or context_data.strip() == "":
            return {
                "response": "I couldn’t find matching data in your store records.",
                "source": "NONE",
                "context": ""
            }

        return await self._synthesize_answer(user_query, context_data, source)

    # -----------------------------
    # GREETING
    # -----------------------------
    def _handle_greetings(self, query: str):
        greetings = {"hello", "hi", "hey", "greetings", "good morning", "good evening"}

        if query in greetings:
            return {
                "response": (
                    "Hello! I’m your StoreAI Intelligence Analyst. "
                    "I can provide sales totals, inventory alerts, and product insights. "
                    "Try 'Total sales this year' or 'Show low stock items'."
                ),
                "source": "HEURISTIC",
                "context": ""
            }
        return None

    # -----------------------------
    # ROUTER
    # -----------------------------
    def _route_intent(self, query: str) -> str:
        sql_keywords = [
            "count", "total", "sum", "average", "avg",
            "revenue", "sales", "profit", "loss",
            "year", "month", "week", "today",
            "overspend", "spending", "expense",
            "how many", "how much",
            "top", "best", "worst",
            "salary", "payroll", "attendance",
            "report", "analytics", "summary"
        ]

        if any(k in query for k in sql_keywords):
            print("[RAG] Intent → SQL")
            return "SQL"

        print("[RAG] Intent → VECTOR")
        return "VECTOR"

    # -----------------------------
    # SQL HANDLER
    # -----------------------------
    async def _handle_sql(self, query: str):
        try:
            sql_prompt = self._build_sql_prompt(query)
            sql = await llm_service.generate_response(sql_prompt)
            sql = sql.replace("```sql", "").replace("```", "").strip()

            print(f"[RAG] Generated SQL → {sql}")

            rows = await db.fetch_rows(sql)
            if not rows:
                return None, None

            # ---- NUMERIC POLISH ----
            if len(rows) == 1 and len(rows[0]) == 1:
                val = list(rows[0].values())[0]
                context_data = f"Total Value: ${val}"
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
        if any(w in query for w in numeric_words):
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
            key = m["name"]
            if key not in seen:
                seen.add(key)
                lines.append(
                    f"• {m['name']} ({m['category']}) - ${m['price']} | Stock: {m['stock']}"
                )

        return "\n".join(lines), "VECTOR"

    # -----------------------------
    # SYNTHESIS
    # -----------------------------
    async def _synthesize_answer(self, user_query, context_data, source):
        try:
            final_prompt = f"""
You are StoreAI Intelligence Analyst.

Context Source: {source}
Data:
{context_data}

User Question: "{user_query}"

Instructions:
- Provide executive style answer.
- If numeric → show totals.
- If list → bullet list.
- Avoid repeating raw rows.
"""

            response = await llm_service.generate_response(final_prompt)

            if "[SYSTEM OVERLOAD]" in response:
                return {
                    "response": "Here is the retrieved data:",
                    "source": source,
                    "context": context_data
                }

            return {"response": response, "source": source, "context": context_data}

        except Exception:
            return {
                "response": "Here is the matching data:",
                "source": source,
                "context": context_data
            }

    # -----------------------------
    # SQL PROMPT
    # -----------------------------
    def _build_sql_prompt(self, query: str) -> str:
        return f"""
You are a PostgreSQL expert.

Generate SAFE READONLY SQL.

Tables:
Product(id, name, price, "stockQuantity")
Sale(id, "totalAmount", "saleDate")
SaleItem(id, "saleId", "productId", "quantity", "unitPrice")

Rules:
- Sales/revenue/totals → SUM("totalAmount")
- Month/year → GROUP BY
- List → SELECT name
- Never INSERT/UPDATE/DELETE
- Return RAW SQL only

User Question: "{query}"
"""


rag_service = RAGService()
