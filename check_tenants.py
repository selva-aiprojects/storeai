import psycopg2
import json

DATABASE_URL = "postgresql://neondb_owner:npg_AEz9RXOcPSp4@ep-blue-water-ahyij9xn-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def check_db():
    print("🐘 Deep Database Diagnostics...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # Check Column Names for User
        print("\n[SCHEMA] User Table Columns:")
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'User'")
        cols = cur.fetchall()
        for c in cols:
            print(f" - {c[0]}")

        print("\n--- TENANTS ---")
        cur.execute('SELECT id, name, slug FROM "Tenant"')
        tenants = cur.fetchall()
        for t in tenants:
            print(f"ID: {t[0]} | Name: {t[1]} | Slug: {t[2]}")

        print("\n--- USERS (admin@storeai.com) ---")
        cur.execute('SELECT id, email FROM "User" WHERE email = \'admin@storeai.com\'')
        users = cur.fetchall()
        for u in users:
            print(f"ID: {u[0]} | Email: {u[1]}")
            
            print(f"  --- UserTenant Associations FOR USER {u[0]} ---")
            cur.execute('SELECT "tenantId", "roleId", "isActive" FROM "UserTenant" WHERE "userId" = %s', (u[0],))
            assocs = cur.fetchall()
            for a in assocs:
                # Fetch role code
                cur.execute('SELECT code FROM "Role" WHERE id = %s', (a[1],))
                role_code = cur.fetchone()[0]
                
                # Fetch tenant name
                cur.execute('SELECT name FROM "Tenant" WHERE id = %s', (a[0],))
                tenant_name = cur.fetchone()[0]
                
                print(f"    Tenant: {tenant_name} ({a[0]}) | Role: {role_code} | Active: {a[2]}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ DB Error: {e}")

if __name__ == "__main__":
    check_db()
