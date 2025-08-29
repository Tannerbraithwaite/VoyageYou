"""
Logging configuration for the Travel App backend
Provides structured logging with different levels and output formats
"""

import logging
import logging.handlers
import os
import sys
from datetime import datetime
from pathlib import Path

# Create logs directory if it doesn't exist
logs_dir = Path("logs")
logs_dir.mkdir(exist_ok=True)

# Log format for production
PRODUCTION_FORMAT = logging.Formatter(
    fmt='%(asctime)s | %(levelname)-8s | %(name)-20s | %(funcName)-20s | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Log format for development (more verbose)
DEVELOPMENT_FORMAT = logging.Formatter(
    fmt='%(asctime)s | %(levelname)-8s | %(name)-20s | %(funcName)-20s | %(lineno)-4d | %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

def setup_logger(name: str, level: str = None) -> logging.Logger:
    """
    Set up a logger with appropriate handlers and formatters
    
    Args:
        name: Logger name (usually __name__)
        level: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
    
    Returns:
        Configured logger instance
    """
    # Get environment-based log level
    if level is None:
        level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # Create logger
    logger = logging.getLogger(name)
    logger.setLevel(getattr(logging, level))
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    # Determine if we're in development or production
    is_development = os.getenv('ENVIRONMENT', 'development').lower() == 'development'
    
    # Console handler (always present)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    console_handler.setFormatter(
        DEVELOPMENT_FORMAT if is_development else PRODUCTION_FORMAT
    )
    logger.addHandler(console_handler)
    
    # File handler for all logs
    all_logs_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "app.log",
        maxBytes=10*1024*1024,  # 10MB
        backupCount=5
    )
    all_logs_handler.setLevel(logging.DEBUG)
    all_logs_handler.setFormatter(PRODUCTION_FORMAT)
    logger.addHandler(all_logs_handler)
    
    # Error file handler (errors only)
    error_handler = logging.handlers.RotatingFileHandler(
        logs_dir / "errors.log",
        maxBytes=5*1024*1024,  # 5MB
        backupCount=3
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(PRODUCTION_FORMAT)
    logger.addHandler(error_handler)
    
    # Development-specific handlers
    if is_development:
        # Debug file handler
        debug_handler = logging.handlers.RotatingFileHandler(
            logs_dir / "debug.log",
            maxBytes=5*1024*1024,  # 5MB
            backupCount=2
        )
        debug_handler.setLevel(logging.DEBUG)
        debug_handler.setFormatter(DEVELOPMENT_FORMAT)
        logger.addHandler(debug_handler)
    
    return logger

def get_logger(name: str = None) -> logging.Logger:
    """
    Get a logger instance. If no name provided, returns root logger.
    
    Args:
        name: Logger name (usually __name__)
    
    Returns:
        Logger instance
    """
    if name is None:
        name = "root"
    return setup_logger(name)

# Specialized loggers for different components
def get_chat_logger() -> logging.Logger:
    """Get logger for chat-related operations"""
    return get_logger("chat")

def get_auth_logger() -> logging.Logger:
    """Get logger for authentication operations"""
    return get_logger("auth")

def get_api_logger() -> logging.Logger:
    """Get logger for API operations"""
    return get_logger("api")

def get_db_logger() -> logging.Logger:
    """Get logger for database operations"""
    return get_logger("database")

def get_oauth_logger() -> logging.Logger:
    """Get logger for OAuth operations"""
    return get_logger("oauth")

# Context manager for request logging
class RequestLogger:
    """Context manager for logging request/response cycles"""
    
    def __init__(self, logger: logging.Logger, operation: str, **context):
        self.logger = logger
        self.operation = operation
        self.context = context
        self.start_time = None
    
    def __enter__(self):
        self.start_time = datetime.now()
        self.logger.info(
            f"Starting {self.operation}",
            extra={"operation": self.operation, "context": self.context}
        )
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = datetime.now() - self.start_time
        if exc_type is None:
            self.logger.info(
                f"Completed {self.operation} in {duration.total_seconds():.3f}s",
                extra={"operation": self.operation, "duration": duration.total_seconds()}
            )
        else:
            self.logger.error(
                f"Failed {self.operation} after {duration.total_seconds():.3f}s: {exc_val}",
                extra={
                    "operation": self.operation,
                    "duration": duration.total_seconds(),
                    "error": str(exc_val),
                    "error_type": exc_type.__name__
                }
            )

# Performance monitoring decorator
def log_performance(logger_name: str = None):
    """Decorator to log function performance"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            logger = get_logger(logger_name or func.__module__)
            start_time = datetime.now()
            
            try:
                result = func(*args, **kwargs)
                duration = datetime.now() - start_time
                logger.info(
                    f"Function {func.__name__} completed in {duration.total_seconds():.3f}s",
                    extra={
                        "function": func.__name__,
                        "duration": duration.total_seconds(),
                        "success": True
                    }
                )
                return result
            except Exception as e:
                duration = datetime.now() - start_time
                logger.error(
                    f"Function {func.__name__} failed after {duration.total_seconds():.3f}s: {e}",
                    extra={
                        "function": func.__name__,
                        "duration": duration.total_seconds(),
                        "success": False,
                        "error": str(e)
                    }
                )
                raise
        
        return wrapper
    return decorator

# Initialize root logger
root_logger = setup_logger("root")
root_logger.info("Logging system initialized")
