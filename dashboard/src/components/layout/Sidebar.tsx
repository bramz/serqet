"use client";

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, MessageSquare, Plus, Cpu, Database, 
  Settings, ChevronRight, ChevronLeft, Trash2, 
  Activity, Zap, BarChart3, Search, ShieldCheck,
  Edit2, Check, X, Sliders, BrainCircuit
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function Sidebar({ 
  isCollapsed, 
  setIsCollapsed, 
  activeSessionId, 
  onSessionSelect 
}: { 
  isCollapsed: boolean, 
  setIsCollapsed: (v: boolean) => void,
  activeSessionId: string,
  onSessionSelect: (id: string) => void
}) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [sysHealth, setSysHealth] = useState({ gateway: 'online', brain: 'online' });
  
  const fetchSessions = async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/api/v1/sessions`);
      const data = await res.json();
      setSessions(data);
      if (!activeSessionId && data.length > 0) onSessionSelect(data[0].session_id);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSessions(); }, []);

  const handleNewSession = async () => {
    const res = await fetch(`${GATEWAY_URL}/api/v1/sessions`, { method: 'POST' });
    const newSession = await res.json();
    await fetchSessions();
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
    fetchSessions();
  };

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Confirm session termination?")) return;
    await fetch(`${GATEWAY_URL}/api/v1/sessions/${id}`, { method: 'DELETE' });
    await fetchSessions();
  };

  return (
    <motion.aside 
      animate={{ width: isCollapsed ? '72px' : '300px' }}
      className="h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col relative z-50 shadow-2xl"
    >
      <button onClick={() => setIsCollapsed(!isCollapsed)} className="absolute -right-3 top-10 bg-primary text-white rounded-full p-1 border border-black shadow-xl hover:scale-110 transition-all z-50">
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* --- HEADER --- */}
      <div className="p-6 flex items-center gap-4">
        <div className="min-w-[40px] h-10 w-10 bg-primary rounded-xl flex items-center justify-center serqet-glow">
          <Terminal size={22} className="text-white" />
        </div>
        {!isCollapsed && (
          <div className="flex flex-col">
            <span className="font-black tracking-tighter text-xl uppercase italic leading-none text-white">Serqet</span>
            <span className="text-[10px] text-primary font-bold tracking-[0.3em] uppercase"></span>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8 mt-2 scrollbar-hide">
        
        {/* --- SECTION 1: SESSION MANAGER --- */}
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
                    <div className="flex-1 flex items-center gap-1">
                      <input 
                        autoFocus
                        className="bg-zinc-800 text-xs font-bold text-white outline-none rounded px-1 w-full"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && saveRename(s.session_id)}
                      />
                      <button onClick={() => saveRename(s.session_id)}><Check size={12} className="text-emerald-500"/></button>
                    </div>
                  ) : (
                    <>
                      <span className="text-xs font-bold truncate text-zinc-300 flex-1">{s.title}</span>
                      <div className="flex opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => startRename(s.session_id, s.title)} className="p-1 hover:text-primary"><Edit2 size={12} /></button>
                        <button onClick={(e) => handleDeleteSession(e, s.session_id)} className="p-1 hover:text-red-500"><Trash2 size={12} /></button>
                      </div>
                    </>
                  )
                )}
              </div>
            ))}
          </div>
        </section>

        {/* --- SECTION 2: COGNITIVE CONTROLS (Sidebar Exclusive) --- */}
        {!isCollapsed && (
          <section className="space-y-4 pt-4 border-t border-zinc-900">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Cognitive Params</p>
            <div className="space-y-4 px-2">
               <div className="space-y-2">
                 <div className="flex justify-between items-center text-[9px] font-black text-zinc-500 uppercase">
                    <span>Context Depth</span>
                    <span className="text-white"></span>
                 </div>
                 <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[45%]" />
                 </div>
               </div>
               <button className="w-full flex items-center justify-between p-2 bg-zinc-900 border border-zinc-800 rounded-lg group hover:border-primary/50 transition-all">
                 <div className="flex items-center gap-2">
                   <BrainCircuit size={12} className="text-zinc-500 group-hover:text-primary"/>
                   <span className="text-[10px] font-black text-zinc-400 uppercase">Specialist Lock</span>
                 </div>
                 <span className="text-[8px] font-black text-zinc-600 uppercase">Auto</span>
               </button>
            </div>
          </section>
        )}

        {/* --- SECTION 3: WORKER THREADS --- */}
        {!isCollapsed && (
          <section className="space-y-4 pt-4 border-t border-zinc-900">
            <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2">Sub-Routines</p>
            <div className="space-y-3 px-2">
              <WorkerStatus icon={<BarChart3 size={14}/>} label="Market Poller" status="Live" color="text-emerald-500" />
              <WorkerStatus icon={<ShieldCheck size={14}/>} label="Mem-Sync" status="Standby" color="text-cyan-500" />
            </div>
          </section>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="p-4 border-t border-zinc-900 mt-auto bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-zinc-900 transition-colors text-zinc-500 group cursor-pointer">
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-700" />
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Brain Settings</span>
              <span className="text-[9px] font-bold text-zinc-600">v0.0.1</span>
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}

function WorkerStatus({ icon, label, status, color }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={color}>{icon}</div>
        <span className="text-[11px] font-bold text-zinc-500 uppercase">{label}</span>
      </div>
      <span className={`text-[8px] font-black uppercase tracking-tighter ${color} bg-zinc-900 px-1.5 py-0.5 rounded`}>
        {status}
      </span>
    </div>
  );
}