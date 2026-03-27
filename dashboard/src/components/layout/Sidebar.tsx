"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, MessageSquare, Plus, Cpu, Database, 
  Settings, ChevronRight, ChevronLeft, Trash2, 
  Activity, Zap, BarChart3, Search, ShieldCheck,
  Edit2, Check, BrainCircuit, Signal, Network,
  Save, RotateCcw, UserCog
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export function Sidebar({ 
  isCollapsed, 
  setIsCollapsed, 
  activeSessionId, 
  onSessionSelect,
  onNavigate
}: { 
  isCollapsed: boolean, 
  setIsCollapsed: (v: boolean) => void,
  activeSessionId: string,
  onSessionSelect: (id: string) => void,
  onNavigate: (tab: string) => void
}) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sysHealth, setSysHealth] = useState({ gateway: 'online', brain: 'online' });
  
  // Agent Editor State
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [tempPrompt, setTempPrompt] = useState("");

  const fetchData = async () => {
    try {
      const [sessRes, agentRes] = await Promise.all([
        fetch(`${GATEWAY_URL}/api/v1/sessions`),
        fetch(`${GATEWAY_URL}/api/v1/agents`)
      ]);
      setSessions(await sessRes.json());
      setAgents(await agentRes.json());
    } catch (err) { console.error("OS Sync Error", err); }
  };

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleOpenEditor = (agent: any) => {
    setSelectedAgent(agent);
    setTempPrompt(agent.system_prompt);
    setIsEditorOpen(true);
  };

  const saveNeuralDNA = async () => {
    await fetch(`${GATEWAY_URL}/api/v1/agents/${selectedAgent.slug}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ system_prompt: tempPrompt })
    });
    setIsEditorOpen(false);
    fetchData();
  };

  const handleNewSession = async () => {
    const res = await fetch(`${GATEWAY_URL}/api/v1/sessions`, { method: 'POST' });
    const newSession = await res.json();
    fetchData();
    onSessionSelect(newSession.session_id);
  };

  const startRename = (id: string, currentTitle: string) => {
    setEditingId(id);
    setEditValue(currentTitle);
  };

  const saveRename = async (id: string) => {
    if (!editValue.trim()) return setEditingId(null);
    await fetch(`${GATEWAY_URL}/api/v1/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: editValue })
    });
    setEditingId(null);
    fetchData();
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Confirm session termination?")) return;
    await fetch(`${GATEWAY_URL}/api/v1/sessions/${id}`, { method: 'DELETE' });
    fetchData();
  };

  return (
    <>
    <motion.aside 
      animate={{ width: isCollapsed ? '72px' : '280px' }}
      className="h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col relative z-50 shadow-2xl"
    >
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-10 bg-primary text-white rounded-full p-1 border border-black shadow-xl hover:scale-110 transition-all z-50">
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* --- HEADER --- */}
      <div className="p-6 flex items-center gap-4 cursor-pointer" onClick={() => onNavigate('overview')}>
        <div className="min-w-[40px] h-10 w-10 bg-primary rounded-xl flex items-center justify-center serqet-glow">
          <Terminal size={22} className="text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-xl uppercase italic leading-none text-white">Serqet</span>
            <span className="text-[10px] text-primary font-bold tracking-[0.3em] uppercase">Kernel v1.0.4</span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8 mt-2 scrollbar-hide">
        
        {/* --- SECTION 1: INSTANCE MANAGER --- */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            {!isCollapsed && <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Instances</p>}
            <button onClick={handleNewSession} className="p-1 hover:bg-zinc-800 rounded text-primary transition-colors"><Plus size={16} /></button>
          </div>
          
          <div className="space-y-1">
            {sessions.map(s => (
              <div 
                key={s.session_id} 
                onClick={() => !editingId && onSessionSelect(s.session_id)}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group relative 
                  ${activeSessionId === s.session_id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-zinc-900 border border-transparent'}`}
              >
                <MessageSquare size={16} className={activeSessionId === s.session_id ? 'text-primary' : 'text-zinc-600'} />
                
                {!isCollapsed && (
                  editingId === s.session_id ? (
                    <input 
                      autoFocus
                      className="bg-zinc-800 text-xs font-bold text-white outline-none rounded px-1 w-full"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveRename(s.session_id)}
                      onBlur={() => saveRename(s.session_id)}
                    />
                  ) : (
                    <>
                      <span className="text-xs font-bold truncate text-zinc-300 flex-1">{s.title}</span>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => { e.stopPropagation(); startRename(s.session_id, s.title)}} className="p-1 hover:text-primary"><Edit2 size={12} /></button>
                        <button onClick={(e) => handleDeleteSession(e, s.session_id)} className="p-1 hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </>
                  )
                )}
              </div>
            ))}
          </div>
        </section>

        {/* --- SECTION 2: SPECIALIST REGISTRY (Agent Editor) --- */}
        <section className="space-y-3 pt-4 border-t border-zinc-900">
          {!isCollapsed && <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Specialist Registry</p>}
          <div className="space-y-1">
            {agents.map(agent => (
              <div 
                key={agent.slug}
                onClick={() => handleOpenEditor(agent)}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-primary/10 transition-all cursor-pointer group"
              >
                <div className="text-zinc-500 group-hover:text-primary transition-colors">
                   <BrainCircuit size={16} />
                </div>
                {!isCollapsed && (
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className="text-xs font-black text-zinc-300 uppercase truncate">{agent.name}</span>
                    <span className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">DNA: {agent.slug}</span>
                  </div>
                )}
                {!isCollapsed && <UserCog size={12} className="text-zinc-800 group-hover:text-zinc-500 transition-colors" />}
              </div>
            ))}
          </div>
        </section>

        {/* --- SECTION 3: COGNITIVE & SUB-ROUTINES --- */}
        {!isCollapsed && (
          <section className="space-y-4 pt-4 border-t border-zinc-900">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Kernel Metrics</p>
            <div className="space-y-4 px-2">
               <div className="space-y-2">
                 <div className="flex justify-between items-center text-[9px] font-black text-zinc-500 uppercase tracking-tighter">
                    <span>Context Depth</span>
                    <span className="text-primary font-mono text-[8px]">4.2k VEC</span>
                 </div>
                 <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[65%] shadow-[0_0_8px_oklch(0.627_0.265_303.9)]" />
                 </div>
               </div>
               <WorkerStatus icon={<BarChart3 size={14}/>} label="Market Logic" status="Live" color="text-emerald-500" />
               <WorkerStatus icon={<Search size={14}/>} label="Web-Scraper" status="Sleeping" color="text-zinc-600" />
            </div>
          </section>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="p-4 border-t border-zinc-900 mt-auto bg-zinc-950/80 backdrop-blur-md">
        <button onClick={() => onNavigate('settings')} className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-zinc-900 transition-all text-zinc-500 group">
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-700" />
          {!isCollapsed && (
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Settings</span>
              <span className="text-[9px] font-bold text-zinc-600">v0.0.1</span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>

    {/* --- NEURAL DNA EDITOR MODAL --- */}
    <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
      <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-2xl shadow-2xl rounded-3xl">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg">
              <BrainCircuit className="text-primary" size={20} />
            </div>
            <div>
              <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">
                Neural DNA: {selectedAgent?.name}
              </DialogTitle>
              <DialogDescription className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">
                Modifying Kernel Instructions for specialist [{selectedAgent?.slug}]
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <textarea 
            value={tempPrompt}
            onChange={(e) => setTempPrompt(e.target.value)}
            className="w-full h-96 bg-black border border-zinc-800 rounded-2xl p-6 font-mono text-xs leading-relaxed text-emerald-500/80 focus:border-primary/50 outline-none shadow-inner resize-none scrollbar-hide"
            spellCheck={false}
          />
        </div>

        <div className="flex justify-between items-center mt-2">
           <p className="text-[9px] text-zinc-600 italic max-w-xs uppercase font-bold tracking-tight">
             Caution: Prompt injection detected. Ensure directives are logic-gated.
           </p>
           <div className="flex gap-2">
              <button 
                onClick={() => setIsEditorOpen(false)}
                className="px-4 py-2 text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors"
              >
                Abort
              </button>
              <button 
                onClick={saveNeuralDNA}
                className="px-6 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-lg hover:opacity-90 flex items-center gap-2 border-t border-white/20"
              >
                <Save size={14}/> Sync DNA
              </button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

function WorkerStatus({ icon, label, status, color }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={color}>{icon}</div>
        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{label}</span>
      </div>
      <span className={`text-[8px] font-black uppercase tracking-tighter ${color} bg-zinc-900 px-1.5 py-0.5 rounded`}>
        {status}
      </span>
    </div>
  );
}