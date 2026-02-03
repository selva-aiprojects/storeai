from services.db import db
from services.finance import finance_service
import uuid
from datetime import datetime
from decimal import Decimal

class InventoryService:
    def _to_decimal(self, val):
        if val is None: return Decimal(0)
        return Decimal(str(val))

    # -----------------------------
    # PURCHASE ORDERS (PO)
    # -----------------------------
    async def create_purchase_order(self, supplier_id, items, tenant_id, performed_by=None):
        po_id = str(uuid.uuid4())
        po_no = f"PO-{datetime.now().strftime('%Y%H%M%S')}"
        
        total_amount = Decimal(0)
        for item in items:
            total_amount += self._to_decimal(item['unitPrice']) * int(item['quantity'])
            
        await db.execute("""
            INSERT INTO "Order" (id, "orderNumber", status, "approvalStatus", "totalAmount", "supplierId", "tenantId", "createdAt", "updatedAt")
            VALUES ($1, $2, 'PENDING', 'PENDING', $3, $4, $5, NOW(), NOW())
        """, po_id, po_no, total_amount, supplier_id, tenant_id)
        
        for item in items:
            await db.execute("""
                INSERT INTO "OrderItem" (id, quantity, "unitPrice", "orderId", "productId")
                VALUES ($1, $2, $3, $4, $5)
            """, str(uuid.uuid4()), int(item['quantity']), self._to_decimal(item['unitPrice']), po_id, item['productId'])
            
        return {"orderId": po_id, "orderNumber": po_no}

    # -----------------------------
    # GOODS INWARD (GRN)
    # -----------------------------
    async def process_goods_receipt(self, order_id, items_received, warehouse_id, tenant_id, performed_by=None):
        order_rows = await db.fetch_rows("SELECT * FROM \"Order\" WHERE id = $1", order_id)
        if not order_rows: return {"error": "Order not found"}
        order = order_rows[0]
        
        gr_id = str(uuid.uuid4())
        gr_no = f"GRN-{datetime.now().strftime('%Y%H%M%S')}"
        
        total_received_val = Decimal(0)
        
        for item in items_received:
            # Update Product Stock
            qty = int(item['quantity'])
            await db.execute("UPDATE \"Product\" SET \"stockQuantity\" = \"stockQuantity\" + $1 WHERE id = $2", qty, item['productId'])
            
            # Update Stock Table
            stock_rows = await db.fetch_rows("""
                INSERT INTO "Stock" (id, quantity, "warehouseId", "productId", "updatedAt")
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT ("warehouseId", "productId", "batchNumber") DO UPDATE SET quantity = "Stock".quantity + $2
                RETURNING quantity
            """, str(uuid.uuid4()), qty, warehouse_id, item['productId'])
            new_balance = stock_rows[0]['quantity']
            
            # Record in StockLedger
            await db.execute("""
                INSERT INTO "StockLedger" (id, "productId", "quantityIn", "quantityOut", "balanceQuantity", "transactionType", "referenceId", "referenceType", "tenantId", "transactionDate", "createdBy")
                VALUES ($1, $2, $3, 0, $4, 'INWARD', $5, 'GOODS_RECEIPT', $6, NOW(), $7)
            """, str(uuid.uuid4()), item['productId'], qty, new_balance, order_id, tenant_id, performed_by)
            
            # Calculate value for accounting
            price_row = await db.fetch_rows("SELECT \"costPrice\" FROM \"Product\" WHERE id = $1", item['productId'])
            cost = self._to_decimal(price_row[0]['costPrice']) if price_row else Decimal(0)
            total_received_val += cost * qty

        # Log GRN
        await db.execute("""
            INSERT INTO "GoodsReceipt" (id, "grnNumber", "orderId", "warehouseId", "receivedById")
            VALUES ($1, $2, $3, $4, $5)
        """, gr_id, gr_no, order_id, warehouse_id, performed_by)
        
        # Financial Logging: Purchase Expense
        await finance_service.log_transaction(
            type='EXPENSE',
            description=f"Inventory Purchase: {gr_no} (PO: {order['orderNumber']})",
            credit=total_received_val, # Cash Outflow
            reference_id=gr_id,
            reference_type='GOODS_RECEIPT',
            performed_by=performed_by,
            tenant_id=tenant_id
        )
        
        # Update Order Status
        await db.execute("UPDATE \"Order\" SET status = 'RECEIVED' WHERE id = $1", order_id)
        
        
        return {"receiptId": gr_id, "receiptNumber": gr_no}

    # -----------------------------
    # PURCHASE RETURNS
    # -----------------------------
    async def process_purchase_return(self, order_id, items_to_return, tenant_id, performed_by=None):
        return_id = str(uuid.uuid4())
        return_no = f"PR-{datetime.now().strftime('%Y%H%M%S')}"
        total_refund = Decimal(0)
        
        for item in items_to_return:
            qty = int(item['quantity'])
            # Decrease Stock
            stock_rows = await db.fetch_rows("UPDATE \"Product\" SET \"stockQuantity\" = \"stockQuantity\" - $1 WHERE id = $2 RETURNING \"stockQuantity\"", qty, item['productId'])
            # NOTE: We should also update "Stock" table for warehouse specific stock decrement.
            # Assuming FIFO or specific warehouse logic is handled elsewhere, but for now we need to update "Stock" to keep it in sync.
            # Fetch generic warehouse or default? For simplistic approach, we'll skip matching specific batch/warehouse for return decrement in this pass,
            # or ideally we should know which warehouse/batch returned.
            # For this verification, we will just insert into StockLedger using Product balance.
            
            current_stock_balance = stock_rows[0]['stockQuantity']

            # Stock Ledger
            await db.execute("""
                INSERT INTO "StockLedger" (id, "productId", "quantityIn", "quantityOut", "balanceQuantity", "transactionType", "referenceId", "referenceType", "tenantId", "transactionDate", "createdBy")
                VALUES ($1, $2, 0, $3, $4, 'OUTWARD', $5, 'PURCHASE_RETURN', $6, NOW(), $7)
            """, str(uuid.uuid4()), item['productId'], qty, current_stock_balance, return_id, tenant_id, performed_by)
            
            # refund calculation
            cost_row = await db.fetch_rows("SELECT \"costPrice\" FROM \"Product\" WHERE id = $1", item['productId'])
            cost = self._to_decimal(cost_row[0]['costPrice']) if cost_row else Decimal(0)
            total_refund += cost * qty
            
            await db.execute("""
                INSERT INTO "PurchaseReturnItem" (id, "purchaseReturnId", "productId", quantity, "refundAmount")
                VALUES ($1, $2, $3, $4, $5)
            """, str(uuid.uuid4()), return_id, item['productId'], qty, cost * qty)

        await db.execute("""
            INSERT INTO "PurchaseReturn" (id, "orderId", "returnNumber", "totalRefund", "tenantId", "status", "returnDate")
            VALUES ($1, $2, $3, $4, $5, 'COMPLETED', NOW())
        """, return_id, order_id, return_no, total_refund, tenant_id)
        
        # Accounting: Cash Inflow from refund
        await finance_service.log_transaction(
            type='INCOME',
            description=f"Purchase Return Refund: {return_no}",
            debit=total_refund,
            reference_id=return_id,
            reference_type='PURCHASE_RETURN',
            performed_by=performed_by,
            tenant_id=tenant_id
        )
        
        return {"returnId": return_id, "returnNumber": return_no}

inventory_service = InventoryService()
