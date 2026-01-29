
import asyncio
import os
import google.generativeai as genai
from dotenv import load_dotenv
from pathlib import Path

# Load env
dotenv_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")
genai.configure(api_key=GOOGLE_API_KEY)

async def test_gen():
    models_to_test = [
        'gemini-flash-latest', 
        'gemini-2.0-flash-lite-001',
        'gemini-2.0-flash'
    ]
    
    for m_name in models_to_test:
        print(f"\n--- Testing {m_name} ---")
        try:
            model = genai.GenerativeModel(m_name)
            resp = model.generate_content("Hello")
            print(f"Success! Response: {resp.text}")
            return # Stop if one works
        except Exception as e:
            print(f"FAILED: {e}")

if __name__ == "__main__":
    asyncio.run(test_gen())
