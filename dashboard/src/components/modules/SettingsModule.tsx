"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { 
  BrainCircuit, Save, RotateCcw, ShieldCheck, 
  Database, Cpu, Key, Palette, Sliders, 
  Eye, RefreshCw, Wrench, Fingerprint,
  Monitor, Zap, Activity, ShieldAlert
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

type SettingsTab = 'agents' | 'engine' | 'memory' | 'interface';

export function SettingsModule() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('agents');
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [tools, setTools] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('dark');

  // --- THEME ENGINE ---
  const applyTheme = useCallback((themeName: string) => {
    const themes = ['dark', 'theme-matrix', 'theme-amber', 'theme-cyan'];
    const root = window.document.documentElement;
    root.classList.remove(...themes);
    root.classList.add(themeName);
    setCurrentTheme(themeName);
    localStorage.setItem('serqet_theme', themeName);
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem('serqet_theme') || 'dark';
    applyTheme(savedTheme);
    fetchAgents();
  }, [applyTheme]);

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/api/v1/agents`);
      const data = await res.json();
      setAgents(data);
      // Initialize if needed
      if (data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0]);
        setPrompt(data[0].system_prompt);
        setTools(data[0].allowed_tools);
      }
    } catch (e) { console.error("Agent fetch failed", e); }
  };

  const handleSelectAgent = (agent: any) => {
    setSelectedAgent(agent);
    setPrompt(agent.system_prompt);
    setTools(agent.allowed_tools);
  };

  const handleSaveDNA = async () => {
    setIsSaving(true);
    try {
      // Sends BOTH system_prompt and allowed_tools to the updated Go API
      await fetch(`${GATEWAY_URL}/api/v1/agents/${selectedAgent.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            system_prompt: prompt, 
            allowed_tools: tools 
        })
      });
      await fetchAgents();
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8 max-w-7xl mx-auto pb-40 px-4 font-sans">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">Settings<span className="text-primary"></span></h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2"></p>
        </div>
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shadow-2xl">
          <NavTab active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} icon={<BrainCircuit size={14}/>} label="Agents" />
          <NavTab active={activeTab === 'engine'} onClick={() => setActiveTab('engine')} icon={<Cpu size={14}/>} label="Engine" />
          <NavTab active={activeTab === 'memory'} onClick={() => setActiveTab('memory')} icon={<Database size={14}/>} label="Memory" />
          <NavTab active={activeTab === 'interface'} onClick={() => setActiveTab('interface')} icon={<Palette size={14}/>} label="UI/UX" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {activeTab === 'agents' && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-4 italic">Specialist Registry</p>
              {agents.map(a => (
                <button key={a.slug} onClick={() => handleSelectAgent(a)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedAgent?.slug === a.slug ? 'bg-primary/10 border-primary text-white' : 'bg-zinc-900/40 border-zinc-800 text-zinc-500 hover:border-zinc-700'}`}>
                  <p className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-50">{a.slug}</p>
                  <p className="text-sm font-bold uppercase tracking-tight">{a.name}</p>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'interface' && (
            <div className="p-4 bg-zinc-900/40 border border-zinc-800 rounded-2xl space-y-6">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Skin</p>
              <div className="flex items-center gap-3">
                 <div className={`h-3 w-3 rounded-full bg-primary shadow-[0_0_10px_var(--primary)]`} />
                 <span className="text-xs font-bold text-white uppercase tracking-tighter">
                    {currentTheme.replace('theme-', '')} Protocol
                 </span>
              </div>
            </div>
          )}

          <Card className="p-4 bg-zinc-950 border-zinc-900 shadow-xl">
             <div className="flex items-center gap-2 text-zinc-500 mb-4">
                <ShieldCheck size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Brain Integrity</span>
             </div>
             <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter">Status: Verified</p>
             <p className="text-[10px] text-emerald-500 font-black uppercase tracking-tighter mt-1">Permission: ROOT_AGENT</p>
          </Card>
        </div>

        <div className="col-span-12 lg:col-span-9">
          <AnimatePresence mode="wait">
            {activeTab === 'agents' && selectedAgent && (
              <motion.div key="agents" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="bg-zinc-950 border-zinc-800 p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
                  <div className="flex justify-between items-center relative z-10">
                    <div className="flex items-center gap-3">
                       <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><ShieldCheck size={20} /></div>
                       <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Modifying [{selectedAgent.slug}] Agent</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setPrompt(selectedAgent.system_prompt); setTools(selectedAgent.allowed_tools); }} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"><RotateCcw size={18}/></button>
                      <button onClick={handleSaveDNA} disabled={isSaving} className="flex items-center gap-3 px-8 py-2.5 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:opacity-90 transition-all border-t border-white/20 shadow-lg">
                        {isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>} {isSaving ? "Syncing..." : "Sync"}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-6 relative z-10">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 ml-1"><Fingerprint size={12}/> Instructions</label>
                      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} spellCheck={false} className="w-full h-80 bg-black border border-zinc-800 rounded-2xl p-6 font-mono text-xs leading-relaxed text-primary/80 focus:border-primary/50 outline-none shadow-inner resize-none scrollbar-hide" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 ml-1"><Wrench size={12}/> Allowed Tooling (CSV)</label>
                      <input value={tools} onChange={(e) => setTools(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-primary outline-none focus:border-primary/50" placeholder="web_research, sync_portfolio..." />
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}

            {activeTab === 'interface' && (
              <motion.div key="interface" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <Card className="bg-zinc-950 border-zinc-800 p-8 space-y-12 shadow-2xl">
                  <section className="space-y-6">
                    <div className="flex items-center gap-3 border-b border-zinc-900 pb-4">
                      <Palette className="text-primary" size={20} />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Neural Skin Protocols</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <ThemeOption label="Standard" active={currentTheme === 'dark'} onClick={() => applyTheme('dark')} color="bg-zinc-800" />
                      <ThemeOption label="Matrix" active={currentTheme === 'theme-matrix'} onClick={() => applyTheme('theme-matrix')} color="bg-[#00FF41]" isMatrix />
                      <ThemeOption label="Amber" active={currentTheme === 'theme-amber'} onClick={() => applyTheme('theme-amber')} color="bg-orange-500" />
                      <ThemeOption label="Cyan" active={currentTheme === 'theme-cyan'} onClick={() => applyTheme('theme-cyan')} color="bg-cyan-400" />
                    </div>
                  </section>

                  <section className="space-y-6 pt-4">
                    <div className="flex items-center gap-3">
                      <Monitor className="text-primary" size={20} />
                      <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Visual Distortion</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-3">
                         <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Atmosphere Opacity</p>
                         <input type="range" className="w-full accent-primary h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                      </div>
                      <div className="space-y-3">
                         <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pulse Intensity</p>
                         <input type="range" className="w-full accent-primary h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                      </div>
                    </div>
                  </section>
                </Card>
              </motion.div>
            )}

            {/* Other tabs follow similar motion patterns... */}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function NavTab({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-xl border-t border-white/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
      {icon} {label}
    </button>
  );
}

function ThemeOption({ label, active, onClick, color, isMatrix }: any) {
  return (
    <button onClick={onClick} className={`p-6 rounded-3xl border transition-all flex flex-col items-center gap-3 relative ${active ? 'border-primary bg-primary/5 shadow-2xl' : 'border-zinc-900 bg-black/40 hover:border-zinc-700'}`}>
      <div className={`w-10 h-10 rounded-full ${color} ${isMatrix ? 'shadow-[0_0_15px_#00FF41] border border-white/20' : ''}`} />
      <span className={`text-[10px] font-black uppercase tracking-tighter ${active ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
      {active && <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />}
    </button>
  );
}