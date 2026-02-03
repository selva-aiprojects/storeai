from services.db import db
import uuid
from datetime import datetime, date as dt_date
from decimal import Decimal

class FinanceService:
    # -----------------------------
    # HELPERS
    # -----------------------------
    def _to_decimal(self, val):
        if val is None: return Decimal(0)
        try:
            return Decimal(str(val))
        except:
            return Decimal(0)

    def _serialize_row(self, row):
        d = dict(row)
        for k, v in d.items():
            if isinstance(v, Decimal):
                d[k] = float(v)
            elif isinstance(v, (datetime, dt_date)):
                d[k] = v.isoformat()
            elif isinstance(v, uuid.UUID):
                d[k] = str(v)
        return d

    # -----------------------------
    # CORE ACCOUNTING
    # -----------------------------
    async def log_transaction(self, type, description, debit=0, credit=0, reference_id=None, reference_type=None, performed_by=None, tenant_id=None):
        """
        Logs a transaction to both Daybook and LedgerEntry for auditable single-entry+.
        """
        db_id = str(uuid.uuid4())
        now = datetime.now()
        
        # 1. Log to Daybook
        await db.execute("""
            INSERT INTO "Daybook" (id, type, description, debit, credit, "referenceId", "tenantId", status, date)
            VALUES ($1, $2, $3, $4, $5, $6, $7, 'POSTED', $8)
        """, db_id, type, description, self._to_decimal(debit), self._to_decimal(credit), reference_id, tenant_id, now)

        # 2. Log to LedgerEntry if specific accounts are mapped
        if reference_type and (debit > 0 or credit > 0):
            # Map types to system accounts
            account_name = "Cash/Bank"
            if type == "EXPENSE":
                account_name = "Expenses"
            elif type == "SALE":
                account_name = "Cash/Bank"
            
            account_rows = await db.fetch_rows("SELECT id FROM \"ChartOfAccounts\" WHERE name = $1 AND \"tenantId\" = $2", account_name, tenant_id)
            
            if account_rows:
                acc_id = account_rows[0]['id']
                le_id = str(uuid.uuid4())
                await db.execute("""
                    INSERT INTO "LedgerEntry" (id, "accountId", "debitAmount", "creditAmount", "description", "referenceId", "referenceType", "tenantId", "createdBy", "entryDate")
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                """, le_id, acc_id, self._to_decimal(debit), self._to_decimal(credit), description, reference_id, reference_type, tenant_id, performed_by, now)
                
                # Update current balance
                # Debit increases Asset/Expense, Credit increases Liability/Income
                await db.execute("""
                    UPDATE "ChartOfAccounts" 
                    SET "currentBalance" = "currentBalance" + $1 - $2 
                    WHERE id = $3
                """, self._to_decimal(debit), self._to_decimal(credit), acc_id)

        return db_id

    # -----------------------------
    # SALES & RETURNS
    # -----------------------------
    async def record_sale(self, sale_id, tenant_id, performed_by=None):
        sale = await db.fetch_rows("SELECT * FROM \"Sale\" WHERE id = $1", sale_id)
        if not sale: return
        s = sale[0]
        desc = f"Sale Invoice: {s['invoiceNo']}"
        await self.log_transaction(
            type='SALE',
            description=desc,
            debit=s['totalAmount'], # Cash Inflow (Debit Cash)
            reference_id=sale_id,
            reference_type='SALE',
            performed_by=performed_by,
            tenant_id=tenant_id
        )

    async def process_sales_return(self, sale_id, items_to_return, condition='EXCELLENT', tenant_id=None, performed_by=None):
        sale_rows = await db.fetch_rows("SELECT * FROM \"Sale\" WHERE id = $1", sale_id)
        if not sale_rows: return {"error": "Sale not found"}
        sale = sale_rows[0]
        
        return_id = str(uuid.uuid4())
        total_refund = Decimal(0)
        
        for item in items_to_return:
            si = await db.fetch_rows("SELECT * FROM \"SaleItem\" WHERE \"saleId\" = $1 AND \"productId\" = $2", sale_id, item['productId'])
            if not si: continue
            
            qty = int(item['quantity'])
            refund = self._to_decimal(si[0]['unitPrice']) * qty
            total_refund += refund
            
            await db.execute("""
                INSERT INTO "SalesReturnItem" (id, "salesReturnId", "productId", quantity, "refundAmount")
                VALUES ($1, $2, $3, $4, $5)
            """, str(uuid.uuid4()), return_id, item['productId'], qty, refund)
            
            # Update stock if not defective
            if condition != 'DEFECTIVE':
                await db.execute("UPDATE \"Product\" SET \"stockQuantity\" = \"stockQuantity\" + $1 WHERE id = $2", qty, item['productId'])
        
        await db.execute("""
            INSERT INTO "SalesReturn" (id, "saleId", "totalRefund", "tenantId", "returnDate", "status")
            VALUES ($1, $2, $3, $4, NOW(), 'COMPLETED')
        """, return_id, sale_id, total_refund, tenant_id)
        
        await self.log_transaction(
            type='RETURN',
            description=f"Sales Return for {sale['invoiceNo']}",
            credit=total_refund, # Cash Outflow (Credit Cash)
            reference_id=return_id,
            reference_type='SALES_RETURN',
            performed_by=performed_by,
            tenant_id=tenant_id
        )
        return {"returnId": return_id, "refund": float(total_refund)}

    # -----------------------------
    # REPORTS
    # -----------------------------
    async def get_daybook(self, tenant_id, start_date=None, end_date=None):
        query = "SELECT * FROM \"Daybook\" WHERE \"tenantId\" = $1"
        params = [tenant_id]
        if start_date:
            query += " AND date >= $2"
            params.append(start_date)
        if end_date:
            query += f" AND date <= ${len(params)+1}"
            params.append(end_date)
        
        rows = await db.fetch_rows(query + " ORDER BY date DESC", *params)
        return [self._serialize_row(r) for r in rows]

    async def get_profit_loss(self, tenant_id):
        sales_val = await db.fetch_val("SELECT SUM(debit) FROM \"Daybook\" WHERE \"tenantId\" = $1 AND type = 'SALE'", tenant_id)
        returns_val = await db.fetch_val("SELECT SUM(credit) FROM \"Daybook\" WHERE \"tenantId\" = $1 AND type = 'RETURN'", tenant_id)
        expenses_val = await db.fetch_val("SELECT SUM(credit) FROM \"Daybook\" WHERE \"tenantId\" = $1 AND type = 'EXPENSE'", tenant_id)
        
        sales = self._to_decimal(sales_val)
        returns = self._to_decimal(returns_val)
        expenses = self._to_decimal(expenses_val)
        
        net_sales = sales - returns
        gross_profit = net_sales * Decimal('0.3') # Mock 30% margin
        net_profit = gross_profit - expenses
        
        return {
            "totalRevenue": float(sales),
            "totalReturns": float(returns),
            "netRevenue": float(net_sales),
            "totalExpenses": float(expenses),
            "grossProfit": float(gross_profit),
            "netProfit": float(net_profit)
        }

    async def get_trial_balance(self, tenant_id):
        accounts = await db.fetch_rows("""
            SELECT name, code, "accountType", "currentBalance" 
            FROM "ChartOfAccounts" 
            WHERE "tenantId" = $1
        """, tenant_id)
        
        tb_data = []
        for acc in accounts:
            tb_data.append({
                "account": acc['name'],
                "debit": float(acc['currentBalance']) if acc['currentBalance'] > 0 else 0,
                "credit": float(abs(acc['currentBalance'])) if acc['currentBalance'] < 0 else 0
            })
        return tb_data

    async def get_balance_sheet(self, tenant_id):
        cash = self._to_decimal(await db.fetch_val("SELECT \"currentBalance\" FROM \"ChartOfAccounts\" WHERE name = 'Cash/Bank' AND \"tenantId\" = $1", tenant_id))
        inventory_val = self._to_decimal(await db.fetch_val("SELECT SUM(\"stockQuantity\" * \"costPrice\") FROM \"Product\" WHERE \"tenantId\" = $1", tenant_id))
        
        return {
            "Assets": {
                "Cash/Bank": float(cash),
                "Inventory": float(inventory_val),
                "Total Assets": float(cash + inventory_val)
            },
            "Liabilities": {
                "Accounts Payable": 0.0,
                "Total Liabilities": 0.0
            },
            "Equity": {
                "Retained Earnings": float(cash + inventory_val)
            }
        }

finance_service = FinanceService()
