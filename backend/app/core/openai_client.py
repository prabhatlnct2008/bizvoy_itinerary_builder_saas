"""
OpenAI Client Factory

Provides a unified interface for both standard OpenAI and Azure OpenAI.
Automatically switches based on USE_AZURE_OPENAI environment variable.
"""
import logging
from typing import Optional, List, Dict, Any
from openai import OpenAI, AzureOpenAI

from app.core.config import settings

logger = logging.getLogger(__name__)


class OpenAIClientFactory:
    """Factory for creating OpenAI clients with Azure support."""

    _chat_client: Optional[OpenAI | AzureOpenAI] = None
    _embed_client: Optional[OpenAI | AzureOpenAI] = None

    @classmethod
    def get_chat_client(cls) -> Optional[OpenAI | AzureOpenAI]:
        """
        Get OpenAI client for chat completions.
        Returns Azure client if USE_AZURE_OPENAI is True, otherwise standard OpenAI.
        """
        if cls._chat_client is not None:
            return cls._chat_client

        if settings.USE_AZURE_OPENAI:
            if not settings.AZURE_OPENAI_ENDPOINT or not settings.AZURE_OPENAI_API_KEY:
                logger.warning("Azure OpenAI endpoint or API key not configured")
                return None

            try:
                cls._chat_client = AzureOpenAI(
                    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                    api_key=settings.AZURE_OPENAI_API_KEY,
                    api_version=settings.AZURE_OPENAI_API_VERSION,
                )
                logger.info("Azure OpenAI chat client initialized")
                return cls._chat_client
            except Exception as e:
                logger.error(f"Failed to initialize Azure OpenAI chat client: {e}")
                return None
        else:
            if not settings.OPENAI_API_KEY:
                logger.warning("OpenAI API key not configured")
                return None

            try:
                cls._chat_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("Standard OpenAI chat client initialized")
                return cls._chat_client
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI chat client: {e}")
                return None

    @classmethod
    def get_embed_client(cls) -> Optional[OpenAI | AzureOpenAI]:
        """
        Get OpenAI client for embeddings.
        Returns Azure client if USE_AZURE_OPENAI is True, otherwise standard OpenAI.
        """
        if cls._embed_client is not None:
            return cls._embed_client

        if settings.USE_AZURE_OPENAI:
            if not settings.AZURE_OPENAI_ENDPOINT or not settings.AZURE_OPENAI_API_KEY:
                logger.warning("Azure OpenAI endpoint or API key not configured")
                return None

            try:
                cls._embed_client = AzureOpenAI(
                    azure_endpoint=settings.AZURE_OPENAI_ENDPOINT,
                    api_key=settings.AZURE_OPENAI_API_KEY,
                    api_version=settings.AZURE_OPENAI_API_VERSION,
                )
                logger.info("Azure OpenAI embed client initialized")
                return cls._embed_client
            except Exception as e:
                logger.error(f"Failed to initialize Azure OpenAI embed client: {e}")
                return None
        else:
            if not settings.OPENAI_API_KEY:
                logger.warning("OpenAI API key not configured")
                return None

            try:
                cls._embed_client = OpenAI(api_key=settings.OPENAI_API_KEY)
                logger.info("Standard OpenAI embed client initialized")
                return cls._embed_client
            except Exception as e:
                logger.error(f"Failed to initialize OpenAI embed client: {e}")
                return None

    @classmethod
    def get_chat_model(cls) -> str:
        """Get the appropriate chat model name."""
        if settings.USE_AZURE_OPENAI and settings.AZURE_OPENAI_CHAT_DEPLOYMENT:
            return settings.AZURE_OPENAI_CHAT_DEPLOYMENT
        return settings.CHAT_MODEL

    @classmethod
    def get_embedding_model(cls) -> str:
        """Get the appropriate embedding model name."""
        if settings.USE_AZURE_OPENAI and settings.AZURE_OPENAI_EMBED_DEPLOYMENT:
            return settings.AZURE_OPENAI_EMBED_DEPLOYMENT
        return settings.EMBEDDING_MODEL

    @classmethod
    def create_chat_completion(
        cls,
        messages: List[Dict[str, str]],
        temperature: float = 0.7,
        max_tokens: int = 1000,
        **kwargs
    ) -> Optional[Any]:
        """
        Create a chat completion using the appropriate client and model.

        Args:
            messages: List of message dicts with 'role' and 'content'
            temperature: Sampling temperature
            max_tokens: Maximum tokens in response
            **kwargs: Additional arguments passed to the API

        Returns:
            OpenAI ChatCompletion response or None on error
        """
        client = cls.get_chat_client()
        if not client:
            return None

        try:
            return client.chat.completions.create(
                model=cls.get_chat_model(),
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                **kwargs
            )
        except Exception as e:
            logger.error(f"Chat completion failed: {e}")
            return None

    @classmethod
    def create_embedding(cls, text: str) -> Optional[List[float]]:
        """
        Create an embedding for the given text.

        Args:
            text: Text to embed

        Returns:
            Embedding vector or None on error
        """
        client = cls.get_embed_client()
        if not client:
            return None

        try:
            response = client.embeddings.create(
                input=text,
                model=cls.get_embedding_model()
            )
            return response.data[0].embedding
        except Exception as e:
            logger.error(f"Embedding creation failed: {e}")
            return None

    @classmethod
    def reset_clients(cls):
        """Reset cached clients (useful for testing)."""
        cls._chat_client = None
        cls._embed_client = None


# Convenience functions
def get_openai_chat_client() -> Optional[OpenAI | AzureOpenAI]:
    """Get the OpenAI/Azure chat client."""
    return OpenAIClientFactory.get_chat_client()


def get_openai_embed_client() -> Optional[OpenAI | AzureOpenAI]:
    """Get the OpenAI/Azure embedding client."""
    return OpenAIClientFactory.get_embed_client()


def create_chat_completion(
    messages: List[Dict[str, str]],
    temperature: float = 0.7,
    max_tokens: int = 1000,
    **kwargs
) -> Optional[Any]:
    """Create a chat completion."""
    return OpenAIClientFactory.create_chat_completion(
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        **kwargs
    )


def create_embedding(text: str) -> Optional[List[float]]:
    """Create an embedding for text."""
    return OpenAIClientFactory.create_embedding(text)
