"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { 
  Globe, Activity, Zap, TrendingUp, Cpu, DollarSign, 
  Briefcase, ListTodo, Database, Shield, Search, 
  Wallet, Terminal, BarChart3, Fingerprint, 
  Network, Server, HardDrive, Binary, Box,
  MessageSquare, HeartPulse, Scale, Rocket, 
  Cog, History, Flame, ShieldCheck, ChevronRight
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function OverviewModule({ onQuickAction, onNavigate }: any) {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchSnapshot = () => fetch(`${GATEWAY_URL}/api/v1/overview`).then(res => res.json()).then(setData);
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 15000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return (
    <div className="flex items-center justify-center h-full">
      <div className="font-black tracking-[0.3em] text-primary animate-pulse uppercase text-sm italic">
        Loading System Data...
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 pb-40 px-4">
      
      {/* --- SECTION 1: KERNEL STATUS (Telemetry) --- */}
      <header className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <div className="col-span-2 md:col-span-1 flex flex-col justify-center">
          <h1 className="text-4xl font-black tracking-tighter text-white italic uppercase leading-none">
            Dashboard<span className="text-primary"></span>
          </h1>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-2">
            Controller
          </p>
        </div>
        
        <TelemetryBox icon={<Cpu size={16}/>} label="CPU" val={data.system_stats.cpu} color="text-emerald-400" />
        <TelemetryBox icon={<Server size={16}/>} label="RAM" val={data.system_stats.memory_usage} color="text-purple-400" />
        <TelemetryBox icon={<ShieldCheck size={16}/>} label="Neural Link" val={data.system_stats.neural_latency} color="text-cyan-400" />
        <TelemetryBox icon={<Database size={16}/>} label="Vector Space" val="1.4k" color="text-amber-400" />
      </header>

      {/* --- SECTION 2: UNIVERSAL COMMAND MATRIX (Compact) --- */}
      <section className="space-y-4 bg-zinc-900/20 p-6 rounded-3xl border border-zinc-800/50">
        <div className="flex items-center gap-2 mb-2">
          <Terminal size={14} className="text-primary" />
          <h2 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em]">Quick Execution Matrix</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          {/* Group: Intelligence */}
          <CommandBtn icon={<Search size={14}/>} label="Scrape Web" cat="INT" onClick={() => onQuickAction("Research current tech trends")} />
          <CommandBtn icon={<Globe size={14}/>} label="Market Intel" onClick={() => onQuickAction("Analyze market news")} />
          
          {/* Group: Finance */}
          <CommandBtn icon={<Wallet size={14}/>} label="Sync Kraken" cat="FIN" onClick={() => onQuickAction("Update my Kraken holdings")} />
          <CommandBtn icon={<TrendingUp size={14}/>} label="BTC Analysis" onClick={() => onQuickAction("Generate signals for BTC")} />
          
          {/* Group: Health */}
          <CommandBtn icon={<Flame size={14}/>} label="Log Workout" cat="BIO" onClick={() => onQuickAction("Log a workout session")} />
          <CommandBtn icon={<Activity size={14}/>} label="Log Nutrition" onClick={() => onQuickAction("I need to log a meal")} />
          
          {/* Group: Operations */}
          <CommandBtn icon={<Zap size={14}/>} label="Arb Search" cat="REV" onClick={() => onQuickAction("Find a revenue opportunity")} />
          <CommandBtn icon={<Rocket size={14}/>} label="Scale Op" onClick={() => onQuickAction("Scale current arbitrage")} />
          
          {/* Group: System */}
          <CommandBtn icon={<History size={14}/>} label="Task Audit" cat="SYS" onClick={() => onQuickAction("Review pending tasks")} />
          <CommandBtn icon={<Cog size={14}/>} label="Self Diag" onClick={() => onQuickAction("Run full system diagnostics")} />
          <CommandBtn icon={<Briefcase size={14}/>} label="Job Scrape" onClick={() => onQuickAction("Find Go developer jobs")} />
          <CommandBtn icon={<MessageSquare size={14}/>} label="Post Draft" onClick={() => onQuickAction("Draft a social thread")} />
        </div>
      </section>

      {/* --- SECTION 3: DATA GRID (Vertical Only, No Horizontal Scroll) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Ledger: Finance */}
        <DataLedger title="Financial Ledger" icon={<DollarSign size={16}/>} onOpen={() => onNavigate("finance")}>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[9px] font-black text-zinc-600 uppercase tracking-widest text-left">
                <th className="pb-4">Asset</th>
                <th className="pb-4 text-right">Position</th>
              </tr>
            </thead>
            <tbody className="text-zinc-200">
              {data.holdings.map((h: any) => (
                <tr key={h.ID} className="border-t border-zinc-900/50">
                  <td className="py-3 font-bold text-xs uppercase tracking-tight">{h.asset}</td>
                  <td className="py-3 text-right font-mono text-emerald-400 text-xs">{h.balance.toFixed(4)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DataLedger>

        {/* Ledger: Intelligence */}
        <DataLedger title="Intel Stream" icon={<Globe size={16}/>} onOpen={() => onNavigate("research")}>
          <div className="space-y-4">
            {data.intelligence.map((i: any) => (
              <div key={i.ID} className="group cursor-pointer border-l-2 border-zinc-800 hover:border-primary pl-4 py-1 transition-all">
                <p className="text-sm font-bold text-zinc-200 line-clamp-1 group-hover:text-white">{i.query}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">
                    {new Date(i.CreatedAt).toLocaleDateString()}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-zinc-800" />
                  <span className="text-[9px] font-bold text-primary uppercase italic">Ready</span>
                </div>
              </div>
            ))}
          </div>
        </DataLedger>

        {/* Ledger: Task Stack */}
        <DataLedger title="Executive Queue" icon={<ListTodo size={16}/>} onOpen={() => onNavigate("task")}>
          <div className="space-y-2">
            {data.tasks.map((t: any) => (
              <div key={t.ID} className="bg-zinc-900/30 p-3 rounded-xl border border-zinc-800/50 flex items-center justify-between group hover:bg-zinc-900 transition-all">
                <span className="text-xs font-bold text-zinc-300 truncate pr-4">{t.title}</span>
                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-1 rounded uppercase">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </DataLedger>

        {/* Ledger: Kernel Logs (System Activity) */}
        <DataLedger title="System Logs" icon={<Binary size={16}/>}>
           <div className="space-y-3 font-mono text-[10px] text-zinc-500">
              <div className="flex gap-2">
                <span className="text-emerald-500 font-bold shrink-0">[OK]</span>
                <span>Kraken ticker feed synchronized (42ms)</span>
              </div>
              <div className="flex gap-2">
                <span className="text-primary font-bold shrink-0">[AI]</span>
                <span>ChromaDB: Indexed 4 new memories</span>
              </div>
              <div className="flex gap-2 text-zinc-600">
                <span className="font-bold shrink-0">[IO]</span>
                <span>Web Research session terminated</span>
              </div>
              <div className="flex gap-2">
                <span className="text-blue-500 font-bold shrink-0">[OS]</span>
                <span>Health check: All sub-systems nominal</span>
              </div>
           </div>
        </DataLedger>

        {/* Ledger: Revenue Arbitrage */}
        <DataLedger title="Revenue Hub" icon={<Zap size={16}/>} onOpen={() => onNavigate("revenue")}>
          <div className="flex flex-col items-center justify-center h-full pb-6">
             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.3em] mb-2">Total OS Revenue</p>
             <h2 className="text-5xl font-black text-white italic tracking-tighter">
                ${data.total_revenue.toLocaleString()}
             </h2>
             <div className="mt-6 px-4 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Scalability: High</span>
             </div>
          </div>
        </DataLedger>

      </div>
    </div>
  );
}

// --- SUB-COMPONENTS FOR HIGH DENSITY ---

function TelemetryBox({ icon, label, val, color }: any) {
  return (
    <div className="bg-zinc-950/50 border border-zinc-900 p-4 rounded-2xl flex flex-col justify-center">
      <div className="flex items-center gap-2 text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-1">
        {icon} {label}
      </div>
      <div className={`text-2xl font-black font-mono tracking-tighter ${color}`}>{val}</div>
    </div>
  );
}

function CommandBtn({ icon, label, cat, onClick }: any) {
  return (
    <button 
      onClick={onClick}
      className="flex items-center gap-3 p-3 bg-zinc-950 border border-zinc-900 rounded-xl hover:bg-zinc-800 hover:border-zinc-700 transition-all group"
    >
      <div className="text-zinc-500 group-hover:text-primary transition-colors shrink-0">
        {icon}
      </div>
      <div className="text-left overflow-hidden">
        {cat && <p className="text-[8px] font-black text-primary/50 uppercase tracking-widest leading-none mb-1">{cat}</p>}
        <p className="text-[10px] font-bold text-zinc-400 truncate uppercase tracking-tight leading-none">{label}</p>
      </div>
    </button>
  );
}

function DataLedger({ title, icon, children, onOpen }: any) {
  return (
    <Card className="bg-zinc-950/40 border-zinc-900 p-6 flex flex-col h-[380px] shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2 text-zinc-500">
          <div className="p-1.5 bg-zinc-900 rounded-lg text-primary">{icon}</div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.25em] ml-1">{title}</h3>
        </div>
        {onOpen && (
          <button onClick={onOpen} className="text-zinc-700 hover:text-white transition-colors">
            <ChevronRight size={18}/>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        {children}
      </div>
    </Card>
  );
}