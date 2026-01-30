import { PromptTemplate, ViewMode } from '../types';

export const PROMPT_TEMPLATES: Record<string, PromptTemplate[]> = {
  chat: [
    { id: 'simple', label: 'Explain simply', prompt: 'Explain this like I am a beginner: ' },
    { id: 'summary', label: 'Summarize', prompt: 'Summarize the following into concise bullet points: ' },
    { id: 'rewrite', label: 'Rewrite professionally', prompt: 'Rewrite the following text to be more professional: ' },
  ],
  code: [
    { id: 'debug', label: 'Find Bugs', prompt: 'Analyze the following code for bugs and security issues: ' },
    { id: 'explain', label: 'Explain Code', prompt: 'Explain how this code works step-by-step: ' },
    { id: 'comments', label: 'Add Comments', prompt: 'Add helpful comments to this code: ' },
  ],
  student: [
    { id: 'quiz', label: 'Create Quiz', prompt: 'Create 5 short quiz questions based on: ' },
    { id: 'notes', label: 'Study Notes', prompt: 'Create structured study notes for: ' },
    { id: 'analogy', label: 'Use Analogy', prompt: 'Explain this concept using a real-world analogy: ' },
  ]
};

export const getTemplatesForView = (view: ViewMode): PromptTemplate[] => {
  return PROMPT_TEMPLATES[view] || PROMPT_TEMPLATES['chat'];
};