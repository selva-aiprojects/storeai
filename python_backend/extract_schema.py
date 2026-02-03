import json
import sys

def extract_schema(table_names):
    try:
        with open('schema_output.json', 'r') as f:
            data = json.load(f)
        
        result = {}
        for table in table_names:
            if table in data:
                result[table] = data[table]
            else:
                result[table] = "Not found"
        
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    tables = [
        "Ledger", "LedgerEntry", "Order", "OrderItem", "GoodsReceipt", 
        "GoodsReceiptItem", "Sale", "SaleItem", "PurchaseReturn", 
        "PurchaseReturnItem", "SalesReturn", "SalesReturnItem", "Stock", 
        "Employee", "User", "Daybook", "GSTLog"
    ]
    extract_schema(tables)
