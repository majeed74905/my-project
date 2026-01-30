
import React, { useState } from 'react';
import { Layers, RotateCw, Box, MoveHorizontal, Maximize, RefreshCw, BookOpen, Image as ImageIcon, Upload, Play, Loader2, Download, Zap, X, Trash2, Film, Music, Clock, Palette, Sparkles, Smile, Video, Wand2, Volume2 } from 'lucide-react';
import { generateVideo } from '../services/gemini';
import { fileToBase64 } from '../utils/fileUtils';
import { GlassCard } from './shared/UIComponents';

const CREATIVE_STYLES = [
  // FEATURE A: Flip Video
  { 
    id: 'basic', 
    label: 'Basic Flip', 
    icon: RotateCw, 
    desc: 'Simple 180° rotation',
    prompt: "Animate the provided image with a clean, basic 180-degree flip transition on the Y-axis. Smooth ease-in-out motion, keeping the subject centered." 
  },
  { 
    id: '3d-card', 
    label: '3D Card Flip', 
    icon: Box, 
    desc: 'Floating depth rotation',
    prompt: "Treat the image as a thick 3D card floating in a void. Rotate it on the Y-axis to reveal the back (or loop) with realistic perspective, thickness, and depth of field." 
  },
  // FEATURE F: Parallax
  { 
    id: 'parallax', 
    label: '3D Parallax', 
    icon: Layers, 
    desc: 'Deep layer separation',
    prompt: "Generate a rich 3D parallax effect. Separate the foreground subject from the background. Move the camera slowly to create a strong illusion of 3D depth and immersion." 
  },
  // FEATURE G: Cartoon
  {
    id: 'cartoon',
    label: 'Cartoon Transform',
    icon: Palette,
    desc: 'Comic/Line-art style',
    prompt: "Transform the image into a high-quality stylized cartoon or comic book art style. Animate the lines shimmering slightly and perform a dynamic flip transition."
  },
  // FEATURE H: Motion Poster
  {
    id: 'motion-poster',
    label: 'Motion Poster',
    icon: Film,
    desc: 'Glows & particles',
    prompt: "Animate this image like a premium motion poster. Add subtle particle effects, a soft neon glow pulse around the subject, and a slow, dramatic camera push."
  },
  // FEATURE L: Face Highlight
  {
    id: 'face-focus',
    label: 'Face Focus',
    icon: Smile,
    desc: 'Emotive zoom',
    prompt: "Identify the face in the image. Start with a wide shot and perform a slow, smooth cinematic zoom into the eyes/face to highlight emotion. Add a subtle lighting flare."
  },
  // FEATURE M: Morph (Requires 2 images effectively, or transition concept)
  {
    id: 'morph',
    label: 'Morph Transition',
    icon: Wand2,
    desc: 'Shape-shift effect',
    prompt: "Apply a fluid morphing transition effect to the image. Warping and blending smoothly into the next state or looping back. Liquid motion style."
  },
  // Feature A continued
  { 
    id: 'rotational', 
    label: 'Spin Flip', 
    icon: RefreshCw, 
    desc: '360° Z-axis spin',
    prompt: "Apply a high-energy complex motion: rotate the image 360 degrees on the Z-axis (spin) while simultaneously performing a flip on the X-axis." 
  },
];

// FEATURE I: Aesthetic Color Grading
const AESTHETICS = [
  { id: 'natural', label: 'Natural', color: 'bg-gray-500' },
  { id: 'cinematic', label: 'Teal & Orange', color: 'bg-teal-600' },
  { id: 'vhs', label: 'Vintage VHS', color: 'bg-yellow-600' },
  { id: 'pastel', label: 'Pastel Dream', color: 'bg-pink-400' },
  { id: 'neon', label: 'Cyberpunk Neon', color: 'bg-purple-600' },
  { id: 'bw', label: 'Noir B&W', color: 'bg-black' },
];

// FEATURE P: Sound FX Sync (Conceptual trigger for prompt)
const AUDIO_FX = [
  { id: 'none', label: 'None' },
  { id: 'whoosh', label: 'Whoosh Transitions' },
  { id: 'boom', label: 'Cinematic Booms' },
  { id: 'lofi', label: 'Lofi Crackle' },
];

export const PhotoFlipMode: React.FC = () => {
  const [selectedStyle, setSelectedStyle] = useState(CREATIVE_STYLES[0]);
  const [images, setImages] = useState<File[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  
  // Controls
  const [aesthetic, setAesthetic] = useState(AESTHETICS[0]);
  const [audioFx, setAudioFx] = useState(AUDIO_FX[0]);
  const [isSlowMo, setIsSlowMo] = useState(false); // Feature D

  // Simulation for progress bar
  React.useEffect(() => {
    let interval: any;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress(p => (p < 90 ? p + 2 : p));
      }, 1000);
    } else {
      setProgress(100);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      const combined = [...images, ...files].slice(0, 3); // Max 3 images
      setImages(combined);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (images.length === 0) return;
    setIsGenerating(true);
    setVideoUrl(null);
    
    try {
      const processedImages = await Promise.all(images.map(async (file) => ({
         base64: await fileToBase64(file),
         mimeType: file.type
      })));

      let finalPrompt = "";
      
      // Feature C: Slideshow Logic
      if (images.length > 1) {
         finalPrompt = `
         CONCEPT: Create a high-quality slideshow video transitioning smoothly between these ${images.length} images.
         
         STYLE & AESTHETIC:
         - Visual Style: ${selectedStyle.label} (${selectedStyle.desc})
         - Color Grading: ${aesthetic.label} look.
         
         MOTION & TIMING:
         - ${isSlowMo ? "CINEMATIC SLOW MOTION: Apply 50% speed to transitions for dramatic effect." : "Normal speed, dynamic transitions."}
         - Audio Vibe: Sync cuts to imaginary ${audioFx.label} sounds.
         
         Ensure the video flows naturally, maintaining the subject's identity across frames if applicable. High resolution render.
         `;
      } else {
         // Single Shot Logic (Flip, Parallax, etc.)
         finalPrompt = `
         CONCEPT: ${selectedStyle.prompt}
         
         VISUAL TREATMENT:
         - Aesthetic: Apply a "${aesthetic.label}" color grade/filter.
         - Lighting: Professional cinematic lighting.
         
         TIMING & FX:
         - ${isSlowMo ? "TIMING: Apply a Cinematic Slow-Motion effect to the peak of the action/movement." : "TIMING: Standard dynamic pacing."}
         - ${audioFx.id !== 'none' ? `SOUND VISUALIZATION: Visualize the impact of ${audioFx.label} in the motion (e.g. shakes or pulses).` : ''}
         
         Render in 720p/1080p quality with high temporal consistency.
         `;
      }
      
      // Veo Generation
      const url = await generateVideo(finalPrompt, '16:9', processedImages);
      setVideoUrl(url);
    } catch (error: any) {
      alert(`Generation Failed: ${error.message}`);
    }
    setIsGenerating(false);
  };

  const isSlideshow = images.length > 1;

  return (
    <div className="h-full flex flex-col max-w-7xl mx-auto p-4 md:p-8 animate-fade-in overflow-hidden">
      
      {/* Header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end">
        <div>
          <h2 className="text-4xl font-black bg-gradient-to-r from-violet-400 via-fuchsia-500 to-white bg-clip-text text-transparent mb-2 tracking-tight">
            Media Creativity Suite
          </h2>
          <p className="text-text-sub flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Zara AI Media Creativity Suite is active. Send me a photo or describe your idea — flip video, slideshow, cinematic edit, cartoon style, parallax, music sync, or anything you imagine.
          </p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 min-h-0">
        
        {/* LEFT: Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar pb-10">
           
           {/* Image Upload */}
           <div className="glass-panel p-6 rounded-3xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-sm font-bold text-text uppercase tracking-wider">1. Source Media</h3>
                 <span className="text-[10px] bg-surfaceHighlight border border-border px-2 py-0.5 rounded text-text-sub">Max 3 Images</span>
              </div>
              
              <div className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all relative overflow-hidden ${images.length > 0 ? 'border-violet-500/30 bg-black/20' : 'border-border hover:border-violet-500/50 bg-black/20'}`}>
                 <input 
                   type="file" 
                   accept="image/*"
                   multiple
                   onChange={handleImageUpload}
                   className="absolute inset-0 opacity-0 cursor-pointer z-10 w-full h-full"
                   disabled={images.length >= 3}
                 />
                 
                 {images.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2 relative z-20 pointer-events-none">
                       {images.map((img, idx) => (
                          <div key={idx} className="relative aspect-square group/item pointer-events-auto">
                             <img 
                               src={URL.createObjectURL(img)} 
                               alt="upload" 
                               className="w-full h-full object-cover rounded-lg border border-white/10"
                             />
                             <button 
                               onClick={(e) => {e.preventDefault(); e.stopPropagation(); removeImage(idx);}}
                               className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shadow-md"
                             >
                                <X className="w-3 h-3" />
                             </button>
                          </div>
                       ))}
                       {images.length < 3 && (
                          <div className="aspect-square rounded-lg border border-dashed border-white/20 flex flex-col items-center justify-center text-text-sub hover:bg-white/5 transition-colors">
                             <Upload className="w-4 h-4 mb-1" />
                             <span className="text-[10px]">Add</span>
                          </div>
                       )}
                    </div>
                 ) : (
                    <div className="py-8 flex flex-col items-center justify-center">
                       <div className="w-14 h-14 rounded-full bg-surfaceHighlight flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-lg shadow-violet-500/10">
                          <Upload className="w-6 h-6 text-text-sub group-hover:text-violet-400" />
                       </div>
                       <p className="text-xs font-bold text-text mb-1">Single or Multi-select</p>
                       <p className="text-[10px] text-text-sub mb-4">Flip, Morph, Slideshow supported</p>
                       <span className="px-4 py-2 rounded-lg bg-surface border border-border text-xs font-medium text-text hover:bg-surfaceHighlight transition-colors shadow-sm">
                          Select Files
                       </span>
                    </div>
                 )}
              </div>
           </div>

           {/* Dynamic Controls based on Count */}
           {isSlideshow ? (
              <div className="glass-panel p-6 rounded-3xl border border-indigo-500/30 bg-indigo-500/5">
                 <h3 className="text-sm font-bold text-indigo-400 mb-2 flex items-center gap-2">
                    <Film className="w-4 h-4" /> Slideshow / Story Mode
                 </h3>
                 <p className="text-xs text-text-sub mb-4">Veo will generate a smooth transition between your selected images using the selected style.</p>
                 <div className="flex items-center gap-2 text-xs text-text-sub bg-surfaceHighlight p-2 rounded-lg">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <span>Auto-configured: 720p, 16:9 Landscape</span>
                 </div>
              </div>
           ) : null}

           {/* Style Selector */}
           <div className="glass-panel p-6 rounded-3xl">
              <h3 className="text-sm font-bold text-text mb-4 uppercase tracking-wider">2. Creative Style</h3>
              <div className="grid grid-cols-2 gap-3">
                 {CREATIVE_STYLES.map(style => (
                    <button
                      key={style.id}
                      onClick={() => setSelectedStyle(style)}
                      className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden group ${
                        selectedStyle.id === style.id 
                          ? 'bg-violet-500/20 border-violet-500 shadow-[0_0_20px_rgba(139,92,246,0.15)]' 
                          : 'bg-surface border-border hover:border-white/20'
                      }`}
                    >
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 transition-colors ${selectedStyle.id === style.id ? 'bg-violet-500 text-white' : 'bg-surfaceHighlight text-text-sub group-hover:text-text'}`}>
                          <style.icon className="w-4 h-4" />
                       </div>
                       <p className={`text-xs font-bold mb-0.5 ${selectedStyle.id === style.id ? 'text-violet-400' : 'text-text'}`}>{style.label}</p>
                       <p className="text-[9px] text-text-sub leading-tight opacity-70 line-clamp-1">{style.desc}</p>
                    </button>
                 ))}
              </div>
           </div>

           {/* Advanced Controls */}
           <div className="glass-panel p-6 rounded-3xl space-y-6">
              
              {/* Aesthetic Grade */}
              <div>
                 <h3 className="text-sm font-bold text-text mb-3 uppercase tracking-wider flex items-center gap-2">
                    <Palette className="w-4 h-4" /> Aesthetic Grade
                 </h3>
                 <div className="grid grid-cols-3 gap-2">
                    {AESTHETICS.map(m => (
                       <button
                         key={m.id}
                         onClick={() => setAesthetic(m)}
                         className={`px-2 py-3 rounded-xl text-[10px] font-bold transition-all border relative overflow-hidden ${
                            aesthetic.id === m.id 
                               ? 'border-white/50 text-white shadow-lg'
                               : 'bg-surface border-border text-text-sub hover:border-white/20'
                         }`}
                       >
                          <div className={`absolute inset-0 opacity-20 ${m.color}`} />
                          <span className="relative z-10">{m.label}</span>
                       </button>
                    ))}
                 </div>
              </div>

              {/* Timing & Sound */}
              <div className="grid grid-cols-1 gap-3">
                 <button
                   onClick={() => setIsSlowMo(!isSlowMo)}
                   className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSlowMo 
                         ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                         : 'bg-surface border-border text-text-sub hover:border-white/20'
                   }`}
                 >
                    <div className="flex items-center gap-2">
                       <Clock className="w-4 h-4" />
                       <span className="text-xs font-bold">Cinematic Slow-Mo</span>
                    </div>
                    <div className={`w-8 h-4 rounded-full relative transition-colors ${isSlowMo ? 'bg-blue-500' : 'bg-surfaceHighlight'}`}>
                       <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isSlowMo ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                 </button>

                 <div className="flex items-center gap-2">
                    <div className="bg-surfaceHighlight p-2 rounded-lg text-text-sub"><Volume2 className="w-4 h-4" /></div>
                    <select 
                       value={audioFx.id}
                       onChange={(e) => setAudioFx(AUDIO_FX.find(a => a.id === e.target.value) || AUDIO_FX[0])}
                       className="flex-1 bg-surface border border-border rounded-xl px-3 py-2 text-xs text-text focus:outline-none focus:border-violet-500"
                    >
                       {AUDIO_FX.map(fx => (
                          <option key={fx.id} value={fx.id}>{fx.label}</option>
                       ))}
                    </select>
                 </div>
              </div>
           </div>

           <button
             onClick={handleGenerate}
             disabled={images.length === 0 || isGenerating}
             className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-violet-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
           >
              {isGenerating ? (
                 <>
                   <Loader2 className="w-5 h-5 animate-spin" />
                   Designing...
                 </>
              ) : (
                 <>
                   <Play className="w-5 h-5 fill-current" />
                   Generate Media
                 </>
              )}
              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
           </button>

        </div>

        {/* RIGHT: Preview */}
        <div className="lg:col-span-2 flex flex-col">
           <GlassCard className="flex-1 relative overflow-hidden flex flex-col items-center justify-center p-4 border-2 border-white/5 bg-black/40">
              
              {isGenerating ? (
                 <div className="text-center z-10 max-w-sm w-full">
                    <div className="w-20 h-20 mx-auto mb-6 relative">
                       <div className="absolute inset-0 rounded-full border-4 border-white/10" />
                       <div className="absolute inset-0 rounded-full border-4 border-violet-500 border-t-transparent animate-spin" />
                       <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-violet-400 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Synthesizing {isSlideshow ? 'Story' : 'Shot'}</h3>
                    <p className="text-white/50 mb-6">
                       Veo is applying the {selectedStyle.label} style with {aesthetic.label} grading...
                    </p>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-300" 
                         style={{ width: `${progress}%` }}
                       />
                    </div>
                    <p className="text-xs text-white/30 mt-2 font-mono">{progress}% Complete</p>
                 </div>
              ) : videoUrl ? (
                 <div className="relative w-full h-full flex items-center justify-center group">
                    <video 
                      src={videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className="max-h-[70vh] w-auto max-w-full rounded-xl shadow-2xl" 
                    />
                    <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                       <a 
                         href={videoUrl} 
                         download={`zara-creative-${Date.now()}.mp4`}
                         className="bg-black/60 backdrop-blur text-white px-4 py-2 rounded-xl hover:bg-violet-600 transition-colors flex items-center gap-2 text-sm font-bold"
                       >
                          <Download className="w-4 h-4" /> Download MP4
                       </a>
                    </div>
                 </div>
              ) : (
                 <div className="text-center opacity-40">
                    <div className="w-24 h-24 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-6 rotate-12">
                       <Video className="w-10 h-10 text-white fill-white" />
                    </div>
                    <h3 className="text-xl font-bold text-white">Creative Canvas</h3>
                    <p className="text-sm text-white/60 mt-2">Upload media to begin your design.</p>
                 </div>
              )}

              {/* Ambient Background Glow */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[120px] pointer-events-none" />
           </GlassCard>
           
           {/* Metadata / Logs */}
           {videoUrl && (
              <div className="mt-4 p-4 rounded-xl border border-white/10 bg-black/20 flex justify-between items-center text-xs text-text-sub font-mono">
                 <span>Style: {selectedStyle.label}</span>
                 <span>Grade: {aesthetic.label}</span>
                 <span>FX: {isSlowMo ? 'Slow-Mo' : 'Std'}</span>
                 <span className="text-green-500">Render Complete</span>
              </div>
           )}
        </div>

      </div>
    </div>
  );
};
