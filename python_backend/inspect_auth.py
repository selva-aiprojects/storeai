import asyncio
import os
import sys
from services.db import db

async def inspect():
    await db.connect()
    print("--- Permissions List ---")
    perms = await db.fetch_rows("SELECT code FROM \"Permission\"")
    for p in perms:
        print(f"- {p['code']}")

    print("\n--- Role-Permission Mapping (SUPER_ADMIN) ---")
    mapping = await db.fetch_rows("""
        SELECT p.code 
        FROM "_PermissionToRole" pr
        JOIN "Permission" p ON p.id = pr."A"
        JOIN "Role" r ON r.id = pr."B"
        WHERE r.code = 'SUPER_ADMIN'
    """)
    if not mapping:
        print("ALERT: No permissions linked to SUPER_ADMIN!")
    for m in mapping:
        print(f"- {m['code']}")
    
    # Check User Permissions from Auth view
    print("\n--- User Permissions Check (admin@storeai.com) ---")
    user_perms = await db.fetch_rows("""
        SELECT p.code
        FROM "User" u
        JOIN "UserTenant" ut ON ut."userId" = u.id
        JOIN "Role" r ON r.id = ut."roleId"
        JOIN "_PermissionToRole" pr ON pr."B" = r.id
        JOIN "Permission" p ON p.id = pr."A"
        WHERE u.email = 'admin@storeai.com'
    """)
    for up in user_perms:
        print(f"- {up['code']}")

if __name__ == "__main__":
    asyncio.run(inspect())
