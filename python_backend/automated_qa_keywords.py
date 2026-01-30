import requests
import json
import time
from datetime import datetime

# URL for the AI Intelligence Layer
API_URL = "http://localhost:8000/api/chat"

# Keywords extracted from main/server/src/data/aiKeywords.ts
AI_KEYWORDS = [
    {"keyword": "low stock", "category": "inventory"},
    {"keyword": "reorder", "category": "inventory"},
    {"keyword": "minimum stock", "category": "inventory"},
    {"keyword": "stock alert", "category": "inventory"},
    {"keyword": "running out", "category": "inventory"},
    {"keyword": "stock critical", "category": "inventory"},
    {"keyword": "below threshold", "category": "inventory"},
    {"keyword": "stockout", "category": "inventory"},
    {"keyword": "reorder level", "category": "inventory"},
    {"keyword": "overstock", "category": "inventory"},
    {"keyword": "excess stock", "category": "inventory"},
    {"keyword": "surplus", "category": "inventory"},
    {"keyword": "dead stock", "category": "inventory"},
    {"keyword": "slow moving", "category": "inventory"},
    {"keyword": "non moving", "category": "inventory"},
    {"keyword": "inventory turnover", "category": "inventory"},
    {"keyword": "days on hand", "category": "inventory"},
    {"keyword": "stock coverage", "category": "inventory"},
    {"keyword": "stock ageing", "category": "inventory"},
    {"keyword": "inventory health", "category": "inventory"},
    {"keyword": "warehouse wise stock", "category": "inventory"},
    {"keyword": "location wise stock", "category": "inventory"},
    {"keyword": "category wise stock", "category": "inventory"},
    {"keyword": "stock mismatch", "category": "inventory"},
    {"keyword": "stock variance", "category": "inventory"},
    {"keyword": "expired", "category": "expiry"},
    {"keyword": "near expiry", "category": "expiry"},
    {"keyword": "expiring soon", "category": "expiry"},
    {"keyword": "batch expiry", "category": "expiry"},
    {"keyword": "shelf life", "category": "expiry"},
    {"keyword": "sales today", "category": "sales"},
    {"keyword": "daily sales", "category": "sales"},
    {"keyword": "weekly sales", "category": "sales"},
    {"keyword": "monthly sales", "category": "sales"},
    {"keyword": "sales trend", "category": "sales"},
    {"keyword": "sales growth", "category": "sales"},
    {"keyword": "revenue", "category": "sales"},
    {"keyword": "top selling", "category": "sales"},
    {"keyword": "best seller", "category": "sales"},
    {"keyword": "slow selling", "category": "sales"},
    {"keyword": "low sales", "category": "sales"},
    {"keyword": "sales return", "category": "sales"},
    {"keyword": "purchase order", "category": "purchase"},
    {"keyword": "pending po", "category": "purchase"},
    {"keyword": "approved po", "category": "purchase"},
    {"keyword": "cancelled po", "category": "purchase"},
    {"keyword": "purchase return", "category": "purchase"},
    {"keyword": "supplier delay", "category": "supplier"},
    {"keyword": "vendor performance", "category": "supplier"},
    {"keyword": "vendor rating", "category": "supplier"},
    {"keyword": "on time delivery", "category": "supplier"},
    {"keyword": "outstanding payment", "category": "finance"},
    {"keyword": "overdue invoice", "category": "finance"},
    {"keyword": "invoice ageing", "category": "finance"},
    {"keyword": "receivables ageing", "category": "finance"},
    {"keyword": "payables ageing", "category": "finance"},
    {"keyword": "unpaid invoices", "category": "finance"},
    {"keyword": "payment status", "category": "finance"},
    {"keyword": "cash flow", "category": "finance"},
    {"keyword": "profit", "category": "finance"},
    {"keyword": "loss", "category": "finance"},
    {"keyword": "margin", "category": "finance"},
    {"keyword": "gross margin", "category": "finance"},
    {"keyword": "net profit", "category": "finance"},
    {"keyword": "profit and loss", "category": "finance"},
    {"keyword": "balance sheet", "category": "finance"},
    {"keyword": "expense trend", "category": "finance"},
    {"keyword": "department wise cost", "category": "finance"},
    {"keyword": "bank reconciliation", "category": "finance"},
    {"keyword": "gst summary", "category": "finance"},
    {"keyword": "tax liability", "category": "finance"},
    {"keyword": "headcount", "category": "hr"},
    {"keyword": "new joiners", "category": "hr"},
    {"keyword": "exits", "category": "hr"},
    {"keyword": "attrition", "category": "hr"},
    {"keyword": "turnover rate", "category": "hr"},
    {"keyword": "attendance summary", "category": "hr"},
    {"keyword": "absenteeism", "category": "hr"},
    {"keyword": "late coming", "category": "hr"},
    {"keyword": "shift wise attendance", "category": "hr"},
    {"keyword": "leave balance", "category": "hr"},
    {"keyword": "pending leave approvals", "category": "hr"},
    {"keyword": "holiday calendar", "category": "hr"},
    {"keyword": "payroll summary", "category": "hr"},
    {"keyword": "salary slip", "category": "hr"},
    {"keyword": "overtime", "category": "hr"},
    {"keyword": "deductions", "category": "hr"},
    {"keyword": "reimbursements", "category": "hr"},
    {"keyword": "performance review", "category": "hr"},
    {"keyword": "appraisal due", "category": "hr"},
    {"keyword": "top performers", "category": "hr"},
    {"keyword": "low performance", "category": "hr"},
    {"keyword": "training status", "category": "hr"},
    {"keyword": "pending trainings", "category": "hr"},
    {"keyword": "anomaly", "category": "ops"},
    {"keyword": "sudden drop", "category": "ops"},
    {"keyword": "spike", "category": "ops"},
    {"keyword": "outlier", "category": "ops"},
    {"keyword": "duplicate", "category": "ops"},
    {"keyword": "duplicate entry", "category": "ops"},
    {"keyword": "data issue", "category": "ops"},
    {"keyword": "missing data", "category": "ops"},
    {"keyword": "inconsistent data", "category": "ops"},
    {"keyword": "sync issue", "category": "ops"},
    {"keyword": "integration error", "category": "ops"},
    {"keyword": "failed job", "category": "ops"},
    {"keyword": "background task error", "category": "ops"},
    {"keyword": "exception list", "category": "ops"},
    {"keyword": "business summary", "category": "executive"},
    {"keyword": "business overview", "category": "executive"},
    {"keyword": "store health", "category": "executive"},
    {"keyword": "company health", "category": "executive"},
    {"keyword": "risks", "category": "executive"},
    {"keyword": "red flags", "category": "executive"},
    {"keyword": "watchlist items", "category": "executive"},
    {"keyword": "bottlenecks", "category": "executive"},
    {"keyword": "overview", "category": "executive"},
    {"keyword": "kpi dashboard", "category": "executive"},
    {"keyword": "key metrics", "category": "executive"},
    {"keyword": "top issues", "category": "executive"},
    {"keyword": "key insights", "category": "executive"},
    {"keyword": "forecast", "category": "executive"},
    {"keyword": "demand forecast", "category": "executive"},
    {"keyword": "sales forecast", "category": "executive"},
    {"keyword": "cash flow forecast", "category": "executive"},
    {"keyword": "branch wise summary", "category": "executive"},
    {"keyword": "department wise summary", "category": "executive"},
    {"keyword": "what to reorder", "category": "nlp"},
    {"keyword": "anything expiring", "category": "nlp"},
    {"keyword": "how are sales", "category": "nlp"},
    {"keyword": "show problems", "category": "nlp"},
    {"keyword": "what needs my attention", "category": "nlp"},
    {"keyword": "what changed today", "category": "nlp"},
    {"keyword": "what changed this week", "category": "nlp"},
    {"keyword": "show today summary", "category": "nlp"},
    {"keyword": "show this week", "category": "nlp"},
    {"keyword": "show this month", "category": "nlp"},
    {"keyword": "where am I losing money", "category": "nlp"},
    {"keyword": "which items are risky", "category": "nlp"},
    {"keyword": "who is not performing", "category": "nlp"}
]

def run_keyword_tests():
    results = []
    print(f"Starting Keyword Regression Sweep: {len(AI_KEYWORDS)} Scenarios...")
    
    start_time = time.time()
    pass_count = 0
    fail_count = 0
    gap_count = 0
    
    for i, kw_obj in enumerate(AI_KEYWORDS):
        kw = kw_obj['keyword']
        category = kw_obj['category']
        print(f"[{i+1}/{len(AI_KEYWORDS)}] Testing: {kw} ({category})", end="... ", flush=True)
        
        try:
            payload = {"query": f"Can you show me {kw}?", "history": []}
            r = requests.post(API_URL, json=payload, timeout=20)
            
            if r.status_code == 200:
                data = r.json()
                response_text = data.get('response', '')
                source = data.get('source', 'UNKNOWN')
                
                # Check for "NONE" source or empty responses as gaps
                if source == "NONE" or "I couldn’t find matching data" in response_text or not response_text:
                    gap_count += 1
                    status = "GAP (No Data Found)"
                    print("GAP")
                elif "[SYSTEM OVERLOAD]" in response_text:
                    fail_count += 1
                    status = "FAIL (Overload)"
                    print("OVERLOAD")
                else:
                    pass_count += 1
                    status = "PASS"
                    print("PASS")
                
                results.append({
                    "id": i+1,
                    "keyword": kw,
                    "category": category,
                    "status": status,
                    "source": source,
                    "latency": f"{r.elapsed.total_seconds():.2f}s"
                })
            else:
                fail_count += 1
                print(f"FAIL ({r.status_code})")
                results.append({
                    "id": i+1,
                    "keyword": kw,
                    "category": category,
                    "status": f"FAIL ({r.status_code})",
                    "latency": "N/A"
                })
        except Exception as e:
            fail_count += 1
            print(f"ERROR ({str(e)})")
            results.append({
                "id": i+1,
                "keyword": kw,
                "category": category,
                "status": f"ERROR ({str(e)})",
                "latency": "N/A"
            })
            
    end_time = time.time()
    total_duration = end_time - start_time
    
    # Generate Report
    report_name = f"KEYWORD_REGRESSION_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.md"
    with open(report_name, "w", encoding='utf-8') as f:
        f.write(f"# AI Intelligence Keyword Regression Report\n")
        f.write(f"**Timestamp:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Total Keywords:** {len(AI_KEYWORDS)}\n")
        f.write(f"**Passed:** {pass_count}\n")
        f.write(f"**Gaps identified:** {gap_count}\n")
        f.write(f"**Failed/Errors:** {fail_count}\n")
        f.write(f"**Success Rate:** {(pass_count/len(AI_KEYWORDS))*100:.1f}%\n")
        f.write(f"**Total Duration:** {total_duration:.2f}s\n\n")
        
        f.write("## Detailed Results\n")
        f.write("| ID | Keyword | Category | Status | Source | Latency |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")
        for res in results:
            f.write(f"| {res['id']} | {res['keyword']} | {res['category']} | {res['status']} | {res.get('source', 'N/A')} | {res.get('latency', 'N/A')} |\n")

    print(f"\nTests Completed. Report generated: {report_name}")
    return report_name

if __name__ == "__main__":
    run_keyword_tests()
