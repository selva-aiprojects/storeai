import logging
import sys
from datetime import datetime
from pathlib import Path

# Ensure logs directory exists
log_dir = Path(__file__).parent.parent / 'logs'
log_dir.mkdir(exist_ok=True)

# Custom formatter with JSON-like structure
class StructuredFormatter(logging.Formatter):
    def format(self, record):
        log_data = {
            'timestamp': datetime.utcnow().isoformat(),
            'level': record.levelname,
            'logger': record.name,
            'message': record.getMessage(),
            'module': record.module,
            'function': record.funcName,
            'line': record.lineno,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_data['exception'] = self.formatException(record.exc_info)
        
        # Add extra fields if present
        if hasattr(record, 'user_id'):
            log_data['user_id'] = record.user_id
        if hasattr(record, 'tenant_id'):
            log_data['tenant_id'] = record.tenant_id
        
        return str(log_data)

# Configure root logger
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_dir / 'app.log'),
        logging.StreamHandler(sys.stdout)
    ]
)

# Get logger instance
logger = logging.getLogger('storeai_python')

# Add structured file handler
structured_handler = logging.FileHandler(log_dir / 'structured.log')
structured_handler.setFormatter(StructuredFormatter())
logger.addHandler(structured_handler)

# Helper functions
def log_error(error: Exception, context: dict = None):
    """Log an error with context"""
    extra = context or {}
    logger.error(f"Error: {str(error)}", exc_info=True, extra=extra)

def log_query(query_type: str, query: str, duration: float, error: Exception = None):
    """Log a database query"""
    if error:
        logger.error(
            f"Query failed: {query_type}",
            extra={'query': query[:200], 'duration': duration, 'error': str(error)}
        )
    else:
        logger.debug(
            f"Query executed: {query_type}",
            extra={'query': query[:200], 'duration': duration}
        )

def log_api_call(method: str, path: str, user_id: str = None, tenant_id: str = None):
    """Log an API call"""
    logger.info(
        f"API {method} {path}",
        extra={'user_id': user_id, 'tenant_id': tenant_id}
    )

__all__ = ['logger', 'log_error', 'log_query', 'log_api_call']
