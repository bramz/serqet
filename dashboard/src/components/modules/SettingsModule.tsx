"use client";

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from "@/components/ui/card";
import { 
  BrainCircuit, Save, RotateCcw, ShieldCheck, 
  Database, Cpu, Key, Palette, Sliders, 
  Eye, EyeOff, RefreshCw, Wrench, Fingerprint,
  Terminal, ShieldAlert, Monitor, Zap,
  Activity
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
    document.body.classList.remove(...themes);
    document.body.classList.add(themeName);
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
      if (data.length > 0 && !selectedAgent) {
        setSelectedAgent(data[0]);
        setPrompt(data[0].system_prompt);
        setTools(data[0].allowed_tools);
      }
    } catch (e) { console.error("Agent fetch failed", e); }
  };

  const handleSaveDNA = async () => {
    setIsSaving(true);
    try {
      await fetch(`${GATEWAY_URL}/api/v1/agents/${selectedAgent.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ system_prompt: prompt, allowed_tools: tools })
      });
      await fetchAgents();
    } finally {
      setTimeout(() => setIsSaving(false), 800);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8 max-w-7xl mx-auto pb-40 px-4 font-sans">
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">Settings<span className="text-primary"></span></h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Configuration Interface</p>
        </div>
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800 shadow-2xl">
          <NavTab active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} icon={<BrainCircuit size={14}/>} label="Agents" />
          <NavTab active={activeTab === 'engine'} onClick={() => setActiveTab('engine')} icon={<Cpu size={14}/>} label="Engine" />
          <NavTab active={activeTab === 'memory'} onClick={() => setActiveTab('memory')} icon={<Database size={14}/>} label="Memory" />
          <NavTab active={activeTab === 'interface'} onClick={() => setActiveTab('interface')} icon={<Palette size={14}/>} label="UI/UX" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* --- LEFT CONTROL PANEL --- */}
        <div className="col-span-12 lg:col-span-3 space-y-6">
          {activeTab === 'agents' && (
            <div className="space-y-2">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-4 italic">Specialist Registry</p>
              {agents.map(a => (
                <button key={a.slug} onClick={() => { setSelectedAgent(a); setPrompt(a.system_prompt); setTools(a.allowed_tools); }}
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
                 <span className="text-xs font-bold text-white uppercase tracking-tighter">{currentTheme.replace('theme-', '')} Protocol</span>
              </div>
            </div>
          )}

          <Card className="p-4 bg-zinc-950 border-zinc-900">
             <div className="flex items-center gap-2 text-zinc-500 mb-4">
                <ShieldCheck size={14} />
                <span className="text-[9px] font-black uppercase tracking-widest">Security Status</span>
             </div>
             <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Encryption: AES-256</p>
             <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter mt-1">Write Access: Verified</p>
          </Card>
        </div>

        {/* --- MAIN CONFIGURATION WINDOW --- */}
        <div className="col-span-12 lg:col-span-9">
          
          {/* TAB: AGENTS */}
          {activeTab === 'agents' && selectedAgent && (
            <Card className="bg-zinc-950 border-zinc-800 p-8 flex flex-col gap-8 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                   <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500"><ShieldCheck size={20} /></div>
                   <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400">Modifying [{selectedAgent.slug}] Neural Path</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setPrompt(selectedAgent.system_prompt); setTools(selectedAgent.allowed_tools); }} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"><RotateCcw size={18}/></button>
                  <button onClick={handleSaveDNA} disabled={isSaving} className="flex items-center gap-3 px-8 py-2.5 bg-primary text-white text-[10px] font-black uppercase rounded-xl hover:opacity-90 transition-all border-t border-white/20">
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
                  <input value={tools} onChange={(e) => setTools(e.target.value)} className="w-full bg-black border border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-primary outline-none" />
                </div>
              </div>
            </Card>
          )}

          {/* TAB: INTERFACE (Matrix Theme) */}
          {activeTab === 'interface' && (
            <Card className="bg-zinc-950 border-zinc-800 p-8 space-y-12 shadow-2xl">
              <section className="space-y-6">
                <div className="flex items-center gap-3">
                  <Palette className="text-primary" size={20} />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Skin Protocols</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <ThemeOption label="Serqet Dark" active={currentTheme === 'dark'} onClick={() => applyTheme('dark')} color="bg-zinc-800" />
                  <ThemeOption label="Green Matrix" active={currentTheme === 'theme-matrix'} onClick={() => applyTheme('theme-matrix')} color="bg-[#00FF41]" isMatrix />
                  <ThemeOption label="Amber" active={currentTheme === 'theme-amber'} onClick={() => applyTheme('theme-amber')} color="bg-orange-500" />
                  <ThemeOption label="Cyan Link" active={currentTheme === 'theme-cyan'} onClick={() => applyTheme('theme-cyan')} color="bg-cyan-400" />
                </div>
              </section>

              <section className="space-y-6 pt-8 border-t border-zinc-900">
                <div className="flex items-center gap-3">
                  <Monitor className="text-primary" size={20} />
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic">Visual Distortion</h3>
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Glassmorphism Opacity</p>
                     <input type="range" className="w-full accent-primary h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                  </div>
                  <div className="space-y-3">
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Pulse Intensity</p>
                     <input type="range" className="w-full accent-primary h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" />
                  </div>
                </div>
              </section>
            </Card>
          )}

          {/* TAB: ENGINE */}
          {activeTab === 'engine' && (
            <Card className="bg-zinc-950 border-zinc-800 p-8 space-y-12 shadow-2xl">
              <div className="grid grid-cols-2 gap-8">
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-2"><Zap size={16} className="text-primary"/> Model Config</h3>
                  <EngineInput label="Core Intelligence" value="Gemini 3 Flash Preview" />
                  <EngineInput label="Local Override" value="Llama 3.2 (Ollama)" />
                </section>
                <section className="space-y-6">
                  <h3 className="text-sm font-black text-white uppercase tracking-widest italic flex items-center gap-2"><Key size={16} className="text-primary"/> API Keys</h3>
                  <div className="space-y-2">
                    <ApiKeyRow label="GOOGLE_GEMINI" />
                    <ApiKeyRow label="KRAKEN_PRIVATE" />
                  </div>
                </section>
              </div>
            </Card>
          )}

          {activeTab === 'memory' && (
             <Card className="bg-zinc-950 border-zinc-800 p-8 space-y-8 shadow-2xl">
                <div className="grid grid-cols-3 gap-4">
                   <div className="p-6 bg-black border border-zinc-900 rounded-3xl text-center">
                      <Database className="mx-auto text-primary mb-2" size={24}/>
                      <p className="text-[10px] font-black text-zinc-600 uppercase">Postgres</p>
                      <p className="text-2xl font-black text-white">12.8k <span className="text-[10px] text-zinc-500">ROWS</span></p>
                   </div>
                   <div className="p-6 bg-black border border-zinc-900 rounded-3xl text-center">
                      <BrainCircuit className="mx-auto text-cyan-500 mb-2" size={24}/>
                      <p className="text-[10px] font-black text-zinc-600 uppercase">ChromaDB</p>
                      <p className="text-2xl font-black text-white">1.4k <span className="text-[10px] text-zinc-500">VECTORS</span></p>
                   </div>
                   <div className="p-6 bg-black border border-zinc-900 rounded-3xl text-center">
                      <Activity className="mx-auto text-emerald-500 mb-2" size={24}/>
                      <p className="text-[10px] font-black text-zinc-600 uppercase">Hitrate</p>
                      <p className="text-2xl font-black text-white">94<span className="text-[10px] text-zinc-500">%</span></p>
                   </div>
                </div>
                <button className="w-full py-4 bg-red-500/5 border border-red-500/20 rounded-2xl text-[10px] font-black text-red-500 uppercase tracking-[0.4em] hover:bg-red-500 hover:text-white transition-all">
                  Purge Volatile Memory Cache
                </button>
             </Card>
          )}

        </div>
      </div>
    </div>
  );
}

// --- BIOS HELPERS ---

function NavTab({ active, onClick, icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-primary text-white shadow-xl border-t border-white/20' : 'text-zinc-500 hover:text-zinc-300'}`}>
      {icon} {label}
    </button>
  );
}

function ThemeOption({ label, active, onClick, color, isMatrix }: any) {
  return (
    <button onClick={onClick} className={`p-5 rounded-3xl border transition-all flex flex-col items-center gap-3 relative ${active ? 'border-primary bg-primary/5 shadow-2xl' : 'border-zinc-900 bg-black/40 hover:border-zinc-700'}`}>
      <div className={`w-10 h-10 rounded-full ${color} ${isMatrix ? 'shadow-[0_0_15px_#00FF41]' : ''}`} />
      <span className={`text-[9px] font-black uppercase tracking-tighter ${active ? 'text-white' : 'text-zinc-500'}`}>{label}</span>
      {active && <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-primary" />}
    </button>
  );
}

function ApiKeyRow({ label }: any) {
  return (
    <div className="flex items-center justify-between p-3 bg-black border border-zinc-900 rounded-xl">
      <span className="text-[9px] font-mono text-zinc-600 uppercase">{label}</span>
      <div className="flex items-center gap-3">
        <span className="text-xs text-zinc-800">••••••••••••</span>
        <button className="text-zinc-700 hover:text-white"><Eye size={12}/></button>
      </div>
    </div>
  );
}

function EngineInput({ label, value }: any) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black text-zinc-600 uppercase ml-1">{label}</p>
      <div className="p-3 bg-black border border-zinc-900 rounded-xl text-[11px] font-mono text-primary/80">{value}</div>
    </div>
  );
}