from services.db import db
import uuid
from datetime import datetime, timedelta
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
            elif isinstance(v, datetime):
                d[k] = v.isoformat()
            elif isinstance(v, uuid.UUID):
                d[k] = str(v)
            # Handle additional types
            elif v is None:
                continue
        return d

    # -----------------------------
    # SALES RETURNS
    # -----------------------------
    async def process_sales_return(self, sale_id, items_to_return, condition='EXCELLENT', transport=0, packaging=0):
        sale_rows = await db.fetch_rows("SELECT * FROM \"Sale\" WHERE id = $1", sale_id)
        if not sale_rows:
            return {"error": "Sale not found"}
        
        sale = sale_rows[0]
        return_id = str(uuid.uuid4())
        
        return_items = []
        total_value = Decimal(0)
        total_gst_deduction = Decimal(0)
        
        for item in items_to_return:
            p_rows = await db.fetch_rows("SELECT * FROM \"Product\" WHERE id = $1", item['productId'])
            if not p_rows: continue
            product = p_rows[0]
            
            if not product.get('isReturnable', True):
                return {"error": f"Product '{product['name']}' is marked as NON-RETURNABLE."}

            si_rows = await db.fetch_rows(
                "SELECT * FROM \"SaleItem\" WHERE \"saleId\" = $1 AND \"productId\" = $2", 
                sale_id, item['productId']
            )
            if not si_rows: continue
            
            unit_price = self._to_decimal(si_rows[0]['unitPrice'])
            qty = int(item['quantity'])
            val = unit_price * qty
            total_value += val
            
            gst_rate = self._to_decimal(product.get('gstPercentage', 18.00)) / Decimal(100.0)
            gst_deduction = val * (gst_rate / (Decimal(1) + gst_rate))
            total_gst_deduction += gst_deduction
            
            return_items.append({
                "id": str(uuid.uuid4()),
                "productId": item['productId'],
                "quantity": qty,
                "refundAmount": float(val)
            })

        condition_penalty = Decimal('0.1') if condition in ['DAMAGED', 'DEFECTIVE'] else Decimal(0)
        penalty_amount = total_value * condition_penalty
        total_refund = total_value - self._to_decimal(transport) - self._to_decimal(packaging) - total_gst_deduction - penalty_amount
        
        await db.execute("""
            INSERT INTO "SalesReturn" (id, "saleId", "totalRefund", "transportDeduction", "packagingDeduction", "gstDeduction", condition)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        """, return_id, sale_id, total_refund, self._to_decimal(transport), self._to_decimal(packaging), total_gst_deduction, condition)
        
        for ri in return_items:
            await db.execute("""
                INSERT INTO "SalesReturnItem" (id, "salesReturnId", "productId", quantity, "refundAmount")
                VALUES ($1, $2, $3, $4, $5)
            """, ri['id'], return_id, ri['productId'], ri['quantity'], self._to_decimal(ri['refundAmount']))
            if condition != 'DEFECTIVE':
                await db.execute("UPDATE \"Product\" SET \"stockQuantity\" = \"stockQuantity\" + $1 WHERE id = $2", ri['quantity'], ri['productId'])

        await self.log_to_daybook(type='RETURN', desc=f"Return for Invoice: {sale['invoiceNo']}", debit=float(total_refund), ref_id=return_id)
        return {"returnId": return_id, "refund": float(total_refund)}

    # -----------------------------
    # DAYBOOK & LEDGER
    # -----------------------------
    async def log_to_daybook(self, type, desc, debit=0, credit=0, ref_id=None):
        db_id = str(uuid.uuid4())
        await db.execute("""
            INSERT INTO "Daybook" (id, type, description, debit, credit, "referenceId", status)
            VALUES ($1, $2, $3, $4, $5, $6, 'POSTED')
        """, db_id, type, desc, self._to_decimal(debit), self._to_decimal(credit), ref_id)

    async def get_daybook(self, date_str=None):
        if not date_str:
            target_date = datetime.now().date()
        else:
            try:
                target_date = datetime.strptime(date_str, '%Y-%m-%d').date()
            except:
                target_date = datetime.now().date()
        
        rows = await db.fetch_rows("""
            SELECT * FROM "Daybook" 
            WHERE "date"::date = $1
            ORDER BY "date" DESC
        """, target_date)
        return [self._serialize_row(r) for r in rows]

    # -----------------------------
    # LIABILITY & AGING
    # -----------------------------
    async def get_liability_report(self, tenant_id=None):
        max_days = 50
        if tenant_id:
            t = await db.fetch_rows("SELECT \"maxCreditDays\" FROM \"Tenant\" WHERE id = $1", tenant_id)
            if t and t[0]['maxCreditDays']: max_days = t[0]['maxCreditDays']
            
        sales = await db.fetch_rows("""
            SELECT s.id, s."invoiceNo", s."totalAmount", s."createdAt", c.name as customer,
                   (CURRENT_DATE - s."createdAt"::date) as days_old
            FROM "Sale" s
            LEFT JOIN "Customer" c ON s."customerId" = c.id
            LEFT JOIN "Payment" p ON s.id = p."saleId"
            WHERE p.id IS NULL
            ORDER BY s."createdAt" ASC
        """)
        
        report = {
            "Within Limit": [],
            "Nearing Expiry": [],
            f"Over {max_days} days (CRITICAL)": []
        }
        
        for s in sales:
            days = s['days_old'] or 0
            data = {"invoice": s['invoiceNo'], "customer": s['customer'], "amount": float(s['totalAmount'] or 0), "days": days}
            if days <= (max_days * 0.6): report["Within Limit"].append(data)
            elif days <= max_days: report["Nearing Expiry"].append(data)
            else: report[f"Over {max_days} days (CRITICAL)"].append(data)
            
        return report

    # -----------------------------
    # FORMAL REPORTS: P&L AND LEDGER
    # -----------------------------
    async def get_profit_loss(self, start_date=None, end_date=None):
        sales_val = await db.fetch_val("SELECT SUM(credit) FROM \"Daybook\" WHERE type = 'SALE' AND status = 'POSTED'")
        returns_val = await db.fetch_val("SELECT SUM(debit) FROM \"Daybook\" WHERE type = 'RETURN'")
        expenses_val = await db.fetch_val("SELECT SUM(debit) FROM \"Daybook\" WHERE type = 'EXPENSE'")
        
        sales = self._to_decimal(sales_val)
        returns = self._to_decimal(returns_val)
        expenses = self._to_decimal(expenses_val)
        
        net_revenue = sales - returns
        gross_profit = net_revenue * Decimal('0.3')
        net_profit = gross_profit - expenses
        
        return {
            "period": "Current Month",
            "revenue": float(sales),
            "returns": float(returns),
            "netRevenue": float(net_revenue),
            "expenses": float(expenses),
            "grossProfit": float(gross_profit),
            "netProfit": float(net_profit),
            "marginPercentage": float(net_profit / net_revenue * 100) if net_revenue > 0 else 0
        }

    async def get_general_ledger(self, account_type=None):
        query = "SELECT * FROM \"Daybook\" WHERE status = 'POSTED'"
        if account_type:
            query += f" AND type = '{account_type}'"
        
        rows = await db.fetch_rows(query + " ORDER BY date DESC")
        return [self._serialize_row(r) for r in rows]

    # -----------------------------
    # RECURRING EXPENSES
    # -----------------------------
    async def auto_generate_expenses(self):
        configs = await db.fetch_rows("SELECT * FROM \"RecurringExpense\" WHERE \"isActive\" = true")
        count = 0
        for cfg in configs:
            daily_val = float(cfg['baseAmount'] or 0) / 30.0 
            exists = await db.fetch_val("""
                SELECT 1 FROM "Daybook" 
                WHERE type = 'EXPENSE' AND description LIKE $1 AND date::date = CURRENT_DATE
            """, f"%{cfg['name']}%")
            
            if not exists:
                await self.log_to_daybook(
                    type='EXPENSE',
                    desc=f"Auto-Generated {cfg['name']}",
                    debit=daily_val,
                    ref_id=cfg['id']
                )
                count += 1
        return count

    # -----------------------------
    # P&L AND GST
    # -----------------------------
    async def get_financial_summary(self):
        s_val = await db.fetch_val("SELECT SUM(credit) FROM \"Daybook\" WHERE type = 'SALE'")
        r_val = await db.fetch_val("SELECT SUM(debit) FROM \"Daybook\" WHERE type = 'RETURN'")
        e_val = await db.fetch_val("SELECT SUM(debit) FROM \"Daybook\" WHERE type = 'EXPENSE'")
        
        gst_out_val = await db.fetch_val("SELECT SUM(\"taxAmount\") FROM \"Sale\"")
        gst_in_val = await db.fetch_val("SELECT SUM(\"taxAmount\") FROM \"Order\"")
        
        sales = self._to_decimal(s_val)
        returns = self._to_decimal(r_val)
        expenses = self._to_decimal(e_val)
        gst_out = self._to_decimal(gst_out_val)
        gst_in = self._to_decimal(gst_in_val)
        
        net_profit = sales - returns - expenses
        gst_liab = gst_out - gst_in
        
        return {
            "totalRevenue": float(sales),
            "totalReturns": float(returns),
            "totalExpenses": float(expenses),
            "netProfit": float(net_profit),
            "gstLiability": float(gst_liab),
            "healthStatus": "EXCELLENT" if net_profit > 0 else "CAUTION"
        }

finance_service = FinanceService()
