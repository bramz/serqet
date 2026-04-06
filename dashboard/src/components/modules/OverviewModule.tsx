"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { 
  Globe, Activity, Zap, TrendingUp, Cpu, DollarSign, 
  Briefcase, ListTodo, Database, Shield, Search, 
  Wallet, Terminal, BarChart3, Binary, 
  ShieldCheck, ChevronRight, HardDrive, Server, Rocket,
  Cog, History, Flame, MessageSquare,
  TimerIcon,
  Linkedin,
  Play
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
      <div className="font-black tracking-[0.4em] text-primary animate-pulse uppercase text-xs italic">
        Syncing Snapshot...
      </div>
    </div>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-8 pb-40">
      
      {/* DIAGNOSTICS HEADER */}
      <header className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
        <div className="col-span-2 md:col-span-1 flex flex-col justify-center">
          <h1 className="text-3xl font-black tracking-tighter text-white italic uppercase leading-none">
            Dashboard<span className="text-primary"></span>
          </h1>
          <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.3em] mt-1">Controller</p>
        </div>
        <DiagBox icon={<Cpu size={14}/>} label="CPU" val={data.system_stats.cpu} color="text-emerald-500" />
        <DiagBox icon={<Server size={14}/>} label="RAM" val={data.system_stats.memory_usage} color="text-purple-500" />
        <DiagBox icon={<TimerIcon size={14}/>} label="Uptime" val={data.system_stats.uptime} color="text-cyan-500" />
        <DiagBox icon={<Database size={14}/>} label="Memory" val={data.system_stats.vector_count} color="text-amber-500" />
      </header>

      {/* COMPACT COMMAND MATRIX */}
      <section className="bg-zinc-950 border border-zinc-900 p-5 rounded-2xl shadow-2xl">
        <h2 className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4">Command Matrix</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-2">
          <ShortcutBtn icon={<Wallet size={12}/>} label="Sync Port" onClick={() => onQuickAction("Sync my Kraken portfolio")} />
          <ShortcutBtn icon={<TrendingUp size={12}/>} label="Market Scan" onClick={() => onQuickAction("Analyze market news")} />
          <ShortcutBtn icon={<Search size={12}/>} label="Web Scrape" onClick={() => onQuickAction("Research tech trends")} />
          <ShortcutBtn icon={<Briefcase size={12}/>} label="Job Search" onClick={() => onQuickAction("Find remote jobs")} />
          <ShortcutBtn icon={<Flame size={12}/>} label="Log Workout" onClick={() => onQuickAction("I want to log a workout")} />
          <ShortcutBtn icon={<Activity size={12}/>} label="Nutrition" onClick={() => onQuickAction("Log a meal")} />
          <ShortcutBtn icon={<Zap size={12}/>} label="Find Arb" onClick={() => onQuickAction("Find revenue arbitrage")} />
          <ShortcutBtn icon={<MessageSquare size={12}/>} label="Draft SOC" onClick={() => onQuickAction("Draft a thread")} />
          <ShortcutBtn icon={<History size={12}/>} label="Audit OS" onClick={() => onQuickAction("Check system health")} />
          <ShortcutBtn icon={<Cog size={12}/>} label="Diag Run" onClick={() => onQuickAction("Run diagnostics")} />
        </div>
      </section>

      {/* DATA LEDGER GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* NEW: ACTION QUEUE (Pending Approvals) */}
        <LedgerCard title="Action Queue" icon={<Zap size={14} className="text-white"/>} onOpen={() => onNavigate("actions")}>
           <div className="space-y-2">
             {data.actions && data.actions.length > 0 ? data.actions.map((a: any) => (
               <div key={a.ID} className="bg-primary/5 p-2.5 rounded-lg border border-primary/20 flex justify-between items-center group/item hover:bg-primary/10 transition-all">
                 <div className="flex flex-col">
                   <span className="text-xs font-bold text-zinc-300 truncate pr-2 uppercase tracking-tighter">{a.title}</span>
                   <span className="text-[8px] font-black text-zinc-600 uppercase tracking-[0.2em]">{a.type}</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black text-primary px-2 py-0.5 rounded uppercase border border-primary/20">Review</span>
                 </div>
               </div>
             )) : (
              <div className="flex flex-col items-center justify-center py-10 opacity-20">
                <ShieldCheck size={24} />
                <span className="text-[9px] font-black uppercase mt-2 tracking-widest">Queue Clear</span>
              </div>
             )}
           </div>
        </LedgerCard>

        <LedgerCard title="Finance" icon={<DollarSign size={14} className="text-white"/>} onOpen={() => onNavigate("finance")}>
           <table className="w-full">
             <tbody className="text-xs">
               {data.holdings.map((h: any) => (
                 <tr key={h.ID} className="border-b border-zinc-900/50 last:border-0">
                   <td className="py-3 font-bold text-zinc-400 uppercase tracking-tighter">{h.asset}</td>
                   <td className="py-3 text-right font-mono text-emerald-500">{h.balance.toFixed(4)}</td>
                 </tr>
               ))}
             </tbody>
           </table>
        </LedgerCard>

        <LedgerCard title="Intelligence" icon={<Globe size={14} className="text-white"/>} onOpen={() => onNavigate("research")}>
           <div className="space-y-4">
             {data.intelligence.map((i: any) => (
               <div key={i.ID} className="border-l-2 border-zinc-800 hover:border-primary pl-3 py-1 transition-all">
                 <p className="text-xs font-bold text-zinc-300 line-clamp-1">{i.query}</p>
                 <span className="text-[9px] font-black text-zinc-600 uppercase">{new Date(i.CreatedAt).toLocaleDateString()}</span>
               </div>
             ))}
           </div>
        </LedgerCard>

        <LedgerCard title="Task Queue" icon={<ListTodo size={14} className="text-white"/>} onOpen={() => onNavigate("task")}>
           <div className="space-y-2">
             {data.tasks.map((t: any) => (
               <div key={t.ID} className="bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/50 flex justify-between items-center">
                 <span className="text-xs font-bold text-zinc-400 truncate pr-2">{t.title}</span>
                 <span className="text-[9px] font-black text-primary px-2 py-0.5 bg-primary/10 rounded uppercase">{t.status}</span>
               </div>
             ))}
           </div>
        </LedgerCard>

        <LedgerCard title="Social Hub" icon={<Linkedin size={14} className="text-white"/>} onOpen={() => onNavigate("social")}>
          <div className="space-y-2">
            {data.social.map((s: any) => (
              <div key={s.ID} className="bg-zinc-900/40 p-2.5 rounded-lg border border-zinc-800/50 flex justify-between items-center">
                <span className="text-xs font-bold text-zinc-400 truncate pr-2">{s.content}</span>
                <span className="text-[9px] font-black text-amber-500 px-2 py-0.5 bg-primary/10 rounded uppercase">{s.platform}</span>
              </div>
            ))}
          </div>
        </LedgerCard>

        <LedgerCard title="Brain Logs" icon={<Binary size={14} className="text-white"/>}>
           <div className="space-y-3 font-mono text-[10px] text-zinc-500">
             {data.events?.map((ev: any) => (
               <div key={ev.ID} className="flex gap-2">
                 <span className={`${ev.level === 'SUCCESS' ? 'text-emerald-500' : 'text-primary'} font-bold shrink-0`}>[{ev.source}]</span>
                 <span className="truncate">{ev.message}</span>
               </div>
             ))}
           </div>
        </LedgerCard>

        <LedgerCard title="Business Hub" icon={<Zap size={14} className="text-white"/>} onOpen={() => onNavigate("revenue")}>
           <div className="flex flex-col items-center justify-center h-full py-4">
             <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Total Earned</span>
             <h2 className="text-4xl font-black italic text-white tracking-tighter">${data.total_revenue.toLocaleString()}</h2>
             <div className="mt-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Growth: 12%</span>
             </div>
           </div>
        </LedgerCard>
      </div>
    </div>
  );
}

function DiagBox({ icon, label, val, color }: any) {
  return (
    <div className="bg-zinc-950 border border-zinc-900 p-3 rounded-xl flex flex-col justify-center">
      <div className="flex items-center gap-2 text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">
        {icon} {label}
      </div>
      <div className={`text-xl font-black font-mono tracking-tighter ${color}`}>{val}</div>
    </div>
  );
}

function ShortcutBtn({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-2.5 p-2.5 bg-zinc-950 border border-zinc-900 rounded-xl hover:bg-zinc-900 hover:border-zinc-700 transition-all group">
      <div className="text-zinc-600 group-hover:text-primary transition-colors shrink-0">{icon}</div>
      <span className="text-[9px] font-bold text-zinc-500 group-hover:text-white uppercase tracking-tight truncate">{label}</span>
    </button>
  );
}

function LedgerCard({ title, icon, children, onOpen }: any) {
  return (
    <Card className="bg-zinc-950/60 border-zinc-900 p-6 h-[340px] flex flex-col group shadow-2xl">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3 text-zinc-500">
          <div className="p-1.5 bg-zinc-900 rounded-lg text-primary">{icon}</div>
          <h3 className="text-[10px] font-black uppercase tracking-[0.3em]">{title}</h3>
        </div>
        {onOpen && (
          <button onClick={onOpen} className="text-zinc-700 hover:text-white transition-colors">
            <ChevronRight size={16}/>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide">{children}</div>
    </Card>
  );
}