import jwt
import datetime
import os
from dotenv import load_dotenv

def generate_token():
    dotenv_path = os.path.join(os.path.dirname(__file__), 'main', '.env')
    load_dotenv(dotenv_path)

    secret = os.getenv("JWT_SECRET")
    if not secret:
        raise ValueError("JWT_SECRET not found in .env")

    exp_time = datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    payload = {
        "id": "test-admin-id",
        "email": "admin@storeai.com",
        "role": "SUPER_ADMIN",
        "tenantId": "technova",
        "exp": exp_time
    }
    return jwt.encode(payload, secret, algorithm="HS256")

if __name__ == "__main__":
    t = generate_token()
    print(f"Token: {t}")
