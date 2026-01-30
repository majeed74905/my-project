import React, { useState, useEffect } from 'react';
import { Newspaper, RefreshCw, Clock, ExternalLink, Loader2 } from 'lucide-react';
import { getBreakingNews } from '../services/gemini';
import ReactMarkdown from 'react-markdown';
import { Source } from '../types';

export const NewsMode: React.FC = () => {
  const [newsCards, setNewsCards] = useState<string[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNews = async () => {
    setLoading(true);
    setError(null);
    try {
      const { text, sources: fetchedSources } = await getBreakingNews();
      
      // Split by '---' to get cards
      const cards = text.split('---').map(c => c.trim()).filter(c => c.length > 0);
      setNewsCards(cards);
      setSources(fetchedSources);
      setLastUpdated(new Date());
    } catch (e: any) {
      setError(e.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchNews();
  }, []);

  useEffect(() => {
    let interval: any;
    if (autoRefresh) {
      interval = setInterval(fetchNews, 300000); // 5 minutes
    }
    return () => clearInterval(interval);
  }, [autoRefresh]);

  return (
    <div className="h-full flex flex-col p-4 md:p-8 animate-fade-in max-w-7xl mx-auto w-full overflow-hidden">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 flex-shrink-0">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent mb-2 flex items-center gap-2">
            <Newspaper className="w-8 h-8 text-blue-500" />
            Live News Feed
          </h2>
          <p className="text-text-sub flex items-center gap-2 text-sm">
            Powered by Google Search Grounding • {lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : 'Updating...'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              autoRefresh 
                ? 'bg-green-500/10 border-green-500/50 text-green-500' 
                : 'bg-surface border-border text-text-sub hover:text-text'
            }`}
          >
            Auto-refresh {autoRefresh ? '(On)' : '(Off)'}
          </button>
          
          <button
            onClick={fetchNews}
            disabled={loading}
            className="bg-surface hover:bg-surfaceHighlight border border-border text-text p-2 rounded-lg transition-all disabled:opacity-50"
            title="Refresh News"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-2">
        {error && (
           <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-4 text-center">
             {error}
           </div>
        )}

        {loading && newsCards.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64">
             <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-4" />
             <p className="text-text-sub">Fetching latest headlines...</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newsCards.map((card, idx) => (
              <div key={idx} className="glass-panel p-6 rounded-2xl flex flex-col hover:shadow-lg transition-shadow border-t-4 border-t-blue-500/50">
                 <div className="flex-1 markdown-body prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown>{card}</ReactMarkdown>
                 </div>
                 <div className="mt-4 pt-4 border-t border-white/5 flex items-center text-xs text-text-sub">
                    <Clock className="w-3 h-3 mr-1" />
                    Live Update
                 </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Sources Footer */}
        {sources.length > 0 && (
          <div className="mt-8 pt-6 border-t border-border">
            <h4 className="text-sm font-semibold text-text mb-3">Sources</h4>
            <div className="flex flex-wrap gap-2">
              {sources.map((s, i) => (
                <a 
                  key={i} 
                  href={s.uri} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 bg-surfaceHighlight hover:bg-surface px-3 py-1 rounded-full text-xs text-text-sub hover:text-blue-400 transition-colors border border-border"
                >
                  <ExternalLink className="w-3 h-3" />
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};