"use client";

import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, MessageSquare, Plus, Cpu, Database, 
  Settings, ChevronRight, ChevronLeft, Trash2, 
  Activity, Zap, BarChart3, Search, ShieldCheck,
  Edit2, Check, BrainCircuit, Signal, Network,
  Save, RotateCcw, UserCog, Boxes, ChevronDown,
  Globe, Shield, SearchCode, Hash, X, Clock
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Specialist Groupings
const CLUSTERS = {
  Value: { icon: <Zap size={12}/>, color: "text-emerald-500", agents: ["arbiter", "finance"] },
  Intel: { icon: <Globe size={12}/>, color: "text-cyan-500", agents: ["researcher", "oracle"] },
  Ops: { icon: <Boxes size={12}/>, color: "text-purple-500", agents: ["tasks", "manager", "builder"] },
  Bio: { icon: <Activity size={12}/>, color: "text-red-500", agents: ["health"] },
  Sec: { icon: <Shield size={12}/>, color: "text-blue-500", agents: ["vanguard", "jobs"] },
};

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
  // State
  const [sessions, setSessions] = useState<any[]>([]);
  const [agents, setAgents] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSessionsExpanded, setIsSessionsExpanded] = useState(true);
  const [isRegistryExpanded, setIsRegistryExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [latency, setLatency] = useState<number | null>(null);
  const [sysHealth, setSysHealth] = useState({ gateway: 'online', brain: 'online' });

  // Agent Editor State
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [tempPrompt, setTempPrompt] = useState("");

  // --- DATA SYNC ---
  const fetchData = async () => {
    try {
      const [sessRes, agentRes] = await Promise.all([
        fetch(`${GATEWAY_URL}/api/v1/sessions`),
        fetch(`${GATEWAY_URL}/api/v1/agents`)
      ]);
      setSessions(await sessRes.json());
      setAgents(await agentRes.json());
    } catch (err) { console.error("System Sync Error", err); }
  };

  useEffect(() => { 
    fetchData(); 
    const interval = setInterval(fetchData, 30000);
    const healthInterval = setInterval(checkPulse, 10000);
    return () => { clearInterval(interval); clearInterval(healthInterval); };
  }, []);

  const checkPulse = async () => {
    // const start = Date.now();
    // try {
    //   const res = await fetch(`${GATEWAY_URL}/health`);
    //   if (res.ok) {
    //     setLatency(Date.now() - start);
    //     setSysHealth(prev => ({ ...prev, gateway: 'online' }));
    //   }
    // } catch {
    //   setSysHealth(prev => ({ ...prev, gateway: 'offline' }));
    //   setLatency(null);
    // }
  };

  // --- LOGIC: SESSIONS ---
  const groupedSessions = useMemo(() => {
    const filtered = sessions.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const now = new Date();
    const today = filtered.filter(s => {
      const d = new Date(s.UpdatedAt);
      return d.toDateString() === now.toDateString();
    });
    const older = filtered.filter(s => !today.includes(s));
    return { today, older };
  }, [sessions, searchQuery]);

  const handleNewSession = async () => {
    const res = await fetch(`${GATEWAY_URL}/api/v1/sessions`, { method: 'POST' });
    const newSession = await res.json();
    fetchData();
    onSessionSelect(newSession.session_id);
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

  // --- LOGIC: AGENTS ---
  const groupedAgents = useMemo(() => {
    return Object.entries(CLUSTERS).map(([name, meta]) => ({
      name,
      ...meta,
      list: agents.filter(a => meta.agents.includes(a.slug))
    })).filter(cluster => cluster.list.length > 0);
  }, [agents]);

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

  return (
    <>
    <motion.aside 
      animate={{ width: isCollapsed ? '72px' : '280px' }}
      className="h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col relative z-50 shadow-2xl"
    >
      {/* --- TOGGLE --- */}
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
        
        {/* --- SECTION 1: DYNAMIC SESSION EXPLORER --- */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            {!isCollapsed && (
               <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setIsSessionsExpanded(!isSessionsExpanded)}>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-white transition-colors">Threads</p>
                  <ChevronDown size={10} className={`text-zinc-400 transition-transform ${isSessionsExpanded ? '' : '-rotate-90'}`} />
               </div>
            )}
            <button onClick={handleNewSession} className="text-primary hover:text-white"><Plus size={16} /></button>
          </div>
          
          <AnimatePresence>
            {isSessionsExpanded && !isCollapsed && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-4 overflow-hidden">
                <div className="relative px-1">
                  <SearchCode className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-primary" size={12} />
                  <input 
                    value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="LOCATE_CONTEXT..."
                    className="w-full bg-zinc-900/50 border border-zinc-900 rounded-lg py-1.5 pl-8 text-[10px] font-mono text-zinc-500 outline-none focus:border-primary/30"
                  />
                </div>

                <div className="max-h-60 overflow-y-auto space-y-4 pr-1 scrollbar-hide">
                  {groupedSessions.today.length > 0 && (
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest px-2 mb-1 flex items-center gap-1"><Clock size={8}/> Recent</p>
                       {groupedSessions.today.map(s => (
                         <SessionItem key={s.session_id} session={s} active={activeSessionId === s.session_id} onSelect={onSessionSelect} onRename={(id, val) => {setEditingId(id); setEditValue(val);}} isEditing={editingId === s.session_id} editValue={editValue} setEditValue={setEditValue} saveRename={saveRename} onDelete={handleDeleteSession} />
                       ))}
                    </div>
                  )}
                  {groupedSessions.older.length > 0 && (
                    <div className="space-y-1">
                       <p className="text-[8px] font-black text-zinc-700 uppercase tracking-widest px-2 mb-1">Cold Storage</p>
                       {groupedSessions.older.map(s => (
                         <SessionItem key={s.session_id} session={s} active={activeSessionId === s.session_id} onSelect={onSessionSelect} onRename={(id, val) => {setEditingId(id); setEditValue(val);}} isEditing={editingId === s.session_id} editValue={editValue} setEditValue={setEditValue} saveRename={saveRename} onDelete={handleDeleteSession} />
                       ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* --- SECTION 2: SPECIALIST REGISTRY --- */}
        <section className="pt-4 border-t border-zinc-900">
          <div className="flex justify-between items-center px-2 mb-4 cursor-pointer group" onClick={() => setIsRegistryExpanded(!isRegistryExpanded)}>
            {!isCollapsed && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest group-hover:text-white transition-colors">Specialists</span>
                <ChevronDown size={10} className={`text-zinc-400 transition-transform ${isRegistryExpanded ? '' : '-rotate-90'}`} />
              </div>
            )}
            {isCollapsed && <BrainCircuit size={16} className="text-zinc-400 mx-auto" />}
          </div>

          <AnimatePresence>
            {isRegistryExpanded && !isCollapsed && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-5 px-1 overflow-hidden">
                {groupedAgents.map((cluster) => (
                  <div key={cluster.name} className="relative pl-4 border-l border-zinc-900">
                    <div className="absolute left-[-1px] top-0 h-4 w-[1px] bg-primary" />
                    <div className={`flex items-center gap-2 mb-2 ${cluster.color} opacity-60`}>
                      {cluster.icon}
                      <span className="text-[8px] font-black uppercase tracking-[0.2em]">{cluster.name}</span>
                    </div>
                    <div className="space-y-1">
                      {cluster.list.map(agent => (
                        <div key={agent.slug} onClick={() => handleOpenEditor(agent)} className="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-900 transition-all cursor-pointer group">
                          <span className="text-[11px] font-bold text-zinc-400 group-hover:text-white uppercase tracking-tighter">{agent.slug}</span>
                          <UserCog size={10} className="text-zinc-800 group-hover:text-zinc-500 transition-colors" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* --- SECTION 3: SYSTEM METRICS --- */}
        {!isCollapsed && (
          <section className="space-y-4 pt-4 border-t border-zinc-900 pb-10">
            <p className="text-[10px] font-black text-zinc-700 uppercase tracking-widest px-2">Sub-Routines</p>
            <div className="space-y-4 px-2">
               <div className="space-y-2">
                 <div className="flex justify-between items-center text-[9px] font-black text-zinc-600 uppercase">
                    <span>Context</span>
                    <span className="text-primary font-mono">4.2k VEC</span>
                 </div>
                 <div className="h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[65%] shadow-[0_0_8px_oklch(0.627_0.265_303.9)]" />
                 </div>
               </div>
               <div className="flex justify-between items-center bg-zinc-900/30 p-2 rounded-lg border border-zinc-900">
                  <div className="flex items-center gap-2">
                    <Signal size={12} className={latency && latency < 100 ? "text-emerald-500" : "text-amber-500"}/>
                    <span className="text-[9px] font-black text-zinc-600 uppercase">Link Pulse</span>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-500">{latency ? `${latency}ms` : "---"}</span>
               </div>
               <WorkerStatus icon={<BarChart3 size={14}/>} label="Market Poller" status="Live" color="text-emerald-500" />
            </div>
          </section>
        )}
      </div>

      {/* --- FOOTER --- */}
      <div className="p-4 border-t border-zinc-900 mt-auto bg-zinc-950/90 backdrop-blur-md">
        <button onClick={() => onNavigate('settings')} className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-zinc-900 transition-all text-zinc-500 group">
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-700" />
          {!isCollapsed && (
            <div className="flex flex-col items-start">
              <span className="text-[10px] font-black uppercase tracking-widest text-white">System Settings</span>
              <span className="text-[9px] font-bold text-zinc-600 hover:text-primary transition-colors">Agents & Keys</span>
            </div>
          )}
        </button>
      </div>
    </motion.aside>

    {/* --- NEURAL DNA EDITOR MODAL --- */}
    <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
      <DialogContent className="bg-zinc-950 border-zinc-900 text-white max-w-2xl shadow-2xl rounded-3xl p-8">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/20 rounded-lg"><BrainCircuit className="text-white" size={20} /></div>
            <div>
              <DialogTitle className="text-xl font-black italic uppercase tracking-tighter">Specialist Prompt: {selectedAgent?.name}</DialogTitle>
              <DialogDescription className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Sequencing Specialist [{selectedAgent?.slug}]</DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="py-4">
          <textarea value={tempPrompt} onChange={(e) => setTempPrompt(e.target.value)} spellCheck={false} className="w-full h-96 bg-black border border-zinc-800 rounded-2xl p-6 font-mono text-xs leading-relaxed text-emerald-500/80 focus:border-primary/50 outline-none shadow-inner resize-none scrollbar-hide" />
        </div>
        <div className="flex justify-between items-center mt-2">
           <p className="text-[8px] text-zinc-600 italic max-w-xs uppercase font-bold tracking-tight">Warning: Deployment of malformed DNA may cause kernel instability.</p>
           <div className="flex gap-2">
              <button onClick={() => setIsEditorOpen(false)} className="px-4 py-2 text-[10px] font-black uppercase text-zinc-500 hover:text-white transition-colors">Abort</button>
              <button onClick={saveNeuralDNA} className="px-6 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-lg border-t border-white/20"><Save size={14} className="mr-2 inline"/>Sync</button>
           </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}

// --- SUB-COMPONENTS ---

function SessionItem({ session, active, onSelect, onRename, isEditing, editValue, setEditValue, saveRename, onDelete }: any) {
  return (
    <div onClick={() => !isEditing && onSelect(session.session_id)} className={`flex items-center gap-3 p-2.5 rounded-xl transition-all cursor-pointer group border ${active ? 'bg-primary/10 border-primary/20 shadow-[0_0_15px_rgba(168,85,247,0.1)]' : 'hover:bg-zinc-900 border-transparent'}`}>
      <Hash size={14} className={active ? 'text-primary' : 'text-zinc-800'} />
      {isEditing ? (
        <input autoFocus className="bg-zinc-800 text-[11px] font-bold text-white outline-none rounded px-1 w-full" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveRename(session.session_id)} onBlur={() => saveRename(session.session_id)} />
      ) : (
        <>
          <span className={`text-[11px] font-bold truncate flex-1 ${active ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-300'}`}>{session.title}</span>
          <div className="flex opacity-0 group-hover:opacity-100 transition-all gap-1">
            <button onClick={(e) => { e.stopPropagation(); onRename(session.session_id, session.title); }} className="p-1 text-zinc-700 hover:text-primary"><Edit2 size={10}/></button>
            <button onClick={(e) => onDelete(e, s.session_id)} className="p-1 text-zinc-700 hover:text-red-500"><Trash2 size={10}/></button>
          </div>
        </>
      )}
    </div>
  );
}

function WorkerStatus({ icon, label, status, color }: any) {
  return (
    <div className="flex items-center justify-between group">
      <div className="flex items-center gap-3">
        <div className={color}>{icon}</div>
        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
      </div>
      <span className={`text-[8px] font-black uppercase tracking-tighter ${color} bg-zinc-900 px-1.5 py-0.5 rounded`}>{status}</span>
    </div>
  );
}