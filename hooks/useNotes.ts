import { useState, useEffect } from 'react';
import { Note } from '../types';

const STORAGE_KEY = 'zara_notes';

export const useNotes = () => {
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { setNotes(JSON.parse(stored)); } catch (e) { console.error(e); }
    }
  }, []);

  const saveNotes = (updated: Note[]) => {
    setNotes(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addNote = (title: string, content: string, tags: string[] = []) => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title,
      content,
      tags,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    saveNotes([newNote, ...notes]);
    return newNote;
  };

  const updateNote = (id: string, updates: Partial<Note>) => {
    const updated = notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: Date.now() } : n);
    saveNotes(updated);
  };

  const deleteNote = (id: string) => {
    saveNotes(notes.filter(n => n.id !== id));
  };

  return { notes, addNote, updateNote, deleteNote };
};