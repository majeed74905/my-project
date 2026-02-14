from groq import Groq
from app.core.config import settings
from app.services.models.base_llm import BaseLLMService
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class GroqService(BaseLLMService):
    def __init__(self):
        if settings.GROQ_API_KEY:
            self.client = Groq(api_key=settings.GROQ_API_KEY)
            self.model_name = "llama-3.3-70b-versatile" # Fast code generation
        else:
            self.client = None
            logger.warning("GROQ_API_KEY not found. Groq Service disabled.")

    def health_check(self) -> bool:
        return self.client is not None

    def generate(self, system_prompt: str, user_prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        if not self.client:
            raise ValueError("Groq Service is not configured.")

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
                temperature=0.2, # Lower temperature for code stability
                max_tokens=2048,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Groq Generation Error: {e}")
            raise e
