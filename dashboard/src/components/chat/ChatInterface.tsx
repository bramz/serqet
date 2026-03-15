"use client";

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, Terminal } from "lucide-react";
import { ChatMessage } from '@/types';

export function ChatInterface({ history, onSend, loading }: { history: ChatMessage[], onSend: (q: string) => void, loading: boolean }) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isExpanded]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    onSend(input);
    setInput("");
    setIsExpanded(true);
  };

  return (
    <motion.div 
      initial={false}
      animate={{ height: isExpanded ? '500px' : '72px' }}
      className="fixed bottom-0 left-0 right-0 bg-zinc-950/90 backdrop-blur-2xl border-t border-zinc-800/50 z-50 shadow-2xl"
      style={{ marginLeft: 'var(--sidebar-width)' }}
    >
      <div className="max-w-5xl mx-auto h-full flex flex-col">
        {/* Toggle Handle */}
        <div 
          className="flex items-center justify-between px-6 h-10 cursor-pointer group" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-3">
            <div className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-purple-500 animate-pulse' : 'bg-zinc-700'}`} />
            <span className="text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
              {loading ? "Neural Link Processing..." : "Serqet Terminal"}
            </span>
          </div>
          {isExpanded ? <ChevronDown size={14} className="text-zinc-600"/> : <ChevronUp size={14} className="text-zinc-600"/>}
        </div>

        {/* Markdown Chat History */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 space-y-6 scrollbar-hide">
          <AnimatePresence>
            {isExpanded && history.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-zinc-800 text-zinc-100 border border-zinc-700' : 'bg-purple-950/10 text-zinc-200 border border-purple-500/20'}`}>
                  <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Command Input */}
        <div className="p-4 bg-transparent">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <div className="relative flex-1 group">
              <Terminal className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-purple-500 transition-colors" size={14} />
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder="EXECUTE COMMAND..." 
                className="bg-zinc-900/50 border-zinc-800 h-12 pl-11 rounded-xl text-zinc-200 font-mono text-xs tracking-wider" 
              />
            </div>
            <Button type="submit" disabled={loading} className="h-12 px-8 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl border-t border-purple-400/30">
              RUN
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}