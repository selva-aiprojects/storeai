
from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from services.rag import rag_service
from services.llm import llm_service
import uvicorn
import os
import traceback
from fastapi.responses import JSONResponse

app = FastAPI(title="StoreAI Intelligence Layer")

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
        print(f"CRITICAL ERROR: {e}")
        traceback.print_exc()
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

@app.post("/api/chat")
async def chat_endpoint(req: QueryRequest):
    try:
        result = await rag_service.process_query(req.query, req.history)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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
    return await db.fetch_rows("SELECT * FROM \"Employee\" WHERE \"isDeleted\" = false")

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
    return {"status": "StoreAI Intelligence Layer Running"}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
