"use client";

import React, { useState, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  Terminal, X, Paperclip, Cpu, Zap, Mic, MicOff,
  Maximize2, Minimize2, ChevronDown, ChevronUp,
  Square, Volume2,
  VolumeX
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
  
  // Voice States
  const [isRecording, setIsRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Hardware Refs
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioStream = useRef<MediaStream | null>(null); // Track the active mic stream
  const audioChunks = useRef<Blob[]>([]);
  const audioCtx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number | null>(null);

  const heightMap = { collapsed: '72px', half: '550px', full: '100vh' };
  const [isMuted, setIsMuted] = useState(false);


  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history, mode]);

  // --- AUTO-PLAY SERQET VOICE ---
useEffect(() => {
  const lastMsg = history[history.length - 1];
  if (lastMsg?.role === 'serqet' && lastMsg.audio_url && !isMuted) {
    const audio = new Audio(lastMsg.audio_url);
    
    // Attempt to play and catch the error silently if the user hasn't interacted yet
    audio.play().catch(e => {
      console.warn("Autoplay blocked. User must interact first.");
    });
  }
}, [history, isMuted]);

  // --- VOICE RECORDING LOGIC ---
  const startRecording = async () => {
    if (isRecording) return; // Prevent double-triggering

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioStream.current = stream;
      
      // Setup Visualizer
      audioCtx.current = new AudioContext();
      analyser.current = audioCtx.current.createAnalyser();
      const source = audioCtx.current.createMediaStreamSource(stream);
      source.connect(analyser.current);
      analyser.current.fftSize = 64;
      
      const updateLevel = () => {
        if (!analyser.current) return;
        const dataArray = new Uint8Array(analyser.current.frequencyBinCount);
        analyser.current.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAudioLevel(avg);
        animationRef.current = requestAnimationFrame(updateLevel);
      };
      updateLevel();

      // Setup Recorder
      mediaRecorder.current = new MediaRecorder(stream);
      audioChunks.current = [];
      mediaRecorder.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      mediaRecorder.current.onstop = () => {
        if (audioChunks.current.length > 0) {
          const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
          const file = new File([audioBlob], "voice_command.webm", { type: 'audio/webm' });
          onSend("Vocal Command Received.", file);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
      if (mode === 'collapsed') setMode('half');
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  // --- STOP RECORDING (STABILIZED) ---
  const stopRecording = useCallback(() => {
    if (!isRecording) return;

    // 1. Stop Recorder
    if (mediaRecorder.current && mediaRecorder.current.state !== "inactive") {
      mediaRecorder.current.stop();
    }

    // 2. Kill Hardware Tracks (This removes the "recording" icon in browser tab)
    if (audioStream.current) {
      audioStream.current.getTracks().forEach(track => track.stop());
      audioStream.current = null;
    }

    // 3. Stop Visualizer
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioCtx.current) audioCtx.current.close();
    
    setIsRecording(false);
    setAudioLevel(0);
  }, [isRecording]);

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
        
        {/* --- HEADER --- */}
        <div className="flex items-center justify-between px-8 h-12 border-b border-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
               <div className={`h-1.5 w-1.5 rounded-full ${loading || isRecording ? 'bg-primary animate-pulse' : 'bg-zinc-700'}`} />
               <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase">
                 {isRecording ? "Listening..." : loading ? "Neural Link Active" : "Serqet Kernel Terminal"}
               </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button onClick={() => setMode('collapsed')} className={`p-2 rounded-lg ${mode === 'collapsed' ? 'text-white' : 'text-zinc-400'}`} title="Collapse"><ChevronDown size={16}/></button>
            <button onClick={() => setMode('half')} className={`p-2 rounded-lg ${mode === 'half' ? 'text-white' : 'text-zinc-400'}`} title="Half Screen"><Square size={14}/></button>
            <button onClick={() => setMode('full')} className={`p-2 rounded-lg ${mode === 'full' ? 'text-white' : 'text-zinc-400'}`} title="Full Screen"><Maximize2 size={14}/></button>
            <button 
              onClick={() => setIsMuted(!isMuted)} 
              className={`p-2 rounded-lg transition-colors ${isMuted ? 'text-red-500 bg-red-500/10' : 'text-zinc-400 hover:text-white'}`}
              title={isMuted ? "Enable Voice" : "Mute Voice"}
            >
              {isMuted ? <VolumeX size={16}/> : <Volume2 size={16}/>}
            </button>   
          </div>
        </div>

        {/* --- STREAM --- */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-10 py-6 space-y-8 scrollbar-hide">
          <AnimatePresence mode="popLayout">
            {mode !== 'collapsed' && history.map((msg: any, i: number) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-zinc-900 border border-white/5 text-zinc-100' : 'bg-primary/5 border border-primary/20 text-zinc-200'}`}>
                  {msg.image && <img src={msg.image} className="mb-4 rounded-xl max-h-96 object-contain mx-auto" />}
                  <div className="prose prose-invert prose-sm max-w-none text-zinc-200 prose-p:leading-relaxed prose-strong:text-primary">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                  {msg.role === 'serqet' && (msg as any).audio_url && (
                    <div className="mt-3 flex items-center gap-2 text-[9px] font-black text-primary uppercase tracking-widest opacity-50">
                      <Volume2 size={12}/> Vocal Synthesis Active
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* --- INPUT AREA --- */}
        <div className={`p-8 pt-0 transition-all ${mode === 'full' ? 'max-w-4xl mx-auto w-full' : ''}`}>
          
          {/* Audio Visualizer Overlay */}
          <AnimatePresence>
            {isRecording && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center justify-center gap-1.5 mb-6 h-10">
                {[...Array(24)].map((_, i) => (
                  <motion.div
                    key={i}
                    animate={{ height: `${Math.max(15, Math.random() * audioLevel * 3)}%` }}
                    className="w-1.5 bg-primary rounded-full shadow-[0_0_15px_oklch(0.627_0.265_303.9_/_0.5)]"
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* File Badge */}
          <AnimatePresence>
            {selectedFile && (
              <motion.div initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 10, opacity: 0 }} className="flex items-center gap-3 p-2 mb-4 bg-primary/10 border border-primary/20 rounded-xl w-fit">
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
                placeholder={selectedFile ? "DESCRIBE DATA..." : isRecording ? "LISTENING..." : "EXECUTE COMMAND..."} 
                className="w-full bg-zinc-900/40 border border-white/5 h-16 pl-14 pr-24 rounded-2xl text-zinc-100 font-mono text-sm outline-none focus:border-primary/40 focus:bg-zinc-900/80 transition-all" 
              />
              
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* MIC BUTTON WITH IMPROVED HANDLERS */}
                <button 
                  type="button"
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording} // Crucial: stops if mouse drags away
                  className={`p-2.5 rounded-xl transition-all ${isRecording ? 'text-white bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]' : 'text-zinc-600 hover:text-primary hover:bg-primary/10'}`}
                >
                  {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                </button>
                
                <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2.5 text-zinc-600 hover:text-primary hover:bg-primary/10 rounded-xl transition-all">
                  <Paperclip size={20} />
                </button>
                <input type="file" ref={fileInputRef} className="hidden" onChange={(e) => e.target.files?.[0] && handleFileAction(e.target.files[0])} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="h-16 px-10 bg-primary hover:opacity-90 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl transition-all">
              {loading ? <Cpu className="animate-spin" /> : "RUN"}
            </button>
          </form>
        </div>
      </div>
    </motion.div>
  );
});

ChatInterface.displayName = 'ChatInterface';