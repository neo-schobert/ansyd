"""
OpenRouter API Client

A clean, modular client for interacting with the OpenRouter API.
Handles authentication, request formatting, and error handling.

Main API:
    - query_model(prompt, system_prompt, model, params) -> str: Query an LLM model
    - list_available_models() -> List[str]: Get available models
"""

import os
import time
import requests
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class ModelConfig:
    """Configuration for an LLM model"""
    name: str
    max_tokens: int = 4000
    temperature: float = 0.1
    top_p: float = 0.9
    frequency_penalty: float = 0.0
    presence_penalty: float = 0.0


@dataclass
class APIResponse:
    """Response from OpenRouter API"""
    content: str
    model: str
    tokens_used: Optional[int] = None
    finish_reason: Optional[str] = None
    raw_response: Optional[Dict] = None


# ============================================================================
# Recommended Models for Security Analysis
# ============================================================================

RECOMMENDED_MODELS = {
    # High accuracy models (recommended for production)
    'claude-opus': 'anthropic/claude-3-opus',
    'claude-sonnet': 'anthropic/claude-3-sonnet',
    'claude-4-sonnet': 'anthropic/claude-sonnet-4-20250514',
    'gpt-4-turbo': 'openai/gpt-4-turbo',
    
    # Cost-effective models
    'claude-haiku': 'anthropic/claude-3-haiku',
    'gpt-3.5': 'openai/gpt-3.5-turbo',
    'gemini-pro': 'google/gemini-pro',
    
    # Specialized models
    'llama-3-70b': 'meta-llama/llama-3-70b-instruct',
    'wizardlm': 'microsoft/wizardlm-2-8x22b',
}


# ============================================================================
# OpenRouter API Client
# ============================================================================

class OpenRouterClient:
    """Client for interacting with OpenRouter API"""
    
    def __init__(self, api_key: str, default_model: str = 'anthropic/claude-3-sonnet'):
        """
        Initialize OpenRouter client.
        
        Args:
            api_key: OpenRouter API key
            default_model: Default model to use (can be overridden per request)
        """
        self.api_key = api_key
        self.default_model = default_model
        self.base_url = "https://openrouter.ai/api/v1/chat/completions"
        
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://github.com/security-analysis-toolkit",
            "X-Title": "Security Analysis Toolkit"
        }
        
        self.request_count = 0
        self.last_request_time = 0
    
    def _rate_limit(self, min_interval: float = 0.5):
        """Implement basic rate limiting"""
        current_time = time.time()
        time_since_last = current_time - self.last_request_time
        
        if time_since_last < min_interval:
            time.sleep(min_interval - time_since_last)
        
        self.last_request_time = time.time()
    
    def query_model(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        config: Optional[ModelConfig] = None
    ) -> APIResponse:
        """
        Query an LLM model via OpenRouter.
        
        Args:
            prompt: User prompt/question
            system_prompt: Optional system prompt to guide model behavior
            model: Model identifier (uses default if not specified)
            config: Optional ModelConfig for fine-tuning
            
        Returns:
            APIResponse object with model output
            
        Raises:
            Exception: If API call fails
        """
        self._rate_limit()
        
        # Use defaults if not provided
        model = model or self.default_model
        
        if config is None:
            config = ModelConfig(name=model)
        
        # Build messages
        messages = []
        if system_prompt:
            messages.append({
                "role": "system",
                "content": system_prompt
            })
        messages.append({
            "role": "user",
            "content": prompt
        })
        
        # Build request payload
        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": config.max_tokens,
            "temperature": config.temperature,
            "top_p": config.top_p,
            "frequency_penalty": config.frequency_penalty,
            "presence_penalty": config.presence_penalty
        }
        
        try:
            print("=== OpenRouter REQUEST ===")
            print("Model:", model)
            print("Max tokens:", payload["max_tokens"])
            print("Temperature:", payload["temperature"])
            print("Messages count:", len(messages))
            print("Prompt size (chars):", sum(len(m["content"]) for m in messages))
            print("==========================")

            response = requests.post(
                self.base_url,
                headers=self.headers,
                json=payload,
                timeout=120
            )
            response.raise_for_status()
            
            result = response.json()
            
            # Extract response data
            content = result['choices'][0]['message']['content']
            finish_reason = result['choices'][0].get('finish_reason')
            
            # Extract token usage if available
            tokens_used = None
            if 'usage' in result:
                tokens_used = result['usage'].get('total_tokens')
            
            self.request_count += 1
            
            return APIResponse(
                content=content,
                model=model,
                tokens_used=tokens_used,
                finish_reason=finish_reason,
                raw_response=result
            )
            
        except requests.exceptions.RequestException as e:
            status = getattr(response, "status_code", "N/A")
            body = getattr(response, "text", "N/A")

            print("=== OpenRouter ERROR ===")
            print("Status:", status)
            print("Body:", body)
            print("=======================")

            raise Exception(
            f"OpenRouter API request failed "
            f"(status={status}): {body}"
        )

    
    def query_with_retries(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        config: Optional[ModelConfig] = None,
        max_retries: int = 3
    ) -> APIResponse:
        """
        Query model with automatic retry on failure.
        
        Args:
            prompt: User prompt
            system_prompt: Optional system prompt
            model: Model identifier
            config: Optional ModelConfig
            max_retries: Maximum number of retry attempts
            
        Returns:
            APIResponse object
        """
        last_error = None
        
        for attempt in range(max_retries):
            try:
                return self.query_model(prompt, system_prompt, model, config)
            except Exception as e:
                last_error = e
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    print(f"Retry {attempt + 1}/{max_retries} after {wait_time}s...")
                    time.sleep(wait_time)
        
        raise Exception(f"Failed after {max_retries} attempts: {last_error}")


# ============================================================================
# Helper Functions
# ============================================================================

def get_recommended_model(purpose: str = 'production') -> str:
    """
    Get recommended model for a specific purpose.
    
    Args:
        purpose: One of 'production', 'development', 'cost-effective'
        
    Returns:
        Model identifier string
    """
    recommendations = {
        'production': RECOMMENDED_MODELS['claude-sonnet'],
        'development': RECOMMENDED_MODELS['claude-haiku'],
        'cost-effective': RECOMMENDED_MODELS['gpt-3.5'],
        'high-accuracy': RECOMMENDED_MODELS['claude-opus'],
    }
    
    return recommendations.get(purpose, RECOMMENDED_MODELS['claude-sonnet'])


def create_client(api_key: Optional[str] = None, model: Optional[str] = None) -> OpenRouterClient:
    """
    Create an OpenRouter client with sensible defaults.
    
    Args:
        api_key: API key (defaults to OPENROUTER_API_KEY env var)
        model: Model to use (defaults to Claude Sonnet)
        
    Returns:
        Configured OpenRouterClient
        
    Raises:
        ValueError: If no API key provided
    """
    api_key = api_key or os.getenv('OPENROUTER_API_KEY')
    
    if not api_key:
        raise ValueError(
            "No API key provided. Set OPENROUTER_API_KEY environment variable "
            "or pass api_key parameter"
        )
    
    model = model or get_recommended_model('production')
    
    return OpenRouterClient(api_key, model)


# ============================================================================
# CLI Entry Point (for testing)
# ============================================================================

def main():
    """Simple CLI for testing the client"""
    import argparse
    import sys
    
    parser = argparse.ArgumentParser(description='Test OpenRouter API client')
    parser.add_argument('prompt', help='Prompt to send to model')
    parser.add_argument('--model', help='Model to use', 
                       default='anthropic/claude-3-sonnet')
    parser.add_argument('--api-key', 
                       default=os.getenv('OPENROUTER_API_KEY'),
                       help='OpenRouter API key')
    
    args = parser.parse_args()
    
    if not args.api_key:
        print("Error: No API key provided", file=sys.stderr)
        sys.exit(1)
    
    try:
        client = OpenRouterClient(args.api_key, args.model)
        
        print(f"Querying {args.model}...")
        response = client.query_model(args.prompt)
        
        print(f"\nResponse ({response.tokens_used} tokens):")
        print("=" * 60)
        print(response.content)
        print("=" * 60)
        
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
