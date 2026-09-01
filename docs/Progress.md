# Progress and Debug Artifacts

Date: 2026-07-13

Summary:
- Fixed balance sheet equity aggregation in `main/server/src/controllers/financeController.ts`.
- Fixed balance-sheet/report generation in `main/server/src/services/report.service.ts` to include current-year P&L.
- Replaced stray `console.log(error)` with `console.error(error)` in `main/server/src/controllers/userController.ts`.

Debug / Diagnostic Files (kept for reconciliation):
- main/server/debug_1350.js — ledger mismatch inspection
- main/server/debug_account_ids.js — account listing + mapping
- main/server/debug_all_sale.js — sale entry dump
- main/server/debug_ar_entries.js — accounts receivable rows
- main/server/debug_bad_account_entries.js — suspicious ledger entries
- main/server/debug_cash_entries.js — cash account checks
- main/server/debug_group_by_account.js — grouping tally helper
- main/server/debug_group_tally.js — group totals
- main/server/debug_grouped_refs.js — grouped references
- main/server/debug_last_sale.js — inspect last sale
- main/server/debug_ledger_inspect.js — ledger inspector
- main/server/debug_ledger_mismatch.js — mismatch tracer
- main/server/debug_login.log — ad-hoc login debug log
- main/server/debug_payment_entries.js — payment entries dump
- main/server/debug_sale_balance.js — sale balancing checks
- main/server/debug_sale_entries.js — sale ledger entries list
- main/server/debug_sales_detail.js — sales metadata dump

Recommendations:
- Keep these debug files in a single folder `main/server/debug/` or archive them with a timestamped suffix (e.g. `.archived-20260713.log`) for future reconciliation.
- When reconciling ledgers next time, run the relevant debug script(s) against the same dataset and attach the output to this Progress record.

Commit: 3ccb63fb1838be00c0768c8c31430cd80ac25bf2
Branch: main

-- End of Progress
