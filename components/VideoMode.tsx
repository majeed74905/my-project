
import React, { useState } from 'react';
import { Video, Film, Loader2, Play, Eye, Upload, AlertCircle, Image as ImageIcon, RotateCw, Box, Maximize, Layers, Smile, Palette, Wand2 } from 'lucide-react';
import { generateVideo, analyzeVideo } from '../services/gemini';
import { fileToBase64 } from '../utils/fileUtils';
import ReactMarkdown from 'react-markdown';

const MOTION_STYLES = [
  { 
    id: 'basic-flip', 
    label: 'Basic Flip', 
    icon: RotateCw, 
    desc: 'Smooth 180° rotation',
    prompt: "A high-quality video starting with the provided image. Apply a smooth, professional 180-degree flip animation to the image, revealing the back or looping smoothly. Keep the subject consistent." 
  },
  { 
    id: '3d-card', 
    label: '3D Card Flip', 
    icon: Box, 
    desc: 'Floating depth rotation',
    prompt: "A video of the provided image rotating like a 3D card floating in a void. Show depth and perspective changes as it flips. High quality 3D render style." 
  },
  { 
    id: 'zoom-flip', 
    label: 'Cinematic Zoom', 
    icon: Maximize, 
    desc: 'Slow zoom + fast flip',
    prompt: "Cinematic video starting with the provided image. Perform a slow, dramatic 'Ken Burns' zoom in on the subject, followed by a rapid, dynamic flip transition at the end." 
  },
  { 
    id: 'parallax', 
    label: '3D Parallax', 
    icon: Layers, 
    desc: 'Depth layer motion',
    prompt: "Generate a 3D parallax effect video from the provided image. The background should move slower than the foreground to create a strong sense of depth and immersion." 
  },
  { 
    id: 'face-motion', 
    label: 'Face Motion', 
    icon: Smile, 
    desc: 'Natural expressions',
    prompt: "Animate the subject in the provided image. The person should look around naturally, blink, and have subtle facial expressions. Keep the identity exactly the same. Lifelike motion." 
  },
  { 
    id: 'cartoon-flip', 
    label: 'Cartoon Flip', 
    icon: Palette, 
    desc: 'Stylized animation',
    prompt: "Transform the provided image into a high-quality 3D cartoon style and perform a playful flip animation. Vivid colors and smooth motion." 
  },
];

export const VideoMode: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'create' | 'motion' | 'analyze'>('motion');
  
  // Create State
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [animationImage, setAnimationImage] = useState<File | null>(null);

  // Motion State
  const [motionImage, setMotionImage] = useState<File | null>(null);
  const [selectedStyle, setSelectedStyle] = useState(MOTION_STYLES[0]);

  // Analyze State
  const [analyzeFile, setAnalyzeFile] = useState<File | null>(null);
  const [analyzePrompt, setAnalyzePrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');

  const handleGenerate = async () => {
    if (!prompt) return;
    setIsGenerating(true);
    setVideoUrl(null);
    try {
      let imagePayload: { base64: string, mimeType: string }[] | undefined = undefined;
      if (animationImage) {
        const base64 = await fileToBase64(animationImage);
        imagePayload = [{ base64, mimeType: animationImage.type }];
      }

      const url = await generateVideo(prompt, aspectRatio, imagePayload);
      setVideoUrl(url);
    } catch (error: any) {
      alert(error.message);
    }
    setIsGenerating(false);
  };

  const handleMotionGenerate = async () => {
    if (!motionImage) return;
    setIsGenerating(true);
    setVideoUrl(null);
    try {
      const base64 = await fileToBase64(motionImage);
      const imagePayload = [{ base64, mimeType: motionImage.type }];
      
      // Construct specialized prompt for Veo
      const fullPrompt = `${selectedStyle.prompt} High resolution, smooth motion.`;
      
      const url = await generateVideo(fullPrompt, aspectRatio, imagePayload);
      setVideoUrl(url);
    } catch (error: any) {
      alert(error.message);
    }
    setIsGenerating(false);
  };

  const handleAnalyze = async () => {
    if (!analyzeFile || !analyzePrompt) return;
    setIsAnalyzing(true);
    try {
      const base64 = await fileToBase64(analyzeFile);
      const result = await analyzeVideo(base64, analyzeFile.type, analyzePrompt);
      setAnalysisResult(result);
    } catch (error: any) {
      setAnalysisResult(`Error: ${error.message}`);
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="h-full flex flex-col max-w-6xl mx-auto p-4 md:p-8 animate-fade-in overflow-y-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-red-400 to-orange-500 bg-clip-text text-transparent mb-2">
            Video Studio
          </h2>
          <p className="text-text-sub">Create animations, flip videos, and analyze footage with Veo.</p>
        </div>
      </div>

      <div className="flex gap-4 mb-6 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('motion')}
          className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
            activeTab === 'motion' 
            ? 'text-red-400 border-b-2 border-red-400' 
            : 'text-text-sub hover:text-text'
          }`}
        >
          <div className="flex items-center gap-2">
            <Wand2 className="w-4 h-4" />
            Photo Motion (Flip)
          </div>
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
            activeTab === 'create' 
            ? 'text-red-400 border-b-2 border-red-400' 
            : 'text-text-sub hover:text-text'
          }`}
        >
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4" />
            Text to Video
          </div>
        </button>
        <button
          onClick={() => setActiveTab('analyze')}
          className={`pb-3 px-4 font-medium transition-all whitespace-nowrap ${
            activeTab === 'analyze' 
            ? 'text-red-400 border-b-2 border-red-400' 
            : 'text-text-sub hover:text-text'
          }`}
        >
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4" />
            Analyze
          </div>
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-0">
        
        {/* LEFT PANEL: Controls */}
        <div className="lg:w-1/3 flex flex-col gap-4 overflow-y-auto pr-2">
          
          {activeTab === 'motion' && (
             <div className="glass-panel p-6 rounded-2xl space-y-6">
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-red-400/50 transition-colors relative bg-background/50 group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setMotionImage(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center">
                        {motionImage ? (
                          <div className="relative">
                             <img src={URL.createObjectURL(motionImage)} alt="preview" className="h-32 w-auto object-cover rounded-lg shadow-md mb-2" />
                             <p className="text-xs text-green-500 font-bold">{motionImage.name}</p>
                          </div>
                        ) : (
                          <>
                            <div className="w-12 h-12 rounded-full bg-surfaceHighlight flex items-center justify-center mb-2 group-hover:bg-red-500/10 transition-colors">
                               <ImageIcon className="w-6 h-6 text-text-sub group-hover:text-red-500" />
                            </div>
                            <p className="text-sm font-medium text-text">Upload Photo</p>
                            <p className="text-xs text-text-sub mt-1">Supports JPG, PNG</p>
                          </>
                        )}
                    </div>
                </div>

                <div>
                   <label className="text-xs font-bold text-text-sub uppercase mb-3 block">Select Motion Style</label>
                   <div className="grid grid-cols-2 gap-3">
                      {MOTION_STYLES.map(style => (
                         <button
                           key={style.id}
                           onClick={() => setSelectedStyle(style)}
                           className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                             selectedStyle.id === style.id 
                               ? 'bg-red-500/10 border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                               : 'bg-surface border-border hover:border-red-400/30'
                           }`}
                         >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${selectedStyle.id === style.id ? 'bg-red-500 text-white' : 'bg-surfaceHighlight text-text-sub'}`}>
                               <style.icon className="w-4 h-4" />
                            </div>
                            <p className={`text-xs font-bold ${selectedStyle.id === style.id ? 'text-red-400' : 'text-text'}`}>{style.label}</p>
                            <p className="text-[10px] text-text-sub mt-0.5 leading-tight">{style.desc}</p>
                         </button>
                      ))}
                   </div>
                </div>

                <button
                  onClick={handleMotionGenerate}
                  disabled={isGenerating || !motionImage}
                  className="w-full bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg hover:shadow-red-500/25 active:scale-95"
                >
                  {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  Generate {selectedStyle.label}
                </button>
             </div>
          )}

          {activeTab === 'create' && (
             <div className="glass-panel p-6 rounded-2xl space-y-4">
                <div className="border-2 border-dashed border-border rounded-xl p-4 text-center hover:border-red-400/50 transition-colors relative bg-background/50">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => setAnimationImage(e.target.files?.[0] || null)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center">
                        {animationImage ? (
                          <>
                            <ImageIcon className="w-8 h-8 text-green-500 mb-2" />
                            <p className="text-xs text-text font-medium truncate max-w-[200px]">{animationImage.name}</p>
                            <p className="text-[10px] text-green-500">Image context active</p>
                          </>
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-text-sub mb-2" />
                            <p className="text-xs text-text-sub">Optional: Upload starting frame</p>
                          </>
                        )}
                    </div>
                </div>

                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the video... e.g., 'Cyberpunk city in rain'"
                  className="w-full bg-background rounded-xl p-4 resize-none h-32 text-text focus:outline-none focus:ring-1 focus:ring-red-400/50 border border-border"
                />
                
                <div>
                   <label className="text-xs font-medium text-text-sub mb-2 block">Aspect Ratio</label>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => setAspectRatio('16:9')}
                       className={`flex-1 py-2 rounded-lg text-xs font-medium border ${aspectRatio === '16:9' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-border text-text-sub'}`}
                     >
                       16:9 Landscape
                     </button>
                     <button 
                       onClick={() => setAspectRatio('9:16')}
                       className={`flex-1 py-2 rounded-lg text-xs font-medium border ${aspectRatio === '9:16' ? 'bg-red-500/20 border-red-500 text-red-400' : 'border-border text-text-sub'}`}
                     >
                       9:16 Portrait
                     </button>
                   </div>
                </div>

                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !prompt}
                  className="w-full bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
                  Generate Video
                </button>
             </div>
          )}

          {activeTab === 'analyze' && (
            <div className="glass-panel p-6 rounded-2xl space-y-4">
              <div className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-red-400/50 transition-colors relative bg-background/50">
                 <input 
                   type="file" 
                   accept="video/mp4,video/webm,video/quicktime" 
                   onChange={(e) => setAnalyzeFile(e.target.files?.[0] || null)}
                   className="absolute inset-0 opacity-0 cursor-pointer"
                 />
                 <Upload className="w-10 h-10 mx-auto text-text-sub mb-2" />
                 <p className="text-sm text-text-sub">
                   {analyzeFile ? analyzeFile.name : "Upload Video to Analyze"}
                 </p>
              </div>
              <textarea
                 value={analyzePrompt}
                 onChange={(e) => setAnalyzePrompt(e.target.value)}
                 placeholder="Ask Zara Vision about this video..."
                 className="w-full bg-background rounded-xl p-4 resize-none h-32 text-text focus:outline-none focus:ring-1 focus:ring-red-400/50 border border-border"
               />
               <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing || !analyzeFile || !analyzePrompt}
                  className="w-full bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-500/20"
                >
                  {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                  Analyze Video
                </button>
                <div className="flex items-start gap-2 text-xs text-orange-400 bg-orange-500/10 p-3 rounded-lg border border-orange-500/20">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p>Pro Tip: Keep videos short/small for faster analysis. Browser-based encoding has limits.</p>
                </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL: Preview / Output */}
        <div className="flex-1 flex flex-col">
           {activeTab === 'analyze' ? (
              <div className="flex-1 glass-panel p-6 rounded-2xl min-h-[300px] markdown-body relative">
                 {analysisResult ? (
                   <ReactMarkdown>{analysisResult}</ReactMarkdown>
                 ) : (
                   <div className="absolute inset-0 flex flex-col items-center justify-center text-text-sub/30">
                     <Eye className="w-16 h-16 mb-4 opacity-50" />
                     <p className="text-lg font-medium">Analysis insights will appear here</p>
                   </div>
                 )}
                 {isAnalyzing && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
                       <div className="text-center">
                          <Loader2 className="w-10 h-10 text-red-500 animate-spin mx-auto mb-2" />
                          <p className="text-red-400 font-bold">Analyzing frames...</p>
                       </div>
                    </div>
                 )}
              </div>
           ) : (
              <div className="flex-1 glass-panel rounded-2xl p-4 flex items-center justify-center min-h-[400px] border-dashed border-2 border-white/5 relative overflow-hidden bg-black/20">
                {isGenerating ? (
                  <div className="text-center z-10">
                    <Loader2 className="w-16 h-16 text-red-400 animate-spin mx-auto mb-6" />
                    <h3 className="text-xl font-bold text-text mb-2">Generating Video...</h3>
                    <p className="text-text-sub animate-pulse max-w-xs mx-auto">
                       Veo 3.1 is dreaming up your {activeTab === 'motion' ? selectedStyle.label : 'scene'}. This typically takes 1-2 minutes.
                    </p>
                  </div>
                ) : videoUrl ? (
                  <div className="relative w-full h-full flex items-center justify-center">
                     <video src={videoUrl} controls autoPlay loop className="max-h-full max-w-full rounded-lg shadow-2xl" />
                  </div>
                ) : (
                  <div className="text-center text-text-sub/30">
                    <Film className="w-24 h-24 mx-auto mb-6 opacity-50" />
                    <p className="text-xl font-medium">Video Output Canvas</p>
                    <p className="text-sm mt-2">Select a style or enter a prompt to begin.</p>
                  </div>
                )}
                
                {/* Background ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/5 rounded-full blur-[100px] pointer-events-none"></div>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};
