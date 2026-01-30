
import { Note, MemoryNode, ViewMode } from '../types';

// Mock response simulator
export class OfflineService {
  
  // Basic Rule-Based Responses
  private static getGreeting(name: string): string {
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    return `${timeOfDay}, ${name}. We are currently offline, but I can access your local notes and memory.`;
  }

  private static getSystemInfo(): string {
    const now = new Date();
    return `**System Status: Offline**\n\n- Time: ${now.toLocaleTimeString()}\n- Date: ${now.toLocaleDateString()}\n- Battery: ${'getBattery' in navigator ? 'Checking...' : 'Unknown'}`;
  }

  // Local Search Algorithm
  private static searchLocalKnowledge(query: string): string {
    const q = query.toLowerCase();
    let found = [];

    // 1. Search Notes
    try {
      const notes: Note[] = JSON.parse(localStorage.getItem('zara_notes') || '[]');
      const matchingNotes = notes.filter(n => 
        n.title.toLowerCase().includes(q) || 
        n.content.toLowerCase().includes(q) ||
        n.tags.some(t => t.toLowerCase().includes(q))
      );
      if (matchingNotes.length > 0) {
        found.push(`**Found in Notes:**\n${matchingNotes.map(n => `- **${n.title}**: ${n.content.substring(0, 100)}...`).join('\n')}`);
      }
    } catch (e) {}

    // 2. Search Memory
    try {
      const memories: MemoryNode[] = JSON.parse(localStorage.getItem('zara_memory_engine_v1') || '[]');
      const matchingMemories = memories.filter(m => 
        m.content.toLowerCase().includes(q) || 
        m.tags.some(t => t.toLowerCase().includes(q))
      );
      if (matchingMemories.length > 0) {
        found.push(`**Found in Memory Bank:**\n${matchingMemories.map(m => `- ${m.content}`).join('\n')}`);
      }
    } catch (e) {}

    if (found.length > 0) {
      return `I found the following in your local storage:\n\n${found.join('\n\n')}`;
    }
    return "";
  }

  // Math Evaluator
  private static calculate(expression: string): string | null {
    try {
      // Safe regex for basic math
      if (/^[0-9+\-*/().\s]+$/.test(expression)) {
        // eslint-disable-next-line no-eval
        const result = eval(expression); 
        return `Calculated Result: **${result}**`;
      }
    } catch (e) {}
    return null;
  }

  // Main Processor
  public static async processMessage(
    text: string, 
    personalization: any,
    onViewChange: (view: ViewMode) => void
  ): Promise<string> {
    const lowerText = text.toLowerCase().trim();

    // 1. Navigation Commands
    if (lowerText.includes('open settings')) { onViewChange('settings'); return "Opening Settings..."; }
    if (lowerText.includes('open notes')) { onViewChange('notes'); return "Opening Notes Vault..."; }
    if (lowerText.includes('open student')) { onViewChange('student'); return "Opening Student Mode..."; }
    if (lowerText.includes('dashboard')) { onViewChange('dashboard'); return "Going to Dashboard..."; }

    // 2. Greetings
    if (['hi', 'hello', 'hey', 'zara'].some(w => lowerText.startsWith(w))) {
      return this.getGreeting(personalization.nickname || 'User');
    }

    // 3. Time/Date
    if (lowerText.includes('time') || lowerText.includes('date')) {
      return this.getSystemInfo();
    }

    // 4. Calculator
    if (/[0-9]/.test(lowerText) && ['+', '-', '*', '/'].some(op => lowerText.includes(op))) {
       const mathResult = this.calculate(text);
       if (mathResult) return mathResult;
    }

    // 5. Local Search
    const searchResult = this.searchLocalKnowledge(text);
    if (searchResult) return searchResult;

    // 6. Fallback
    return `I am currently offline and cannot access my full intelligence models. \n\n**Available Offline Actions:**\n- Search your local Notes & Memories (try typing a keyword)\n- Navigate the app (e.g. "Open Notes")\n- Basic calculations\n\nPlease reconnect to the internet for full AI capabilities.`;
  }
}
