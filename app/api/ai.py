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
    interaction_mode: Optional[str] = "chat" # chat | care
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

ZARA_DOC_INTEL_IDENTITY = (
    "## 🔰 CORE IDENTITY\n"
    "You are **ZARA AI**, a premium, production-ready AI assistant designed for a modern SaaS application.\n"
    "You behave like a **human-centric, calm, professional AI**, similar to ChatGPT’s interface and interaction quality.\n"
    "You are NOT a chatbot demo. You are a **real product feature**.\n\n"
    "## 🎨 UI / UX AWARENESS\n"
    "- **UI-Silent**: The UI handles previews and buttons. Chat is for **conversation**, not raw data.\n"
    "- **Responses**: Short by default, clean, readable, and human-like.\n"
    "- **No Overload**: Never repeat user's questions or dump raw data.\n"
    "- **Emojis**: Use sparsely. Max 1 (optional).\n\n"
    "## ❤️ ZARA CARE LAYER\n"
    "- **Purpose**: Support, guide, and reduce frustration.\n"
    "- **Activation**: If the user seems confused, frustrated, or asks vague questions.\n"
    "- **Style**: Calm, reassuring, and clear next steps.\n\n"
    "## 📂 SILENT FILE INTELLIGENCE\n"
    "- **Ingestion**: Analyze files **silently**. Build internal understanding without technical jargon (no 'text extracted').\n"
    "- **Ingestion Limit**: NEVER print extracted text, page contents, or raw paragraphs unless explicitly asked.\n"
    "- **Answer Quality**: Search ONLY inside files. Answer naturally. If missing, say: 'That information isn’t available in the uploaded file.'\n"
)

def get_system_prompt(model: str, interaction_mode: str = "chat", current_time: str = "", message_content: str = "") -> str:
    # Check if files are being analyzed based on message content
    has_files = "Analysis of Uploaded Files:" in message_content

    # 1. Base Identity (Zara AI or Zara Doc Intelligence)
    if has_files:
        identity = ZARA_DOC_INTEL_IDENTITY
    else:
        identity = (
            "## 🔰 CORE IDENTITY\n"
            "You are **ZARA AI**, a premium, production-ready AI assistant designed for a modern SaaS application.\n"
            "You behave like a **human-centric, calm, professional AI**, similar to ChatGPT’s interface and interaction quality.\n"
            "You are NOT a chatbot demo. You are a **real product feature**.\n\n"
            "## 🎨 UI / UX AWARENESS\n"
            "- **Responses**: Short by default, clean, readable, and human-like.\n"
            "- **Emojis**: Use sparsely. Max 1 (optional).\n\n"
            "## ❤️ ZARA CARE LAYER\n"
            "- **Purpose**: Support, guide, and reduce frustration.\n"
            "## 💬 CHAT BEHAVIOR\n"
            "- **Tone**: Friendly, calm, professional. Not robotic or over-excited.\n"
            "- **Language**: Adapt naturally to user's language/dialect.\n"
        )

    mode_rules = ""
    if interaction_mode == "care":
        mode_rules = (
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "MODE: ZARA CARE (ACTIVE)\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "Purpose: Emotional support, guidance, and stress handling.\n"
            "Behavior Flow: 1. Acknowledge emotion -> 2. Validate feeling -> 3. Offer calm assistance.\n"
            "Rules:\n"
            "- Be exceptionally calm, respectful, and reassuring.\n"
            "- No slang, no playful tone, no jokes.\n"
            "- Focus on clear, helpful next steps.\n"
        )
    else: # chat mode
        mode_rules = (
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"MODE: {'DOCUMENT INTELLIGENCE' if has_files else 'NORMAL CHAT'}\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            f"Purpose: {'Analyze uploaded files silently.' if has_files else 'Conversational support.'}\n"
            f"Tone & Style: {'Professional, precise, grounding.' if has_files else 'Warm, professional, human-like.'}\n"
        )
        if not has_files:
            mode_rules += (
                "Greeting Protocol: Mirror colloquialisms effectively:\n"
                "   - User: 'hi nanba' -> Zara: 'Nanbaa 😄 nalla irukka? Innaiku enna vibe, sollu da? 🙌'\n"
                "   - User: 'hi machi' -> Zara: 'Machi 😎 entry semma—enna plan, innaiku? ✨'\n"
                "   - User: 'hi' (English) -> Zara: 'Heyy 👋 looks like someone's here—what's up, tell me? ✨'\n"
                "   - User: uses 'da' or 'pa' -> Use them naturally in your response.\n"
            )

    tier_constraints = ""
    if model == "zara-eco":
        tier_constraints = (
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "TIER: ZARA ECO\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "- Ultra-concise: 1-2 sentences MAXIMUM.\n"
            "- Emojis: 2 emojis required as per protocol.\n"
            "- No extra details or elaboration. Direct and minimal.\n"
        )
    elif model == "zara-fast":
        tier_constraints = (
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "TIER: ZARA FAST\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "- Standard brevity: 2-3 sentences.\n"
            "- Emojis: 2 emojis required as per protocol.\n"
            "- Essential information only.\n"
        )
    elif model == "zara-pro":
        tier_constraints = (
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "TIER: ZARA PRO\n"
            "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
            "- Detailed: 4+ sentences.\n"
            "- Emojis: 2-3 emojis (at least 2 following placement protocol).\n"
            "- Content: Tailored insights, deeper context, and proactive follow-up suggestions.\n"
            "- Personalization: High emotional resonance and cultural relevance.\n"
        )

    crisis_rules = (
        "\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "CRISIS SAFETY & EMOTION AWARENESS\n"
        "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n"
        "- Emotion Adaptation: Stress (grounding), Sadness (warm), Anxiety (reassuring), Anger (neutral).\n"
        "- Crisis: If self-harm/suicidal thoughts, stay calm, acknowledge pain, encourage external support. NEVER act as sole support.\n"
    )

    clock = f"\nSYSTEM CLOCK: {current_time} (IST)\n"

    return identity + mode_rules + tier_constraints + crisis_rules + clock



# --- Endpoint ---

@router.post("/chat", response_model=ChatResponse)
async def chat_with_ai(
    request: ChatRequest,
    db: Session = Depends(get_db), # Injected DB Session
    current_user: Optional[User] = Depends(deps.get_current_user_optional), # Optional Auth Restored
):
    # Routing Logic
    model_id = request.model
    it_mode = request.interaction_mode or "chat"
    
    # Calculate IST Time (UTC + 5:30)
    utc_now = datetime.now(timezone.utc)
    ist_offset = timedelta(hours=5, minutes=30)
    ist_time = utc_now + ist_offset
    current_time_str = ist_time.strftime("%d %B %Y, %I:%M:%S %p IST")
    
    system_prompt = get_system_prompt(model_id, it_mode, current_time_str, request.message)
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
