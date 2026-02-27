
import os
import asyncio
import asyncpg
import sys
from dotenv import load_dotenv

# Ensure the python_backend is in the path (parent directory)
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

async def check_schema():
    # Look for .env in main folder
    env_path = os.path.join(os.path.dirname(parent_dir), 'main', '.env')
    load_dotenv(env_path)
    
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        print("ERROR: DATABASE_URL not found in .env")
        return
        
    conn = await asyncpg.connect(db_url)
    
    tables = ['Sale', 'Payment', 'Product', 'Employee']
    for table in tables:
        print(f"\n--- {table} Columns ---")
        rows = await conn.fetch(f"SELECT column_name FROM information_schema.columns WHERE table_name = '{table}'")
        for row in rows:
            print(row['column_name'])
            
    await conn.close()

if __name__ == "__main__":
    asyncio.run(check_schema())
