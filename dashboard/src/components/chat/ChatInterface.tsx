"use client";

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  ChevronUp, ChevronDown, Terminal, Image as ImageIcon, 
  X, Paperclip, UploadCloud, Cpu, Zap 
} from "lucide-react";
import { ChatMessage } from '@/types';

interface ChatProps {
  history: ChatMessage[];
  onSend: (query: string, file?: File | null) => void;
  loading: boolean;
}

export function ChatInterface({ history, onSend, loading }: ChatProps) {
  const [input, setInput] = useState("");
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll logic
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, isExpanded]);

  // Handle File Selection
  const handleFileAction = (file: File) => {
    if (file.type.startsWith('image/') || file.type === 'application/pdf') {
      setSelectedFile(file);
      setIsExpanded(true); // Expand terminal to show preview
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);



        
      }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) handleFileAction(e.target.files[0]);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  };

  // Drag and Drop Logic
  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) handleFileAction(e.dataTransfer.files[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!input.trim() && !selectedFile) || loading) return;
    
    onSend(input, selectedFile);
    
    // Clear State
    setInput("");
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsExpanded(true);
  };

  return (
    <motion.div 
      initial={false}
      animate={{ 
        height: isExpanded ? '600px' : '72px',
        backgroundColor: isDragging ? 'oklch(0.2 0.05 303.9 / 0.95)' : 'oklch(0.141 0.005 285.823 / 0.9)'
      }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="fixed bottom-0 left-0 right-0 backdrop-blur-3xl border-t border-white/5 z-50 shadow-[0_-20px_50px_rgba(0,0,0,0.5)] transition-colors duration-300"
      style={{ marginLeft: 'var(--sidebar-width)' }}
    >
      {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-primary/10 border-2 border-dashed border-primary m-4 rounded-2xl pointer-events-none"
          >
            <UploadCloud size={48} className="text-primary animate-bounce mb-2" />
            <span className="font-black text-xs tracking-widest uppercase">Drop data to brain</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-6xl mx-auto h-full flex flex-col relative">
        
        {/* --- HEADER / TOGGLE --- */}
        <div 
          className="flex items-center justify-between px-6 h-10 cursor-pointer group" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className={`h-1.5 w-1.5 rounded-full ${loading ? 'bg-primary animate-pulse' : 'bg-zinc-700'}`} />
               <span className="text-[10px] font-black tracking-[0.3em] text-zinc-500 uppercase group-hover:text-primary transition-colors">
                 {loading ? "Neural Link Active" : "Serqet Terminal"}
               </span>
            </div>
            {!isExpanded && history.length > 0 && (
              <span className="text-[9px] font-bold text-zinc-600 uppercase border-l border-zinc-800 pl-4 truncate max-w-sm">
                Last: {history[history.length - 1].text.slice(0, 60)}...
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
             {isExpanded ? <ChevronDown size={16} className="text-zinc-600"/> : <ChevronUp size={16} className="text-zinc-600"/>}
          </div>
        </div>

        {/* --- CHAT AREA --- */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-8 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {isExpanded && history.map((msg, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }} 
                animate={{ opacity: 1, x: 0 }} 
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`group relative max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed shadow-2xl ${
                  msg.role === 'user' 
                    ? 'bg-zinc-900 border border-white/5 text-zinc-100 rounded-tr-none' 
                    : 'bg-primary/5 border border-primary/20 text-zinc-200 rounded-tl-none'
                }`}>
                  {/* Image Display inside Chat */}
                  {msg.image && (
                    <div className="mb-4 rounded-xl overflow-hidden border border-white/10">
                      <img src={msg.image} alt="Visual Context" className="max-h-64 w-auto object-contain" />
                    </div>
                  )}

                  <div className="prose prose-invert prose-sm max-w-none 
                    prose-p:text-zinc-300 prose-p:leading-relaxed
                    prose-strong:text-primary prose-code:text-primary/80
                    prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/5">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>

                  <span className="absolute -bottom-5 left-0 text-[8px] font-black text-zinc-700 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    {msg.role} • {new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* --- INPUT & ATTACHMENT AREA --- */}
        <div className="p-6 pt-2 bg-transparent">
          {/* File Preview Bubble */}
          <AnimatePresence>
            {selectedFile && (
              <motion.div 
                initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                className="flex items-center gap-3 p-3 mb-3 bg-primary/10 border border-primary/30 rounded-2xl w-fit"
              >
                {previewUrl ? (
                  <img src={previewUrl} className="h-10 w-10 rounded-lg object-cover border border-primary/20" />
                ) : (
                  <div className="h-10 w-10 bg-zinc-900 rounded-lg flex items-center justify-center"><Paperclip size={16}/></div>
                )}
                <div className="pr-4">
                  <p className="text-[10px] font-black text-white uppercase truncate max-w-[150px]">{selectedFile.name}</p>
                  <p className="text-[8px] font-bold text-primary uppercase">Ready for Ingestion</p>
                </div>
                <button onClick={removeFile} className="p-1 hover:bg-white/10 rounded-full transition-colors">
                  <X size={14} className="text-zinc-500" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSubmit} className="flex items-center gap-3">
            <div className="relative flex-1 group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-3">
                <Terminal className="text-zinc-600 group-focus-within:text-primary transition-colors" size={16} />
              </div>
              
              <Input 
                value={input} 
                onChange={(e) => setInput(e.target.value)} 
                placeholder={selectedFile ? "DESCRIBE THIS FILE..." : "EXECUTE COMMAND..."} 
                className="bg-zinc-900/60 border-white/5 h-14 pl-12 pr-24 rounded-2xl text-zinc-200 font-mono text-xs tracking-wider focus:border-primary/50 focus:ring-0" 
              />
              
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 text-zinc-500 hover:text-primary transition-all hover:bg-white/5 rounded-xl"
                >
                  <Paperclip size={18} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={onFileChange} accept="image/*,application/pdf" />
              </div>
            </div>

            <Button 
              type="submit" 
              disabled={loading} 
              className="h-14 px-8 bg-primary hover:opacity-90 text-white font-black rounded-2xl border-t border-white/20 shadow-[0_10px_20px_oklch(0.627_0.265_303.9_/_0.3)]"
            >
              {loading ? <Cpu className="animate-spin" size={18} /> : "RUN"}
            </Button>
          </form>
        </div>
      </div>
    </motion.div>
  );
}