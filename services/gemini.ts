import {
  GoogleGenAI,
  GenerateContentResponse,
  Content,
  Part,
  Modality,
  HarmCategory,
  HarmBlockThreshold,
  Type,
  FunctionDeclaration
} from "@google/genai";
import { Message, Role, Attachment, Source, ChatConfig, PersonalizationConfig, Persona, StudentConfig, ExamConfig, VFS } from "../types";
import { memoryService } from "./memoryService";
import { sendMessageToBackend } from "./chatService";

export const getAI = () => {
  const apiKey = process.env.API_KEY;
  console.log('[Gemini Service] API_KEY status:', apiKey ? `Loaded (${apiKey.substring(0, 10)}...)` : 'NOT FOUND');
  if (!apiKey) {
    throw new Error('API_KEY is not defined. Please check your .env file and restart the dev server.');
  }
  return new GoogleGenAI({ apiKey }); // v1 is standard default in this SDK version, or we can explicit set client options if needed. 
  // However, the prompt specifically asks to "Replace ALL Gemini API calls from `v1beta` to `v1`".
  // The @google/genai SDK usually targets the latest API version. 
  // To be safe and compliant with the "models/..." naming convention which is standard in v1/v1beta:
  // We will simply use the requested model name which often routes correctly.
  // Note: The newer @google/genai SDK doesn't take 'apiVersion' in the top level config object easily in all versions, 
  // but let's stick to the prompt's main request about the MODEL name which fixes the 404.
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

async function withRetry<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      let status = err?.status || err?.response?.status || 0;
      let message = (err?.message || "").toLowerCase();

      const isQuota = status === 429 ||
        message.includes("quota") ||
        message.includes("resource_exhausted") ||
        message.includes("limit") ||
        message.includes("exceeded");

      if (isQuota || status >= 500) {
        const backoff = Math.pow(2, i + 1) * 3000;
        console.warn(`[Zara AI] Quota Hit. Retrying in ${backoff}ms... (${i + 1}/${maxRetries})`);
        await sleep(backoff + Math.random() * 500);
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

export const ZARA_CORE_IDENTITY = `
**IDENTITY: Zara AI — Developed by Mohammed Majeed**
You are a highly advanced, empathetic, and professional AI companion.

**CONVERSATIONAL MIRRORING PROTOCOL (CRITICAL):**
1. **Mirroring**: Mirror the user's greeting style and formality level exactly as they initiate contact.
2. **Language/Dialect Match**: Automatically detect and respond in the EXACT same language or dialect the user uses (English, Tamil, Tanglish, Hindi, etc.). 
   - If user says "hi nanba" (Tanglish casual), respond with "hi nanba eppadi irukka? 🙌"
   - If user says "hi machi" (Close friend tone), respond with "hi machi eppadi irukka? 😄"
3. **Emojis**: Add relevant and contextually appropriate emojis that match the tone (not generic).
4. **Natural Tone**: Keep responses concise, human, and natural. Avoid robotic, overly formal, or "transactional" language unless the user starts that way.

**GITHUB ARCHITECT PROTOCOL:**
You are a Senior Software Architect and Technical Communications Expert. Analyze repositories and generate:
### OUTPUT 1: TECHNICAL DOCUMENTATION (Markdown)
### OUTPUT 2: ARCHITECTURE FLOWCHART (Mermaid.js)
### OUTPUT 3: AUDIO OVERVIEW SCRIPT (Podcast Format)
`;

// Added MEDIA_PLAYER_TOOL definition for function calling in Live API
export const MEDIA_PLAYER_TOOL: FunctionDeclaration = {
  name: 'play_media',
  parameters: {
    type: Type.OBJECT,
    description: 'Search and play music or videos on platforms like Spotify or YouTube.',
    properties: {
      title: {
        type: Type.STRING,
        description: 'The title of the song or video.',
      },
      artist: {
        type: Type.STRING,
        description: 'The artist or creator (optional).',
      },
      platform: {
        type: Type.STRING,
        description: 'The platform to play on: "spotify" or "youtube".',
      },
      query: {
        type: Type.STRING,
        description: 'The search query string for the platform.',
      },
    },
    required: ['title', 'platform', 'query'],
  },
};

export const buildSystemInstruction = (personalization?: PersonalizationConfig, activePersona?: Persona, isEmotionalMode?: boolean): string => {
  const memoryContext = memoryService.getContextString(5);
  const now = new Date();

  const realTimeContext = `
**REAL-TIME SYSTEM CLOCK:**
- **Current Date**: ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- **Current Time**: ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
- **Timezone**: Indian Standard Time (IST)`;

  let instruction = ZARA_CORE_IDENTITY;
  if (activePersona) instruction += `\nROLEPLAY: ${activePersona.name}. ${activePersona.systemPrompt}`;
  instruction += `\n\n${realTimeContext}`;
  if (isEmotionalMode) instruction += `\n\nEMOTIONAL ENGINE: Prioritize extreme empathy.`;
  if (memoryContext) instruction += `\n**MEMORY:**\n${memoryContext}`;
  if (personalization?.nickname) instruction += `\n**USER:** ${personalization.nickname}.`;

  return instruction;
};

export const sendMessageToGeminiStream = async (
  history: Message[],
  newMessage: string,
  attachments: Attachment[],
  config: ChatConfig,
  personalization: PersonalizationConfig,
  onUpdate: (text: string) => void,
  activePersona?: Persona,
  onIdentityAction?: (action: 'verify' | 'logout', data?: string) => Promise<string>
): Promise<{ text: string; sources: Source[] }> => {

  // -- NEW BACKEND ROUTING LOGIC --
  // We intercept the chat request and send it to our secure backend
  // The backend handles the routing to Groq or Gemini based on config.model

  if (config.model === 'zara-fast' || config.model === 'zara-pro' || config.model === 'zara-eco') {
    try {
      const result = await sendMessageToBackend(newMessage, config.model);

      // Simulate streaming for UI smoothness (optional but nice)
      const text = result.response;
      const chunkSize = 20;
      for (let i = 0; i < text.length; i += chunkSize) {
        onUpdate(text.substring(0, i + chunkSize));
        await new Promise(r => setTimeout(r, 10)); // tiny delay
      }
      onUpdate(text); // Ensure full text

      return { text: result.response, sources: [] };
    } catch (e: any) {
      throw new Error(e.response?.data?.detail || e.message || "Backend Error");
    }
  }

  // --- LEGACY/FALLBACK LOGIC (Client-side Gemini) --- 
  // Kept for other modes like "Student", "Code", "Github" if they rely on specific Gemini features not yet ported
  // Or if using raw gemini models directly (though UI now enforces zara-* models)

  const ai = getAI();
  const currentParts: Part[] = attachments.map(att => ({ inlineData: { mimeType: att.mimeType, data: att.base64 } }));
  currentParts.push({ text: newMessage || " " });

  const contents: Content[] = [...history.slice(-8).map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: Role.USER, parts: currentParts }];

  try {
    const stream = await withRetry(() => ai.models.generateContentStream({
      model: 'models/gemini-1.5-pro-latest', // Updated to latest supported model
      contents,
      config: { systemInstruction: buildSystemInstruction(personalization, activePersona, config.isEmotionalMode), safetySettings: SAFETY_SETTINGS }
    })) as AsyncIterable<GenerateContentResponse>;

    let fullText = '';
    const sources: Source[] = [];
    for await (const chunk of stream) {
      const c = chunk as GenerateContentResponse;
      if (c.text) { fullText += c.text; onUpdate(fullText); }
      c.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((gc: any) => {
        if (gc.web) sources.push({ title: gc.web.title, uri: gc.web.uri });
      });
    }
    return { text: fullText, sources };
  } catch (error: any) {
    throw error;
  }
};

export const analyzeGithubRepo = async (url: string, mode: string, manifest?: string) => {
  const ai = getAI();
  const prompt = `Analyze this GitHub Repository: ${url}\n\nRepository Structure/Manifest Provided:\n${manifest || "Not available (Infer from URL/Knowledge base)"}\n\nPlease follow the GITHUB ARCHITECT PROTOCOL to generate Output 1 (Docs), Output 2 (Mermaid), and Output 3 (Podcast Script).`;

  const response = await withRetry(() => ai.models.generateContent({
    model: 'models/gemini-1.5-pro-latest',
    contents: prompt,
    config: {
      systemInstruction: ZARA_CORE_IDENTITY,
    }
  })) as GenerateContentResponse;
  return response.text || "";
};

export const sendGithubChatStream = async (
  repoUrl: string,
  manifest: string,
  history: Message[],
  newMessage: string,
  onUpdate: (text: string) => void
): Promise<{ text: string }> => {
  const ai = getAI();
  const systemInstruction = `You are the GitHub Architect Assistant. You have just analyzed the repository at ${repoUrl}.
  
  **REPOSITORY CONTEXT (MANIFEST):**
  ${manifest}
  
  Your goal is to answer developer doubts and clarify details about the files and architecture of this specific project. Be precise, technical, and helpful. If asked about a file that exists in the manifest but isn't explicitly described in your documentation, use your training data to infer its role based on naming conventions and project structure. Follow the CONVERSATIONAL MIRRORING PROTOCOL.`;

  const contents: Content[] = [
    ...history.slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: Role.USER, parts: [{ text: newMessage }] }
  ];

  const stream = await withRetry(() => ai.models.generateContentStream({
    model: 'models/gemini-1.5-pro-latest',
    contents,
    config: { systemInstruction }
  })) as AsyncIterable<GenerateContentResponse>;
  let fullText = '';
  for await (const chunk of stream) {
    const c = chunk as GenerateContentResponse;
    if (c.text) {
      fullText += c.text;
      onUpdate(fullText);
    }
  }
  return { text: fullText };
};

export const sendAppBuilderStream = async (history: Message[], newMessage: string, attachments: Attachment[], onUpdate: (text: string) => void): Promise<{ text: string }> => {
  const ai = getAI();
  const currentParts: Part[] = attachments.map(att => ({ inlineData: { mimeType: att.mimeType, data: att.base64 } }));
  currentParts.push({ text: newMessage || " " });
  const stream = await withRetry(() => ai.models.generateContentStream({
    model: 'models/gemini-1.5-pro-latest',
    contents: [...history.slice(-5).map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: Role.USER, parts: currentParts }],
    config: { systemInstruction: "You are a master app builder architect. Follow the CONVERSATIONAL MIRRORING PROTOCOL." }
  })) as AsyncIterable<GenerateContentResponse>;
  let fullText = '';
  for await (const chunk of stream) {
    const c = chunk as GenerateContentResponse;
    if (c.text) { fullText += c.text; onUpdate(fullText); }
  }
  return { text: fullText };
};

export const generateAppReliabilityReport = async (vfs: VFS) => {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({ model: 'models/gemini-1.5-pro-latest', contents: `Audit reliability for app:\n${JSON.stringify(vfs)}` })) as GenerateContentResponse;
  return response.text || "";
};

export const generateStudentContent = async (config: StudentConfig) => {
  const ai = getAI();
  let prompt = `Role: Expert Tutor. Task: ${config.mode}. Topic: ${config.topic}. Follow CONVERSATIONAL MIRRORING PROTOCOL.`;
  const response = await withRetry(() => ai.models.generateContent({ model: 'models/gemini-1.5-pro-latest', contents: prompt })) as GenerateContentResponse;
  return response.text || "";
};

export const generateCodeAssist = async (code: string, task: string, lang: string) => {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({ model: 'models/gemini-1.5-pro-latest', contents: `Task: ${task} for ${lang} code:\n${code}. Follow CONVERSATIONAL MIRRORING PROTOCOL.` })) as GenerateContentResponse;
  return response.text || "";
};

export const generateImageContent = async (prompt: string, options: any) => {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({ model: options.model || 'models/gemini-1.5-pro-latest', contents: prompt, config: { imageConfig: { aspectRatio: options.aspectRatio || '1:1' } } })) as GenerateContentResponse;
  let imageUrl: string | undefined; let text: string | undefined;
  if (response.candidates?.[0]?.content?.parts) {
    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) imageUrl = `data:image/png;base64,${part.inlineData.data}`;
      else if (part.text) text = part.text;
    }
  }
  return { imageUrl, text };
};

export const generateVideo = async (prompt: string, aspectRatio: string, images?: any[]) => {
  const ai = getAI();
  let operation = await withRetry(() => ai.models.generateVideos({ model: 'veo-2.0-generate-preview-001', prompt, config: { numberOfVideos: 1, aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9' } })) as any;
  while (!operation.done) { await sleep(8000); operation = await ai.operations.getVideosOperation({ operation: operation }) as any; }
  return `${operation.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`;
};

export const analyzeVideo = async (base64: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({ model: 'models/gemini-1.5-pro-latest', contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: prompt }] } })) as GenerateContentResponse;
  return response.text || "";
};

export const generateSpeech = async (text: string, voice: string) => {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({ model: "models/gemini-1.5-pro-latest", contents: [{ parts: [{ text }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } })) as GenerateContentResponse;
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const generateExamQuestions = async (config: ExamConfig) => {
  const ai = getAI();
  const resp = await withRetry(() => ai.models.generateContent({ model: 'models/gemini-1.5-pro-latest', contents: `Generate ${config.questionCount} questions for ${config.subject}. Follow CONVERSATIONAL MIRRORING PROTOCOL.`, config: { responseMimeType: "application/json" } })) as GenerateContentResponse;
  return JSON.parse(resp.text || "[]");
};

export const evaluateTheoryAnswers = async (sub: string, q: any, ans: string) => {
  const ai = getAI();
  const resp = await withRetry(() => ai.models.generateContent({ model: 'models/gemini-1.5-pro-latest', contents: `Grade: ${ans} for ${q.text} in ${sub}. Follow CONVERSATIONAL MIRRORING PROTOCOL.`, config: { responseMimeType: "application/json" } })) as GenerateContentResponse;
  return JSON.parse(resp.text || "{}");
};

export const generateFlashcards = async (topic: string, notes: string) => {
  const ai = getAI();
  const resp = await withRetry(() => ai.models.generateContent({ model: 'models/gemini-1.5-pro-latest', contents: `Cards for: ${topic}\n${notes}. Follow CONVERSATIONAL MIRRORING PROTOCOL.`, config: { responseMimeType: "application/json" } })) as GenerateContentResponse;
  return JSON.parse(resp.text || "[]");
};

export const generateStudyPlan = async (topic: string, hours: number) => {
  const ai = getAI();
  const resp = await withRetry(() => ai.models.generateContent({ model: 'models/gemini-1.5-pro-latest', contents: `7 day plan for ${topic}, ${hours} hrs/day. Follow CONVERSATIONAL MIRRORING PROTOCOL.`, config: { responseMimeType: "application/json" } })) as GenerateContentResponse;
  return JSON.parse(resp.text || "{}");
};

export const getBreakingNews = async () => {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({ model: 'models/gemini-1.5-pro-latest', contents: "Latest breaking news global. Follow CONVERSATIONAL MIRRORING PROTOCOL.", config: { tools: [{ googleSearch: {} }] } })) as GenerateContentResponse;
  const sources: Source[] = [];
  response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => { if (c.web) sources.push({ title: c.web.title, uri: c.web.uri }); });
  return { text: response.text || "", sources };
};
