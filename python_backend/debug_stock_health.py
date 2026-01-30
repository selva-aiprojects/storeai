
import asyncio
from services.rag import rag_service
from services.db import db

async def test_stock_health():
    query = "Stock Health"
    print(f"Testing Query: {query}")
    try:
        # We need to connect to DB for this test
        await db.connect()
        
        # Test handle_sql logic directly to see SQL
        sql_prompt = rag_service._build_sql_prompt(query)
        from services.llm import llm_service
        raw_response = await llm_service.generate_response(sql_prompt)
        print(f"Raw Response: {raw_response}")
        
        import re
        sql_match = re.search(r"```sql\n?(.*?)\n?```", raw_response, re.DOTALL | re.IGNORECASE)
        if sql_match:
            sql = sql_match.group(1).strip()
        else:
            sql = raw_response.replace("```sql", "").replace("```", "").strip()
        
        print(f"Extracted SQL: {sql}")
        
        rows = await db.fetch_rows(sql)
        print(f"Rows found: {len(rows)}")
        
        result = await rag_service.process_query(query)
        print(f"Final Result: {result['response'][:100]}...")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        await db.disconnect()

if __name__ == "__main__":
    asyncio.run(test_stock_health())
