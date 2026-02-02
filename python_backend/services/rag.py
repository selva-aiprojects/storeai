"""
RAG Service for StoreAI Intelligence Platform
Handles query processing, intent routing, and response generation
"""

import chromadb
import json
import uuid
import re
import asyncio
from datetime import datetime, date
from decimal import Decimal
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass
from enum import Enum

from services.llm import llm_service
from services.db import db


# ============================================================================
# CONFIGURATION & CONSTANTS
# ============================================================================

class IntentType(Enum):
    """Query intent types"""
    SQL = "SQL"
    VECTOR = "VECTOR"
    GREETING = "GREETING"


class DataSource(Enum):
    """Data retrieval sources"""
    SQL = "SQL"
    VECTOR = "VECTOR"
    HEURISTIC = "HEURISTIC"
    CONVERSATION = "CONVERSATION"
    NONE = "NONE"
    ERROR = "ERROR"


# Constants
NO_DATA_SIGNAL = "NO_NEW_DATA_SIGNAL"
DEFAULT_TENANT_ID = "technova"  # Updated to technova which has the seeded data
MAX_CONTEXT_MESSAGES = 4
MAX_SQL_RESULTS = 15
MAX_VECTOR_RESULTS = 5
SYNTHESIS_MAX_WORDS = 150
CHROMA_DB_PATH = "./chroma_db"
COLLECTION_NAME = "storeai_products"


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class QueryResult:
    """Structured response from RAG processing"""
    response: str
    source: str
    context: Optional[Any] = None


@dataclass
class IntentClassification:
    """Intent classification result"""
    intent_type: IntentType
    confidence: float = 1.0


# ============================================================================
# UTILITIES
# ============================================================================

class CustomJSONEncoder(json.JSONEncoder):
    """Enhanced JSON encoder for common types"""
    
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, uuid.UUID):
            return str(obj)
        if isinstance(obj, Decimal):
            return float(obj)
        if isinstance(obj, Enum):
            return obj.value
        return super().default(obj)


class SQLValidator:
    """Validates and sanitizes SQL queries"""
    
    FORBIDDEN_KEYWORDS = [
        "DROP", "DELETE", "UPDATE", "INSERT", 
        "TRUNCATE", "ALTER", "CREATE", "GRANT", 
        "REVOKE", "EXEC", "EXECUTE"
    ]
    
    @classmethod
    def is_safe(cls, sql: str) -> bool:
        """Check if SQL query is safe (read-only)"""
        if not sql or not sql.strip():
            return False
        
        sql_upper = sql.upper()
        return not any(keyword in sql_upper for keyword in cls.FORBIDDEN_KEYWORDS)
    
    @classmethod
    def extract_first_query(cls, sql: str) -> str:
        """Extract and clean the first query from multi-statement SQL"""
        return sql.split(";")[0].strip()


class SQLExtractor:
    """Extracts SQL from various response formats"""
    
    @staticmethod
    def extract(response: str) -> Optional[str]:
        """Extract SQL from LLM response (handles markdown and plain text)"""
        if not response:
            return None
        
        # Try markdown code block first
        sql_match = re.search(
            r"```sql\n?(.*?)\n?```", 
            response, 
            re.DOTALL | re.IGNORECASE
        )
        if sql_match:
            return sql_match.group(1).strip()
        
        # Try to find SELECT statement
        select_match = re.search(
            r"(SELECT\s+.*?(?:;|$))", 
            response, 
            re.DOTALL | re.IGNORECASE
        )
        if select_match:
            return select_match.group(1).strip()
        
        # Fallback: clean backticks
        return response.replace("```sql", "").replace("```", "").strip()


# ============================================================================
# INTENT ROUTER
# ============================================================================

class IntentRouter:
    """Routes queries to appropriate handlers based on intent"""
    
    # Keywords indicating structured data queries
    SQL_KEYWORDS = {
        # Inventory terms
        "low stock", "reorder", "minimum stock", "stock alert", "running out",
        "stock critical", "below threshold", "stockout", "overstock", "excess stock",
        "surplus", "dead stock", "slow moving", "non moving", "turnover",
        "days on hand", "stock coverage", "stock ageing", "inventory health",
        "warehouse", "location", "variance", "mismatch", "stock health",
        
        # Expiry terms
        "expired", "near expiry", "expiring soon", "batch expiry", "shelf life",
        
        # Sales terms
        "sales", "revenue", "profit", "loss", "margin", "top selling",
        "best seller", "growth", "trend",
        
        # Purchase/Supplier terms
        "purchase order", "po", "pending po", "approved po", "cancelled po",
        "supplier", "vendor", "on time delivery",
        
        # Finance terms
        "payment", "overdue", "invoice", "receivables", "payables", "cash flow",
        "balance sheet", "p&l", "expense", "cost", "bank reconciliation",
        "gst", "tax", "liability", "investment", "capital", "equity",
        "daybook", "ledger", "transactions", "financial", "debit", "credit",
        
        # HR & Resource terms
        "resource", "allocation", "headcount", "joiners", "exits", "attrition",
        "attendance", "absenteeism", "late coming", "leave", "holiday",
        "payroll", "salary", "overtime", "deductions", "reimbursements",
        "performance", "appraisal", "performer", "training",
        "employee", "employees", "staff", "department", "designation",
        
        # Operations terms
        "anomaly", "spike", "drop", "outlier", "duplicate", "data issue",
        "missing data", "sync", "failed job", "background task", "exception list",
        
        # Executive/Analytics terms
        "business summary", "overview", "store health", "risks", "red flags",
        "watchlist", "bottlenecks", "kpi", "metrics", "insights", "forecast",
        "demand", "attention", "changed",
        
        # Aggregation terms
        "count", "total", "sum", "average", "avg", "how many", "how much",
        "top", "best", "worst", "highest", "lowest", "show", "list",
        
        # Time-based terms (critical for date queries)
        "yesterday", "today", "this week", "this month", "last week", "last month",
        "daily", "weekly", "monthly", "yearly", "recent", "latest",
        
        # Customer terms
        # Customer terms
        "customer", "customers", "top customer", "buyer", "client",
        
        # Additional operational terms
        "health", "audit", "compliance", "unpaid", "pending", "overdue",
        "aging", "returns", "refunds", "stock movement", "valuation"
    }
    
    GREETING_PATTERNS = {
        "hello", "hi", "hey", "greetings", "good morning", 
        "good evening", "good afternoon", "who are you", "help"
    }
    
    @classmethod
    async classify(cls, query: str, llm_service=None) -> IntentClassification:
        """Classify query intent with LLM fallback for high accuracy"""
        normalized_query = query.lower().strip()
        
        # 1. Check for greetings
        if cls._is_greeting(normalized_query):
            return IntentClassification(IntentType.GREETING)
        
        # 2. Heuristic keyword matching (Fast path)
        if cls._contains_sql_keywords(normalized_query):
            return IntentClassification(IntentType.SQL)
            
        # 3. LLM Fallback (Slow path - Intelligence path)
        if llm_service:
            try:
                prompt = f"""Classify the intent of the following user query for an ERP system.
Query: "{query}"

Intent Types:
- SQL: Querying structured database (sales, stock, accounting, attendance)
- VECTOR: Semantic product search, descriptions, or general knowledge
- GREETING: Simple hello, help, or who are you

Return ONLY the Intent Type (SQL/VECTOR/GREETING). No explanation."""
                response = await llm_service.generate_response(prompt)
                intent_str = response.strip().upper()
                
                if "SQL" in intent_str: return IntentClassification(IntentType.SQL)
                if "GREETING" in intent_str: return IntentClassification(IntentType.GREETING)
                return IntentClassification(IntentType.VECTOR)
            except:
                pass
        
        return IntentClassification(IntentType.VECTOR)
    
    @classmethod
    def _is_greeting(cls, query: str) -> bool:
        """Check if query is a greeting"""
        return (
            query in cls.GREETING_PATTERNS or 
            (len(query) < 4 and any(g in query for g in ["hi", "hey"]))
        )
    
    @classmethod
    def _contains_sql_keywords(cls, query: str) -> bool:
        """Check if query contains SQL-triggering keywords"""
        return any(keyword in query for keyword in cls.SQL_KEYWORDS)


# ============================================================================
# PROMPT TEMPLATES
# ============================================================================

class PromptTemplates:
    """Centralized prompt templates"""
    
    @staticmethod
    def query_refinement(query: str, history: List[Dict]) -> str:
        """Prompt for refining query with conversation context"""
        history_text = "\n".join([
            f"{msg['role'].upper()}: {msg['content']}" 
            for msg in history
        ])
        
        return f"""Given the conversation history and the newest question, rewrite the newest question into a standalone search query.
The standalone query should contain all context (product names, timeframes, categories) mentioned previously.
If the question is already standalone, return it as is.

History:
{history_text}

New Question: {query}

Standalone Query:"""
    
    @staticmethod
    def sql_generation(query: str, tenant_id: str = DEFAULT_TENANT_ID) -> str:
        """Prompt for SQL generation with deep accounting context"""
        return f"""You are the Advanced StoreAI Business Assistant (PostgreSQL Specialist).
Generate EXECUTION-READY, READONLY SQL for the "{tenant_id}" environment.

SCHEMA CONTEXT:
- "Product"("id", "sku", "name", "price", "stockQuantity", "tenantId")
- "Sale"("id", "invoiceNo", "totalAmount", "taxAmount", "tenantId", "createdAt")
- "Payment"("id", "amount", "method", "saleId", "tenantId") -> Links to "Sale"
- "LedgerEntry"("id", "accountId", "debitAmount", "creditAmount", "referenceType", "referenceId", "tenantId")
- "ChartOfAccounts"("id", "name", "accountType", "accountGroup", "tenantId")
- "Employee"("id", "firstName", "lastName", "designation", "tenantId")
- "Attendance"("id", "employeeId", "status", "date")

CRITICAL RULES:
1. TENANT ISOLATION: Use (T."tenantId" = '{tenant_id}') for every table.
2. ACCOUNTING: Joins "LedgerEntry" with "ChartOfAccounts" to filter by accountGroup ('INCOME', 'EXPENSES', 'ASSETS', 'LIABILITIES').
3. QUOTING: Use DOUBLE QUOTES for ALL table and column names.
4. AGGREGATION: Use SUM(), COUNT(), or AVG() as requested.
5. NO MARKDOWN: Return only the SQL string.

QUERY: "{query}"
SQL:"""
    
    @staticmethod
    def answer_synthesis(
        user_query: str, 
        context_data: str, 
        history: List[Dict]
    ) -> str:
        """Prompt for final answer synthesis"""
        history_str = ""
        if history:
            history_str = "\n".join([
                f"{m['role'].upper()}: {m['content']}" 
                for m in history[-5:]
            ])
        
        return f"""ROLE: Lead StoreAI Assistant.
CONTEXT: Business Intelligence Guide.

Respond to "{user_query}" based on the telemetry below.

TELEMETRY DATA:
{context_data}

CONVERSATION HISTORY:
{history_str if history_str else "N/A"}

INSTRUCTIONS:
1. DATA-DRIVEN: Use specific numbers from telemetry.
2. NO HALLUCINATION: If telemetry is empty or null, state "No specific data found for this period/category."
3. PROFESSIONAL TONE: Reassuring and insightful.
4. MARKDOWN: Use tables for product lists or financial breakdowns.
5. INSIGHT: Add one "Smart Observation" based on the data trends.
6. CALL TO ACTION: End with a highly relevant follow-up question.
7. MAX WORDS: {SYNTHESIS_MAX_WORDS}

RESPONSE:"""


# ============================================================================
# DATA HANDLERS
# ============================================================================

class SQLHandler:
    """Handles SQL-based data retrieval"""
    
    def __init__(self, db_service, llm_service):
        self.db = db_service
        self.llm = llm_service
    
    async def execute(self, query: str, tenant_id: str = DEFAULT_TENANT_ID) -> Tuple[Optional[str], Optional[str]]:
        """
        Generate and execute SQL query
        Returns: (context_data, source) tuple
        """
        try:
            # Generate SQL
            sql_prompt = PromptTemplates.sql_generation(query, tenant_id)
            llm_response = await self.llm.generate_response(sql_prompt)
            
            if not llm_response or "[SYSTEM OVERLOAD]" in llm_response:
                print("[SQL Handler] LLM overload or empty response")
                return None, None
            
            # Extract SQL
            sql = SQLExtractor.extract(llm_response)
            if not sql:
                print("[SQL Handler] Failed to extract SQL from response")
                return None, None
            
            # Validate and clean
            sql = SQLValidator.extract_first_query(sql)
            if not SQLValidator.is_safe(sql):
                print(f"[SQL Handler] Unsafe SQL blocked: {sql}")
                return None, None
            
            print(f"[SQL Handler] Executing: {sql}")
            
            # Execute query
            rows = await self.db.fetch_rows(sql)
            
            if not rows:
                print("[SQL Handler] Query returned no results")
                return None, None
            
            # Format results
            context_data = self._format_results(rows)
            return context_data, DataSource.SQL.value
            
        except Exception as e:
            print(f"[SQL Handler] Error: {e}")
            import traceback
            traceback.print_exc()
            return None, None
    
    def _format_results(self, rows: List[Dict]) -> str:
        """Format SQL results as JSON"""
        # Single value optimization
        if len(rows) == 1 and len(rows[0]) == 1:
            val = list(rows[0].values())[0]
            if val is None:
                return None
            return json.dumps([{"value": val}], cls=CustomJSONEncoder)
        
        # Limit payload size
        limited_rows = [dict(r) for r in rows[:MAX_SQL_RESULTS]]
        return json.dumps(limited_rows, cls=CustomJSONEncoder)


class VectorHandler:
    """Handles vector-based semantic search"""
    
    def __init__(self, collection, llm_service):
        self.collection = collection
        self.llm = llm_service
    
    async def execute(self, query: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Perform vector similarity search
        Returns: (context_data, source) tuple
        """
        try:
            # Skip if clearly numeric/aggregate query
            if self._is_numeric_query(query):
                return None, None
            
            # Get embedding
            embedding = await self.llm.get_embedding(query)
            if not embedding:
                print("[Vector Handler] Failed to generate embedding")
                return None, None
            
            # Query collection
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=MAX_VECTOR_RESULTS
            )
            
            metadatas = results.get("metadatas", [[]])[0]
            if not metadatas:
                print("[Vector Handler] No results found")
                return None, None
            
            context_data = json.dumps(metadatas, cls=CustomJSONEncoder)
            return context_data, DataSource.VECTOR.value
            
        except Exception as e:
            print(f"[Vector Handler] Error: {e}")
            return None, None
    
    @staticmethod
    def _is_numeric_query(query: str) -> bool:
        """Check if query is clearly numeric/aggregate"""
        numeric_indicators = ["total", "sum", "revenue", "sales", "profit", "count"]
        return any(word in query.lower() for word in numeric_indicators)


# ============================================================================
# MAIN RAG SERVICE
# ============================================================================

class RAGService:
    """
    Retrieval-Augmented Generation Service
    Main orchestrator for query processing
    """
    
    def __init__(
        self,
        chroma_client=None,
        db_service=None,
        llm_service=None,
        tenant_id: str = DEFAULT_TENANT_ID
    ):
        # Initialize ChromaDB
        self.chroma_client = chroma_client or chromadb.PersistentClient(
            path=CHROMA_DB_PATH
        )
        self.collection = self.chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"},
        )
        
        # Services
        self.db = db_service or db
        # Import and initialize LLM service if not provided
        if llm_service is None:
            from services.llm import llm_service as default_llm
            self.llm = default_llm
        else:
            self.llm = llm_service
        self.tenant_slug = tenant_id  # Store the slug
        self.tenant_id = None  # Will be resolved to UUID
        
        # Intent router and handlers
        self.intent_router = IntentRouter()
        self.sql_handler = SQLHandler(self.db, self.llm)
        self.vector_handler = VectorHandler(self.collection, self.llm)
        
        # Concurrency control
        self._semaphore = asyncio.Semaphore(1)

        
    async def _ensure_tenant_id(self):
        """Resolve tenant slug to UUID if not already done"""
        if self.tenant_id is None:
            rows = await self.db.fetch_rows(
                'SELECT "id" FROM "Tenant" WHERE "slug" = $1 LIMIT 1',
                self.tenant_slug
            )
            if rows:
                self.tenant_id = dict(rows[0])['id']
            else:
                # Fallback: if slug not found, try to get first tenant
                fallback = await self.db.fetch_rows('SELECT "id" FROM "Tenant" LIMIT 1')
                if fallback:
                    self.tenant_id = dict(fallback[0])['id']
                else:
                    raise ValueError(f"No tenant found for slug '{self.tenant_slug}'")
    
    # ========================================================================
    # PUBLIC API
    # ========================================================================
    
    # ========================================================================
    # PUBLIC API
    # ========================================================================
    
    async def process_query(
        self, 
        user_query: str, 
        history: List[Dict] = None,
        tenant_id: str = None
    ) -> QueryResult:
        """
        Main entry point for query processing
        
        Args:
            user_query: User's question
            history: Conversation history
            tenant_id: UUID of the tenant to query (context)
        """
        # Fallback to default if no tenant provided (for backward compat/testing)
        # In production this should come from the request
        if not tenant_id:
            # Resolve default slug to UUID
            await self._ensure_tenant_id()
            target_tenant_id = self.tenant_id
        else:
            # Use provided tenant_id (should be UUID from JWT)
            target_tenant_id = tenant_id

        if history is None:
            history = []
        
        async with self._semaphore:
            try:
                # Normalize query
                query = self._normalize_query(user_query)
                print(f"[RAG] Processing for tenant {target_tenant_id}: '{query}'")
                
                # Refine with context
                if len(history) >= 2:
                    refined_query = await self._refine_query(query, history)
                else:
                    refined_query = query
                
                # Handle greetings
                greeting_result = self._handle_greeting(query)
                if greeting_result:
                    return greeting_result
                
                # Route intent
                intent = await IntentRouter.classify(refined_query, self.llm)
                print(f"[RAG] Intent: {intent.intent_type.value}")
                
                # Retrieve context data
                context_data, source = await self._retrieve_context(
                    refined_query, 
                    intent,
                    target_tenant_id
                )
                
                # Handle no data found
                if not self._is_valid_context(context_data):
                    return await self._handle_no_data(history, user_query)
                
                # Synthesize final answer
                return await self._synthesize_answer(
                    user_query, 
                    context_data, 
                    source, 
                    history
                )
                
            except Exception as e:
                print(f"[RAG] Critical error: {e}")
                import traceback
                traceback.print_exc()
                return self._error_response(str(e))
    
    # ========================================================================
    # PRIVATE METHODS
    # ========================================================================
    
    @staticmethod
    def _normalize_query(query: str) -> str:
        """Normalize user query"""
        return (query or "").lower().strip().replace("!", "")
    
    async def _refine_query(self, query: str, history: List[Dict]) -> str:
        """Refine query using conversation context"""
        try:
            recent_history = history[-MAX_CONTEXT_MESSAGES:]
            prompt = PromptTemplates.query_refinement(query, recent_history)
            
            refined = await self.llm.generate_response(prompt)
            
            if not refined or "[SYSTEM OVERLOAD]" in refined:
                return query
            
            return refined.strip().replace('"', "")
            
        except Exception as e:
            print(f"[RAG] Query refinement error: {e}")
            return query
    
    def _handle_greeting(self, query: str) -> Optional[QueryResult]:
        """Handle greeting queries"""
        if IntentRouter._is_greeting(query):
            return QueryResult(
                response=(
                    "Greetings! I am the StoreAI Assistant. "
                    "I am currently synchronized with your live store data. "
                    "How can I assist you with Inventory, Sales, or Staff insights today?"
                ),
                source=DataSource.HEURISTIC.value,
                context="Persona: Helpful Store Assistant"
            )
        return None
    
    async def _retrieve_context(
        self, 
        query: str, 
        intent: IntentClassification,
        tenant_id: str
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Retrieve context data based on intent
        """
        if intent.intent_type == IntentType.SQL:
            # Try SQL first
            context_data, source = await self.sql_handler.execute(
                query, 
                tenant_id
            )
            
            # Fallback to vector if SQL fails
            if not context_data:
                print("[RAG] SQL failed, trying vector fallback")
                await asyncio.sleep(0.2)
                context_data, source = await self.vector_handler.execute(query)
            
            return context_data, source
        
        else:  # VECTOR
            return await self.vector_handler.execute(query)
    
    @staticmethod
    def _is_valid_context(context_data: Optional[str]) -> bool:
        """Check if context data is valid and non-empty"""
        if not context_data:
            return False
        if context_data.strip() == "":
            return False
        if context_data == '[{"value": null}]':
            return False
        return True
    
    async def _handle_no_data(
        self, 
        history: List[Dict], 
        user_query: str
    ) -> QueryResult:
        """Handle cases where no data is found"""
        # If in conversation, try conversational response
        if history:
            return await self._synthesize_answer(
                user_query, 
                NO_DATA_SIGNAL, 
                DataSource.CONVERSATION.value, 
                history
            )
        
        # Provide more helpful guidance based on query type
        query_lower = user_query.lower()
        suggestions = []
        
        if any(term in query_lower for term in ["stock", "product", "inventory"]):
            suggestions.append("Try asking for 'low stock products' or 'stock health overview'")
        elif any(term in query_lower for term in ["sale", "revenue", "transaction"]):
            suggestions.append("Try asking for 'yesterday sales' or 'this month revenue'")
        elif any(term in query_lower for term in ["employee", "staff", "resource", "department"]):
            suggestions.append("Try asking for 'resource allocation by department' or 'employee count'")
        elif any(term in query_lower for term in ["customer", "buyer", "client"]):
            suggestions.append("Try asking for 'top customers' or 'customer list'")
        else:
            suggestions.append("Try being more specific, e.g., 'yesterday sales', 'low stock', or 'top customers'")
        
        # Default no-data response
        response = (
            f"I couldn't find specific data matching your query in the current database. "
            f"{suggestions[0]}. "
        )
        
        if "yesterday" in query_lower or "today" in query_lower:
            response += "Try asking for a broader range, like 'this week' or 'this month' to see if there is any data."
        else:
            response += "You can also ask about stock health, sales trends, or resource allocation."

        return QueryResult(
            response=response,
            source=DataSource.NONE.value,
            context=None
        )
    
    async def _synthesize_answer(
        self,
        user_query: str,
        context_data: str,
        source: str,
        history: List[Dict]
    ) -> QueryResult:
        """Synthesize final answer using LLM"""
        try:
            prompt = PromptTemplates.answer_synthesis(
                user_query, 
                context_data, 
                history
            )
            
            response = await self.llm.generate_response(prompt)
            
            # Handle LLM failure gracefully
            if "[SYSTEM OVERLOAD]" in response:
                response = (
                    "I've retrieved the latest readings from your store telemetry. "
                    "Here is the structured summary for your review."
                )
            
            # Prepare UI context
            ui_context = None if context_data == NO_DATA_SIGNAL else context_data
            
            return QueryResult(
                response=response,
                source=source,
                context=ui_context
            )
            
        except Exception as e:
            print(f"[RAG] Synthesis error: {e}")
            return QueryResult(
                response=(
                    "I've retrieved the following telemetry from your records. "
                    "How shall we proceed with this analysis?"
                ),
                source=source,
                context=context_data if context_data != NO_DATA_SIGNAL else None
            )
    
    @staticmethod
    def _error_response(error_msg: str) -> QueryResult:
        """Create error response"""
        return QueryResult(
            response=(
                "I encountered a synchronization error while accessing the store telemetry. "
                "Please try rephrasing your request."
            ),
            source=DataSource.ERROR.value,
            context=error_msg
        )


# ============================================================================
# MODULE EXPORTS
# ============================================================================

# Singleton instance for backward compatibility
rag_service = RAGService()

__all__ = [
    'RAGService',
    'rag_service',
    'QueryResult',
    'IntentType',
    'DataSource',
]