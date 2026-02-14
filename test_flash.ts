import { GoogleGenAI } from "@google/genai";
const apiKey = "AIzaSyBSgML0tQw3qcoz7hjSyuyDJ-iZuNI_GD8";

async function test() {
    try {
        const ai = new GoogleGenAI({
            apiKey: apiKey,
            apiVersion: 'v1'
        });
        console.log("Testing gemini-1.5-flash on v1...");
        const result = await ai.models.generateContent({
            model: 'models/gemini-1.5-flash',
            contents: [{ role: 'user', parts: [{ text: 'Hi' }] }]
        });
        console.log("Success:", result.text);
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

test();
