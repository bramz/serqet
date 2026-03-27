"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { 
  BrainCircuit, Save, RotateCcw, ShieldCheck, 
  Settings, Database, Cpu, HardDrive, 
  Key, Palette, Sliders, Activity, 
  Eye, EyeOff, Trash2, Zap, RefreshCw, 
  Wrench, Fingerprint
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

type SettingsTab = 'agents' | 'engine' | 'memory' | 'interface' | 'hardware';

export function SettingsModule() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('agents');
  const [agents, setAgents] = useState<any[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);
  const [prompt, setPrompt] = useState("");
  const [tools, setTools] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Engine Settings State
  const [showKeys, setShowKeys] = useState(false);
  const [engineConfig, setEngineConfig] = useState({
    primary_model: "gemini-3-flash-preview",
    fallback_model: "llama3.2:3b",
    temperature: 0.3,
    max_tokens: 8192
  });

  const fetchAgents = async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/api/v1/agents`);
      const data = await res.json();
      setAgents(data);
      if (data.length > 0 && !selectedAgent) {
        handleSelectAgent(data[0]);
      }
    } catch (e) { console.error("Agent fetch failed", e); }
  };

  useEffect(() => { fetchAgents(); }, []);

  const handleSelectAgent = (agent: any) => {
    setSelectedAgent(agent);
    setPrompt(agent.system_prompt);
    setTools(agent.allowed_tools);
  };

  const handleSaveDNA = async () => {
    setIsSaving(true);
    try {
      await fetch(`${GATEWAY_URL}/api/v1/agents/${selectedAgent.slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          system_prompt: prompt,
          allowed_tools: tools
        })
      });
      fetchAgents();
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  return (
    <div className="animate-in fade-in duration-700 space-y-8 max-w-7xl mx-auto pb-40 px-4">
      {/* --- MODULE HEADER --- */}
      <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">System<span className="text-zinc-500">/Config</span></h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Brain Settings</p>
        </div>
        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <NavTab active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} icon={<BrainCircuit size={14}/>} label="Agents" />
          <NavTab active={activeTab === 'engine'} onClick={() => setActiveTab('engine')} icon={<Cpu size={14}/>} label="Engine" />
          <NavTab active={activeTab === 'memory'} onClick={() => setActiveTab('memory')} icon={<Database size={14}/>} label="Memory" />
          <NavTab active={activeTab === 'interface'} onClick={() => setActiveTab('interface')} icon={<Palette size={14}/>} label="UI/UX" />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        
        {/* --- LEFT SIDEBAR: TAB SPECIFIC CONTROLS --- */}
        <div className="col-span-12 lg:col-span-3 space-y-4">
          {activeTab === 'agents' && (
            <div className="space-y-2">
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2 mb-4">Specialist Registry</p>
              {agents.map(a => (
                <button 
                  key={a.slug}
                  onClick={() => handleSelectAgent(a)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedAgent?.slug === a.slug ? 'bg-primary/10 border-primary text-white' : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:border-zinc-700'
                  }`}
                >
                  <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-50">{a.slug}</p>
                  <p className="text-sm font-bold uppercase italic">{a.name}</p>
                </button>
              ))}
            </div>
          )}

          {activeTab === 'engine' && (
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-6">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Keys</p>
              <KeyItem label="Gemini AI" status="Active" />
              <KeyItem label="Kraken Pro" status="Active" />
              <KeyItem label="DuckDuckGo" status="Free Tier" />
            </div>
          )}

          {activeTab === 'memory' && (
            <div className="p-4 bg-zinc-900/50 border border-zinc-800 rounded-2xl space-y-6">
               <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Index Health</p>
               <div className="space-y-4">
                  <MemoryStat label="Postgres Rows" val="12.4k" />
                  <MemoryStat label="Chroma Vectors" val="1.4k" />
                  <button className="w-full py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-[9px] font-black text-red-500 uppercase hover:bg-red-500 hover:text-white transition-all">
                    Wipe Neural Cache
                  </button>
               </div>
            </div>
          )}
        </div>

        {/* --- MAIN EDITOR WINDOW --- */}
        <div className="col-span-12 lg:col-span-9">
          
          {/* TAB: AGENT EDITOR */}
          {activeTab === 'agents' && (
            <Card className="bg-zinc-950 border-zinc-800 p-8 flex flex-col gap-6 shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3 text-emerald-500">
                   <ShieldCheck size={20} />
                   <span className="text-xs font-black uppercase tracking-[0.2em]">Agent Write Access: Enabled</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setPrompt(selectedAgent.system_prompt)} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-white transition-all"><RotateCcw size={18}/></button>
                  <button 
                    onClick={handleSaveDNA}
                    disabled={isSaving}
                    className="flex items-center gap-3 px-8 py-2.5 bg-primary text-white text-xs font-black uppercase rounded-xl hover:opacity-90 transition-all shadow-lg border-t border-white/20"
                  >
                    {isSaving ? <RefreshCw className="animate-spin" size={16}/> : <Save size={16}/>} 
                    {isSaving ? "Syncing..." : "Sync Agent Settings"}
                  </button>
                </div>
              </div>

              <div className="space-y-6 relative z-10">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Fingerprint size={12}/> System Instructions
                  </label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-80 bg-black border border-zinc-800 rounded-2xl p-6 font-mono text-xs leading-relaxed text-emerald-500/80 focus:border-primary/50 outline-none shadow-inner resize-none"
                    spellCheck={false}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2 ml-1">
                    <Wrench size={12}/> Cognitive Capabilities (Tools)
                  </label>
                  <input 
                    value={tools}
                    onChange={(e) => setTools(e.target.value)}
                    className="w-full bg-black border border-zinc-800 rounded-xl p-4 font-mono text-[10px] text-emerald-500 outline-none focus:border-primary/50"
                    placeholder="web_research, sync_portfolio, etc..."
                  />
                </div>
              </div>
            </Card>
          )}

          {/* TAB: ENGINE CONFIG */}
          {activeTab === 'engine' && (
            <Card className="bg-zinc-950 border-zinc-800 p-8 space-y-8 shadow-2xl">
              <section className="space-y-4">
                <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                  <Sliders size={18} className="text-primary"/> Model Parameters
                </h3>
                <div className="grid grid-cols-2 gap-6">
                  <SettingInput label="Primary Intelligence" value={engineConfig.primary_model} />
                  <SettingInput label="Local Fallback" value={engineConfig.fallback_model} />
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-500 uppercase">Creativity (Temp)</label>
                    <input type="range" className="w-full accent-primary bg-zinc-800 rounded-lg h-2 appearance-none cursor-pointer" />
                  </div>
                </div>
              </section>

              <section className="space-y-4 pt-8 border-t border-zinc-900">
                 <h3 className="text-sm font-black text-white uppercase italic tracking-widest flex items-center gap-2">
                   <Key size={18} className="text-primary"/> API Authentication
                 </h3>
                 <div className="space-y-3">
                    <ApiKeyRow label="GOOGLE_GEMINI_KEY" />
                    <ApiKeyRow label="KRAKEN_API_KEY" />
                    <ApiKeyRow label="KRAKEN_SECRET_KEY" />
                 </div>
              </section>
            </Card>
          )}

          {/* TAB: INTERFACE SETTINGS */}
          {activeTab === 'interface' && (
             <Card className="bg-zinc-950 border-zinc-800 p-8 space-y-8 shadow-2xl">
                <div className="grid grid-cols-2 gap-8">
                   <div className="space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Color Schema</h3>
                      <div className="flex gap-4">
                         <div className="w-10 h-10 rounded-full bg-purple-600 border-2 border-white cursor-pointer shadow-[0_0_15px_oklch(0.627_0.265_303.9)]" />
                         <div className="w-10 h-10 rounded-full bg-emerald-600 border-2 border-transparent cursor-pointer" />
                         <div className="w-10 h-10 rounded-full bg-cyan-600 border-2 border-transparent cursor-pointer" />
                         <div className="w-10 h-10 rounded-full bg-orange-600 border-2 border-transparent cursor-pointer" />
                      </div>
                   </div>
                   <div className="space-y-4">
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Glass Opacity</h3>
                      <input type="range" className="w-full accent-primary" />
                   </div>
                </div>
             </Card>
          )}

        </div>
      </div>
    </div>
  );
}

// --- SUB-COMPONENTS ---

function NavTab({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-primary text-white shadow-xl border-t border-white/20' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {icon} {label}
    </button>
  );
}

function SettingInput({ label, value }: any) {
  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">{label}</label>
      <input 
        disabled
        value={value}
        className="w-full bg-black border border-zinc-800 rounded-xl p-3 font-mono text-xs text-zinc-400"
      />
    </div>
  );
}

function ApiKeyRow({ label }: any) {
  return (
    <div className="flex items-center justify-between p-4 bg-black border border-zinc-800 rounded-2xl group">
      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-tighter">{label}</span>
      <div className="flex items-center gap-4">
        <span className="text-xs text-zinc-700 font-mono">••••••••••••••••</span>
        <button className="text-zinc-600 hover:text-white transition-colors"><Eye size={14}/></button>
      </div>
    </div>
  );
}

function MemoryStat({ label, val }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-bold text-zinc-400">{label}</span>
      <span className="text-[11px] font-mono text-white">{val}</span>
    </div>
  );
}

function KeyItem({ label, status }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[11px] font-bold text-zinc-300 uppercase">{label}</span>
      <span className="text-[8px] font-black text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded uppercase tracking-tighter">{status}</span>
    </div>
  );
}