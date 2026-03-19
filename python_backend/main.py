
import os
import json
import re
from dotenv import load_dotenv

# Load .env from main directory ASAP
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'main', '.env')
load_dotenv(dotenv_path)

from fastapi import FastAPI, HTTPException, Request
from fastapi.staticfiles import StaticFiles
import asyncio
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.rag import rag_service
from services.llm import llm_service
from services.ai_orchestration import ai_orchestration_service
from services.market_data import market_data_service, MarketDataError
from utils.logger import logger, log_error, log_api_call
import uvicorn
import traceback
from fastapi.responses import JSONResponse

app = FastAPI(title="StoreAI Intelligence Platform (Cognivectra)")

# CORS logic is handled last to ensure it's the outermost middleware

@app.get("/api/health")
def health_check():
    return {"status": "UP", "version": "1.0.2", "service": "storeai-ai-engine"}

@app.get("/api")
def api_root():
    return {"status": "AI Hub Active", "endpoints": ["/chat", "/health", "/ai/stock-analyze"]}

@app.middleware("http")
async def log_requests(request, call_next):
    logger.info(f"AI API Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"AI API Response: {response.status_code}")
    return response

@app.middleware("http")
async def catch_exceptions_middleware(request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        log_error(e, {
            'path': str(request.url.path),
            'method': request.method,
            'client_ip': request.client.host if request.client else None,
        })
        return JSONResponse(status_code=500, content={"detail": str(e)})


# Serve Frontend
static_dir = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

from services.finance import finance_service

class QueryRequest(BaseModel):
    query: str
    history: list = []

class OrchestrationRequest(BaseModel):
    query: str
    history: list = []
    mode: str = "auto"

class ReturnRequest(BaseModel):
    saleId: str
    items: list
    condition: str = "EXCELLENT"
    transport: float = 0
    packaging: float = 0

# Auth Utils
from fastapi import Depends, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

security = HTTPBearer()
JWT_SECRET = os.getenv("JWT_SECRET", "your_super_secret_jwt_key")
logger.info(f"Initializing with JWT_SECRET: {JWT_SECRET[:4]}...{JWT_SECRET[-2:]}")

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception as e:
        logger.error(f"Auth Failed: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@app.post("/chat")
@app.post("/api/chat")
async def chat_endpoint(req: QueryRequest, user: dict = Depends(get_current_user)):
    try:
        # Extract user details from token
        tenant_id = user.get('tenantId')
        user_role = user.get('role')
        
        result = await rag_service.process_query(
            req.query, 
            req.history, 
            tenant_id=tenant_id,
            role=user_role
        )
        return {
            "response": result.response,
            "source": result.source,
            "context": result.context,
            "intent": result.intent,
            "progress": result.intent == "SQL" and "Analyzing" or "Processing"
        }
        
    except Exception as e:
        logger.error(f"Chat Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})


@app.post("/api/ai/orchestrate")
async def orchestrate_ai(req: OrchestrationRequest, user: dict = Depends(get_current_user)):
    try:
        tenant_id = user.get('tenantId')
        user_role = user.get('role')
        result = await ai_orchestration_service.orchestrate(
            query=req.query,
            history=req.history,
            tenant_id=tenant_id,
            role=user_role,
            mode=req.mode
        )
        return {
            "response": result.response,
            "source": result.source,
            "route": result.route,
            "mode": result.mode,
            "metadata": result.metadata,
        }
    except Exception as e:
        logger.error(f"Orchestration Error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

@app.get("/api/ai/verify-config")
async def verify_llm_config(user: dict = Depends(get_current_user)):
    """Securely verify if LLM and RAG are configured correctly"""
    health = await llm_service.health_check()
    provider_health = health.get("groq")
    embed_health = health.get("embedding")
    return {
        "llm_provider": "groq",
        "llm_healthy": provider_health.is_healthy if provider_health else False,
        "llm_error": provider_health.error if provider_health and not provider_health.is_healthy else None,
        "embedding_healthy": embed_health.is_healthy if embed_health else False,
        "tenant_id": user.get("tenantId"),
        "role": user.get("role")
    }

@app.post("/api/admin/reindex")
async def reindex_data(request: Request):
    """Trigger full re-indexing of vector store"""
    auth_header = request.headers.get("X-Admin-Key")
    if auth_header != os.getenv("ADMIN_API_KEY", "storeai_admin_secret"):
        raise HTTPException(status_code=403, detail="Unauthorized")
    
    from indexer import index_products
    from knowledge_indexer import index_knowledge
    
    # Run in background to avoid timeout
    asyncio.create_task(index_products())
    asyncio.create_task(index_knowledge())
    
    return {"status": "accepted", "message": "Re-indexing started in background"}

class StockRequest(BaseModel):
    ticker: str

@app.post("/api/ai/stock-analyze")
async def analyze_stock(req: StockRequest, user: dict = Depends(get_current_user)):
    try:
        if not req.ticker:
            raise HTTPException(status_code=400, detail="Ticker is required")

        live_context = await market_data_service.fetch_live_context(req.ticker)
        live_json = json.dumps(live_context, ensure_ascii=True)

        prompt = f"""Role: Institutional Quantitative Analyst.
Task: Generate prediction and interpretation ONLY from the provided LIVE market context.

LIVE_CONTEXT_JSON:
{live_json}

STRICT RULES:
1. Use ONLY LIVE_CONTEXT_JSON for market facts.
2. Do NOT simulate any market data.
3. If a field is missing in LIVE_CONTEXT_JSON, keep it null or explicitly state \"insufficient live data\".
4. Prediction is allowed, but clearly label it as forecast.
5. Return STRICT JSON only (no markdown).

Return structure:
{{
  \"meta\": {{
    \"ticker_requested\": \"{req.ticker}\",
    \"symbol_resolved\": \"<symbol>\",
    \"company_name\": \"<name|null>\",
    \"exchange\": \"<exchange|null>\",
    \"currency\": \"<currency|null>\",
    \"as_of_epoch\": <number>
  }},
  \"live_snapshot\": {{
    \"last_price\": <number|null>,
    \"change_percent\": <number|null>,
    \"volume\": <number|null>,
    \"market_cap\": <number|null>,
    \"pe\": <number|null>,
    \"eps_ttm\": <number|null>,
    \"rsi14\": <number|null>,
    \"sma20\": <number|null>,
    \"sma50\": <number|null>
  }},
  \"prediction\": {{
    \"rating\": \"Strong Buy|Buy|Hold|Sell|Avoid\",
    \"horizon\": \"short_term|medium_term|long_term\",
    \"confidence\": <0-100>,
    \"bull_case\": \"<forecast>\",
    \"base_case\": \"<forecast>\",
    \"bear_case\": \"<forecast>\"
  }},
  \"analysis\": {{
    \"thesis\": \"<2-3 sentences grounded in live data>\",
    \"risk_factors\": [\"<risk1>\", \"<risk2>\"],
    \"action_points\": [\"<action1>\", \"<action2>\"]
  }},
  \"news_digest\": [
    {{
      \"title\": \"<title>\",
      \"publisher\": \"<publisher>\",
      \"published_at_epoch\": <number|null>,
      \"impact\": \"High|Medium|Low\",
      \"why_it_matters\": \"<grounded explanation>\"
    }}
  ],
  \"price_series\": [
    {{\"ts\": <epoch|null>, \"close\": <number>}}
  ]
}}"""

        response = await llm_service.generate_response(prompt)
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            response = json_match.group(0)

        return json.loads(response)

    except MarketDataError as e:
        logger.error(f"Live market data unavailable: {e}")
        raise HTTPException(
            status_code=502,
            detail=f"Live market data unavailable for ticker '{req.ticker}': {str(e)}"
        )
    except Exception as e:
        logger.error(f"Stock analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/market-research")
@app.get("/api/market-research")
@app.get("/api/v1/ai/market-research")
@app.get("/api/ai/market-research")
async def market_research_stub(user: dict = Depends(get_current_user)):
    """Legacy compatibility for mission-control dashboard - Updated for Indian Markets"""
    return {
        "status": "active",
        "market_sentiment": "BULLISH",
        "volatility": "MODERATE",
        "top_picks": ["RELIANCE", "TCS", "HDFCBANK", "INFY"],
        "summary": "Nifty 50 showing strong support at key EMA levels. Positive outlook on BFSI and Auto sectors.",
        "exchanges": [
            {"name": "NSE", "status": "OPEN", "trend": "+0.45%"},
            {"name": "BSE", "status": "OPEN", "trend": "+0.42%"}
        ]
    }

# --- FINANCE ENDPOINTS ---

@app.post("/api/finance/return")
async def process_return(req: ReturnRequest):
    try:
        return await finance_service.process_sales_return(
            req.saleId, req.items, req.condition, req.transport, req.packaging
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/finance/daybook")
async def get_daybook(date: str = None):
    return await finance_service.get_daybook(date)

@app.get("/api/finance/liability")
async def get_liability():
    return await finance_service.get_liability_report()

@app.get("/api/finance/summary")
async def get_summary():
    return await finance_service.get_financial_summary()

@app.get("/api/finance/pl")
async def get_pl(start: str = None, end: str = None):
    return await finance_service.get_profit_loss(start, end)

@app.get("/api/finance/ledger")
async def get_ledger(type: str = None):
    return await finance_service.get_general_ledger(type)

@app.post("/api/finance/sync-expenses")
async def sync_expenses():
    count = await finance_service.auto_generate_expenses()
    return {"generated": count}

from services.hr import hr_service

@app.get("/api/hr/employees")
async def get_employees():
    from services.db import db
    from decimal import Decimal
    rows = await db.fetch_rows("SELECT * FROM \"Employee\" WHERE \"isDeleted\" = false")
    # Serialize rows to handle Decimal and date types  
    result = []
    for row in rows:
        d = dict(row)
        for k, v in d.items():
            if isinstance(v, Decimal):
                d[k] = float(v)
            elif hasattr(v, 'isoformat'):
                d[k] = v.isoformat()
        result.append(d)
    return result

@app.post("/api/hr/attendance")
async def log_attendance(req: dict):
    return await hr_service.log_attendance(
        req['employeeId'], req['date'], req.get('status', 'PRESENT'),
        req.get('checkIn'), req.get('checkOut'), req.get('otMins', 0), req.get('incentive', 0)
    )

@app.get("/api/hr/attendance/report")
async def get_attendance_report(month: int, year: int):
    return await hr_service.get_monthly_attendance(month, year)

@app.post("/api/hr/payroll/process")
async def process_payroll(req: dict):
    return await hr_service.calculate_payroll(req['employeeId'], req['month'], req['year'])

@app.get("/api/hr/payroll/slip")
async def get_slip(employeeId: str, month: int, year: int):
    return await hr_service.get_salary_slip(employeeId, month, year)

@app.get("/api/hr/reports/yearly")
async def get_yearly_report(year: int, type: str):
    if type == 'PF':
        return await hr_service.get_yearly_pf_report(year)
    return await hr_service.get_yearly_salary_report(year)

@app.get("/")
def read_root():
    return {"status": "StoreAI Intelligence Platform Running"}

@app.on_event("startup")
async def startup_event():
    logger.info("AI Hub: Fast Startup Mode Active")
    # Trigger RAG and LLM initialization in the background
    # This allows the server to bind to PORT and pass health checks immediately
    asyncio.create_task(rag_service.init())
    
    logger.info("Startup: Listing Routes")
    for route in app.routes:
        logger.info(f"Route: {route.path} [{route.name}]")

# Add CORS last to wrap ALL other responses and errors
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://store-ai-client.onrender.com",
        "https://store-ai-prd.onrender.com",
        "https://steward-platform.onrender.com"
    ],
    allow_origin_regex=r"https://[a-z0-9-]+\.onrender\.com",
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
