import asyncio
import os
import json
from dotenv import load_dotenv
import asyncpg

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

async def get_schema():
    conn = await asyncpg.connect(DATABASE_URL)
    try:
        # Get all tables
        tables = await conn.fetch("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        """)
        
        schema = {}
        for row in tables:
            table_name = row['table_name']
            columns = await conn.fetch("""
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns 
                WHERE table_name = $1
            """, table_name)
            
            schema[table_name] = [dict(col) for col in columns]
            
        with open('full_schema.json', 'w') as f:
            json.dump(schema, f, indent=2)
            
        print("Full schema exported to full_schema.json")
    finally:
        await conn.close()

if __name__ == "__main__":
    asyncio.run(get_schema())
