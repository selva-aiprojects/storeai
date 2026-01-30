from groq import Groq
import google.generativeai as genai
import os
import asyncio
from dotenv import load_dotenv

load_dotenv()

# -----------------------------
# CONFIG
# -----------------------------
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY") # Keep for embeddings
MODEL_NAME = "llama-3.1-8b-instant"
EMBED_MODEL = "models/embedding-001"
MAX_RETRIES = 2
TIMEOUT_SECONDS = 25

# Initialize Groq
client = Groq(api_key=GROQ_API_KEY)

# Initialize Gemini (only for embeddings)
if GOOGLE_API_KEY:
    genai.configure(api_key=GOOGLE_API_KEY)


class LLMService:

    # -----------------------------
    # TEXT GENERATION (Now via Groq)
    # -----------------------------
    async def generate_response(self, prompt: str) -> str:
        if not prompt or len(prompt.strip()) == 0:
            return "[SYSTEM OVERLOAD]"

        if len(prompt) > 20000:
            prompt = prompt[:20000]

        for attempt in range(MAX_RETRIES + 1):
            try:
                # Use Groq for text generation
                completion = await asyncio.to_thread(
                    client.chat.completions.create,
                    messages=[
                        {
                            "role": "user",
                            "content": prompt,
                        }
                    ],
                    model=MODEL_NAME,
                    timeout=TIMEOUT_SECONDS
                )

                if not completion or not completion.choices[0].message.content:
                    return "[SYSTEM OVERLOAD]"

                return completion.choices[0].message.content.strip()

            except Exception as e:
                print(f"[LLM ERROR] Attempt {attempt}: {e}")
                if "rate_limit_exceeded" in str(e).lower() and attempt < MAX_RETRIES:
                    await asyncio.sleep(2) # Wait a bit on rate limit
                if attempt == MAX_RETRIES:
                    return "[SYSTEM OVERLOAD]"

        return "[SYSTEM OVERLOAD]"

    # -----------------------------
    # EMBEDDING GENERATION (Keep Google for now)
    # -----------------------------
    async def get_embedding(self, text: str):
        if not text:
            return None

        # Fallback to a zero vector if Google API fails or is missing
        try:
            result = await asyncio.to_thread(
                genai.embed_content,
                model=EMBED_MODEL,
                content=text,
                task_type="retrieval_query"
            )
            return result["embedding"]
        except Exception as e:
            print(f"[EMBED ERROR] {e}")
            return None

    # -----------------------------
    # HEALTH CHECK
    # -----------------------------
    async def ping(self) -> bool:
        try:
            test = await self.generate_response("Ping")
            return test != "[SYSTEM OVERLOAD]"
        except:
            return False


llm_service = LLMService()
