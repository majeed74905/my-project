import { GoogleGenAI } from "@google/genai";
const apiKey = "AIzaSyBSgML0tQw3qcoz7hjSyuyDJ-iZuNI_GD8";

async function test() {
    try {
        console.log("Testing Gemini API with v1 and gemini-1.5-pro...");
        const ai = new GoogleGenAI({
            apiKey: apiKey,
            // @ts-ignore
            apiVersion: 'v1'
        });

        const result = await ai.models.generateContent({
            model: 'models/gemini-1.5-pro',
            contents: [{ role: 'user', parts: [{ text: 'Hello, are you there?' }] }]
        });
        console.log("Success:", result.text);
    } catch (e: any) {
        console.error("Error status:", e.status);
        console.error("Error message:", e.message);
        if (e.response) {
            console.error("Response data:", e.response.data);
        }
    }
}

test();
