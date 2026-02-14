import { GoogleGenAI } from "@google/genai";
const apiKey = "AIzaSyBSgML0tQw3qcoz7hjSyuyDJ-iZuNI_GD8";

async function listModels() {
    try {
        const ai = new GoogleGenAI({ apiKey: apiKey }); // Default (beta)
        console.log("Listing models (default)...");
        // @ts-ignore
        const response = await ai.models.list();
        // @ts-ignore
        console.log(JSON.stringify(response));
    } catch (e: any) {
        console.error("Error:", e.message);
    }
}

listModels();
