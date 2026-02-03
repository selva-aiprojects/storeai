
import asyncio
from services.db import db
import json

async def inspect_schema():
    print("--- SCHEMA INSPECTION ---")
    results = {}
    try:
        # Get all tables
        tables = await db.fetch_rows("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        table_list = [t['table_name'] for t in tables]
        results['tables'] = table_list

        for table in ['Product', 'Category', 'Tenant', 'Sale']:
            query = f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'"
            rows = await db.fetch_rows(query)
            cols = []
            for row in rows:
                cols.append({"name": row['column_name'], "type": row['data_type']})
            results[table] = cols
            
        with open('schema_output.json', 'w') as f:
            json.dump(results, f, indent=2)
        print("Schema saved to schema_output.json")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_schema())
