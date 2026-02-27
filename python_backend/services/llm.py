"""
LLM Service for StoreAI Intelligence Platform
Handles text generation (Groq) and embeddings (Local ONNX via ChromaDB)
with robust error handling, retry logic, and monitoring
"""

import os
import asyncio
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta
import logging

from groq import AsyncGroq
# Use ChromaDB's default embedding function (ONNX-based, local, free)
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from dotenv import load_dotenv


# Load environment variables
load_dotenv()


# ============================================================================
# CONFIGURATION & CONSTANTS
# ============================================================================

class ModelProvider(Enum):
    """LLM providers"""
    GROQ = "groq"
    LOCAL = "local"


class TaskType(Enum):
    """Embedding task types (Kept for compatibility, though not used by local model)"""
    RETRIEVAL_QUERY = "retrieval_query"
    RETRIEVAL_DOCUMENT = "retrieval_document"
    SEMANTIC_SIMILARITY = "semantic_similarity"
    CLASSIFICATION = "classification"


# API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Model Configuration
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"
DEFAULT_EMBED_MODEL = "all-MiniLM-L6-v2"  # Standard local model

# Generation Parameters
DEFAULT_MAX_TOKENS = 2048
DEFAULT_TEMPERATURE = 0.2
MAX_PROMPT_LENGTH = 20000

# Retry Configuration
MAX_RETRIES = 2
BASE_RETRY_DELAY = 2  # seconds
TIMEOUT_SECONDS = 25

# Rate Limiting
RATE_LIMIT_WINDOW = 60  # seconds
MAX_REQUESTS_PER_WINDOW = 50

# Error Messages
OVERLOAD_SIGNAL = "[SYSTEM OVERLOAD]"


# ============================================================================
# DATA CLASSES
# ============================================================================

@dataclass
class GenerationConfig:
    """Configuration for text generation"""
    model: str = DEFAULT_GROQ_MODEL
    max_tokens: int = DEFAULT_MAX_TOKENS
    temperature: float = DEFAULT_TEMPERATURE
    top_p: float = 1.0
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0
    adapter: Optional[str] = None


@dataclass
class EmbeddingConfig:
    """Configuration for embedding generation"""
    model: str = DEFAULT_EMBED_MODEL
    task_type: str = TaskType.RETRIEVAL_QUERY.value


@dataclass
class LLMResponse:
    """Structured response from LLM"""
    content: str
    model: str
    tokens_used: Optional[int] = None
    finish_reason: Optional[str] = None
    latency_ms: Optional[float] = None


@dataclass
class HealthStatus:
    """Health check result"""
    is_healthy: bool
    provider: str
    latency_ms: Optional[float] = None
    error: Optional[str] = None
    timestamp: datetime = None
    
    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


# ============================================================================
# EXCEPTIONS
# ============================================================================

class LLMServiceError(Exception):
    """Base exception for LLM service errors"""
    pass


class RateLimitError(LLMServiceError):
    """Rate limit exceeded"""
    pass


class InvalidInputError(LLMServiceError):
    """Invalid input provided"""
    pass


class ProviderError(LLMServiceError):
    """Error from LLM provider"""
    pass


# ============================================================================
# UTILITIES
# ============================================================================

class RetryStrategy:
    """Handles retry logic with exponential backoff"""
    
    @staticmethod
    async def execute_with_retry(
        func,
        max_retries: int = MAX_RETRIES,
        base_delay: float = BASE_RETRY_DELAY,
        should_retry_fn=None
    ):
        """
        Execute function with exponential backoff retry
        """
        last_error = None
        
        for attempt in range(max_retries + 1):
            try:
                return await func()
            except Exception as e:
                last_error = e
                
                # Check if we should retry
                if attempt >= max_retries:
                    break
                
                # Custom retry logic
                if should_retry_fn and not should_retry_fn(e):
                    raise
                
                # Default retry logic for rate limits and transient errors
                if not RetryStrategy._is_retryable(e):
                    raise
                
                # Calculate backoff delay
                delay = base_delay * (2 ** attempt)
                logging.warning(
                    f"Retry attempt {attempt + 1}/{max_retries} after {delay}s. Error: {e}"
                )
                await asyncio.sleep(delay)
        
        # All retries exhausted
        raise last_error
    
    @staticmethod
    def _is_retryable(error: Exception) -> bool:
        """Determine if error is retryable"""
        error_msg = str(error).lower()
        retryable_patterns = [
            "rate limit",
            "429",
            "temporarily_unavailable",
            "timeout",
            "connection",
            "503",
            "502",
            "504",
        ]
        return any(pattern in error_msg for pattern in retryable_patterns)


class RateLimiter:
    """Simple token bucket rate limiter"""
    
    def __init__(
        self, 
        max_requests: int = MAX_REQUESTS_PER_WINDOW,
        window_seconds: int = RATE_LIMIT_WINDOW
    ):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests = []
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        """Acquire permission to make request (blocks if rate limited)"""
        async with self._lock:
            now = datetime.now()
            
            # Remove old requests outside the window
            cutoff = now - timedelta(seconds=self.window_seconds)
            self.requests = [ts for ts in self.requests if ts > cutoff]
            
            # Check if we can proceed
            if len(self.requests) >= self.max_requests:
                # Calculate wait time
                oldest_request = min(self.requests)
                wait_until = oldest_request + timedelta(seconds=self.window_seconds)
                wait_seconds = (wait_until - now).total_seconds()
                
                if wait_seconds > 0:
                    logging.warning(f"Rate limit reached. Waiting {wait_seconds:.2f}s")
                    await asyncio.sleep(wait_seconds)
                    # Retry after waiting
                    return await self.acquire()
            
            # Record this request
            self.requests.append(now)


class InputValidator:
    """Validates and sanitizes inputs"""
    
    @staticmethod
    def validate_prompt(prompt: str, max_length: int = MAX_PROMPT_LENGTH) -> str:
        """Validate and sanitize prompt"""
        if not prompt:
            raise InvalidInputError("Prompt cannot be empty")
        
        prompt = prompt.strip()
        
        if len(prompt) == 0:
            raise InvalidInputError("Prompt cannot be blank")
        
        # Truncate if too long
        if len(prompt) > max_length:
            logging.warning(
                f"Prompt truncated from {len(prompt)} to {max_length} characters"
            )
            prompt = prompt[:max_length]
        
        return prompt
    
    @staticmethod
    def validate_text(text: str) -> str:
        """Validate text for embedding generation"""
        if not text or not text.strip():
            raise InvalidInputError("Text for embedding cannot be empty")
        return text.strip()


# ============================================================================
# GROQ CLIENT
# ============================================================================

class GroqClient:
    """Handles Groq API interactions"""
    
    def __init__(
        self,
        api_key: str,
        timeout: int = TIMEOUT_SECONDS,
        rate_limiter: Optional[RateLimiter] = None
    ):
        if not api_key:
            raise ValueError("Groq API key is required")
        
        import httpx
        self.client = AsyncGroq(
            api_key=api_key, 
            timeout=timeout,
            http_client=httpx.AsyncClient(
                base_url="https://api.groq.com/openai/v1",
                follow_redirects=True,
            )
        )
        self.rate_limiter = rate_limiter
    
    def _get_adapter_system_prompt(self, adapter: str) -> str:
        adapters = {
            "finance_qlora": "Active QLoRA Adapter: Enterprise Finance v4.\nSpecialization: ROI dynamics, liquidity, and P&L. INSTRUCTION: You MUST incorporate every telemetry data point into your analysis. High-level summaries must be grounded in the specific currency amounts and percentages provided.",
            "inventory_lora": "Active LoRA Adapter: Supply Chain & SKU Velocity v2.\nSpecialization: Demand forecasting and warehouse efficiency. INSTRUCTION: Direct citation of stock quantities and reorder points is MANDATORY. Do not generalize stock levels.",
            "market_qlora": "Active QLoRA Adapter: Macro Market Context v3.\nSpecialization: External macroeconomic impacts on retail operations.",
            "hr_lora": "Active LoRA Adapter: Talent Ops & Payroll v1.\nSpecialization: Workforce efficiency, HR compliance."
        }
        return adapters.get(adapter.lower(), "")

    async def generate(
        self, 
        prompt: str, 
        config: GenerationConfig
    ) -> LLMResponse:
        """Generate text completion"""
        if self.rate_limiter:
            await self.rate_limiter.acquire()
        
        start_time = datetime.now()
        
        messages = []
        if config.adapter:
            system_ctx = self._get_adapter_system_prompt(config.adapter)
            if system_ctx:
                messages.append({"role": "system", "content": system_ctx})
                logging.info(f"[LLM] Loaded Virtual Context Adapter: {config.adapter}")
        
        messages.append({"role": "user", "content": prompt})

        try:
            completion = await self.client.chat.completions.create(
                messages=messages,
                model=config.model,
                max_tokens=config.max_tokens,
                temperature=config.temperature,
                top_p=config.top_p,
                frequency_penalty=config.frequency_penalty,
                presence_penalty=config.presence_penalty,
            )
            
            # Validate response
            if not completion or not completion.choices:
                raise ProviderError("Empty response from Groq")
            
            choice = completion.choices[0]
            if not choice.message or not choice.message.content:
                raise ProviderError("No content in response")
            
            latency = (datetime.now() - start_time).total_seconds() * 1000
            
            return LLMResponse(
                content=choice.message.content.strip(),
                model=config.model,
                tokens_used=completion.usage.total_tokens if completion.usage else None,
                finish_reason=choice.finish_reason,
                latency_ms=latency
            )
            
        except Exception as e:
            if isinstance(e, ProviderError):
                raise
            raise ProviderError(f"Groq generation failed: {e}") from e


# ============================================================================
# LOCAL EMBEDDING CLIENT (REPLACEMENT FOR GEMINI)
# ============================================================================

class LocalEmbeddingClient:
    """Handles Local Embedding generation using ChromaDB's default function"""
    
    def __init__(self):
        self.embed_fn = None
        self.configured = False
        self._init_lock = asyncio.Lock()
    
    async def _lazy_init(self):
        """Initialize model only when needed"""
        if self.configured:
            return
            
        async with self._init_lock:
            if self.configured:
                return
            try:
                # Running this in a thread because it's CPU/IO heavy
                def setup():
                    # Default is all-MiniLM-L6-v2 (ONNX)
                    return DefaultEmbeddingFunction()
                
                self.embed_fn = await asyncio.to_thread(setup)
                self.configured = True
                logging.info("Local Embedding Model initialized lazily (all-MiniLM-L6-v2)")
            except Exception as e:
                logging.error(f"Failed to initialize local embedding model: {e}")
                self.configured = False
    
    async def generate_embedding(
        self,
        text: str,
        config: EmbeddingConfig
    ) -> Optional[List[float]]:
        """
        Generate embedding vector (Async wrapper)
        """
        try:
            # Ensure initialized
            await self._lazy_init()
            
            if not self.configured:
                return None

            # Run synchronous CPU-bound task in thread pool
            def get_emb():
                embeddings = self.embed_fn([text])
                return embeddings[0] if embeddings else None
                
            result = await asyncio.to_thread(get_emb)
            return result
        except Exception as e:
            logging.error(f"Embedding generation failed: {e}")
            return None


# ============================================================================
# MAIN LLM SERVICE
# ============================================================================

class LLMService:
    """
    Unified LLM service for text generation (Groq) and embeddings (Local)
    """
    
    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        google_api_key: Optional[str] = None, # Kept for signature compatibility but ignored
        enable_rate_limiting: bool = True
    ):
        """Initialize LLM service"""
        # Setup logging
        self._setup_logging()
        
        # API keys
        self.groq_api_key = groq_api_key or GROQ_API_KEY
        
        # Validate required keys
        if not self.groq_api_key:
            raise ValueError(
                "GROQ_API_KEY is required. Set it in environment or pass to constructor."
            )
        
        # Initialize components
        self.rate_limiter = RateLimiter() if enable_rate_limiting else None
        self.groq_client = GroqClient(
            self.groq_api_key,
            timeout=TIMEOUT_SECONDS,
            rate_limiter=self.rate_limiter
        )
        
        # Initialize Local Embedding Client (Lazy)
        self.embedding_client = LocalEmbeddingClient()
    
    # ========================================================================
    # PUBLIC API - TEXT GENERATION
    # ========================================================================
    
    async def generate_response(
        self,
        prompt: str,
        config: Optional[GenerationConfig] = None
    ) -> str:
        """Generate text response from prompt"""
        config = config or GenerationConfig()
        
        try:
            # Validate input
            try:
                prompt = InputValidator.validate_prompt(prompt)
            except InvalidInputError as e:
                logging.error(f"Invalid prompt: {e}")
                return OVERLOAD_SIGNAL
            
            # Generate with retry
            response = await RetryStrategy.execute_with_retry(
                lambda: self.groq_client.generate(prompt, config),
                max_retries=MAX_RETRIES
            )
            
            logging.info(
                f"Generated {response.tokens_used} tokens in {response.latency_ms:.0f}ms"
            )
            
            return response.content
            
        except Exception as e:
            logging.error(f"Generation failed: {e}")
            return OVERLOAD_SIGNAL
    
    async def generate_structured(
        self,
        prompt: str,
        config: Optional[GenerationConfig] = None
    ) -> LLMResponse:
        """Generate text with full response metadata"""
        config = config or GenerationConfig()
        
        # Validate input
        prompt = InputValidator.validate_prompt(prompt)
        
        # Generate with retry
        return await RetryStrategy.execute_with_retry(
            lambda: self.groq_client.generate(prompt, config),
            max_retries=MAX_RETRIES
        )
    
    # ========================================================================
    # PUBLIC API - EMBEDDINGS
    # ========================================================================
    
    async def get_embedding(
        self,
        text: str,
        config: Optional[EmbeddingConfig] = None
    ) -> Optional[List[float]]:
        """Generate embedding vector for text"""
        config = config or EmbeddingConfig()
        
        try:
            # Validate input
            text = InputValidator.validate_text(text)
            
            # Generate embedding
            embedding = await self.embedding_client.generate_embedding(text, config)
            
            if embedding:
                logging.info(f"Generated embedding with {len(embedding)} dimensions")
            
            return embedding
            
        except InvalidInputError as e:
            logging.error(f"Invalid text for embedding: {e}")
            return None
        except Exception as e:
            logging.error(f"Embedding generation failed: {e}")
            return None
    
    # ========================================================================
    # PUBLIC API - BATCH OPERATIONS
    # ========================================================================
    
    async def generate_batch(
        self,
        prompts: List[str],
        config: Optional[GenerationConfig] = None,
        max_concurrent: int = 5
    ) -> List[str]:
        """Generate responses for multiple prompts concurrently"""
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def generate_with_semaphore(prompt: str) -> str:
            async with semaphore:
                return await self.generate_response(prompt, config)
        
        tasks = [generate_with_semaphore(p) for p in prompts]
        return await asyncio.gather(*tasks)
    
    async def get_embeddings_batch(
        self,
        texts: List[str],
        config: Optional[EmbeddingConfig] = None,
        max_concurrent: int = 10
    ) -> List[Optional[List[float]]]:
        """Generate embeddings for multiple texts concurrently"""
        semaphore = asyncio.Semaphore(max_concurrent)
        
        async def embed_with_semaphore(text: str) -> Optional[List[float]]:
            async with semaphore:
                return await self.get_embedding(text, config)
        
        tasks = [embed_with_semaphore(t) for t in texts]
        return await asyncio.gather(*tasks)
    
    # ========================================================================
    # PUBLIC API - HEALTH & MONITORING
    # ========================================================================
    
    async def health_check(self) -> Dict[str, HealthStatus]:
        """Check health of all providers"""
        results = {}
        
        # Check Groq
        results["groq"] = await self._check_groq_health()
        
        # Check Local Embedding
        results["embedding"] = await self._check_embedding_health()
        
        return results
    
    async def ping(self) -> bool:
        """Simple health check"""
        try:
            response = await self.generate_response("Ping")
            return response != OVERLOAD_SIGNAL
        except Exception as e:
            logging.error(f"Ping failed: {e}")
            return False
    
    # ========================================================================
    # PRIVATE METHODS
    # ========================================================================
    
    def _setup_logging(self):
        """Configure logging"""
        logging.basicConfig(
            level=logging.INFO,
            format='[%(asctime)s] %(levelname)s [%(name)s] %(message)s',
            datefmt='%Y-%m-%d %H:%M:%S'
        )
    
    async def _check_groq_health(self) -> HealthStatus:
        """Check Groq service health"""
        try:
            start_time = datetime.now()
            response = await self.groq_client.generate(
                "Health check",
                GenerationConfig(max_tokens=10)
            )
            latency = (datetime.now() - start_time).total_seconds() * 1000
            
            return HealthStatus(
                is_healthy=True,
                provider=ModelProvider.GROQ.value,
                latency_ms=latency
            )
        except Exception as e:
            return HealthStatus(
                is_healthy=False,
                provider=ModelProvider.GROQ.value,
                error=str(e)
            )
    
    async def _check_embedding_health(self) -> HealthStatus:
        """Check local embedding health"""
        try:
            start_time = datetime.now()
            embedding = await self.get_embedding("Health check")
            latency = (datetime.now() - start_time).total_seconds() * 1000
            
            return HealthStatus(
                is_healthy=embedding is not None,
                provider=ModelProvider.LOCAL.value,
                latency_ms=latency if embedding else None,
                error=None if embedding else "No embedding returned"
            )
        except Exception as e:
            return HealthStatus(
                is_healthy=False,
                provider=ModelProvider.LOCAL.value,
                error=str(e)
            )


# ============================================================================
# MODULE EXPORTS
# ============================================================================

# Singleton instance
llm_service = LLMService()

__all__ = [
    'LLMService',
    'llm_service',
    'GenerationConfig',
    'EmbeddingConfig',
    'LLMResponse',
    'HealthStatus',
    'ModelProvider',
    'TaskType',
]