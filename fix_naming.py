import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_AEz9RXOcPSp4@ep-blue-water-ahyij9xn-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"

def fix_naming():
    print("🐘 Naming & Tenant Fix...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # 1. List all tenants to find "Store Hub-master"
        cur.execute('SELECT id, name, slug FROM "Tenant"')
        tenants = cur.fetchall()
        print("\nCurrent Tenants:")
        for t in tenants:
            print(f" - {t[1]} (Slug: {t[2]})")
            if "Store Hub" in t[1] or "master" in t[1].lower():
                print(f"!!! FOUND MATCH: {t[1]}")

        # 2. Rename "Master Validation Store" to "Technova" if it exists
        # Actually, let's rename "Master Validation Store" to something cleaner if requested.
        # The user's screenshot has "MASTER VALIDATION STORE".
        # Let's rename it to the user's apparent preference or just "Technova Tech & Logistics"
        cur.execute('UPDATE "Tenant" SET name = \'Technova Tech & Logistics\' WHERE name = \'Master Validation Store\'')
        if cur.rowcount > 0:
            print("✅ Renamed 'Master Validation Store' to 'Technova Tech & Logistics'")

        # 3. Check for "Store Hub-master" in all columns of Tenant
        cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'Tenant'")
        cols = [c[0] for c in cur.fetchall()]
        for col in cols:
            cur.execute(f'SELECT id, "{col}" FROM "Tenant" WHERE CAST("{col}" AS TEXT) ILIKE \'%Store Hub%\'')
            matches = cur.fetchall()
            if matches:
                 for m in matches:
                     print(f"!!! FOUND in Tenant.{col}: {m[1]}")

        conn.commit()
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    fix_naming()
