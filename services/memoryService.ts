
import { MemoryNode, MemoryCategory } from '../types';

const STORAGE_KEY_MEMORY = 'zara_memory_engine_v1';

class MemoryEngine {
  private memories: MemoryNode[] = [];

  constructor() {
    this.load();
  }

  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY_MEMORY);
      if (stored) {
        this.memories = JSON.parse(stored);
      } else {
        // Seed default memories if empty
        this.memories = [];
      }
    } catch (e) {
      console.error("Memory Engine Load Error", e);
      this.memories = [];
    }
  }

  private save() {
    try {
      localStorage.setItem(STORAGE_KEY_MEMORY, JSON.stringify(this.memories));
    } catch (e) {
      console.error("Memory Engine Save Error", e);
    }
  }

  // --- API Endpoints Mock ---

  /**
   * Stores a new memory fact.
   * Equivalent to INSERT INTO memories ...
   */
  public addMemory(content: string, category: MemoryCategory = 'fact', tags: string[] = []): MemoryNode {
    const newMemory: MemoryNode = {
      id: crypto.randomUUID(),
      content: content.trim(),
      category,
      tags: tags.map(t => t.toLowerCase().trim()),
      confidence: 1.0,
      timestamp: Date.now()
    };
    
    // Simple duplicate check based on content similarity could go here
    this.memories.unshift(newMemory);
    this.save();
    return newMemory;
  }

  /**
   * Retrieves all memories, optional filtering.
   * Equivalent to SELECT * FROM memories ...
   */
  public getMemories(filter?: { category?: MemoryCategory, query?: string }): MemoryNode[] {
    let results = this.memories;

    if (filter?.category) {
      results = results.filter(m => m.category === filter.category);
    }

    if (filter?.query) {
      const q = filter.query.toLowerCase();
      results = results.filter(m => 
        m.content.toLowerCase().includes(q) || 
        m.tags.some(t => t.includes(q))
      );
    }

    return results;
  }

  /**
   * Deletes a memory by ID.
   */
  public deleteMemory(id: string) {
    this.memories = this.memories.filter(m => m.id !== id);
    this.save();
  }

  /**
   * Generates a context string for the AI System Instruction.
   * This pulls the most recent/relevant memories to give the AI "Long Term Memory".
   */
  public getContextString(limit: number = 20): string {
    if (this.memories.length === 0) return "";

    // In a real DB, this would be a vector search. 
    // Here we take the most recent ones as "Working Memory".
    const relevant = this.memories.slice(0, limit);
    
    return relevant.map(m => `[${m.category.toUpperCase()}] ${m.content}`).join('\n');
  }
  
  public getStats() {
      return {
          total: this.memories.length,
          byCategory: this.memories.reduce((acc, curr) => {
              acc[curr.category] = (acc[curr.category] || 0) + 1;
              return acc;
          }, {} as Record<string, number>)
      };
  }
}

export const memoryService = new MemoryEngine();
