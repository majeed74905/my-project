import { Groq } from 'groq-sdk';
import { Message } from '../types';

let groqClient: Groq | null = null;
const apiKey = process.env.API_KEY || ''; // Prefer environment variable, but allow overrides

// Initialize Groq Client safely
const getGroqClient = () => {
    if (groqClient) return groqClient;

    // We are running in browser, so we must be careful with keys.
    // Prioritize the specific VITE_GROQ_API_KEY first.
    // The generic 'apiKey' (process.env.API_KEY) often holds the Google Gemini key, which causes 401s on Groq.
    const key = (import.meta as any).env?.VITE_GROQ_API_KEY || apiKey || localStorage.getItem('groq_api_key');

    if (!key) {
        console.warn("Groq API Key missing. Please set VITE_GROQ_API_KEY or use the settings.");
        // Return a dummy client that will fail gracefully or prompt user
        throw new Error("GROQ_API_KEY_MISSING");
    }

    groqClient = new Groq({
        apiKey: key,
        dangerouslyAllowBrowser: true // Required for client-side demo
    });
    return groqClient;
};

export interface RepoNode {
    path: string;
    type: 'blob' | 'tree';
    sha?: string;
    content?: string; // Optional cached content
}

export interface AnalysisStage {
    name: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    message: string;
}

export const analyzeRepoStream = async (
    repoContext: string,
    onToken: (token: string) => void,
    onStatus: (stage: string) => void
) => {
    const groq = getGroqClient();

    const systemPrompt = `You are a Principal Software Architect AI.
  Your goal is to deeply start analyzing a GitHub repository structure and provide a comprehensive architectural breakdown.
  
  OUTPUT FORMAT: Markdown with clear sections.
  1. **High-Level Overview**: What does this project do?
  2. **Tech Stack**: Detect languages, frameworks, and tools.
  3. **Architecture Diagram**: Describe the data flow and structure. Mermaid diagrams are deprecated. Zara must only generate Graphviz DOT diagrams.
  4. **Key Modules**: Explain the folder structure logic.
  5. **Code Quality**: Identify patterns and anti-patterns.
  
  Be concise, professional, and insightful. Start analyzing now based on the provided file tree and manifest.`;

    try {
        onStatus("Initializing Groq Llama-3 Analysis...");

        const stream = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: `Analyze this repository structure:\n\n${repoContext}` }
            ],
            model: 'llama-3.3-70b-versatile',
            temperature: 0.5,
            max_tokens: 4096,
            stream: true,
        });

        onStatus("Streaming Analysis...");

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                onToken(content);
            }
        }

        onStatus("Analysis Complete");

    } catch (error: any) {
        if (error.message === 'GROQ_API_KEY_MISSING') {
            onToken("\n\n**ERROR**: Groq API Key is missing. Please add VITE_GROQ_API_KEY to your .env file.");
        } else {
            console.error("Groq Analysis Error:", error);
            onToken(`\n\n**Analysis Error**: ${error.message}`);
        }
        onStatus("Failed");
    }
};

export const chatWithRepoStream = async (
    history: Message[],
    repoContext: string,
    onToken: (token: string) => void
) => {
    const groq = getGroqClient();

    const systemPrompt = `You are the Maintainer AI for this repository.
   Context contains the file structure and analysis of the repo.
   Answer the user's questions specifically about this codebase.
   
   REPO CONTEXT:
   ${repoContext.slice(0, 10000)} // Limit context for token safety
   `;

    // Convert messages to Groq format
    const messages = [
        { role: 'system', content: systemPrompt },
        ...history.map(m => ({ role: m.role === 'model' ? 'assistant' : 'user', content: m.text }))
    ];

    try {
        const stream = await groq.chat.completions.create({
            messages: messages as any,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 1024,
            stream: true,
        });

        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) onToken(content);
        }
    } catch (error: any) {
        console.error("Groq Chat Error:", error);
        onToken(`\n*Error generating response: ${error.message}*`);
    }
};

// Helper to fetch valid tree from GitHub API
export const fetchGithubTree = async (owner: string, repo: string, branch: string = 'main'): Promise<RepoNode[]> => {
    // Try main then master
    const branches = ['main', 'master', 'dev'];
    let treeData = null;

    for (const b of branches) {
        try {
            const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${b}?recursive=1`);
            if (res.ok) {
                const data = await res.json();
                treeData = data.tree;
                break;
            }
        } catch (e) { }
    }

    if (!treeData) throw new Error("Could not fetch repository tree. Is it public?");

    // specific filtering for relevance
    return treeData.filter((node: RepoNode) => {
        const path = node.path;
        return !path.includes('node_modules') &&
            !path.includes('.git/') &&
            !path.includes('dist/') &&
            !path.includes('build/') &&
            !path.includes('package-lock.json') &&
            !path.includes('yarn.lock');
    });
};
