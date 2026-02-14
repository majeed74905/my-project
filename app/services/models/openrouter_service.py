from openai import OpenAI
from app.core.config import settings
from app.services.models.base_llm import BaseLLMService
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class OpenRouterService(BaseLLMService):
    """
    OpenRouter Service - ECO Mode Provider
    Replaces DeepSeek and Together AI for cost-effective, flexible AI responses
    OpenRouter provides access to multiple models through a single API
    """
    def __init__(self):
        if settings.OPENROUTER_API_KEY:
            self.client = OpenAI(
                api_key=settings.OPENROUTER_API_KEY,
                base_url="https://openrouter.ai/api/v1"
            )
            # Using Mixtral for ECO mode - efficient and cost-effective
            # OpenRouter format: provider/model-name
            self.model_name = "mistralai/mixtral-8x7b-instruct"
            
            # OpenRouter-specific headers for better tracking and attribution
            self.extra_headers = {
                "HTTP-Referer": "https://zara.ai",
                "X-Title": "ZARA AI"
            }
        else:
            self.client = None
            logger.warning("OPENROUTER_API_KEY not found. OpenRouter Service disabled.")

    def health_check(self) -> bool:
        return self.client is not None

    def generate(self, system_prompt: str, user_prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        if not self.client:
            raise ValueError("OpenRouter Service is not configured.")

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        if context and context.get("history"):
            # Insert history between system and user
            messages[1:1] = context["history"]

        try:
            response = self.client.chat.completions.create(
                model=self.model_name,
                messages=messages,
                temperature=0.6,
                max_tokens=512,
                top_p=0.7,
                extra_headers=self.extra_headers
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenRouter Generation Error: {e}")
            raise e
