
export interface MockAIResponse {
    files: Record<string, string>;
    message: string;
}

export const callLLMService = async (prompt: string): Promise<MockAIResponse> => {
    // Simulate network delay (2-3 seconds)
    await new Promise(resolve => setTimeout(resolve, 2500));

    prompt = prompt.toLowerCase();

    // MOCK LOGIC for demo purposes
    // In a real implementation, this would call the Gemini API
    // MARK: GEMINI_API_INTEGRATION_POINT

    if (prompt.includes('weather')) {
        return {
            message: "I've generated a weather application with Tailwind styling. It features a mock search, current conditions card, and a forecast list.",
            files: {
                "App.tsx": `import React, { useState } from 'react';
import { Cloud, Sun, Wind, Droplets, Search } from 'lucide-react';

export default function App() {
  const [city, setCity] = useState("San Francisco");

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-400 to-blue-600 p-8 flex items-center justify-center font-sans text-white">
      <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-8 max-w-md w-full shadow-2xl border border-white/30">
        
        {/* Search Bar */}
        <div className="relative mb-8">
          <input 
            type="text" 
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full bg-white/10 border border-white/30 rounded-full py-3 px-12 text-white placeholder-white/70 focus:outline-none focus:bg-white/20 transition"
            placeholder="Search city..."
          />
          <Search className="absolute left-4 top-3.5 w-5 h-5 opacity-70" />
        </div>

        {/* Current Weather */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
             <Sun className="w-24 h-24 text-yellow-300 animate-pulse" />
          </div>
          <h1 className="text-5xl font-bold mb-2">72°</h1>
          <h2 className="text-2xl font-medium tracking-wide">{city}</h2>
          <p className="opacity-80 mt-1">Sunny & Clear</p>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Wind className="w-6 h-6 mx-auto mb-1 opacity-80" />
            <p className="text-sm font-bold">8 mph</p>
            <p className="text-[10px] opacity-70 uppercase tracking-wider">Wind</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Droplets className="w-6 h-6 mx-auto mb-1 opacity-80" />
            <p className="text-sm font-bold">42%</p>
            <p className="text-[10px] opacity-70 uppercase tracking-wider">Humidity</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3 text-center">
            <Cloud className="w-6 h-6 mx-auto mb-1 opacity-80" />
            <p className="text-sm font-bold">0%</p>
            <p className="text-[10px] opacity-70 uppercase tracking-wider">Rain</p>
          </div>
        </div>

        {/* Forecast */}
        <div className="space-y-3">
          {["Mon", "Tue", "Wed"].map((day, i) => (
            <div key={day} className="flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/10 transition cursor-pointer">
              <span className="font-medium w-12">{day}</span>
              <div className="flex items-center gap-2 flex-1 justify-center opacity-80">
                {i === 0 ? <Sun className="w-4 h-4 text-yellow-300" /> : <Cloud className="w-4 h-4" />}
                <span className="text-xs">{i === 0 ? 'Sunny' : 'Cloudy'}</span>
              </div>
              <span className="font-bold">{70 - i * 2}°</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}`,
                "styles.css": `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
body { font-family: 'Inter', sans-serif; }`
            }
        };
    }

    // Default Response (generic counter)
    return {
        message: "I've created a simple counter application for you. You can try editing the code to change the colors or logic!",
        files: {
            "App.tsx": `import React, { useState } from 'react';
import { Sparkles } from 'lucide-react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center p-10 bg-gray-800 rounded-2xl shadow-xl border border-gray-700">
        <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Hello World
        </h1>
        <p className="mb-8 text-gray-400">Welcome to your generated app!</p>
        
        <div className="text-6xl font-mono mb-8 font-bold text-white">
          {count}
        </div>
        
        <button 
          onClick={() => setCount(c => c + 1)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-bold transition-all transform hover:scale-105 active:scale-95 mx-auto"
        >
          <Sparkles className="w-5 h-5" />
          Increment Counter
        </button>
      </div>
    </div>
  );
}`,
            "styles.css": `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
body { font-family: 'Inter', sans-serif; }`
        }
    };
};
