
import os
import sys

# Ensure the python_backend is in the path (parent directory)
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)

from utils.security import SecurityUtils

def test_encryption():
    raw_key = "gsk_test_key_123456789"
    encrypted = SecurityUtils.encrypt(raw_key)
    print(f"Raw: {raw_key}")
    print(f"Encrypted: {encrypted}")
    
    decrypted = SecurityUtils.decrypt(encrypted)
    print(f"Decrypted: {decrypted}")
    
    if raw_key == decrypted:
        print("SUCCESS: Encryption/Decryption verified.")
    else:
        print("FAILURE: Decryption do not match raw key.")

if __name__ == "__main__":
    test_encryption()
