"use client";

import React, { useState, useRef, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Terminal, X, Paperclip, Cpu, Zap, 
  Maximize2, Minimize2, ChevronDown, ChevronUp,
  Square, Layout // Additional icons for sizing
} from "lucide-react";
import { ChatMessage } from '@/types';
import { TerminalMode } from '@/app/page';

interface ChatProps {
  history: ChatMessage[];
  onSend: (q: string, file?: File | null) => void;
  loading: boolean;
  mode: TerminalMode;
  setMode: (m: TerminalMode) => void;
}

export const ChatInterface = memo(({ history, onSend, loading, mode, setMode }: ChatProps) => {
  const [localText, setLocalText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Map modes to actual CSS heights
  const heightMap = {
    collapsed: '72px',
    half: '550px',
    full: '100vh'
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, mode]);

  const handleFileAction = (file: File) => {
    setSelectedFile(file);
    if (mode === 'collapsed') setMode('half');
    if (file.type.startsWith('image/')) setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!localText.trim() && !selectedFile) || loading) return;
    onSend(localText, selectedFile);
    setLocalText("");
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <motion.div 
      initial={false}
      animate={{ height: heightMap[mode] }}
      transition={{ type: "spring", damping: 30, stiffness: 200 }}
      className={`fixed bottom-0 left-0 right-0 z-50 shadow-2xl transition-colors duration-300 ${
        mode === 'full' ? 'bg-zinc-950' : 'bg-zinc-950/90 backdrop-blur-3xl border-t border-white/5'
      }`}
      style={{ marginLeft: mode === 'full' ? '0' : 'var(--sidebar-width)' }}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files?.[0]) handleFileAction(e.dataTransfer.files[0]); }}
    >
      <div className="max-w-6xl mx-auto h-full flex flex-col relative">
        
        {/* --- ENHANCED HEADER CONTROLS --- */}
        <div className="flex items-center justify-between px-8 h-12 border-b border-white/[0.02]">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => setMode(mode === 'collapsed' ? 'half' : 'collapsed')}>
            <div className="flex items-center gap-2">
               <div className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-primary animate-pulse' : 'bg-zinc-700'}`} />
               <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                 Serqet Terminal <span className="text-primary/50 ml-2">v1.5</span>
               </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Collapse to bar */}
            <button onClick={() => setMode('collapsed')} className={`p-2 rounded-lg transition-colors ${mode === 'collapsed' ? 'text-primary bg-primary/10' : 'text-zinc-600 hover:text-white'}`}>
              <ChevronDown size={16}/>
            </button>
            {/* Half Screen */}
            <button onClick={() => setMode('half')} className={`p-2 rounded-lg transition-colors ${mode === 'half' ? 'text-primary bg-primary/10' : 'text-zinc-600 hover:text-white'}`}>
              <Square size={14}/>
            </button>
            {/* Full Screen */}
            <button onClick={() => setMode('full')} className={`p-2 rounded-lg transition-colors ${mode === 'full' ? 'text-primary bg-primary/10' : 'text-zinc-600 hover:text-white'}`}>
              <Maximize2 size={14}/>
            </button>
          </div>
        </div>

        {/* --- INTELLIGENCE STREAM --- */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-6 space-y-8 scrollbar-hide">
          <AnimatePresence>
            {mode !== 'collapsed' && history.map((msg: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-zinc-900 border border-white/5 text-zinc-100' : 'bg-primary/5 border border-primary/20 text-zinc-200'}`}>
                  {msg.image && <img src={msg.image} className="mb-4 rounded-xl max-h-96 object-contain border border-white/10 mx-auto" />}
                  <div className="prose prose-invert prose-sm max-w-none text-zinc-200 prose-strong:text-primary prose-headings:italic">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* --- COMMAND CENTER INPUT --- */}
        <div className={`p-8 pt-0 transition-all ${mode === 'full' ? 'max-w-4xl mx-auto w-full' : ''}`}>
          <AnimatePresence>
            {selectedFile && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center gap-3 p-2 mb-4 bg-primary/10 border border-primary/20 rounded-xl w-fit">
                {previewUrl ? <img src={previewUrl} className="h-8 w-8 rounded object-cover" /> : <div className="p-2 bg-zinc-900 rounded"><Paperclip size={14}/></div>}
                <span className="text-[10px] font-black text-white uppercase pr-4">{selectedFile.name}</span>
                <button onClick={() => setSelectedFile(null)} className="p-1 hover:text-red-500"><X size={14}/></button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            <div className="relative flex-1 group">
              <Terminal className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-primary transition-all" size={18} />
              <input 
                value={localText} 
                onChange={(e) => setLocalText(e.target.value)} 
                placeholder="EXECUTE SYSTEM COMMAND..." 
                className="w-full bg-zinc-900/40 border border-white/5 h-16 pl-14 pr-14 rounded-2xl text-zinc-100 font-mono text-sm outline-none focus:border-primary/40 focus:bg-zinc-900/80 transition-all shadow-inner" 
              />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-all">
                <Paperclip size={20} />
              </button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileAction(e.target.files[0])} />
            </div>
            <button type="submit" disabled={loading} className="h-16 px-10 bg-primary hover:opacity-90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all border-t border-white/10">
              {loading ? <Cpu className="animate-spin" /> : "RUN"}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
});

ChatInterface.displayName = 'ChatInterface';