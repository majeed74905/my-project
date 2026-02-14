from app.services.models.gemini_service import GeminiService
from app.services.models.openrouter_service import OpenRouterService
from app.services.models.groq_service import GroqService
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class LLMRouter:
    def __init__(self):
        self.gemini = GeminiService()
        self.openrouter = OpenRouterService()  # ECO mode - replaces DeepSeek & Together AI
        self.groq = GroqService()

    def route_request(self, module: str, task: str, prompt: str, system_prompt: str, context: Optional[Dict[str, Any]] = None) -> str:
        """
        Intelligent routing logic based on module and task type.
        
        ROUTING STRATEGY (UPDATED - GEMINI FIRST FOR ACADEMIC MODULES):
        1. Chat & File Analysis → Gemini (exclusive, no fallback)
        2. Tutor & Exam Prep → Gemini (primary) → Groq → OpenRouter (fallbacks)
        3. Code & Other modules → Groq → OpenRouter → Gemini (last resort)
        """
        logger.info(f"Routing request for Module: {module}, Task: {task}")
        
        # 1. Chat & File Analysis (Live Conversation) → Gemini (Primary) with Fallback
        if module == "chat" or module == "file_analyze":
            logger.info(f"Chat/File Analysis for {module} → PRIMARY: Gemini (strict if possible, fallback if limited)")
            try:
                # Try Gemini strictly first
                return self._call_service_strict(self.gemini, system_prompt, prompt, context)
            except Exception as e:
                logger.warning(f"Gemini failed for Chat. Falling back to chain: {e}")
                # Fallback to the standard chain (Groq -> OpenRouter -> Gemini)
                return self._call_service_with_chain(
                    primary=self.groq,
                    secondary=self.openrouter,
                    last_resort=self.gemini,
                    system_prompt=system_prompt,
                    prompt=prompt,
                    context=context
                )
        
        # 2. ACADEMIC & ARCHITECT MODULES (Tutor, Exam Prep, GitHub) → Gemini (PRIMARY)
        # Per user requirements: Gemini FIRST for academic and architect/teaching modules
        if module in ["tutor", "exam_prep", "github"]:
            logger.info(f"{module.upper()} → PRIMARY: Gemini, Fallback: Groq, Last Resort: OpenRouter")
            return self._call_service_with_chain(
                primary=self.gemini,
                secondary=self.groq,
                last_resort=self.openrouter,
                system_prompt=system_prompt,
                prompt=prompt,
                context=context
            )
        
        # 3. ALL OTHER MODULES (Code, etc.) → Groq → OpenRouter → Gemini (last resort)
        logger.info(f"{module.upper()} → Primary: Groq, Fallback: OpenRouter, Last Resort: Gemini")
        return self._call_service_with_chain(
            primary=self.groq,
            secondary=self.openrouter,
            last_resort=self.gemini,
            system_prompt=system_prompt,
            prompt=prompt,
            context=context
        )


    def _call_service_strict(self, service, system_prompt, prompt, context):
        """
        Call service with NO fallback (for Chat & File Analysis with Gemini).
        If Gemini fails, raise error - no fallback to other services.
        """
        try:
            if service.health_check():
                logger.info(f"Using {service.__class__.__name__} (strict mode - no fallback)")
                return service.generate(system_prompt, prompt, context)
            else:
                error_msg = f"{service.__class__.__name__} is not configured or unhealthy"
                logger.error(error_msg)
                raise ValueError(error_msg)
        except Exception as e:
            logger.error(f"{service.__class__.__name__} failed (strict mode): {e}")
            raise e  # No fallback - raise error
    
    def _call_service_with_chain(self, primary, secondary, last_resort, system_prompt, prompt, context):
        """
        Call service with fallback chain: Primary → Secondary → Last Resort.
        For all modules except Chat/File Analysis.
        
        Chain: Groq → OpenRouter → Gemini (last resort only)
        """
        # Try Primary (Groq)
        try:
            if primary.health_check():
                logger.info(f"Using PRIMARY: {primary.__class__.__name__}")
                return primary.generate(system_prompt, prompt, context)
            else:
                logger.warning(f"Primary {primary.__class__.__name__} unhealthy, trying secondary")
                raise ValueError("Primary service unhealthy")
        except Exception as e:
            logger.error(f"Primary {primary.__class__.__name__} failed: {e}")
            
            # Try Secondary (OpenRouter)
            try:
                if secondary.health_check():
                    logger.info(f"Using SECONDARY fallback: {secondary.__class__.__name__}")
                    return secondary.generate(system_prompt, prompt, context)
                else:
                    logger.warning(f"Secondary {secondary.__class__.__name__} unhealthy, trying last resort")
                    raise ValueError("Secondary service unhealthy")
            except Exception as e2:
                logger.error(f"Secondary {secondary.__class__.__name__} failed: {e2}")
                
                # Try Last Resort (Gemini) - ONLY if both Groq and OpenRouter fail
                try:
                    if last_resort.health_check():
                        logger.warning(f"⚠️ Using LAST RESORT: {last_resort.__class__.__name__} (both Groq and OpenRouter failed)")
                        return last_resort.generate(system_prompt, prompt, context)
                    else:
                        error_msg = "All services failed: Primary, Secondary, and Last Resort are unhealthy"
                        logger.error(error_msg)
                        raise ValueError(error_msg)
                except Exception as e3:
                    logger.error(f"Last resort {last_resort.__class__.__name__} also failed: {e3}")
                    raise Exception(f"All services failed. Primary: {e}, Secondary: {e2}, Last Resort: {e3}")

# specific instance
llm_router = LLMRouter()
