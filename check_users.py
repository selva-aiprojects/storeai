import asyncio
import os
import json
from dotenv import load_dotenv
import asyncpg

async def inspect():
    load_dotenv('main/.env')
    DATABASE_URL = os.getenv('DATABASE_URL')
    if not DATABASE_URL:
        print("DATABASE_URL not found in main/.env")
        return
        
    try:
        conn = await asyncpg.connect(DATABASE_URL)
        
        print("--- USERS ---")
        users = await conn.fetch('SELECT id, email, "firstName", "lastName", role, "isActive" FROM "User"')
        for u in users:
            print(f"ID: {u['id']}, Email: {u['email']}, Name: {u['firstName']} {u['lastName']}, Role: {u['role']}, Active: {u['isActive']}")
            
        print("\n--- TENANT ASSOCIATIONS ---")
        associations = await conn.fetch('''
            SELECT u.email, t.name as tenant_name, t.slug, t.status, r.code as role_code
            FROM "UserTenant" ut
            JOIN "User" u ON ut."userId" = u.id
            JOIN "Tenant" t ON ut."tenantId" = t.id
            JOIN "Role" r ON ut."roleId" = r.id
        ''')
        for a in associations:
            print(f"Email: {a['email']}, Tenant: {a['tenant_name']} ({a['slug']}), Status: {a['status']}, Role: {a['role_code']}")
            
        await conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(inspect())
