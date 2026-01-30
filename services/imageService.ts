import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export interface ImageGenerationRequest {
    prompt: string;
    style?: string;
    width?: number;
    height?: number;
}

export interface ImageGenerationResponse {
    image_url: string;
}

export const imageService = {
    generateImage: async (request: ImageGenerationRequest): Promise<ImageGenerationResponse> => {
        try {
            const response = await axios.post(`${API_URL}/image-generation/generate-image`, request);
            return response.data;
        } catch (error) {
            console.error("Image generation error:", error);
            throw error;
        }
    }
};
