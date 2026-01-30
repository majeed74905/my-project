
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Github, Search, Loader2, GitBranch, File, Folder, AlertCircle, Layers, MessageSquare, Send, Bot, User as UserIcon, Check, Copy } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import mermaid from 'mermaid';
import { analyzeRepoStream, chatWithRepoStream, fetchGithubTree, RepoNode } from '../services/groq';
import { Message, Role } from '../types';
import { useTheme } from '../theme/ThemeContext';

// --- Components ---

const MermaidDiagram = ({ code }: { code: string }) => {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const { currentThemeName } = useTheme();

  useEffect(() => {
    const render = async () => {
      try {
        const isDark = !['light', 'glass'].includes(currentThemeName);
        mermaid.initialize({ startOnLoad: false, theme: isDark ? 'dark' : 'default', securityLevel: 'loose' });
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(id, code);
        setSvg(svg);
        setError(null);
      } catch (e) {
        console.error("Mermaid Render Error", e);
        // Don't show technical error to user, just keep old svg or nothing
        // setError("Failed to render graph"); 
      }
    };
    if (code) render();
  }, [code, currentThemeName]);

  if (error) return null;
  return <div ref={ref} className="w-full overflow-x-auto p-4 flex justify-center" dangerouslySetInnerHTML={{ __html: svg }} />;
};

const MarkdownCodeBlock = ({ inline, className, children, ...props }: any) => {
  const match = /language-(\w+)/.exec(className || '');
  const content = String(children).replace(/\n$/, '');

  if (!inline && match && match[1] === 'mermaid') {
    return <MermaidDiagram code={content} />;
  }

  return !inline && match ? (
    <div className="relative group my-4 rounded-lg overflow-hidden border border-white/10 bg-black/40">
      <div className="flex justify-between px-4 py-2 bg-white/5 border-b border-white/5 text-xs font-mono text-gray-400">
        <span>{match[1]}</span>
        <button onClick={() => navigator.clipboard.writeText(content)} className="hover:text-white">Copy</button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm"><code className={className} {...props}>{children}</code></pre>
    </div>
  ) : (
    <code className={`${className} bg-white/10 px-1 py-0.5 rounded text-sm`} {...props}>{children}</code>
  );
};

// --- Main Page Component ---

export const GithubMode: React.FC = () => {
  const [repoUrl, setRepoUrl] = useState('');
  const [repoNodes, setRepoNodes] = useState<RepoNode[]>([]);
  const [analysisText, setAnalysisText] = useState('');
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Chat
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async () => {
    if (!repoUrl) return;
    setIsLoading(true);
    setAnalysisText('');
    setRepoNodes([]);
    setStatus('Scanning Repository...');

    try {
      // 1. Parse URL & Clean .git suffix
      const cleanUrl = repoUrl.trim().replace(/\/$/, '').replace(/\.git$/, '');
      const match = cleanUrl.match(/github\.com\/([^/]+)\/([^/]+)/);

      if (!match) throw new Error("Invalid GitHub URL");
      const [_, owner, repoName] = match;

      // 2. Fetch Tree
      const nodes = await fetchGithubTree(owner, repoName);
      setRepoNodes(nodes);

      // 3. Prepare Context
      const fileStructure = nodes.map(n => `${n.type === 'tree' ? 'DIR' : 'FILE'}: ${n.path}`).slice(0, 3000).join('\n');

      // 4. Stream Analysis with Groq
      await analyzeRepoStream(fileStructure, (token) => {
        setAnalysisText(prev => prev + token);
      }, (stage) => setStatus(stage));

      // 5. Init Chat
      setChatMessages([{
        id: 'init',
        role: Role.MODEL,
        text: "I've analyzed the repository structure. What would you like to know about the architecture or code?",
        timestamp: Date.now()
      }]);

    } catch (e: any) {
      setStatus("Analysis interrupted");
      setAnalysisText("Unable to complete analysis at this time. Please check the repository URL and ensure it is public.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim() || isChatting) return;

    const userMsg: Message = { id: crypto.randomUUID(), role: Role.USER, text: chatInput, timestamp: Date.now() };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatting(true);

    const botId = crypto.randomUUID();
    setChatMessages(prev => [...prev, { id: botId, role: Role.MODEL, text: '', timestamp: Date.now(), isStreaming: true }]);

    const fileStructure = repoNodes.map(n => `${n.type === 'tree' ? 'DIR' : 'FILE'}: ${n.path}`).slice(0, 3000).join('\n');
    const context = `ANALYSIS SUMMARY:\n${analysisText}\n\nFILE STRUCTURE:\n${fileStructure}`;

    await chatWithRepoStream([...chatMessages, userMsg], context, (token) => {
      setChatMessages(prev => prev.map(m => m.id === botId ? { ...m, text: m.text + token } : m));
    });

    setChatMessages(prev => prev.map(m => m.id === botId ? { ...m, isStreaming: false } : m));
    setIsChatting(false);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  return (
    <div className="h-full flex flex-col max-w-[1600px] mx-auto p-6 overflow-hidden animate-fade-in relative">

      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-white/10 rounded-xl border border-white/10"><Github className="w-8 h-8 text-white" /></div>
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white mb-1"><span className="text-primary">GitHub</span> Architect</h1>
          <p className="text-text-sub text-sm">Real-time repository analysis & architectural workflow.</p>
        </div>

        <div className="ml-auto w-full max-w-xl relative flex items-center">
          <input
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
            placeholder="https://github.com/owner/repo"
            className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-32 py-3 text-sm focus:border-primary/50 focus:outline-none transition-all"
          />
          <button
            onClick={handleAnalyze}
            disabled={isLoading}
            className="absolute right-1 top-1 bottom-1 px-6 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-xs transition-all disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'ANALYZE'}
          </button>
        </div>
      </div>

      {/* Status Bar */}
      {status && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur border border-primary/30 px-6 py-2 rounded-full flex items-center gap-3 z-50 shadow-xl">
          <Loader2 className={`w-4 h-4 text-primary ${isLoading ? 'animate-spin' : ''}`} />
          <span className="text-xs font-bold text-white uppercase tracking-widest">{status}</span>
        </div>
      )}

      <div className="flex-1 flex gap-6 min-h-0">
        {/* Left Panel: File Tree */}
        <div className="w-80 flex-shrink-0 bg-surfaceHighlight/30 border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <span className="text-xs font-bold text-text-sub uppercase tracking-wider">Repository</span>
            <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-text-sub">{repoNodes.length} Nodes</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 custom-scrollbar space-y-0.5">
            {repoNodes.length === 0 && <div className="text-center p-8 text-text-sub/30 text-xs italic">No repository loaded.</div>}
            {repoNodes.map((node, i) => (
              <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded hover:bg-white/5 cursor-default group transition-colors">
                {node.type === 'tree' ? <Folder className="w-3.5 h-3.5 text-primary" /> : <File className="w-3.5 h-3.5 text-text-sub group-hover:text-white" />}
                <span className="text-xs text-text-sub group-hover:text-text truncate font-mono">{node.path.split('/').pop()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Middle Panel: AI Analysis & Graph */}
        <div className="flex-1 bg-surfaceHighlight/30 border border-white/5 rounded-2xl flex flex-col overflow-hidden relative">
          <div className="absolute inset-0 bg-dots-pattern opacity-5 pointer-events-none" />
          <div className="flex-1 overflow-y-auto p-8 custom-scrollbar markdown-body prose prose-invert max-w-none">
            {/* Center Panel - Only show analysis or waiting state. Errors are hidden from here to keep UI clean. */}
            {!analysisText && !isLoading && (
              <div className="h-full flex flex-col items-center justify-center opacity-30">
                <Layers className="w-24 h-24 mb-4 text-primary" />
                <p className="text-xl font-bold">Waiting for Blueprint</p>
              </div>
            )}
            {/* Filter out specific API error strings if they leak into analysisText */}
            <ReactMarkdown components={{ code: MarkdownCodeBlock }}>
              {analysisText.includes('Analysis Failed') ? '' : analysisText}
            </ReactMarkdown>
          </div>
        </div>

        {/* Right Panel: Chat */}
        <div className="w-96 flex-shrink-0 bg-surfaceHighlight/30 border border-white/5 rounded-2xl flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/5">
            <span className="text-xs font-bold text-text-sub uppercase tracking-wider">Architect Chat</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {chatMessages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === Role.USER ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${msg.role === Role.USER ? 'bg-primary' : 'bg-white/10'}`}>
                  {msg.role === Role.USER ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>
                <div className={`p-3 rounded-xl text-sm ${msg.role === Role.USER ? 'bg-primary/20 text-white' : 'bg-white/5 text-text-sub'}`}>
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <div className="p-4 border-t border-white/5">
            <div className="relative">
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendChat()}
                placeholder="Ask about the code..."
                className="w-full bg-black/40 border border-white/10 rounded-xl pl-4 pr-10 py-3 text-sm focus:border-primary/50 focus:outline-none"
              />
              <button
                onClick={handleSendChat}
                disabled={!chatInput.trim() || isChatting}
                className="absolute right-2 top-2 p-1.5 text-text-sub hover:text-white disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
