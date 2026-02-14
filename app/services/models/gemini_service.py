import google.generativeai as genai
from app.core.config import settings
from app.services.models.base_llm import BaseLLMService
from typing import Dict, Any, Optional
import time
import logging

logger = logging.getLogger(__name__)

class GeminiService(BaseLLMService):
    def __init__(self):
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            # Use 1.5-flash as it has the most generous free tier and highest stability
            self.model_name = "models/gemini-1.5-flash" 
            self.model = genai.GenerativeModel(
                model_name=self.model_name
            )
        else:
            self.model = None
            logger.warning("GEMINI_API_KEY not found. Gemini Service disabled.")

    def health_check(self) -> bool:
        return self.model is not None

    def generate(self, system_prompt: str, user_prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        if not self.model:
            raise ValueError("Gemini Service is not configured.")

        try:
            # Create a specific model instance with the system prompt for this request
            chat_model = genai.GenerativeModel(
                model_name=self.model_name,
                system_instruction=system_prompt
            )
            
            # Construct final prompt with history if available
            final_user_prompt = user_prompt
            if context and context.get("history"):
                history_text = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in context["history"]])
                final_user_prompt = f"Previous Conversation Context:\n{history_text}\n\nUser Question: {user_prompt}"

            response = chat_model.generate_content(final_user_prompt)
            
            if not response.text:
                raise ValueError("Gemini returned an empty response (possibly blocked or safety triggered)")
                
            return response.text
        except Exception as e:
            logger.error(f"Gemini Generation Error: {e}")
            # Fallback to a simpler prompt construction without system_instruction if it fails
            try:
                combined_prompt = f"{system_prompt}\n\nUSER: {user_prompt}"
                response = self.model.generate_content(combined_prompt)
                return response.text
            except Exception as e2:
                logger.error(f"Gemini Hard Failure: {e2}")
                raise e2
