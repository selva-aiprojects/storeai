# AI Intelligence Keyword Regression Report
**Timestamp:** 2026-01-30 20:24:37
**Total Keywords:** 140
**Passed:** 32
**Gaps identified:** 23
**Failed/Errors:** 85
**Success Rate:** 22.9%
**Total Duration:** 1247.41s

## Detailed Results
| ID | Keyword | Category | Status | Source | Latency |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | low stock | inventory | ERROR (HTTPConnectionPool(host='localhost', port=8000): Max retries exceeded with url: /api/chat (Caused by NewConnectionError("HTTPConnection(host='localhost', port=8000): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))) | N/A | N/A |
| 2 | reorder | inventory | GAP (No Data Found) | NONE | 19.54s |
| 3 | minimum stock | inventory | FAIL (500) | N/A | N/A |
| 4 | stock alert | inventory | PASS | SQL | 3.61s |
| 5 | running out | inventory | PASS | SQL | 3.89s |
| 6 | stock critical | inventory | FAIL (500) | N/A | N/A |
| 7 | below threshold | inventory | PASS | SQL | 4.23s |
| 8 | stockout | inventory | PASS | SQL | 12.02s |
| 9 | reorder level | inventory | PASS | SQL | 11.46s |
| 10 | overstock | inventory | PASS | SQL | 15.47s |
| 11 | excess stock | inventory | PASS | SQL | 16.18s |
| 12 | surplus | inventory | PASS | SQL | 10.12s |
| 13 | dead stock | inventory | GAP (No Data Found) | NONE | 18.18s |
| 14 | slow moving | inventory | FAIL (500) | N/A | N/A |
| 15 | non moving | inventory | GAP (No Data Found) | NONE | 15.76s |
| 16 | inventory turnover | inventory | FAIL (500) | N/A | N/A |
| 17 | days on hand | inventory | ERROR (('Connection aborted.', ConnectionResetError(10054, 'An existing connection was forcibly closed by the remote host', None, 10054, None))) | N/A | N/A |
| 18 | stock coverage | inventory | ERROR (HTTPConnectionPool(host='localhost', port=8000): Max retries exceeded with url: /api/chat (Caused by NewConnectionError("HTTPConnection(host='localhost', port=8000): Failed to establish a new connection: [WinError 10061] No connection could be made because the target machine actively refused it"))) | N/A | N/A |
| 19 | stock ageing | inventory | FAIL (500) | N/A | N/A |
| 20 | inventory health | inventory | ERROR (HTTPConnectionPool(host='localhost', port=8000): Read timed out. (read timeout=20)) | N/A | N/A |
| 21 | warehouse wise stock | inventory | GAP (No Data Found) | NONE | 14.78s |
| 22 | location wise stock | inventory | FAIL (500) | N/A | N/A |
| 23 | category wise stock | inventory | FAIL (500) | N/A | N/A |
| 24 | stock mismatch | inventory | FAIL (500) | N/A | N/A |
| 25 | stock variance | inventory | FAIL (500) | N/A | N/A |
| 26 | expired | expiry | ERROR (HTTPConnectionPool(host='localhost', port=8000): Read timed out. (read timeout=20)) | N/A | N/A |
| 27 | near expiry | expiry | FAIL (500) | N/A | N/A |
| 28 | expiring soon | expiry | ERROR (HTTPConnectionPool(host='localhost', port=8000): Read timed out. (read timeout=20)) | N/A | N/A |
| 29 | batch expiry | expiry | FAIL (500) | N/A | N/A |
| 30 | shelf life | expiry | FAIL (500) | N/A | N/A |
| 31 | sales today | sales | GAP (No Data Found) | NONE | 6.28s |
| 32 | daily sales | sales | FAIL (500) | N/A | N/A |
| 33 | weekly sales | sales | FAIL (500) | N/A | N/A |
| 34 | monthly sales | sales | PASS | SQL | 10.74s |
| 35 | sales trend | sales | FAIL (500) | N/A | N/A |
| 36 | sales growth | sales | FAIL (500) | N/A | N/A |
| 37 | revenue | sales | PASS | SQL | 9.96s |
| 38 | top selling | sales | FAIL (500) | N/A | N/A |
| 39 | best seller | sales | FAIL (500) | N/A | N/A |
| 40 | slow selling | sales | PASS | SQL | 12.67s |
| 41 | low sales | sales | PASS | SQL | 19.12s |
| 42 | sales return | sales | FAIL (500) | N/A | N/A |
| 43 | purchase order | purchase | GAP (No Data Found) | NONE | 18.48s |
| 44 | pending po | purchase | FAIL (500) | N/A | N/A |
| 45 | approved po | purchase | FAIL (500) | N/A | N/A |
| 46 | cancelled po | purchase | FAIL (500) | N/A | N/A |
| 47 | purchase return | purchase | PASS | SQL | 11.98s |
| 48 | supplier delay | supplier | PASS | SQL | 10.43s |
| 49 | vendor performance | supplier | FAIL (500) | N/A | N/A |
| 50 | vendor rating | supplier | FAIL (500) | N/A | N/A |
| 51 | on time delivery | supplier | GAP (No Data Found) | NONE | 18.50s |
| 52 | outstanding payment | finance | PASS | SQL | 3.97s |
| 53 | overdue invoice | finance | FAIL (500) | N/A | N/A |
| 54 | invoice ageing | finance | PASS | SQL | 7.35s |
| 55 | receivables ageing | finance | PASS | SQL | 11.36s |
| 56 | payables ageing | finance | FAIL (500) | N/A | N/A |
| 57 | unpaid invoices | finance | FAIL (500) | N/A | N/A |
| 58 | payment status | finance | FAIL (500) | N/A | N/A |
| 59 | cash flow | finance | PASS | SQL | 10.49s |
| 60 | profit | finance | PASS | SQL | 11.62s |
| 61 | loss | finance | FAIL (500) | N/A | N/A |
| 62 | margin | finance | FAIL (500) | N/A | N/A |
| 63 | gross margin | finance | FAIL (500) | N/A | N/A |
| 64 | net profit | finance | PASS | SQL | 10.29s |
| 65 | profit and loss | finance | FAIL (500) | N/A | N/A |
| 66 | balance sheet | finance | FAIL (500) | N/A | N/A |
| 67 | expense trend | finance | PASS | SQL | 10.91s |
| 68 | department wise cost | finance | FAIL (500) | N/A | N/A |
| 69 | bank reconciliation | finance | FAIL (500) | N/A | N/A |
| 70 | gst summary | finance | PASS | SQL | 10.90s |
| 71 | tax liability | finance | FAIL (500) | N/A | N/A |
| 72 | headcount | hr | PASS | SQL | 9.24s |
| 73 | new joiners | hr | FAIL (500) | N/A | N/A |
| 74 | exits | hr | GAP (No Data Found) | NONE | 15.76s |
| 75 | attrition | hr | FAIL (500) | N/A | N/A |
| 76 | turnover rate | hr | PASS | SQL | 4.74s |
| 77 | attendance summary | hr | FAIL (500) | N/A | N/A |
| 78 | absenteeism | hr | PASS | SQL | 15.65s |
| 79 | late coming | hr | FAIL (500) | N/A | N/A |
| 80 | shift wise attendance | hr | FAIL (500) | N/A | N/A |
| 81 | leave balance | hr | FAIL (500) | N/A | N/A |
| 82 | pending leave approvals | hr | GAP (No Data Found) | NONE | 17.93s |
| 83 | holiday calendar | hr | GAP (No Data Found) | NONE | 16.46s |
| 84 | payroll summary | hr | FAIL (500) | N/A | N/A |
| 85 | salary slip | hr | GAP (No Data Found) | NONE | 14.52s |
| 86 | overtime | hr | GAP (No Data Found) | NONE | 14.79s |
| 87 | deductions | hr | FAIL (500) | N/A | N/A |
| 88 | reimbursements | hr | GAP (No Data Found) | NONE | 16.46s |
| 89 | performance review | hr | FAIL (500) | N/A | N/A |
| 90 | appraisal due | hr | GAP (No Data Found) | NONE | 14.79s |
| 91 | top performers | hr | FAIL (500) | N/A | N/A |
| 92 | low performance | hr | FAIL (500) | N/A | N/A |
| 93 | training status | hr | FAIL (500) | N/A | N/A |
| 94 | pending trainings | hr | FAIL (500) | N/A | N/A |
| 95 | anomaly | ops | FAIL (500) | N/A | N/A |
| 96 | sudden drop | ops | PASS | SQL | 10.81s |
| 97 | spike | ops | PASS | SQL | 10.02s |
| 98 | outlier | ops | PASS | SQL | 13.49s |
| 99 | duplicate | ops | GAP (No Data Found) | NONE | 19.83s |
| 100 | duplicate entry | ops | GAP (No Data Found) | NONE | 16.10s |
| 101 | data issue | ops | FAIL (500) | N/A | N/A |
| 102 | missing data | ops | GAP (No Data Found) | NONE | 14.85s |
| 103 | inconsistent data | ops | ERROR (HTTPConnectionPool(host='localhost', port=8000): Read timed out. (read timeout=20)) | N/A | N/A |
| 104 | sync issue | ops | FAIL (500) | N/A | N/A |
| 105 | integration error | ops | FAIL (500) | N/A | N/A |
| 106 | failed job | ops | GAP (No Data Found) | NONE | 14.57s |
| 107 | background task error | ops | FAIL (500) | N/A | N/A |
| 108 | exception list | ops | GAP (No Data Found) | NONE | 14.52s |
| 109 | business summary | executive | FAIL (500) | N/A | N/A |
| 110 | business overview | executive | FAIL (500) | N/A | N/A |
| 111 | store health | executive | FAIL (500) | N/A | N/A |
| 112 | company health | executive | FAIL (500) | N/A | N/A |
| 113 | risks | executive | FAIL (500) | N/A | N/A |
| 114 | red flags | executive | FAIL (500) | N/A | N/A |
| 115 | watchlist items | executive | FAIL (500) | N/A | N/A |
| 116 | bottlenecks | executive | GAP (No Data Found) | NONE | 18.16s |
| 117 | overview | executive | FAIL (500) | N/A | N/A |
| 118 | kpi dashboard | executive | FAIL (500) | N/A | N/A |
| 119 | key metrics | executive | FAIL (500) | N/A | N/A |
| 120 | top issues | executive | FAIL (500) | N/A | N/A |
| 121 | key insights | executive | FAIL (500) | N/A | N/A |
| 122 | forecast | executive | FAIL (500) | N/A | N/A |
| 123 | demand forecast | executive | PASS | SQL | 11.99s |
| 124 | sales forecast | executive | FAIL (500) | N/A | N/A |
| 125 | cash flow forecast | executive | FAIL (500) | N/A | N/A |
| 126 | branch wise summary | executive | FAIL (500) | N/A | N/A |
| 127 | department wise summary | executive | FAIL (500) | N/A | N/A |
| 128 | what to reorder | nlp | GAP (No Data Found) | NONE | 14.72s |
| 129 | anything expiring | nlp | FAIL (500) | N/A | N/A |
| 130 | how are sales | nlp | PASS | SQL | 5.29s |
| 131 | show problems | nlp | FAIL (500) | N/A | N/A |
| 132 | what needs my attention | nlp | FAIL (500) | N/A | N/A |
| 133 | what changed today | nlp | GAP (No Data Found) | NONE | 19.22s |
| 134 | what changed this week | nlp | PASS | SQL | 9.52s |
| 135 | show today summary | nlp | FAIL (500) | N/A | N/A |
| 136 | show this week | nlp | FAIL (500) | N/A | N/A |
| 137 | show this month | nlp | GAP (No Data Found) | NONE | 17.54s |
| 138 | where am I losing money | nlp | PASS | SQL | 4.24s |
| 139 | which items are risky | nlp | FAIL (500) | N/A | N/A |
| 140 | who is not performing | nlp | FAIL (500) | N/A | N/A |
