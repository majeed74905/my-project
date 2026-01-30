import { Message, Role, Attachment, Source, ChatConfig, PersonalizationConfig, Persona } from "../types";
import { modelManager, AVAILABLE_MODELS } from "./modelManager";

export const sendMessageToGeminiStream = async (
    history: Message[],
    newMessage: string,
    attachments: Attachment[],
    config: ChatConfig,
    personalization: PersonalizationConfig,
    onUpdate: (text: string) => void,
    activePersona?: Persona,
    onIdentityAction?: (action: 'verify' | 'logout', data?: string) => Promise<string>
): Promise<{ text: string; sources: Source[]; interactions?: any }> => {
    // --- STRICT BACKEND ROUTING IMPLEMENTATION ---
    // The frontend must NOT call AI providers directly.
    // It must ONLY send { message, model } to /api/ai/chat.


    const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:8000/api/v1';

    // ANONYMOUS SESSION MANAGEMENT
    let sessionId = sessionStorage.getItem('zara_session_id');
    if (!sessionId) {
        sessionId = `anon_${crypto.randomUUID()}`;
        sessionStorage.setItem('zara_session_id', sessionId);
        console.log('[Zara AI] New Anonymous Session Created:', sessionId);
    }

    try {
        console.log(`[Zara AI Backend] Sending request to ${API_URL}/ai/chat with model: ${config.model}`);

        // Simulating "Thinking" state for better UX
        onUpdate("Thinking...");

        const response = await fetch(`${API_URL}/ai/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // Add Authorization if needed, assuming generic public or session based
                'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
            },
            body: JSON.stringify({
                message: newMessage,
                model: config.model, // zara-fast, zara-pro, or zara-eco
                session_id: sessionId // Essential for anonymous context
            })
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: response.statusText }));
            throw new Error(errorData.detail || `Backend Error: ${response.status}`);
        }

        const data = await response.json();
        const fullText = data.response;
        const modelUsed = data.model_used;

        // "Stream" the result artificially for UI consistency or just show it.
        // For Zara Fast, we want instant result.
        onUpdate(fullText);

        console.log(`[Zara AI Backend] Success. Model used: ${modelUsed}`);
        return { text: fullText, sources: [], interactions: data.interaction_modules };

    } catch (error: any) {
        console.error("Backend Chat Error:", error);
        throw error;
    }
};
