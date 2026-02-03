import asyncio
import os
from dotenv import load_dotenv
import asyncpg
import json
from decimal import Decimal
from datetime import datetime

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

class E(json.JSONEncoder):
    def default(self, o):
        if hasattr(o, "isoformat"): return o.isoformat()
        if isinstance(o, Decimal): return float(o)
        return super().default(o)

async def main():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Tenants
        tenants = await conn.fetch('SELECT id, name, slug FROM "Tenant"')
        t_map = {r['id']: {"slug": r['slug'], "name": r['name']} for r in tenants}
        
        # Products with stock > 0
        products = await conn.fetch('SELECT * FROM "Product" WHERE "stockQuantity" > 0')
        
        report = []
        for p in products:
            p_dict = dict(p)
            p_dict['tenant_slug'] = t_map.get(p_dict['tenantId'], {}).get('slug', 'Unknown')
            p_dict['tenant_name'] = t_map.get(p_dict['tenantId'], {}).get('name', 'Unknown')
            report.append(p_dict)
            
        with open('all_stock_dump.json', 'w') as f:
            json.dump(report, f, indent=2, cls=E)
            
        print(f"Dumped {len(report)} products with stock > 0 to all_stock_dump.json")
        
        # Also dump ALL tenants for reference
        with open('tenants_dump.json', 'w') as f:
            json.dump(t_map, f, indent=2, cls=E)

    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(main())
