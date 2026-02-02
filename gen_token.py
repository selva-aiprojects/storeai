import jwt
import datetime

secret = "682c5156cfded9886986b1f4b1434808"
payload = {
    "id": "test-admin-id",
    "email": "admin@storeai.com",
    "role": "SUPER_ADMIN",
    "tenantId": "technova",
    "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=1)
}
token = jwt.encode(payload, secret, algorithm="HS256")
print(token)
