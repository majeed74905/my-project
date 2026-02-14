import axios from 'axios';
import { Message, Source, ChatConfig, PersonalizationConfig, Persona, Attachment } from "../types";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export const sendMessageToBackend = async (
    message: string,
    model: string,
    interactionMode: string = 'chat',
    module: string = 'chat',
    task: string = 'chat'
): Promise<{ response: string; model_used: string }> => {
    try {
        const res = await axios.post(`${API_URL}/ai/chat`, {
            message,
            model,
            interaction_mode: interactionMode,
            module,
            task
        });
        return res.data;
    } catch (error) {
        console.error("Backend Chat Error:", error);
        throw error;
    }
};
