import { GoogleGenAI } from "@google/genai";
const apiKey = "AIzaSyBSgML0tQw3qcoz7hjSyuyDJ-iZuNI_GD8";

async function testLiveModel() {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey }); // Default (beta)
        console.log("Testing Live Model Connectivity...");
        const modelName = 'gemini-2.0-flash-exp'; // Let's test a known one first, then the specific one.

        // Live connect is complex in node, let's just try generateContent on it to see if it 404s
        const result = await ai.models.generateContent({
            model: 'models/gemini-2.0-flash-exp',
            contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
        });
        console.log("2.0-flash-exp Success:", result.text);

    } catch (e: any) {
        console.error("2.0-flash-exp Error:", e.message);
    }

    try {
        const ai = new GoogleGenAI({ apiKey: apiKey });
        console.log("Testing Specific Preview Model...");
        // trying the one from LiveMode.tsx
        const modelName = 'models/gemini-2.5-flash-native-audio-preview-12-2025';
        const result = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: 'Hello' }] }]
        });
        console.log("Preview Model Success:", result.text);
    } catch (e: any) {
        console.error("Preview Model Error:", e.message);
    }
}

testLiveModel();
