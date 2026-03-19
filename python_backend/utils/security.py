
import os
import base64
import logging
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.fernet import Fernet
from dotenv import load_dotenv

# Load .env to get potential existing keys
load_dotenv()

class SecurityUtils:
    """Utilities for encrypting and decrypting sensitive information"""
    
    _master_key = None
    
    @classmethod
    def _get_master_key(cls):
        """Derives or retrieves a master key for encryption"""
        if cls._master_key:
            return cls._master_key
            
        # In a real enterprise app, this would be in a KMS or Vault.
        # Here we derive it from a system-specific seed or a hardcoded secret if env is missing.
        password = os.getenv("JWT_SECRET", "store-ai-default-encryption-salt").encode()
        salt = b'storeai_salt_123' # Fixed salt for consistency across restarts
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
        )
        key = base64.urlsafe_b64encode(kdf.derive(password))
        cls._master_key = Fernet(key)
        return cls._master_key

    @classmethod
    def encrypt(cls, data: str) -> str:
        """Encrypts a string"""
        if not data:
            return ""
        if data.startswith("ENC:"):
            return data # Already encrypted
            
        fernet = cls._get_master_key()
        encrypted = fernet.encrypt(data.encode())
        return f"ENC:{encrypted.decode()}"

    @classmethod
    def decrypt(cls, data: str) -> str:
        """Decrypts a string if it's prefixed with ENC:"""
        if not data or not data.startswith("ENC:"):
            return data
            
        try:
            fernet = cls._get_master_key()
            token = data[4:].strip().strip('"').strip("'") # Robust cleaning
            decrypted = fernet.decrypt(token.encode())
            return decrypted.decode()
        except Exception as e:
            # Fallback for failed decryption
            logging.error(f"[SECURITY] Decryption failed: {e}")
            return data

if __name__ == "__main__":
    # Test script to encrypt existing keys in .env
    backend_env = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env')
    main_env = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'main', '.env')
    
    for dotenv_path in [backend_env, main_env]:
        if os.path.exists(dotenv_path):
            with open(dotenv_path, 'r') as f:
                lines = f.readlines()
            
            new_lines = []
            changed = False
            for line in lines:
                if "GROQ_API_KEY=" in line and not "ENC:" in line:
                    key_match = line.strip().split("=", 1)
                    if len(key_match) == 2:
                        raw_key = key_match[1].strip('"').strip("'")
                        enc_key = SecurityUtils.encrypt(raw_key)
                        new_lines.append(f'{key_match[0]}="{enc_key}"\n')
                        changed = True
                        print(f"Encrypted {key_match[0]}: {enc_key}")
                    else:
                        new_lines.append(line)
                else:
                    new_lines.append(line)
                
            if changed:
                with open(dotenv_path, 'w') as f:
                    f.writelines(new_lines)
                print(f"Successfully updated {dotenv_path} with encrypted keys.")
