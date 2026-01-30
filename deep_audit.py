import psycopg2
import os

DATABASE_URL = "postgresql://neondb_owner:npg_AEz9RXOcPSp4@ep-blue-water-ahyij9xn-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

def audit():
    print("--- 🐘 DEEP AUDIT ---")
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Check Tenants
    cur.execute("SELECT id, name, slug FROM \"Tenant\"")
    tenants = cur.fetchall()
    print("\n[TENANTS]")
    for t in tenants:
        print(f"ID: {t[0]} | Name: {t[1]} | Slug: {t[2]}")
        
    # Check Users
    cur.execute("SELECT id, email, \"firstName\", \"lastName\" FROM \"User\"")
    users = cur.fetchall()
    print("\n[USERS]")
    for u in users:
        print(f"ID: {u[0]} | Email: {u[1]} | Name: {u[2]} {u[3]}")
        
    # Search all text columns in Tenant for 'master'
    cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'Tenant'")
    cols = [c[0] for c in cur.fetchall()]
    for col in cols:
        try:
             cur.execute(f"SELECT id, \"{col}\" FROM \"Tenant\" WHERE CAST(\"{col}\" AS TEXT) ILIKE '%master%'")
             matches = cur.fetchall()
             if matches:
                 print(f"\n[MATCH IN Tenant.{col}]")
                 for m in matches: print(f"  ID: {m[0]} | Value: {m[1]}")
        except: pass

    conn.close()

if __name__ == "__main__":
    audit()
