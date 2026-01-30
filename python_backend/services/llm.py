"""
LLM Service for StoreAI Intelligence Platform
Handles text generation (Groq) and embeddings (Google Gemini)
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
import google.generativeai as genai
from dotenv import load_dotenv


# Load environment variables
load_dotenv()


# ============================================================================
# CONFIGURATION & CONSTANTS
# ============================================================================

class ModelProvider(Enum):
    """LLM providers"""
    GROQ = "groq"
    GOOGLE = "google"


class TaskType(Enum):
    """Embedding task types"""
    RETRIEVAL_QUERY = "retrieval_query"
    RETRIEVAL_DOCUMENT = "retrieval_document"
    SEMANTIC_SIMILARITY = "semantic_similarity"
    CLASSIFICATION = "classification"


# API Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY")

# Model Configuration
DEFAULT_GROQ_MODEL = "llama-3.1-8b-instant"
DEFAULT_EMBED_MODEL = "models/embedding-001"

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
        
        Args:
            func: Async function to execute
            max_retries: Maximum number of retries
            base_delay: Base delay in seconds
            should_retry_fn: Optional function to determine if error is retryable
        
        Returns:
            Function result or raises exception
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
        """
        Validate and sanitize prompt
        
        Args:
            prompt: Input prompt
            max_length: Maximum allowed length
        
        Returns:
            Sanitized prompt
        
        Raises:
            InvalidInputError: If prompt is invalid
        """
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
        
        self.client = AsyncGroq(api_key=api_key, timeout=timeout)
        self.rate_limiter = rate_limiter
    
    async def generate(
        self, 
        prompt: str, 
        config: GenerationConfig
    ) -> LLMResponse:
        """
        Generate text completion
        
        Args:
            prompt: Input prompt
            config: Generation configuration
        
        Returns:
            LLMResponse with generated content
        
        Raises:
            ProviderError: If generation fails
        """
        # Rate limiting
        if self.rate_limiter:
            await self.rate_limiter.acquire()
        
        start_time = datetime.now()
        
        try:
            completion = await self.client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
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
# GOOGLE GEMINI CLIENT
# ============================================================================

class GeminiClient:
    """Handles Google Gemini API interactions (embeddings only)"""
    
    def __init__(self, api_key: str):
        if not api_key:
            raise ValueError("Google API key is required")
        
        genai.configure(api_key=api_key)
        self.configured = True
    
    async def generate_embedding(
        self,
        text: str,
        config: EmbeddingConfig
    ) -> Optional[List[float]]:
        """
        Generate embedding vector
        
        Args:
            text: Input text
            config: Embedding configuration
        
        Returns:
            Embedding vector or None if failed
        """
        try:
            # Run synchronous SDK in thread pool
            result = await asyncio.to_thread(
                genai.embed_content,
                model=config.model,
                content=text,
                task_type=config.task_type,
            )
            
            # Handle different SDK versions
            return self._extract_embedding(result)
            
        except Exception as e:
            logging.error(f"Gemini embedding failed: {e}")
            return None
    
    @staticmethod
    def _extract_embedding(result) -> Optional[List[float]]:
        """Extract embedding from various SDK response formats"""
        # Legacy SDK format
        if isinstance(result, dict) and "embedding" in result:
            return result["embedding"]
        
        # Object with embedding attribute
        if hasattr(result, "embedding"):
            embedding = result.embedding
            if isinstance(embedding, list):
                return embedding
            if hasattr(embedding, "values"):
                return embedding.values
        
        # New SDK format with embeddings list
        if hasattr(result, "embeddings") and result.embeddings:
            first_embedding = result.embeddings[0]
            if hasattr(first_embedding, "values"):
                return first_embedding.values
            if isinstance(first_embedding, list):
                return first_embedding
        
        logging.error(f"Unknown embedding format: {type(result)}")
        return None


# ============================================================================
# MAIN LLM SERVICE
# ============================================================================

class LLMService:
    """
    Unified LLM service for text generation and embeddings
    
    Features:
    - Groq for text generation
    - Google Gemini for embeddings
    - Retry logic with exponential backoff
    - Rate limiting
    - Input validation
    - Health checks
    - Comprehensive error handling
    """
    
    def __init__(
        self,
        groq_api_key: Optional[str] = None,
        google_api_key: Optional[str] = None,
        enable_rate_limiting: bool = True
    ):
        """
        Initialize LLM service
        
        Args:
            groq_api_key: Groq API key (defaults to env var)
            google_api_key: Google API key (defaults to env var)
            enable_rate_limiting: Whether to enable rate limiting
        """
        # Setup logging
        self._setup_logging()
        
        # API keys
        self.groq_api_key = groq_api_key or GROQ_API_KEY
        self.google_api_key = google_api_key or GOOGLE_API_KEY
        
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
        
        # Gemini client (optional, only for embeddings)
        self.gemini_client = None
        if self.google_api_key:
            try:
                self.gemini_client = GeminiClient(self.google_api_key)
                logging.info("Gemini client initialized for embeddings")
            except Exception as e:
                logging.warning(f"Gemini client initialization failed: {e}")
        else:
            logging.info("Google API key not provided. Embeddings will not be available.")
    
    # ========================================================================
    # PUBLIC API - TEXT GENERATION
    # ========================================================================
    
    async def generate_response(
        self,
        prompt: str,
        config: Optional[GenerationConfig] = None
    ) -> str:
        """
        Generate text response from prompt
        
        Args:
            prompt: Input prompt
            config: Optional generation configuration
        
        Returns:
            Generated text or OVERLOAD_SIGNAL on failure
        """
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
        """
        Generate text with full response metadata
        
        Args:
            prompt: Input prompt
            config: Optional generation configuration
        
        Returns:
            LLMResponse with metadata
        
        Raises:
            InvalidInputError: If input is invalid
            ProviderError: If generation fails
        """
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
        """
        Generate embedding vector for text
        
        Args:
            text: Input text
            config: Optional embedding configuration
        
        Returns:
            Embedding vector or None if failed/unavailable
        """
        if not self.gemini_client:
            logging.warning("Gemini client not available. Cannot generate embeddings.")
            return None
        
        config = config or EmbeddingConfig()
        
        try:
            # Validate input
            text = InputValidator.validate_text(text)
            
            # Generate embedding
            embedding = await self.gemini_client.generate_embedding(text, config)
            
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
        """
        Generate responses for multiple prompts concurrently
        
        Args:
            prompts: List of input prompts
            config: Optional generation configuration
            max_concurrent: Maximum concurrent requests
        
        Returns:
            List of generated responses (same order as prompts)
        """
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
        """
        Generate embeddings for multiple texts concurrently
        
        Args:
            texts: List of input texts
            config: Optional embedding configuration
            max_concurrent: Maximum concurrent requests
        
        Returns:
            List of embedding vectors (same order as texts)
        """
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
        """
        Check health of all providers
        
        Returns:
            Dict mapping provider name to health status
        """
        results = {}
        
        # Check Groq
        results["groq"] = await self._check_groq_health()
        
        # Check Gemini
        if self.gemini_client:
            results["gemini"] = await self._check_gemini_health()
        
        return results
    
    async def ping(self) -> bool:
        """
        Simple health check for backward compatibility
        
        Returns:
            True if service is healthy
        """
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
    
    async def _check_gemini_health(self) -> HealthStatus:
        """Check Gemini service health"""
        try:
            start_time = datetime.now()
            embedding = await self.gemini_client.generate_embedding(
                "Health check",
                EmbeddingConfig()
            )
            latency = (datetime.now() - start_time).total_seconds() * 1000
            
            return HealthStatus(
                is_healthy=embedding is not None,
                provider=ModelProvider.GOOGLE.value,
                latency_ms=latency if embedding else None,
                error=None if embedding else "No embedding returned"
            )
        except Exception as e:
            return HealthStatus(
                is_healthy=False,
                provider=ModelProvider.GOOGLE.value,
                error=str(e)
            )


# ============================================================================
# MODULE EXPORTS
# ============================================================================

# Singleton instance for backward compatibility
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