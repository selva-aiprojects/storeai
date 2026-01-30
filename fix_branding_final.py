import psycopg2

DATABASE_URL = "postgresql://neondb_owner:npg_AEz9RXOcPSp4@ep-blue-water-ahyij9xn-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

def fix():
    conn = psycopg2.connect(DATABASE_URL)
    cur = conn.cursor()
    
    # Rename Tenants
    cur.execute("UPDATE \"Tenant\" SET name = 'Technova Tech & Logistics' WHERE slug = 'technova'")
    cur.execute("UPDATE \"Tenant\" SET name = 'Technova Hub (Alpha)' WHERE slug = 'master-s'")
    cur.execute("UPDATE \"Tenant\" SET name = 'Technova Executive' WHERE name ILIKE '%Store Hub%'")
    
    # Check for the literal string the user mentioned
    cur.execute("SELECT id, name FROM \"Tenant\" WHERE name = 'Store Hub-master'")
    match = cur.fetchone()
    if match:
        cur.execute("UPDATE \"Tenant\" SET name = 'Technova Enterprise' WHERE id = %s", (match[0],))
        print(f"Renamed literal 'Store Hub-master' (ID: {match[0]})")
    
    conn.commit()
    print("DB Fix Complete.")
    conn.close()

if __name__ == "__main__":
    fix()
