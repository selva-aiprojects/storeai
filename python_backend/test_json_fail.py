
import json
from datetime import datetime
from uuid import uuid4

def test_serialization():
    data = [
        {"id": uuid4(), "date": datetime.now(), "value": 100.5}
    ]
    try:
        print("Testing standard json.dumps...")
        json.dumps(data)
        print("Success!")
    except Exception as e:
        print(f"FAILED: {e}")

if __name__ == "__main__":
    test_serialization()
