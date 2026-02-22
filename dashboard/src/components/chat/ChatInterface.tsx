import { useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChatMessage } from '@/types';

interface ChatProps {
  history: ChatMessage[];
  onSend: (query: string) => void;
  loading: boolean;
}

export function ChatInterface({ history, onSend, loading }: ChatProps) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSend(input);
      setInput("");
    }
  };

  return (
    <div className="p-6 bg-zinc-950 border-t border-zinc-800">
      <div className="max-w-3xl mx-auto">
        {/* Recent Chat Bubbles */}
        <div className="mb-4 space-y-2 max-h-40 overflow-y-auto p-2">
          {history.slice(-3).map((msg, i) => (
            <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-zinc-500' : 'text-blue-400'}`}>
              <span className="font-bold uppercase tracking-tighter mr-2">{msg.role}:</span> 
              {msg.text}
            </div>
          ))}
        </div>
        
        <form onSubmit={handleSubmit} className="relative">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter a command..."
            className="bg-zinc-900 border-zinc-700 h-12 pr-20 focus:ring-blue-500 text-white"
            disabled={loading}
          />
          <Button 
            type="submit" 
            className="absolute right-1 top-1 bottom-1 bg-blue-600 hover:bg-blue-500"
            disabled={loading}
          >
            {loading ? "..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}