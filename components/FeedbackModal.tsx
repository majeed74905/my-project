
import React, { useState } from 'react';
import { Star, X, Send, Mail, Phone, Github, Globe } from 'lucide-react';
import { AppFeedback } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState('General');
  const [text, setText] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    const feedback: AppFeedback = {
      id: crypto.randomUUID(),
      rating,
      category,
      text,
      timestamp: Date.now()
    };
    
    // Save locally
    const existing = JSON.parse(localStorage.getItem('zara-feedbacks') || '[]');
    localStorage.setItem('zara-feedbacks', JSON.stringify([...existing, feedback]));
    
    setSubmitted(true);
    setTimeout(() => {
       setSubmitted(false);
       onClose();
       setRating(0);
       setText('');
    }, 1500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-surface border border-border rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-fade-in flex flex-col max-h-[90vh]">
        
        <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
          <h3 className="font-bold text-lg">Send Feedback</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-text-sub" /></button>
        </div>

        <div className="overflow-y-auto">
          {submitted ? (
            <div className="p-12 text-center">
               <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-green-500">
                 <Send className="w-8 h-8" />
               </div>
               <h4 className="font-bold text-xl mb-2">Thank You!</h4>
               <p className="text-text-sub">Your feedback helps us improve Zara AI.</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div>
                 <label className="text-xs font-bold text-text-sub uppercase mb-2 block">How would you rate your experience?</label>
                 <div className="flex gap-2 justify-center">
                   {[1, 2, 3, 4, 5].map(star => (
                      <button 
                        key={star}
                        onClick={() => setRating(star)}
                        className={`p-2 transition-all hover:scale-110 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-border'}`}
                      >
                        <Star className={`w-8 h-8 ${rating >= star ? 'fill-current' : ''}`} />
                      </button>
                   ))}
                 </div>
              </div>

              <div>
                 <label className="text-xs font-bold text-text-sub uppercase mb-2 block">Category</label>
                 <select 
                   value={category}
                   onChange={e => setCategory(e.target.value)}
                   className="w-full bg-surfaceHighlight border border-border rounded-xl p-2.5 text-sm outline-none focus:border-primary"
                 >
                   <option>General</option>
                   <option>Bug Report</option>
                   <option>Feature Request</option>
                   <option>Student Mode</option>
                   <option>Code Mode</option>
                 </select>
              </div>

              <div>
                 <label className="text-xs font-bold text-text-sub uppercase mb-2 block">Comments</label>
                 <textarea 
                   value={text}
                   onChange={e => setText(e.target.value)}
                   className="w-full h-32 bg-surfaceHighlight border border-border rounded-xl p-3 text-sm outline-none focus:border-primary resize-none"
                   placeholder="Tell us what you think..."
                 />
              </div>

              <button 
                onClick={handleSubmit}
                disabled={rating === 0}
                className="w-full bg-primary hover:bg-primary-dark text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Feedback
              </button>

              <div className="mt-6 pt-6 border-t border-border">
                 <p className="text-xs font-bold text-text-sub uppercase mb-3">Developer Contact</p>
                 <div className="grid grid-cols-1 gap-2">
                    <a href="mailto:majeed74905@gmail.com" className="flex items-center gap-2 text-xs text-text-sub hover:text-primary transition-colors">
                       <Mail className="w-3.5 h-3.5" /> majeed74905@gmail.com
                    </a>
                    <div className="flex items-center gap-2 text-xs text-text-sub">
                       <Phone className="w-3.5 h-3.5" /> 9361971840
                    </div>
                    <div className="flex gap-4 mt-1">
                       <a href="https://github.com/majeed74905" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                          <Github className="w-3.5 h-3.5" /> GitHub
                       </a>
                       <a href="https://majeed-portfolio-website.netlify.app/" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-primary hover:underline">
                          <Globe className="w-3.5 h-3.5" /> Portfolio
                       </a>
                    </div>
                 </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
