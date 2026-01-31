
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.rag import rag_service
from services.llm import llm_service
from utils.logger import logger, log_error, log_api_call
import uvicorn
import os
import traceback
from fastapi.responses import JSONResponse

app = FastAPI(title="StoreAI Intelligence Platform (Cognivectra)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

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
JWT_SECRET = os.getenv("JWT_SECRET", "your_super_secret_jwt_key")  # Must match Node.js backend

def get_current_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        return payload
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")


@app.post("/api/chat")
async def chat_endpoint(req: QueryRequest, user: dict = Depends(get_current_user)):
    try:
        # Extract tenant from token
        # Our JWT payload structure: { id, email, role, tenantId, ... }
        tenant_id = user.get('tenantId')
        
        # If tenantId is missing (e.g. super admin specific case), fallback to default
        if not tenant_id:
            # Try to resolve based on user role or default
            # For now, if no tenantId, we might default to technova (the seed)
            # But the token SHOULD have it.
            pass

        result = await rag_service.process_query(req.query, req.history, tenant_id=tenant_id)
        return result
    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

class StockRequest(BaseModel):
    ticker: str

@app.post("/api/ai/stock-analyze")
async def analyze_stock(req: StockRequest):
    try:
        if not req.ticker:
            raise HTTPException(status_code=400, detail="Ticker is required")
            
        prompt = f"""Role: Institutional Quantitative Analyst AI.
Task: Perform a deep-dive analysis of {req.ticker} for an institutional investment memo.
Input Data: Simulate real-time market data, technical indicators (RSI, MACD, Bollinger, Moving Averages), fundamental data (P/E, EPS, Revenue Growth), and scan recent news/sentiment.

Output: STRICT JSON ONLY. No markdown. No conversational text.
Target JSON Structure (AiAnalysis Interface):

{{
    "meta": {{
        "ticker": "{req.ticker}",
        "company_name": "<Full Company Name>",
        "sector": "<Sector>",
        "last_price": <number>,
        "currency": "USD",
        "time_range": "6M"
    }},
    "core_signals": {{
        "ai_overall_rating": "Strong Buy" | "Buy" | "Hold" | "Sell" | "Avoid",
        "technical_score": <0-100>,
        "fundamental_score": <0-100>,
        "news_score": <0-100>,
        "risk_score": <0-100>, 
        "confidence": <0-100>
    }},
    "ai_rationale": {{
        "thesis": "<Executive summary thesis (2-3 sentences)>",
        "time_horizon": "short_term" | "medium_term" | "long_term",
        "bull_case": "<Optimistic scenario>",
        "bear_case": "<Downside risks>",
        "base_case": "<Most likely outcome>"
    }},
    "explanations": {{
        "technical_explain": "<Specific levels, indicators>",
        "fundamental_explain": "<Valuation, growth stats>",
        "news_explain": "<Key narratives driving price>",
        "risk_explain": "<Key headwinds>"
    }},
    "history_context": {{
        "previous_calls": [
            {{ "date": "YYYY-MM-DD", "rating": "Buy", "confidence": 85, "outcome": "outperformed" }},
            {{ "date": "YYYY-MM-DD", "rating": "Hold", "confidence": 70, "outcome": "neutral" }}
        ],
        "model_confidence_trend": [
            {{ "date": "YYYY-MM-DD", "confidence": 75 }},
            {{ "date": "YYYY-MM-DD", "confidence": 80 }}
        ]
    }},
    "charts": {{
        "price_series": [ 
            {{ "date": "2024-01-01", "close": 150.00 }},
            ... (Generate ~15 data points matching the trend)
        ]
    }},
    "recent_news": [
        {{
            "headline": "<Headline>",
            "source": "Bloomberg" | "Reuters" | "WSJ",
            "published_at": "<Relative Date>",
            "sentiment": "Positive" | "Negative" | "Neutral",
            "impact": "High" | "Medium" | "Low",
            "why_it_matters": "<One concise sentence insight>"
        }}
    ]
}}

Instructions:
1. Be specific with numbers (Price, P/E, RSI).
2. Ensure `core_signals` scores are consistent with the `ai_overall_rating`.
3. Simulate a realistic `price_series` array that visually correlates with your technical analysis.
4. Provide "Insider" level insight in `why_it_matters` for news.
"""
        
        response = await llm_service.generate_response(prompt)
        
        # Clean response if it contains markdown code blocks
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            response = json_match.group(0)
            
        import json
        return json.loads(response)
        
    except Exception as e:
        logger.error(f"Stock analysis failed: {e}")
        # Return mock data on failure to prevent UI crash
        return {
            "meta": {
                "ticker": req.ticker,
                "company_name": f"{req.ticker} Corp (Simulation)",
                "sector": "Technology",
                "last_price": 150.00,
                "currency": "USD",
                "time_range": "6M"
            },
            "core_signals": {
                "ai_overall_rating": "Hold",
                "technical_score": 50,
                "fundamental_score": 60,
                "news_score": 50,
                "risk_score": 40,
                "confidence": 50
            },
            "ai_rationale": {
                "thesis": "Service unavailable. Showing placeholder data.",
                "time_horizon": "medium_term",
                "bull_case": "Service restored.",
                "bear_case": "Continued outage.",
                "base_case": "Retry shortly."
            },
            "explanations": {
                "technical_explain": "N/A",
                "fundamental_explain": "N/A",
                "news_explain": "N/A",
                "risk_explain": "N/A"
            },
            "history_context": {
                "previous_calls": [],
                "model_confidence_trend": []
            },
            "charts": {
                "price_series": []
            },
            "recent_news": []
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

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
