import psycopg2
import json

DATABASE_URL = "postgresql://neondb_owner:npg_AEz9RXOcPSp4@ep-blue-water-ahyij9xn-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def find_alex():
    print("🐘 Finding Alex...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        cur.execute('SELECT id, email, "firstName", "lastName" FROM "User" WHERE "firstName" ILIKE \'Alex%%\' OR "lastName" ILIKE \'Alex%%\'')
        users = cur.fetchall()
        for u in users:
            print(f"ID: {u[0]} | Email: {u[1]} | Name: {u[2]} {u[3]}")
            
            cur.execute('SELECT "tenantId", "roleId" FROM "UserTenant" WHERE "userId" = %s', (u[0],))
            assocs = cur.fetchall()
            for a in assocs:
                cur.execute('SELECT name FROM "Tenant" WHERE id = %s', (a[0],))
                tenant_name = cur.fetchone()[0]
                print(f"    Tenant: {tenant_name} ({a[0]})")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ DB Error: {e}")

if __name__ == "__main__":
    find_alex()
