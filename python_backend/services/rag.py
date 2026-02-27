"""
RAG Service for StoreAI Intelligence Platform
Handles query processing, intent routing, and response generation
"""

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
    GENERAL = "GENERAL"


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
DEFAULT_TENANT_ID = "storeai"  # Updated to storeai (owner of seeded data)
MAX_CONTEXT_MESSAGES = 4
MAX_SQL_RESULTS = 15
MAX_VECTOR_RESULTS = 5
SYNTHESIS_MAX_WORDS = 150
# Defaults for lazy initialization
CHROMA_DB_PATH = "./chroma_db_v2"
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
    intent: Optional[str] = None


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
        
        # Use regex to find exact words only (prevents blocking "createdAt" because of "CREATE")
        # Prevent huge data dumps
        if "LIMIT" not in sql_upper:
            return False
        return True
    
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
    
    SQL_KEYWORDS = {
        # Core inventory/product terms
        "stock", "product", "inventory", "item", "sku", "catalog", "list", "show",
        "find", "search", "check", "available", "quantity", "price",
        
        # Original keywords
        "low stock", "reorder", "minimum stock", "stock alert", "running out",
        "stock critical", "below threshold", "stockout", "overstock", "excess stock",
        "surplus", "dead stock", "slow moving", "non moving", "turnover",
        "days on hand", "stock coverage", "stock ageing", "inventory health",
        "warehouse", "location", "variance", "mismatch", "stock health",
        "expired", "near expiry", "expiring soon", "batch expiry", "shelf life",
        "sales", "revenue", "profit", "loss", "margin", "top selling",
        "best seller", "growth", "trend",
        "purchase order", "po", "pending po", "approved po", "cancelled po",
        "supplier", "vendor", "on time delivery",
        "payment", "overdue", "invoice", "receivables", "payables", "cash flow",
        "balance sheet", "p&l", "expense", "cost", "bank reconciliation",
        "gst", "tax", "liability", "investment", "share capital", "working capital", "equity",
        "daybook", "ledger", "transactions", "financial", "debit", "credit",
        "resource", "allocation", "headcount", "joiners", "exits", "attrition",
        "attendance", "absenteeism", "late coming", "leave", "holiday",
        "payroll", "salary", "overtime", "deductions", "reimbursements",
        "performance", "appraisal", "performer", "training",
        "employee", "employees", "staff", "department", "designation",
        "anomaly", "spike", "drop", "outlier", "duplicate", "data issue",
        "missing data", "sync", "failed job", "background task", "exception list",
        "business summary", "overview", "store health", "risks", "red flags",
        "watchlist", "bottlenecks", "kpi", "metrics", "insights", "forecast",
        "demand", "attention", "changed",
        "count", "total", "sum", "average", "avg",
        "yesterday", "today", "this week", "this month", "last week", "last month",
        "daily", "weekly", "monthly", "yearly", "recent", "latest",
        "customer", "customers", "top customer", "buyer", "client",
        "health", "audit", "compliance", "unpaid", "pending", "overdue",
        "aging", "returns", "refunds", "stock movement", "valuation"
    }
    
    GREETING_PATTERNS = {
        "hello", "hi", "hey", "greetings", "good morning", 
        "good evening", "good afternoon", "who are you", "help"
    }

    GENERAL_KEYWORDS = {
        "weather", "time", "joke", "news", "how are you", 
        "what is", "calculate", "math",
        "who is", "where is", "capital", "distance", "temperature",
        "who created", "definition", "meaning of"
    }
    
    @classmethod
    async def classify(cls, query: str, llm_service=None) -> IntentClassification:
        """Classify query intent with LLM fallback for high accuracy"""
        normalized_query = query.lower().strip()
        
        # 1. Check for greetings
        if cls._is_greeting(normalized_query):
            return IntentClassification(IntentType.GREETING)
        
        # 2. Heuristic keyword matching (Fast path)
        if cls._contains_sql_keywords(normalized_query) or any(x in normalized_query for x in ["health", "stock", "sales", "revenue", "product", "product list"]):
            return IntentClassification(IntentType.SQL)

        for kw in cls.GENERAL_KEYWORDS:
            pattern = r'\b' + re.escape(kw) + r'\b'
            if re.search(pattern, normalized_query):
                return IntentClassification(IntentType.GENERAL)

        # 3. LLM Fallback (Slow path - Intelligence path)
        if llm_service:
            try:
                # Secondary force SQL
                if any(x in normalized_query for x in ["health", "stock", "sales", "revenue", "product", "inventory"]):
                    return IntentClassification(IntentType.SQL)

                prompt = f"""Classify the intent of the following user query for an ERP system.
Query: "{query}"

Intent Types:
- SQL: Querying structured database (sales, stock, inventory, product lists, accounting, attendance, health reports, revenue)
- VECTOR: Semantic product search, detailed descriptions, instructions, or store-specific policy knowledge
- GREETING: Simple hello, help, or who are you
- GENERAL: General world knowledge (weather, astronomy, geography, travel), math, or non-store topics

CRITICAL: If the query mentions specific items (like switches, phones, products) OR store operations (sales, stock), you MUST return SQL or VECTOR. Return GENERAL ONLY for topics completely unrelated to a retail/inventory business.

Return ONLY the Intent Type (SQL/VECTOR/GREETING/GENERAL). No explanation."""
                response = await llm_service.generate_response(prompt)
                intent_str = response.strip().upper()
                
                if "SQL" in intent_str: return IntentClassification(IntentType.SQL)
                if "GREETING" in intent_str: return IntentClassification(IntentType.GREETING)
                if "GENERAL" in intent_str: return IntentClassification(IntentType.GENERAL)
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
        """Check if query contains SQL-triggering keywords with word boundaries"""
        for keyword in cls.SQL_KEYWORDS:
            pattern = r'\b' + re.escape(keyword) + r'\b'
            if re.search(pattern, query):
                return True
        return False


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
    def sql_generation(query: str, tenant_id: str = DEFAULT_TENANT_ID, role: str = None) -> str:
        """Prompt for SQL generation with deep accounting context"""
        tenant_filter = f'TENANT ISOLATION: Use (T."tenantId" = \'{tenant_id}\') for every table.'
        if role == 'SUPER_ADMIN':
            tenant_filter = 'SUPERADMIN MODE: OMIT tenantId filters. Query across ALL tenants to provide a global view.'

        return f"""You are the Advanced StoreAI Business Assistant (PostgreSQL Specialist).
Generate EXECUTION-READY, READONLY SQL for the "{tenant_id}" environment.

SCHEMA CONTEXT (PostgreSQL):
- Table "Product" columns: ("id", "sku", "name", "price", "stockQuantity", "categoryId", "tenantId", "isDeleted", "createdAt")
- Table "Sale" columns: ("id", "invoiceNo", "totalAmount", "taxAmount", "cgstAmount", "sgstAmount", "igstAmount", "customerId", "tenantId", "createdAt")
- Table "Payment" columns: ("id", "amount", "method", "saleId" (FOREIGN KEY to Sale.id), "tenantId")
- Table "Employee" columns: ("id", "firstName", "lastName", "designation", "salary", "tenantId", "isDeleted")

CRITICAL: The columns are case-sensitive. You MUST wrap every column name in DOUBLE QUOTES (e.g., SELECT "totalAmount" FROM "Sale").

CRITICAL RULES:
1. {tenant_filter}
2. QUOTING: Use DOUBLE QUOTES for EVERY column and table name (e.g., SELECT T."stockQuantity" FROM "Product" T).
3. CASE SENSITIVITY: Use ILIKE for all string comparisons.
4. DATE FILTERING (PostgreSQL): 
   - Yesterday: WHERE "createdAt"::DATE = CURRENT_DATE - INTERVAL '1 day'
   - Today: WHERE "createdAt"::DATE = CURRENT_DATE
   - Last 7 Days: WHERE "createdAt" > NOW() - INTERVAL '7 days'
5. LIMIT: Always append "LIMIT 50" unless a specific count is requested.
6. NO MARKDOWN: Return ONLY the standard SQL string.

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

Respond to "{user_query}" based on the telemetry provided.

TELEMETRY DATA (JSON):
{context_data}

CONVERSATION HISTORY:
{history_str if history_str else "N/A"}

CRITICAL INSTRUCTIONS:
1. DATA TRANSPARENCY: You MUST directly cite the numbers from the TELEMETRY DATA. If the data shows 500 units, say "500 units". DO NOT generalize or omit specific counts/amounts.
2. NO DATA FALLBACK: If TELEMETRY DATA contains "{NO_DATA_SIGNAL}" or is empty/null, you MUST state: "I've reviewed the store records for your request, but no specific data was found for this period/category."
3. FORMATTING: Use Markdown tables or bold text to highlight specific data points.
4. INSIGHT: Add one "Smart Observation" based on the patterns identified in the numbers.
5. CALL TO ACTION: End with a relevant follow-up question.
6. MAX WORDS: {SYNTHESIS_MAX_WORDS}

RESPONSE:"""

    @staticmethod
    def general_synthesis(user_query: str, history: List[Dict]) -> str:
        """Prompt for general, non-platform specific conversation"""
        history_str = ""
        if history:
            history_str = "\n".join([
                f"{m['role'].upper()}: {m['content']}" 
                for m in history[-5:]
            ])

        return f"""ROLE: StoreAI Premium Assistant (General Intelligence Mode).
CONTEXT: You are the high-end AI brain for the StoreAI Enterprise platform. 
While your core expertise is financial oversight and stock management, you are capable of engaging in intelligent, high-level conversation, answering world knowledge queries, and providing general assistance.

CONVERSATION HISTORY:
{history_str if history_str else "N/A"}

USER QUERY: "{user_query}"

CRITICAL INSTRUCTIONS:
1. PREMIUM TONE: Use a polished, eloquent, and sophisticated tone. Avoid being robotic.
2. INTELLIGENT HELP: Provide direct and accurate answers for general facts, weather, or math.
3. BRAND AWARENESS: Occasionally (not always) tie back a general concept to how it might relate to a business or store environment if relevant.
4. SECURITY: ABSOLUTELY NEVER share database credentials, system paths, or internal platform architecture.
5. CONCISE: Keep responses between 40-100 words.

RESPONSE:"""


# ============================================================================
# DATA HANDLERS
# ============================================================================

class SQLHandler:
    """Handles SQL-based data retrieval"""
    
    def __init__(self, db_service, llm_service):
        self.db = db_service
        self.llm = llm_service
    
    async def execute(self, query: str, tenant_id: str = DEFAULT_TENANT_ID, role: str = None) -> Tuple[Optional[str], Optional[str]]:
        """
        Generate and execute SQL query
        Returns: (context_data, source) tuple
        """
        try:
            # Generate SQL
            sql_prompt = PromptTemplates.sql_generation(query, tenant_id, role)
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
    """Handles vector-based semantic search across multiple collections"""
    
    def __init__(self, product_collection, knowledge_collection, llm_service):
        self.product_collection = product_collection
        self.knowledge_collection = knowledge_collection
        self.llm = llm_service
    
    async def execute(self, query: str) -> Tuple[Optional[str], Optional[str]]:
        """
        Perform hybrid vector similarity search
        Returns: (context_data, source) tuple
        """
        try:
            # Skip if clearly numeric/aggregate query
            if self._is_numeric_query(query):
                return None, None
            
            # Get embedding
            embedding = await self.llm.get_embedding(query)
            if embedding is None:
                print("[Vector Handler] Failed to generate embedding")
                return None, None
            
            # Query both collections in thread pool (non-blocking)
            product_results = {}
            if self.product_collection:
                product_results = await asyncio.to_thread(
                    self.product_collection.query,
                    query_embeddings=[embedding],
                    n_results=MAX_VECTOR_RESULTS
                )
            
            knowledge_results = {}
            if self.knowledge_collection:
                knowledge_results = await asyncio.to_thread(
                    self.knowledge_collection.query,
                    query_embeddings=[embedding],
                    n_results=MAX_VECTOR_RESULTS
                )
            
            # Combine results with text
            context_items = []
            
            # Add products
            for i in range(len(product_results.get("ids", [[]])[0])):
                context_items.append({
                    "content": product_results["documents"][0][i],
                    "metadata": product_results["metadatas"][0][i]
                })
            
            # Add knowledge
            for i in range(len(knowledge_results.get("ids", [[]])[0])):
                context_items.append({
                    "content": knowledge_results["documents"][0][i],
                    "metadata": knowledge_results["metadatas"][0][i]
                })
            
            if not context_items:
                print("[Vector Handler] No results found in any collection")
                return None, None
            
            context_data = json.dumps(context_items, cls=CustomJSONEncoder)
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
        # Configuration
        self.chroma_path = CHROMA_DB_PATH
        self.collection_name = COLLECTION_NAME
        # Services
        self.db = db_service or db
        
        # Delayed initialization
        self.chroma_client = chroma_client
        self.product_collection = None
        self.knowledge_collection = None
        self.llm = llm_service
        self.tenant_slug = tenant_id
        self.tenant_id = None
        
        # Handlers (will be created in init)
        self.intent_router = IntentRouter()
        self.sql_handler = None
        self.vector_handler = None
        
        # Concurrency & Init state
        self._semaphore = asyncio.Semaphore(1)
        self._initialized = False
        self._init_lock = asyncio.Lock()

    async def init(self):
        """Initialize ChromaDB and handlers lazily"""
        if self._initialized:
            return
            
        async with self._init_lock:
            if self._initialized:
                return
                
            try:
                print(f"[RAG] Initializing ChromaDB at {self.chroma_path}...")
                
                # 1. Initialize Database connection early
                print("[RAG] Pre-warming Database connection...")
                await self.db.connect()
                
                # 2. Initialize ChromaDB client lazily
                if not self.chroma_client:
                    try:
                        import chromadb
                        from chromadb.config import Settings
                        
                        settings = Settings(anonymized_telemetry=False)
                        self.chroma_client = await asyncio.to_thread(
                            chromadb.PersistentClient,
                            path=self.chroma_path,
                            settings=settings
                        )
                        
                        # Get or create collections
                        self.product_collection = await asyncio.to_thread(
                            self.chroma_client.get_or_create_collection,
                            name=self.collection_name,
                            metadata={"hnsw:space": "cosine"}
                        )
                        
                        self.knowledge_collection = await asyncio.to_thread(
                            self.chroma_client.get_or_create_collection,
                            name="storeai_knowledge",
                            metadata={"hnsw:space": "cosine"}
                        )
                    except Exception as e:
                        print(f"[RAG] ChromaDB initialization skipped/failed: {e}")
                        self.chroma_client = None
                        self.product_collection = None
                        self.knowledge_collection = None
                
                # 3. Resolve LLM service
                if self.llm is None:
                    from services.llm import llm_service as default_llm
                    self.llm = default_llm
                
                # 4. Initialize handlers
                self.sql_handler = SQLHandler(self.db, self.llm)
                self.vector_handler = VectorHandler(
                    self.product_collection, 
                    self.knowledge_collection, 
                    self.llm
                )
                
                # 5. Pre-warm Embedding Model (Heavy task)
                print("[RAG] Pre-warming Local Embedding Model...")
                dummy_text = "warmup"
                await self.llm.get_embedding(dummy_text)
                
                # 6. Pre-warm Intent Router (No LLM call just check keywords)
                print("[RAG] Routing check...")
                await IntentRouter.classify("how many products")

                self._initialized = True
                print("[RAG] Initialization complete. System is HOT.")
            except Exception as e:
                print(f"[RAG] Failed to initialize: {e}")
                import traceback
                traceback.print_exc()
                raise e
    

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
    
    async def process_query(
        self, 
        user_query: str, 
        history: List[Dict] = None,
        tenant_id: str = None,
        role: str = None
    ) -> QueryResult:
        """
        Main entry point for query processing
        """
        # Ensure initialized
        await self.init()

        # Fallback to default if no tenant provided
        if not tenant_id:
            await self._ensure_tenant_id()
            target_tenant_id = self.tenant_id
        else:
            target_tenant_id = tenant_id

        if history is None:
            history = []
        
        async with self._semaphore:
            try:
                # Normalize query
                query = self._normalize_query(user_query)
                print(f"[RAG] Processing for tenant {target_tenant_id}: '{query}'")

                # Handle greetings
                greeting_result = self._handle_greeting(query)
                if greeting_result:
                    greeting_result.intent = "GREETING"
                    return greeting_result

                # Route raw query first to avoid history hijacking (e.g., weather -> SQL fallback/no-data).
                raw_intent = await IntentRouter.classify(query, None)
                if raw_intent.intent_type == IntentType.GENERAL:
                    return await self._handle_general_query(user_query, history)

                # Refine with context only for non-general paths
                if len(history) >= 2:
                    refined_query = await self._refine_query(query, history)
                else:
                    refined_query = query

                # Route refined query
                intent_classification = await IntentRouter.classify(refined_query, self.llm)

                # Safety: if raw is clearly GENERAL, do not allow refined context to force store intent.
                if raw_intent.intent_type == IntentType.GENERAL:
                    return await self._handle_general_query(user_query, history)
                
                # Double check: if refined intent is too broad, stick with it unless it's GREETING
                intent_type = intent_classification.intent_type.value
                print(f"[RAG] Intent: {intent_type}")
                
                # Handle General Intent
                if intent_classification.intent_type == IntentType.GENERAL:
                    return await self._handle_general_query(user_query, history)

                # Retrieve context data
                context_data, source = await self._retrieve_context(
                    refined_query, 
                    intent_classification,
                    target_tenant_id,
                    role
                )

                # Deterministic fallback for frequent KPI asks when LLM SQL path yields empty results.
                if not self._is_valid_context(context_data):
                    context_data, source = await self._fallback_kpi_context(
                        refined_query,
                        target_tenant_id,
                        role
                    )
                
                # Handle no data found
                if not self._is_valid_context(context_data):
                    return await self._handle_no_data(history, user_query, intent=intent_type)
                
                # Synthesize final answer
                return await self._synthesize_answer(
                    user_query, 
                    context_data, 
                    source, 
                    history,
                    intent=intent_type
                )
                
            except Exception as e:
                print(f"[RAG] Critical error: {e}")
                import traceback
                traceback.print_exc()
                return self._error_response(str(e))
    
    async def _handle_general_query(self, user_query: str, history: List[Dict]) -> QueryResult:
        """Handle general/out-of-scope queries"""
        prompt = PromptTemplates.general_synthesis(user_query, history)
        response = await self.llm.generate_response(prompt)
        
        return QueryResult(
            response=response,
            source=DataSource.CONVERSATION.value,
            context=None,  # Hiding telemetry for general queries per user request
            intent=IntentType.GENERAL.value
        )
    
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
                context="Persona: Helpful Store Assistant",
                intent="GREETING"
            )
        return None
    
    async def _retrieve_context(
        self, 
        query: str, 
        intent: IntentClassification,
        tenant_id: str,
        role: str = None
    ) -> Tuple[Optional[str], Optional[str]]:
        """
        Retrieve context data based on intent
        """
        if intent.intent_type == IntentType.SQL:
            # Try SQL first
            context_data, source = await self.sql_handler.execute(
                query, 
                tenant_id,
                role
            )
            
            # Fallback to vector if SQL fails
            if not context_data:
                print(f"[RAG] SQL failed for '{query}', trying vector fallback")
                await asyncio.sleep(0.2)
                context_data, source = await self.vector_handler.execute(query)
                print(f"[RAG] Vector Fallback Result Length: {len(context_data) if context_data else 0}")
            
            return context_data, source
        
        else:  # VECTOR
            context_data, source = await self.vector_handler.execute(query)
            print(f"[RAG] Direct Vector Result Length: {len(context_data) if context_data else 0}")
            return context_data, source

    async def _fallback_kpi_context(
        self,
        query: str,
        tenant_id: str,
        role: str = None
    ) -> Tuple[Optional[str], Optional[str]]:
        """Deterministic SQL fallbacks for high-frequency operational asks."""
        q = query.lower()
        try:
            if "yesterday" in q and any(x in q for x in ["sale", "sales", "revenue"]):
                sql = (
                    'SELECT COALESCE(SUM(S."totalAmount"), 0) AS "totalSales", '
                    'COUNT(*) AS "orderCount" '
                    'FROM "Sale" S '
                    'WHERE S."createdAt"::DATE = CURRENT_DATE - INTERVAL \'1 day\' '
                )
                if role != "SUPER_ADMIN":
                    sql += 'AND S."tenantId" = $1'
                    rows = await self.db.fetch_rows(sql, tenant_id)
                else:
                    rows = await self.db.fetch_rows(sql)
                return json.dumps([dict(r) for r in rows], cls=CustomJSONEncoder), DataSource.SQL.value

            if any(x in q for x in ["stock health", "inventory health", "stock status"]):
                sql = (
                    'SELECT COUNT(*) AS "totalProducts", '
                    'SUM(CASE WHEN P."stockQuantity" <= 0 THEN 1 ELSE 0 END) AS "outOfStockCount", '
                    'SUM(CASE WHEN P."stockQuantity" > 0 AND P."stockQuantity" <= P."lowStockThreshold" THEN 1 ELSE 0 END) AS "lowStockCount" '
                    'FROM "Product" P WHERE P."isDeleted" = false '
                )
                if role != "SUPER_ADMIN":
                    sql += 'AND P."tenantId" = $1'
                    rows = await self.db.fetch_rows(sql, tenant_id)
                else:
                    rows = await self.db.fetch_rows(sql)
                return json.dumps([dict(r) for r in rows], cls=CustomJSONEncoder), DataSource.SQL.value

            if any(x in q for x in ["resource allocation", "headcount", "staff allocation"]):
                sql = (
                    'SELECT D."name" AS "department", COUNT(E.id) AS "employeeCount" '
                    'FROM "Department" D '
                    'LEFT JOIN "Employee" E ON D.id = E."departmentId" AND E."isDeleted" = false '
                    'WHERE D."isDeleted" = false '
                )
                if role != "SUPER_ADMIN":
                    sql += 'AND D."tenantId" = $1 GROUP BY D."name"'
                    rows = await self.db.fetch_rows(sql, tenant_id)
                else:
                    sql += 'GROUP BY D."name"'
                    rows = await self.db.fetch_rows(sql)
                return json.dumps([dict(r) for r in rows], cls=CustomJSONEncoder), DataSource.SQL.value

            if "top customer" in q or "best customer" in q:
                sql = (
                    'SELECT C."name" AS "customer", SUM(S."totalAmount") AS "totalSpend" '
                    'FROM "Customer" C '
                    'JOIN "Sale" S ON C.id = S."customerId" '
                    'WHERE C."isDeleted" = false '
                )
                if role != "SUPER_ADMIN":
                    sql += 'AND C."tenantId" = $1 GROUP BY C."name" ORDER BY "totalSpend" DESC LIMIT 1'
                    rows = await self.db.fetch_rows(sql, tenant_id)
                else:
                    sql += 'GROUP BY C."name" ORDER BY "totalSpend" DESC LIMIT 1'
                    rows = await self.db.fetch_rows(sql)
                return json.dumps([dict(r) for r in rows], cls=CustomJSONEncoder), DataSource.SQL.value
        except Exception as e:
            print(f"[RAG] KPI fallback error: {e}")

        return None, None
    
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
        user_query: str,
        intent: str = None
    ) -> QueryResult:
        """Handle cases where no data is found"""
        # Never answer GENERAL intent with store no-data boilerplate.
        if intent == IntentType.GENERAL.value:
            return await self._handle_general_query(user_query, history)

        # If in conversation, try conversational response
        if history:
            return await self._synthesize_answer(
                user_query, 
                NO_DATA_SIGNAL, 
                DataSource.CONVERSATION.value, 
                history,
                intent=intent
            )
        
        # Provide helpful guidance
        response = (
            f"I couldn't find specific data matching your query in the current database. "
            f"Try asking about stock health, sales trends, or resource allocation."
        )

        return QueryResult(
            response=response,
            source=DataSource.CONVERSATION.value if intent == IntentType.GENERAL.value else DataSource.NONE.value,
            context=None,
            intent=intent or DataSource.NONE.value
        )
    
    async def _synthesize_answer(
        self,
        user_query: str,
        context_data: str,
        source: str,
        history: List[Dict],
        intent: str = None
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
            if OVERLOAD_SIGNAL in response:
                response = (
                    "I've retrieved the latest readings from your store telemetry. "
                    "However, the AI reasoning engine is currently synchronizing. "
                    "Please review the structured data breakdown below."
                )
            
            # Prepare UI context
            ui_context = None if context_data == NO_DATA_SIGNAL else context_data
            
            return QueryResult(
                response=response,
                source=source,
                context=ui_context,
                intent=intent
            )
            
        except Exception as e:
            print(f"[RAG] Synthesis error: {e}")
            return QueryResult(
                response=(
                    "I've retrieved the following telemetry from your records. "
                    "How shall we proceed?"
                ),
                source=source,
                context=context_data if context_data != NO_DATA_SIGNAL else None,
                intent=intent
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
            context=error_msg,
            intent=DataSource.ERROR.value
        )


# ============================================================================
# MODULE EXPORTS
# ============================================================================

# Singleton instance
rag_service = RAGService()

__all__ = [
    'RAGService',
    'rag_service',
    'QueryResult',
    'IntentType',
    'DataSource',
]
