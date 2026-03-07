
import React, { useState } from 'react';
import { Image as ImageIcon, Download, Loader2, Zap } from 'lucide-react';
import { imageService } from '../services/imageService';

export const ImageMode: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [textResponse, setTextResponse] = useState('');
  const [style, setStyle] = useState('realistic');
  const [aspectRatio, setAspectRatio] = useState('1:1');

  const handleGenerate = async () => {
    if (!prompt) return;
    setLoading(true);
    setGeneratedImage(null);
    setTextResponse('');

    try {
      // Stable Diffusion connection
      let width = 512;
      let height = 512;
      // Basic aspect ratio handling logic
      if (aspectRatio === '16:9') { width = 768; height = 432; }
      else if (aspectRatio === '9:16') { width = 432; height = 768; }

      const result = await imageService.generateImage({
        prompt,
        style,
        width,
        height
      });
      if (result.image_url) setGeneratedImage(result.image_url);

    } catch (e: any) {
      const errorMsg = e.response?.data?.detail || e.message;
      setTextResponse(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-4 md:p-8 animate-fade-in overflow-y-auto custom-scrollbar">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-black bg-gradient-to-br from-white to-primary bg-clip-text text-transparent mb-2 italic tracking-tighter">IMAGE STUDIO</h2>
        <p className="text-text-sub text-sm">Ultra-fast visual generation.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="lg:w-1/3 space-y-6">
          <div className="glass-panel p-6 rounded-[2rem] border-white/5 space-y-6">

            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-black text-text-sub uppercase tracking-widest">Describe Concept</label>
                <select
                  value={style}
                  onChange={(e) => setStyle(e.target.value)}
                  className="bg-gray-900 text-white border border-white/20 rounded-lg outline-none px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-800 transition-colors"
                >
                  <option value="realistic" className="bg-gray-900 text-white">REALISTIC</option>
                  <option value="anime" className="bg-gray-900 text-white">ANIME</option>
                  <option value="cyberpunk" className="bg-gray-900 text-white">CYBERPUNK</option>
                  <option value="cartoon" className="bg-gray-900 text-white">CARTOON</option>
                </select>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic robot in a forest..."
                className="w-full bg-black/40 border border-border rounded-2xl p-4 h-32 resize-none text-sm focus:border-primary outline-none transition-all shadow-inner"
              />
              {textResponse && <p className="text-red-400 text-xs px-2">{textResponse}</p>}
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !prompt}
              className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 rounded-2xl font-black text-sm tracking-[0.2em] shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-current" />}
              PROCESS
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6">
          <div className="glass-panel rounded-[3rem] p-4 flex flex-col items-center justify-center min-h-[500px] border-dashed border-2 border-white/5 relative overflow-hidden bg-black/40 shadow-2xl">
            {loading ? (
              <div className="flex flex-col items-center gap-4 z-10 animate-pulse">
                <div className="w-20 h-20 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-primary font-black text-xs tracking-[0.3em]">SYNTHESIZING...</p>
              </div>
            ) : generatedImage ? (
              <div className="relative group w-full h-full flex items-center justify-center animate-fade-in">
                <img src={generatedImage} alt="Generated" className="max-h-[600px] w-auto rounded-[2rem] shadow-2xl object-contain border border-white/10" />
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                  <a href={generatedImage} download="zara_design.png" className="bg-black/60 backdrop-blur-xl text-white p-3 rounded-2xl hover:bg-primary transition-all flex items-center gap-2 border border-white/10">
                    <Download className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ) : (
              <div className="text-center opacity-10 space-y-4">
                <ImageIcon className="w-32 h-32 mx-auto" />
                <p className="text-2xl font-black italic tracking-tighter uppercase">Canvas Ready</p>
              </div>
            )}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
          </div>

        </div>
      </div>
    </div>
  );
};
