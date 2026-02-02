import requests
import json

try:
    # Check OpenAPI
    schema_resp = requests.get("http://127.0.0.1:8002/openapi.json")
    print(f"Schema Status: {schema_resp.status_code}")
    print(f"Schema: {schema_resp.text}")
except Exception as e:
    print(f"Error: {e}")
