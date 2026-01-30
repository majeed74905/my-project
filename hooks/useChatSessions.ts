import { useState, useEffect } from 'react';
import { ChatSession, Message, Role } from '../types';

const STORAGE_KEY_SESSIONS = 'zara_chat_sessions';

export const useChatSessions = () => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY_SESSIONS);
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to load sessions", e);
      }
    }
  }, []);

  const saveToStorage = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(updatedSessions));
  };

  const createSession = (initialMessages: Message[]) => {
    const newId = crypto.randomUUID();
    
    // Auto-generate title
    const firstUserMsg = initialMessages.find(m => m.role === Role.USER);
    const text = firstUserMsg?.text || "New Chat";
    const title = text.length > 30 ? text.substring(0, 30) + '...' : text;

    const newSession: ChatSession = {
      id: newId,
      title,
      messages: initialMessages,
      updatedAt: Date.now()
    };

    const updated = [newSession, ...sessions];
    saveToStorage(updated);
    setCurrentSessionId(newId);
    return newId;
  };

  const updateSession = (id: string, messages: Message[]) => {
    const existing = sessions.find(s => s.id === id);
    if (!existing) {
      // If session doesn't exist (e.g. first message of new chat), create it
      return createSession(messages);
    }

    const updated = sessions.map(s => 
      s.id === id 
        ? { ...s, messages, updatedAt: Date.now() } 
        : s
    );
    // Move updated session to top
    const sorted = updated.sort((a, b) => b.updatedAt - a.updatedAt);
    saveToStorage(sorted);
    return id;
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    saveToStorage(updated);
    if (currentSessionId === id) {
      setCurrentSessionId(null);
    }
  };

  const renameSession = (id: string, newTitle: string) => {
    const updated = sessions.map(s => 
      s.id === id ? { ...s, title: newTitle } : s
    );
    saveToStorage(updated);
  };

  const loadSession = (id: string) => {
    setCurrentSessionId(id);
    const session = sessions.find(s => s.id === id);
    return session ? session.messages : [];
  };

  const clearCurrentSession = () => {
    setCurrentSessionId(null);
  };

  return {
    sessions,
    currentSessionId,
    createSession,
    updateSession,
    deleteSession,
    renameSession,
    loadSession,
    clearCurrentSession
  };
};