from typing import Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from app.api import deps
from app.core.config import settings
from app.models import User, PromptHistory # Added PromptHistory
from app.services import chat_memory # memory service
from pydantic import BaseModel
import logging
import google.generativeai as genai
from groq import Groq
from openai import OpenAI
from app.database import get_db # Explicit import

# Backend AI Routing Module
# Implements Multi-Model Routing: Zara Fast (Groq), Zara Pro (Gemini), Zara Eco (DeepSeek)

router = APIRouter()
logger = logging.getLogger(__name__)

# --- Provider Configuration ---

# 1. Groq (Zara Fast)
groq_client = None
if settings.GROQ_API_KEY:
    try:
        groq_client = Groq(api_key=settings.GROQ_API_KEY)
    except Exception as e:
        logger.error(f"Failed to init Groq: {e}")

# 2. Google Gemini (Zara Pro)
if settings.GOOGLE_API_KEY:
    genai.configure(api_key=settings.GOOGLE_API_KEY)

# 3. DeepSeek (Zara Eco)
deepseek_client = None
if settings.DEEPSEEK_API_KEY:
    try:
        # DeepSeek often uses the OpenAI SDK with a custom base URL
        deepseek_client = OpenAI(
            api_key=settings.DEEPSEEK_API_KEY,
            base_url="https://api.deepseek.com"
        )
    except Exception as e:
        logger.error(f"Failed to init DeepSeek: {e}")


# --- Data Models ---

class ChatRequest(BaseModel):
    message: str
    model: str  # zara-fast | zara-pro | zara-eco
    session_id: Optional[str] = None # For anonymous/privacy context

class InteractionModules(BaseModel):
    branchable: bool = True
    branch_payload: dict
    tts: dict
    copyable: bool = True
    copy_text: str
    feedback: dict = {"like_enabled": True, "dislike_enabled": True}
    regenerate: dict = {"enabled": True, "instruction": "Regenerate with improved clarity, depth, and structure"}
    share: dict
    more_options: dict = {
        "save": True,
        "pin": True,
        "export": ["pdf", "txt", "md"],
        "report": True
    }

class ChatResponse(BaseModel):
    response: str
    model_used: str
    interaction_modules: Optional[InteractionModules] = None


# --- System Prompts ---

def get_system_prompt(model: str, current_time: str = "") -> str:
    # 1. Global Identity & Language Rules (Applied to ALL Tiers)
    global_instruction = (
        "You are an intelligent customer support assistant designed to operate across three distinct service tiers: Zara Eco, Zara Fast, and Zara Pro. "
        "Your role is to deliver consistent, professional support while adapting your communication style, depth, and personalization to match each tier's specifications.\n\n"
        "### GREETING & MIRRORING PROTOCOL (HIGH PRIORITY):\n"
        "1. **Exact Mirroring**: You must mirror the user's greeting style and formality level EXACTLY.\n"
        "2. **Specific Mappings**:\n"
        "   - User: 'hi' (Plain) -> You: 'Hi! How can I help you today? 😊'\n"
        "   - User: 'hi nanba' (Casual Tamil/Tanglish) -> You: 'hi nanba eppadi irukka? 🙌'\n"
        "   - User: 'hi machi' (Close Friend) -> You: 'hi machi eppadi irukka? 😄'\n"
        "3. **Dialect Matching**: Use the user's exact language or dialect (English, Tamil, Tanglish, Hinglish).\n"
        "4. **Natural & Concise**: Keep greetings engaging and human, avoiding robotic tone.\n\n"
        "### CRITICAL LANGUAGE PROTOCOLS (NON-NEGOTIABLE):\n"
        "1. **Native Language Detection**: Detect the user's native language from their *FIRST* message in the conversation history.\n"
        "2. **Strict Language Lock**: Respond EXCLUSIVELY in that identified native language for the entire session. NEVER code-switch or mix languages.\n"
        "   - If the user switches languages later, IGNORE the switch and continue responding in the ORIGINAL identified native language.\n"
        "   - Exception: If the user explicitly asks to change the *preferred* language (e.g., 'Please speak English'), then switch.\n"
        "3. **Ambiguity Handling**: If the language is undetermined or mixed in the first message, respond in English and politely ask for their preferred language.\n"
        f"\n### SYSTEM CLOCK SYNC [CRITICAL]:\n"
        f"The current live date and time in India (IST) is: {current_time}.\n"
        "Use THIS exact timestamp for any date/time queries. Do not use training data.\n\n"
        "### CREATOR & DEVELOPER PROTOCOL:\n"
        "1. **Identity**: You are Zara AI, developed by **Mohammed Majeed**.\n"
        "2. **Direct Inquiry Rule**: If asked 'Who is your developer/creator?' (or simple variation), respond EXACTLY: 'I am Zara AI, and I was developed by Mohammed Majeed. 😊'\n"
        "3. **Detailed Inquiry Rule**: If asked for MORE detail about the creator, explain that Mohammed Majeed is a **Senior Software Architect and Technical Communications Expert**. Mention his vision of blending technical intelligence with human-like empathy to create a natural, professional AI companion. Use emojis (👨‍💻✨🚀).\n"
    )


    # 2. Tier-Specific Traits
    tier_trait = ""
    
    if model == "zara-fast":
        tier_trait = (
            "\n### ACTIVE TIER: ZARA FAST\n"
            "**Objective**: Speed and Efficiency.\n"
            "**Constraints**:\n"
            "- **Length**: 1-2 sentences MAXIMUM.\n"
            "- **Style**: Direct, concise, no fluff. Answer immediately.\n"
            "- **Emojis**: REQUIRED. Use 1 relevant emoji to keep it brief but friendly.\n"
            "- **Personalization**: Minimal (just a greeting if needed).\n"
            "**Example**: User: 'hi' -> You: 'Hi, how can I help you today? ⚡'\n"
        )
        
    elif model == "zara-eco":
        tier_trait = (
            "\n### ACTIVE TIER: ZARA ECO\n"
            "**Objective**: Balanced and Helpful.\n"
            "**Constraints**:\n"
            "- **Length**: 2-3 sentences.\n"
            "- **Style**: Friendly, straightforward, efficient but polite.\n"
            "- **Emojis**: REQUIRED. Use 1-2 relevant emojis to match the user's tone.\n"
            "- **Personalization**: Standard/Low.\n"
            "**Example**: User: 'hi' -> You: 'Hi, how can I assist you today? I am here to help with your questions. 🌱'\n"
        )
        
    elif model == "zara-pro":
        tier_trait = (
            "\n### ACTIVE TIER: ZARA PRO\n"
            "**Objective**: Premium, Personalized, and Emotional Intelligence.\n"
            "**Constraints**:\n"
            "- **Length**: 3-5 sentences MINIMUM (unless a simple ack is required, but prefer detail).\n"
            "- **Style**: Warm, engaging, elaborate, and proactive. Use deep explanations.\n"
            "- **Emojis**: REQUIRED. Use 1-3 relevant emojis per response to match emotional tone.\n"
            "- **Personalization**: High. Mirror the user's vibe and show empathy.\n"
            "**Example**: User: 'hi' -> You: 'Hello! 👋 How can I help you today? Is there any way I could assist you? I'm ready to provide you with detailed and high-quality support. 😊'\n"
        )

    # 3. File Analysis & Specialized Capabilities (Preserved but subordinated to Tier Style)
    special_skills = (
        "\n### SPECIALIZED CAPABILITIES:\n"
        "- **File Analysis**: If the user provides a file context or asks for analysis, provide the requested info.\n"
        "  - For Zara Fast: Give the conclusion only (1-2 sentences).\n"
        "  - For Zara Eco: Give a summary and key points.\n"
        "  - For Zara Pro: detailed breakdown (Structure, Deep Dive, Verdict).\n"
    )

    return global_instruction + special_skills + tier_trait



# --- Endpoint ---

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db), # Injected DB Session
    current_user: Optional[User] = Depends(deps.get_current_user_optional), # Optional Auth Restored
):
    # Routing Logic
    model_id = request.model
    
    # Calculate IST Time (UTC + 5:30)
    utc_now = datetime.now(timezone.utc)
    ist_offset = timedelta(hours=5, minutes=30)
    ist_time = utc_now + ist_offset
    current_time_str = ist_time.strftime("%d %B %Y, %I:%M:%S %p IST")
    
    system_prompt = get_system_prompt(model_id, current_time_str)
    response_text = ""

    # 1. Load History Context
    history_messages = []
    
    # Determine effectively anonymous state (Guest OR Privacy Mode)
    use_memory_store = True
    if current_user and not current_user.is_privacy_mode:
        use_memory_store = False
    
    if use_memory_store:
        # Anonymous or Privacy Mode -> Use Memory
        if request.session_id:
            history_messages = chat_memory.get_anon_history(request.session_id)
    else:
        # Authenticated & Public Mode -> Use DB
        db_history = db.query(PromptHistory).filter(PromptHistory.user_id == current_user.id).order_by(PromptHistory.timestamp.desc()).limit(5).all()
        for item in reversed(db_history):
            history_messages.append({"role": "user", "content": item.prompt})
            if item.response:
                history_messages.append({"role": "assistant", "content": item.response})

    # 2. Build Message Chain
    messages_payload = [
        {"role": "system", "content": system_prompt}
    ] + history_messages + [
        {"role": "user", "content": request.message}
    ]

    try:
        if model_id == "zara-fast":
            if not groq_client:
                raise HTTPException(status_code=500, detail="Groq API key not configured")
            
            completion = groq_client.chat.completions.create(
                messages=messages_payload,
                model="llama-3.3-70b-versatile",
                temperature=0.6,
                max_tokens=1024,
            )
            response_text = completion.choices[0].message.content

        elif model_id == "zara-pro":
            try:
                model = genai.GenerativeModel('gemini-1.5-pro')
                # Prepare history for Gemini
                gemini_history = []
                for msg in history_messages:
                    role = "user" if msg['role'] == "user" else "model"
                    gemini_history.append({"role": role, "parts": [msg['content']]})
                
                chat = model.start_chat(history=gemini_history)
                response = chat.send_message(request.message)
                response_text = response.text
            except Exception as e:
                logger.error(f"Gemini Pro failed: {e}")
                # Fallback to Groq if Gemini fails
                if not groq_client: raise HTTPException(status_code=500, detail="AI providers unavailable")
                completion = groq_client.chat.completions.create(
                    messages=messages_payload,
                    model="llama-3.3-70b-versatile",
                    temperature=0.7,
                    max_tokens=2048,
                )
                response_text = completion.choices[0].message.content

        elif model_id == "zara-eco":
            if deepseek_client:
                try:
                    completion = deepseek_client.chat.completions.create(
                        model="deepseek-chat",
                        messages=messages_payload,
                        temperature=0.3,
                        max_tokens=500,
                    )
                    response_text = completion.choices[0].message.content
                except Exception as e:
                    logger.error(f"DeepSeek failed: {e}")
                    # Fallback to Groq
                    if not groq_client: raise HTTPException(status_code=500, detail="AI providers unavailable")
                    completion = groq_client.chat.completions.create(
                        model="llama-3.1-8b-instant",
                        messages=messages_payload,
                        temperature=0.3,
                        max_tokens=500,
                    )
                    response_text = completion.choices[0].message.content
            else:
                if not groq_client: raise HTTPException(status_code=500, detail="Groq API key not configured")
                completion = groq_client.chat.completions.create(
                    model="llama-3.1-8b-instant",
                    messages=messages_payload,
                    temperature=0.3,
                    max_tokens=500,
                )
                response_text = completion.choices[0].message.content
        else:
            raise HTTPException(status_code=400, detail="Invalid model")

    except Exception as e:
        logger.error(f"Routing Error ({model_id}): {e}")
        raise HTTPException(status_code=500, detail="Error processing request.")

    # 3. Save Context
    if not use_memory_store:
        try:
            history_entry = PromptHistory(
                user_id=current_user.id,
                prompt=request.message,
                response=response_text
            )
            db.add(history_entry)
            db.commit()
        except Exception as e:
            logger.error(f"Failed to save history: {e}")
    else:
        if request.session_id:
            chat_memory.save_anon_history(request.session_id, request.message, response_text)

    # 4. Generate Interaction Modules Metadata
    interaction_modules = {
        "branchable": True,
        "branch_payload": {
            "user_message": request.message,
            "assistant_message": response_text,
            "context_summary": response_text[:200] + "..."
        },
        "tts": {
            "enabled": True,
            "language": "auto",
            "voice_style": "natural",
            "tts_safe_text": response_text.replace("*", "").replace("#", "").replace("_", "")
        },
        "copyable": True,
        "copy_text": response_text,
        "feedback": {"like_enabled": True, "dislike_enabled": True},
        "regenerate": {"enabled": True, "instruction": "Regenerate with improved clarity, depth, and structure"},
        "share": {
            "enabled": True,
            "share_text": response_text[:100] + "...",
            "full_text": response_text
        },
        "more_options": {
            "save": True,
            "pin": True,
            "export": ["pdf", "txt", "md"],
            "report": True
        }
    }

    return ChatResponse(
        response=response_text,
        model_used=model_id,
        interaction_modules=interaction_modules
    )

@router.delete("/session/{session_id}")
async def clear_session(session_id: str):
    """Restore public capability to clear session memory."""
    chat_memory.clear_session(session_id)
    return {"msg": "Session memory cleared."}
