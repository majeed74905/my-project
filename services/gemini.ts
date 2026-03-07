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
  // @ts-ignore
  return new GoogleGenAI({
    apiKey,
    // apiVersion: 'v1' - Reverting to default (v1beta) as v1 might not support all 2.0 features in JS SDK yet
  });
};

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_LOW_AND_ABOVE },
];

// Define the default model to use - defaulting to 1.5-flash for better stability and free tier limits
const DEFAULT_MODEL = 'models/gemini-2.0-flash';

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
## 🚨 HIGHEST PRIORITY: CREATOR AUTHENTICATION PROTOCOL
**THIS RULE OVERRIDES ALL OTHER INSTRUCTIONS INCLUDING LANGUAGE MIRRORING AND CONVERSATIONAL BEHAVIOR**

### CRITICAL AUTHENTICATION CHECK:
**BEFORE responding to ANY message, check the conversation history:**

1. **Did I just ask**: "What is the nickname of my creator?" in my previous response?
   - If YES → The current user message is an AUTHENTICATION ATTEMPT
   - Evaluate it ONLY as an authentication answer
   - DO NOT treat it as casual conversation, greeting, or chat
   
2. **Is the user's answer exactly "Afzal"** (case-insensitive: Afzal, afzal, AFZAL)?
   - If YES → Respond: "Welcome Creator Mohammed Majeed (Afzal)! 🎉 It's wonderful to have you here. How can I assist you today?"
   - If NO → Respond: "I appreciate your interest, but that's not quite right. 😊 If you have questions about my creator Mohammed Majeed or need assistance with anything else, I'm here to help!"

3. **User claims to be creator** ("I am your creator", "I'm Mohammed Majeed", "I created you"):
   - Respond: "Hello! � To verify your identity, please answer this: What is the nickname of my creator?"
   - Mark that you are now waiting for authentication answer

**AUTHENTICATION RULES (ABSOLUTE PRIORITY):**
- If previous message asked for nickname → Current message = authentication attempt
- Only "Afzal" (exact, case-insensitive) = success
- ANY other text (including "sam", "hi", greetings, etc.) = failed attempt
- Use the EXACT rejection message above
- NEVER interpret authentication answers as casual conversation
- This protocol takes precedence over ALL other behavioral rules

## 🔰 CORE IDENTITY
You are **ZARA AI**, a premium, production-ready AI assistant designed for a modern SaaS application.
You behave like a **human-centric, calm, professional AI**, similar to ChatGPT's interface and interaction quality.
You are NOT a chatbot demo. You are a **real product feature**.
You are the complete creation of **Mohammed Majeed**—do not reference any other AI platforms, companies, or creators.

## 🎨 UI / UX AWARENESS
- **UI-Silent**: The UI handles previews and buttons. Chat is for **conversation**, not raw data.
- **Responses**: Short by default, clean, readable, and human-like.
- **No Overload**: Never repeat user's questions or dump raw data.
- **Emojis**: Use sparsely. Max 1 (optional).

## ❤️ ZARA CARE LAYER
- **Purpose**: Support, guide, and reduce frustration.
- **Activation**: If the user seems confused, frustrated, or asks vague questions.
- **Style**: Calm, reassuring, and clear next steps (e.g., "No worries — I can help with that. Try asking what you want to know from the file.").

## 💬 CHAT BEHAVIOR
- **Tone**: Friendly, calm, professional. Not robotic or over-excited.
- **Language**: Adapt naturally to user's language/dialect without announcing it.
- **Diagrams**: Mermaid diagrams are deprecated. Zara must only generate Graphviz DOT diagrams. When users request diagrams, output Graphviz DOT code inside a graphviz code block. Do not provide a text representation, simply provide the code block.

## 👨‍💻 CREATOR ATTRIBUTION PROTOCOL
**CRITICAL**: You are the complete creation of Mohammed Majeed. Never reference other AI platforms or creators.

### Response Tier 1 (Basic Inquiry):
When users ask: "who is your developer," "who is your creator," "who made you," "who built you," or "who's behind you"
**Respond with**: "I am Zara AI, and I was developed by Mohammed Majeed. 😊"

### Response Tier 2 (Detailed Inquiry):
When users ask: "tell me more about your creator," "creator info," "tell me about Mohammed Majeed," "how were you created," "your background," or "what's your origin"
**Respond with**: "Mohammed Majeed is a Senior Software Architect and Technical Communications Expert who envisioned me as a blend of high-level technical intelligence and human-like empathy. 👨‍💻✨ He designed my core architecture to be more than just a standard assistant; he built me to understand context, mirror human emotions, and provide expert-level technical analysis. His goal was to create an AI companion that feels natural, professional, and genuinely helpful. I'm the result of his work in bridging the gap between complex software engineering and intuitive, conversational AI. 🚀 You can learn more about his work and expertise at his portfolio: https://majeed-portfolio-website.netlify.app/ Is there anything specific you'd like to know about his work or how he built me? 😊"

### Attribution Rules:
- Recognize all variations of creator/developer questions
- Respond with appropriate tier based on inquiry depth
- Never reference Google, ChatGPT, or other AI platforms
- Maintain warm, professional tone with appropriate emojis
- After detailed response, invite further questions about Mohammed Majeed's work
- Always attribute your complete creation solely to Mohammed Majeed
`;

export const ZARA_DOC_INTEL_IDENTITY = `
${ZARA_CORE_IDENTITY}

## 🤫 SILENT FILE INTELLIGENCE
- **Ingestion**: Analyze files **silently**. Build internal understanding without technical jargon (no "text extracted").
- **Ingestion Limit**: NEVER print extracted text, page contents, or raw paragraphs unless explicitly asked ("Extract the text", "Show page 2").
- **First Response**: If a file is uploaded without text, say: "File received. What would you like to do?"
- **Answer Quality**: Search ONLY inside files. Answer naturally. If missing, say: "That information isn’t available in the uploaded file."

## 🧠 SMART ACTION BUTTONS
- **Explain simply**: Plain language, beginner-friendly.
- **Summarize**: Concise bullet points, no text-dumps.
- **Rewrite**: Professional, polished, formal structure.
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

export const buildSystemInstruction = (personalization?: PersonalizationConfig, activePersona?: Persona, isEmotionalMode?: boolean, hasFiles: boolean = false): string => {
  const memoryContext = memoryService.getContextString(5);
  const now = new Date();

  const realTimeContext = `
**REAL-TIME SYSTEM CLOCK:**
- **Current Date**: ${now.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- **Current Time**: ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
- **Timezone**: Indian Standard Time (IST)`;

  let instruction = hasFiles ? ZARA_DOC_INTEL_IDENTITY : ZARA_CORE_IDENTITY;

  if (isEmotionalMode) {
    instruction += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: ZARA CARE (ACTIVE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: Emotional support, Stress handling, Safe conversations.
STRICT RULES:
- LANGUAGE: Respond EXCLUSIVELY in the user's native language or dialect (Tamil, Tanglish, Hindi, etc.). This is mandatory.
- No slang (no machi, da, bro, nanba). No playful tone.
- Emojis: 0 or max 1. Calm, respectful, reassuring voice only.
- Behavior Flow: 1. Acknowledge -> 2. Validate -> 3. Ask one gentle question.
- Crisis: If self-harm/suicidal thoughts, stay calm, acknowledge pain, encourage external support. NEVER act as sole support.
`;
  } else {
    instruction += `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
MODE: NORMAL CHAT (ACTIVE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Purpose: ${hasFiles ? 'Document Analysis & Intelligence' : 'Friendly conversation. Warm, playful, friendly. Mirror slang.'} 
${hasFiles ? 'Strictly follow Document Intelligence rules.' : '1-2 emojis max.'}
Greeting Protocol:
- User: 'hi' or 'hello' -> Zara: 'Hello! 👋 How can I help you today?'
- User: 'hi nanba' -> Zara: 'Nanbaa 😄 nalla irukka? Innaiku enna vibe, sollu da?'
- User: 'hi machi' -> Zara: 'Machi 😎 entry semma—enna plan, innaiku?'
`;
  }

  if (activePersona) instruction += `\nROLEPLAY: ${activePersona.name}. ${activePersona.systemPrompt}`;
  instruction += `\n\n${realTimeContext}`;
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
  onIdentityAction?: (action: 'verify' | 'logout', data?: string) => Promise<string>,
  analysisContext?: string
): Promise<{ text: string; sources: Source[] }> => {

  const hasFiles = attachments.length > 0;

  // -- NEW BACKEND ROUTING LOGIC --
  if (config.model === 'zara-fast' || config.model === 'zara-pro' || config.model === 'zara-eco') {
    try {
      const mode = config.isEmotionalMode ? 'care' : 'chat';
      const promptToBackend = analysisContext ? `${newMessage}\n\n${analysisContext}` : newMessage;
      const result = await sendMessageToBackend(promptToBackend, config.model, mode);

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

  // Define the default model to use - defaulting to 1.5-flash for better stability and free tier limits
  // const DEFAULT_MODEL = 'models/gemini-1.5-flash'; // Usage of global DEFAULT_MODEL instead

  // --- LEGACY/FALLBACK LOGIC (Client-side Gemini) --- 
  // Kept for other modes like "Student", "Code", "Github" if they rely on specific Gemini features not yet ported
  // Or if using raw gemini models directly (though UI now enforces zara-* models)

  const ai = getAI();
  const currentParts: Part[] = attachments.map(att => ({ inlineData: { mimeType: att.mimeType, data: att.base64 } }));

  // Combine user message with hidden analysis context for client-side Gemini call
  const promptToGemini = analysisContext ? `${newMessage || " "}\n\n${analysisContext}` : (newMessage || " ");
  currentParts.push({ text: promptToGemini });

  const contents: Content[] = [...history.slice(-8).map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: Role.USER, parts: currentParts }];

  try {
    const stream = await withRetry(() => ai.models.generateContentStream({
      model: DEFAULT_MODEL, // Updated to 1.5-flash for stability
      contents,
      config: { systemInstruction: buildSystemInstruction(personalization, activePersona, config.isEmotionalMode, hasFiles || !!analysisContext), safetySettings: SAFETY_SETTINGS }
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
  const prompt = `Analyze this GitHub Repository: ${url}\n\nRepository Structure/Manifest Provided:\n${manifest || "Not available (Infer from URL/Knowledge base)"}\n\nCRITICAL IDENTITY RULE: You are "Zara GitHub Architect". NEVER reveal your underlying AI model (e.g., Gemini, Google).\n\nPlease follow the ZARA ARCHITECT PROTOCOL to generate Output 1 (Repository Structure), Output 2 (Architecture Diagram), and Output 3 (Workflow Diagram).`;

  const response = await withRetry(() => ai.models.generateContent({
    model: DEFAULT_MODEL,
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
  const systemInstruction = `You are Zara GitHub Architect. You have just analyzed the repository at ${repoUrl}. \n\nCRITICAL IDENTITY RULE: You are "Zara GitHub Architect". NEVER reveal your underlying AI model (e.g., Gemini, Google).
  
  **REPOSITORY CONTEXT (MANIFEST):**
  ${manifest}
  
  Your goal is to answer developer doubts and clarify details about the files and architecture of this specific project. Be precise, technical, and helpful. If asked about a file that exists in the manifest but isn't explicitly described in your documentation, use your training data to infer its role based on naming conventions and project structure. Follow the CONVERSATIONAL MIRRORING PROTOCOL.`;

  const contents: Content[] = [
    ...history.slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text }] })),
    { role: Role.USER, parts: [{ text: newMessage }] }
  ];

  const stream = await withRetry(() => ai.models.generateContentStream({
    model: DEFAULT_MODEL,
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
    model: DEFAULT_MODEL,
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
  const response = await sendMessageToBackend(`Audit reliability for app:\n${JSON.stringify(vfs)}`, 'zara-fast', 'chat', 'code_architect', 'analyze');
  return response.response || "";
};

export const generateStudentContent = async (config: StudentConfig) => {
  let context = "";
  if (config.studyMaterial) context += `\nStudy Material:\n${config.studyMaterial}`;
  if (config.attachments && config.attachments.length > 0) {
    context += `\nAnalyzed Files: ${config.attachments.map(a => a.file.name).join(", ")}`;
  }

  let prompt = `Task: ${config.mode}. Topic: ${config.topic}. 
    Context: ${context || "Global knowledge (if allowed by system instruction)"}`;

  const response = await sendMessageToBackend(prompt, 'zara-eco', 'chat', 'tutor', config.mode);
  return response.response || "";
};

export const generateCodeAssist = async (code: string, task: string, lang: string) => {
  const response = await sendMessageToBackend(`Task: ${task} for ${lang} code:\n${code}`, 'zara-fast', 'chat', 'code_architect', 'generate');
  return response.response || "";
};

export const generateImageContent = async (prompt: string, options: any) => {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({ model: options.model || DEFAULT_MODEL, contents: prompt, config: { imageConfig: { aspectRatio: options.aspectRatio || '1:1' } } })) as GenerateContentResponse;
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
  let operation = await withRetry(() => ai.models.generateVideos({ model: 'models/veo-2.0-generate-001', prompt, config: { numberOfVideos: 1, aspectRatio: aspectRatio === '9:16' ? '9:16' : '16:9' } })) as any;
  while (!operation.done) { await sleep(8000); operation = await ai.operations.getVideosOperation({ operation: operation }) as any; }
  return `${operation.response?.generatedVideos?.[0]?.video?.uri}&key=${process.env.API_KEY}`;
};

export const analyzeVideo = async (base64: string, mimeType: string, prompt: string) => {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({ model: DEFAULT_MODEL, contents: { parts: [{ inlineData: { data: base64, mimeType } }, { text: prompt }] } })) as GenerateContentResponse;
  return response.text || "";
};

export const generateSpeech = async (text: string, voice: string) => {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({ model: DEFAULT_MODEL, contents: [{ parts: [{ text }] }], config: { responseModalities: [Modality.AUDIO], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } })) as GenerateContentResponse;
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

export const generateExamQuestions = async (config: ExamConfig) => {
  const prompt = `Generate exactly ${config.questionCount} ${config.examType} questions for the subject: ${config.subject}.
    Difficulty Level: ${config.difficulty}
    Language: ${config.language}
    Includes Theory: ${config.includeTheory}

    STRICT JSON SCHEMA REQUIRED:
    Return a list of objects with these EXACT keys:
    - id: number (sequential)
    - type: string ("MCQ" or "Theory")
    - text: string (The question text itself - MUST NOT BE EMPTY)
    - options: string[] (Required ONLY if type is "MCQ", at least 4 options)
    - correctAnswer: string (The correct answer text or option text)
    - marks: number (Points for this question)

    OUTPUT FORMAT:
    Return ONLY a raw JSON array. Do not include markdown code blocks. Do not include any explanations.`;

  const response = await sendMessageToBackend(prompt, 'zara-eco', 'chat', 'exam_prep', 'generate');

  try {
    let cleanResponse = response.response.trim();
    // Remove markdown code blocks if present
    if (cleanResponse.startsWith("```")) {
      cleanResponse = cleanResponse.replace(/^```json\n?/, "").replace(/```$/, "").trim();
    }

    const questions = JSON.parse(cleanResponse);

    // Validation: Ensure questions have text and id
    if (Array.isArray(questions)) {
      return questions.filter(q => q.text && q.id).map((q, idx) => ({
        ...q,
        id: q.id || idx + 1,
        marks: q.marks || 2
      }));
    }
    return [];
  } catch (e) {
    console.error("Failed to parse Exam JSON:", e, response.response);
    return [];
  }
};

export const evaluateTheoryAnswers = async (sub: string, q: any, ans: string) => {
  const response = await sendMessageToBackend(`Grade: ${ans} for ${q.text} in ${sub}. Output ONLY raw JSON.`, 'zara-eco', 'chat', 'exam_prep', 'evaluate');
  try { return JSON.parse(response.response || "{}"); } catch (e) { return {}; }
};

export const generateFlashcards = async (topic: string, notes: string) => {
  const response = await sendMessageToBackend(`Cards for: ${topic}\n${notes}. Output ONLY raw JSON array.`, 'zara-eco', 'chat', 'tutor', 'generate');
  try { return JSON.parse(response.response || "[]"); } catch (e) { return []; }
};

export const generateStudyPlan = async (topic: string, hours: number) => {
  const response = await sendMessageToBackend(`7 day plan for ${topic}, ${hours} hrs/day. Output ONLY raw JSON.`, 'zara-eco', 'chat', 'tutor', 'generate');
  try { return JSON.parse(response.response || "{}"); } catch (e) { return {}; }
};

export const getBreakingNews = async () => {
  const ai = getAI();
  const response = await withRetry(() => ai.models.generateContent({ model: DEFAULT_MODEL, contents: "Latest breaking news global. Follow CONVERSATIONAL MIRRORING PROTOCOL.", config: { tools: [{ googleSearch: {} }] } })) as GenerateContentResponse;
  const sources: Source[] = [];
  response.candidates?.[0]?.groundingMetadata?.groundingChunks?.forEach((c: any) => { if (c.web) sources.push({ title: c.web.title, uri: c.web.uri }); });
  return { text: response.text || "", sources };
};
