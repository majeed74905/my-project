import { GoogleGenAI } from "@google/genai";
const apiKey = "AIzaSyBSgML0tQw3qcoz7hjSyuyDJ-iZuNI_GD8";

async function test() {
    try {
        console.log("Testing Gemini API with v1...");
        const ai = new GoogleGenAI({
            apiKey: apiKey,
            // @ts-ignore
            apiVersion: 'v1'
        });
        const model = ai.models.get({ model: 'gemini-1.5-pro' });
        console.log("Model object created.");

        const result = await ai.models.generateContent({
            model: 'gemini-1.5-pro',
            contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
        });
        console.log("Success:", result.text);
    } catch (e) {
        console.error("Error:", e);
    }
}

test();
