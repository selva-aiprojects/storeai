export const AI_KEYWORDS = [
    // INVENTORY – LOW STOCK / REORDER
    { keyword: "low stock", category: "inventory" },
    { keyword: "reorder", category: "inventory" },
    { keyword: "minimum stock", category: "inventory" },
    { keyword: "stock alert", category: "inventory" },
    { keyword: "running out", category: "inventory" },
    { keyword: "stock critical", category: "inventory" },
    { keyword: "below threshold", category: "inventory" },
    { keyword: "stockout", category: "inventory" },              // stockout risk [web:9][web:15]
    { keyword: "reorder level", category: "inventory" },         // reorder point [web:1][web:11]

    // INVENTORY – OVERSTOCK / SLOW MOVING
    { keyword: "overstock", category: "inventory" },
    { keyword: "excess stock", category: "inventory" },
    { keyword: "surplus", category: "inventory" },
    { keyword: "dead stock", category: "inventory" },
    { keyword: "slow moving", category: "inventory" },
    { keyword: "non moving", category: "inventory" },

    // INVENTORY – HEALTH / KPI
    { keyword: "inventory turnover", category: "inventory" },    // key KPI [web:1][web:9][web:12][web:15]
    { keyword: "days on hand", category: "inventory" },          // days in inventory [web:1][web:11][web:12]
    { keyword: "stock coverage", category: "inventory" },        // coverage days [web:12][web:15]
    { keyword: "stock ageing", category: "inventory" },          // age of stock [web:11][web:12]
    { keyword: "inventory health", category: "inventory" },      // dashboard health [web:12][web:15]
    { keyword: "warehouse wise stock", category: "inventory" },
    { keyword: "location wise stock", category: "inventory" },
    { keyword: "category wise stock", category: "inventory" },
    { keyword: "stock mismatch", category: "inventory" },
    { keyword: "stock variance", category: "inventory" },

    // INVENTORY – EXPIRY / BATCH
    { keyword: "expired", category: "expiry" },
    { keyword: "near expiry", category: "expiry" },
    { keyword: "expiring soon", category: "expiry" },
    { keyword: "batch expiry", category: "expiry" },
    { keyword: "shelf life", category: "expiry" },

    // SALES
    { keyword: "sales today", category: "sales" },
    { keyword: "daily sales", category: "sales" },
    { keyword: "weekly sales", category: "sales" },
    { keyword: "monthly sales", category: "sales" },
    { keyword: "sales trend", category: "sales" },               // trend line [web:15]
    { keyword: "sales growth", category: "sales" },
    { keyword: "revenue", category: "sales" },
    { keyword: "top selling", category: "sales" },
    { keyword: "best seller", category: "sales" },
    { keyword: "slow selling", category: "sales" },
    { keyword: "low sales", category: "sales" },
    { keyword: "sales return", category: "sales" },

    // PURCHASE / SUPPLIER
    { keyword: "purchase order", category: "purchase" },
    { keyword: "pending po", category: "purchase" },
    { keyword: "approved po", category: "purchase" },
    { keyword: "cancelled po", category: "purchase" },
    { keyword: "purchase return", category: "purchase" },
    { keyword: "supplier delay", category: "supplier" },
    { keyword: "vendor performance", category: "supplier" },
    { keyword: "vendor rating", category: "supplier" },
    { keyword: "on time delivery", category: "supplier" },

    // FINANCE / ACCOUNTS
    { keyword: "outstanding payment", category: "finance" },
    { keyword: "overdue invoice", category: "finance" },
    { keyword: "invoice ageing", category: "finance" },          // AR ageing [web:14][web:17]
    { keyword: "receivables ageing", category: "finance" },
    { keyword: "payables ageing", category: "finance" },
    { keyword: "unpaid invoices", category: "finance" },         // AR dashboard [web:14]
    { keyword: "payment status", category: "finance" },          // AP dashboards [web:17]
    { keyword: "cash flow", category: "finance" },
    { keyword: "profit", category: "finance" },
    { keyword: "loss", category: "finance" },
    { keyword: "margin", category: "finance" },
    { keyword: "gross margin", category: "finance" },
    { keyword: "net profit", category: "finance" },
    { keyword: "profit and loss", category: "finance" },
    { keyword: "balance sheet", category: "finance" },
    { keyword: "expense trend", category: "finance" },
    { keyword: "department wise cost", category: "finance" },
    { keyword: "bank reconciliation", category: "finance" },
    { keyword: "gst summary", category: "finance" },
    { keyword: "tax liability", category: "finance" },

    // HR – HEADCOUNT / MOVEMENT
    { keyword: "headcount", category: "hr" },
    { keyword: "new joiners", category: "hr" },
    { keyword: "exits", category: "hr" },
    { keyword: "attrition", category: "hr" },                    // turnover rate [web:16]
    { keyword: "turnover rate", category: "hr" },

    // HR – ATTENDANCE / LEAVE
    { keyword: "attendance summary", category: "hr" },
    { keyword: "absenteeism", category: "hr" },                  // absenteeism dashboard [web:16]
    { keyword: "late coming", category: "hr" },
    { keyword: "shift wise attendance", category: "hr" },
    { keyword: "leave balance", category: "hr" },
    { keyword: "pending leave approvals", category: "hr" },
    { keyword: "holiday calendar", category: "hr" },

    // HR – PAYROLL / PERFORMANCE
    { keyword: "payroll summary", category: "hr" },              // payroll dashboard [web:13]
    { keyword: "salary slip", category: "hr" },
    { keyword: "overtime", category: "hr" },
    { keyword: "deductions", category: "hr" },
    { keyword: "reimbursements", category: "hr" },
    { keyword: "performance review", category: "hr" },
    { keyword: "appraisal due", category: "hr" },
    { keyword: "top performers", category: "hr" },
    { keyword: "low performance", category: "hr" },
    { keyword: "training status", category: "hr" },
    { keyword: "pending trainings", category: "hr" },

    // OPERATIONS / DATA QUALITY / TECH
    { keyword: "anomaly", category: "ops" },
    { keyword: "sudden drop", category: "ops" },
    { keyword: "spike", category: "ops" },
    { keyword: "outlier", category: "ops" },
    { keyword: "duplicate", category: "ops" },
    { keyword: "duplicate entry", category: "ops" },
    { keyword: "data issue", category: "ops" },
    { keyword: "missing data", category: "ops" },
    { keyword: "inconsistent data", category: "ops" },
    { keyword: "sync issue", category: "ops" },
    { keyword: "integration error", category: "ops" },
    { keyword: "failed job", category: "ops" },
    { keyword: "background task error", category: "ops" },
    { keyword: "exception list", category: "ops" },

    // EXECUTIVE / DASHBOARD VIEW
    { keyword: "business summary", category: "executive" },
    { keyword: "business overview", category: "executive" },
    { keyword: "store health", category: "executive" },          // inventory health [web:12][web:15]
    { keyword: "company health", category: "executive" },
    { keyword: "risks", category: "executive" },
    { keyword: "red flags", category: "executive" },
    { keyword: "watchlist items", category: "executive" },
    { keyword: "bottlenecks", category: "executive" },
    { keyword: "overview", category: "executive" },
    { keyword: "kpi dashboard", category: "executive" },
    { keyword: "key metrics", category: "executive" },
    { keyword: "top issues", category: "executive" },
    { keyword: "key insights", category: "executive" },
    { keyword: "forecast", category: "executive" },
    { keyword: "demand forecast", category: "executive" },
    { keyword: "sales forecast", category: "executive" },
    { keyword: "cash flow forecast", category: "executive" },
    { keyword: "branch wise summary", category: "executive" },
    { keyword: "department wise summary", category: "executive" },

    // NATURAL LANGUAGE SHORT FORMS (NLP)
    { keyword: "what to reorder", category: "nlp" },
    { keyword: "anything expiring", category: "nlp" },
    { keyword: "how are sales", category: "nlp" },
    { keyword: "show problems", category: "nlp" },
    { keyword: "what needs my attention", category: "nlp" },
    { keyword: "what changed today", category: "nlp" },
    { keyword: "what changed this week", category: "nlp" },
    { keyword: "show today summary", category: "nlp" },
    { keyword: "show this week", category: "nlp" },
    { keyword: "show this month", category: "nlp" },
    { keyword: "where am I losing money", category: "nlp" },
    { keyword: "which items are risky", category: "nlp" },
    { keyword: "who is not performing", category: "nlp" }
];
