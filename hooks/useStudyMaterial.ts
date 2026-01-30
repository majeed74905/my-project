
import { useState, useEffect } from 'react';
import { Attachment } from '../types';
import { createAttachment, validateFile } from '../utils/fileUtils';

const STORAGE_KEY_STUDY_MATERIAL = 'zara_study_material_text';

export const useStudyMaterial = () => {
  const [studyMaterial, setStudyMaterial] = useState<string>('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_STUDY_MATERIAL);
    if (stored) setStudyMaterial(stored);
  }, []);

  const updateMaterial = (text: string) => {
    setStudyMaterial(text);
    localStorage.setItem(STORAGE_KEY_STUDY_MATERIAL, text);
  };

  const loadFromFile = async (file: File) => {
    const error = validateFile(file);
    if (error) throw new Error(error);

    // If it's a text file, we can optionally extract it to the text box
    if (file.type === 'text/plain' || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const text = await file.text();
      updateMaterial(text);
      return;
    }

    // Otherwise, handle it as a multi-modal attachment
    const attachment = await createAttachment(file);
    setAttachments(prev => [...prev, attachment]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const clearMaterial = () => {
    setStudyMaterial('');
    setAttachments([]);
    localStorage.removeItem(STORAGE_KEY_STUDY_MATERIAL);
  };

  return {
    studyMaterial,
    attachments,
    updateMaterial,
    loadFromFile,
    removeAttachment,
    clearMaterial
  };
};
