import asyncio
import os
import sys
from dotenv import load_dotenv

# Add python_backend to path
sys.path.append(os.path.join(os.getcwd(), 'python_backend'))

from services.rag import rag_service
from services.db import db
from services.llm import llm_service

async def main():
    await db.connect()
    
    await rag_service.init()
    TENANT_ID = 'd648adeb-cb77-4678-912d-0a5f6122e5dd'
    
    query = "Check stock levels for Cisco Catalyst 9200L"
    print(f"\nQUERY: {query}")
    
    from services.rag import PromptTemplates
    sql_prompt = PromptTemplates.sql_generation(query, TENANT_ID)
    llm_resp = await llm_service.generate_response(sql_prompt)
    print(f"LLM SQL RESPONSE: {llm_resp}")
    
    # Extract and execute
    from services.rag import SQLExtractor
    sql = SQLExtractor.extract(llm_resp)
    print(f"EXTRACTED SQL: {sql}")
    
    if sql:
        try:
            results = await db.fetch_rows(sql)
            print(f"RESULTS: {results}")
        except Exception as e:
            print(f"EXECUTION ERROR: {e}")
            
    await db.disconnect()

if __name__ == "__main__":
    asyncio.run(main())
