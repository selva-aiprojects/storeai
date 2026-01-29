import google.generativeai as genai
import os
import asyncio

# -----------------------------
# CONFIG
# -----------------------------
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
MODEL_NAME = "gemini-1.5-flash"
EMBED_MODEL = "models/embedding-001"
MAX_RETRIES = 2
TIMEOUT_SECONDS = 25

genai.configure(api_key=GEMINI_API_KEY)


class LLMService:

    # -----------------------------
    # TEXT GENERATION
    # -----------------------------
    async def generate_response(self, prompt: str) -> str:
        if not prompt or len(prompt.strip()) == 0:
            return "[SYSTEM OVERLOAD]"

        # Basic length guard (demo safety)
        if len(prompt) > 20000:
            prompt = prompt[:20000]

        for attempt in range(MAX_RETRIES + 1):
            try:
                model = genai.GenerativeModel(MODEL_NAME)

                # Timeout wrapper
                response = await asyncio.wait_for(
                    asyncio.to_thread(model.generate_content, prompt),
                    timeout=TIMEOUT_SECONDS
                )

                if not response or not response.text:
                    return "[SYSTEM OVERLOAD]"

                return response.text.strip()

            except asyncio.TimeoutError:
                print("[LLM TIMEOUT] Retrying...")
            except Exception as e:
                print(f"[LLM ERROR] Attempt {attempt}: {e}")

        return "[SYSTEM OVERLOAD]"

    # -----------------------------
    # EMBEDDING GENERATION
    # -----------------------------
    async def get_embedding(self, text: str):
        if not text:
            return None

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
    # HEALTH CHECK (Optional)
    # -----------------------------
    async def ping(self) -> bool:
        try:
            test = await self.generate_response("Ping")
            return test != "[SYSTEM OVERLOAD]"
        except:
            return False


llm_service = LLMService()
