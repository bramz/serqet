"use client";

import { useEffect, useState } from 'react';
import { Card, CardTitle } from "@/components/ui/card";
import { 
  Globe, Activity, Zap, TrendingUp, Cpu, 
  DollarSign, Briefcase, ListTodo, Database, 
  Shield, Search, Wallet, RefreshCcw, LayoutGrid
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

interface OverviewData {
  intelligence: any[];
  holdings: any[];
  tasks: any[];
  total_revenue: number;
  system_stats: any;
}

export function OverviewModule({ onQuickAction }: { onQuickAction: (q: string) => void }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSnapshot = async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/v1/overview`);
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Failed to fetch overview snapshot", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSnapshot();
    const interval = setInterval(fetchSnapshot, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading || !data) return <div className="text-zinc-500 font-mono text-xs animate-pulse">Loading System Data...</div>;

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-700 pb-20">
      
      {/* SECTION 1: SYSTEM DIAGNOSTICS BAR */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="col-span-2 flex flex-col justify-end pb-2">
           <h1 className="text-3xl font-black tracking-tighter text-white uppercase italic">Dashboard</h1>
           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Overview</p>
        </div>
        <DiagBox icon={<Cpu size={14}/>} label="CPU Load" value={data.system_stats.cpu} color="text-emerald-500" />
        <DiagBox icon={<Database size={14}/>} label="Memory" value={data.system_stats.memory} color="text-purple-500" />
        <DiagBox icon={<Shield size={14}/>} label="Uptime" value={data.system_stats.uptime} color="text-cyan-500" />
      </div>

      {/* SECTION 2: THE AGENT LAUNCHER */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Agent Shortcut Path</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <ShortcutBtn icon={<Search size={14}/>} label="Web Intel" onClick={() => onQuickAction("Research the current news on Go 1.26")} />
            <ShortcutBtn icon={<Wallet size={14}/>} label="Sync Kraken" onClick={() => onQuickAction("Update my Kraken holdings")} />
            <ShortcutBtn icon={<TrendingUp size={14}/>} label="Market Signal" onClick={() => onQuickAction("Generate market signals for BTC/USD")} />
            <ShortcutBtn icon={<Activity size={14}/>} label="Log Bio" onClick={() => onQuickAction("I want to log my calories")} />
            <ShortcutBtn icon={<Briefcase size={14}/>} label="Job Search" onClick={() => onQuickAction("Find Go developer jobs")} />
            <ShortcutBtn icon={<Zap size={14}/>} label="Revenue Op" onClick={() => onQuickAction("Identify a revenue arbitrage opportunity")} />
            <ShortcutBtn icon={<RefreshCcw size={14}/>} label="Self Check" onClick={() => onQuickAction("Run system diagnostics")} />
            <ShortcutBtn icon={<LayoutGrid size={14}/>} label="All Agents" onClick={() => onQuickAction("List all active agents")} />
          </div>
        </div>

        <Card className="bg-primary/5 border-primary/20 p-5 relative overflow-hidden group flex flex-col justify-between">
           <div className="relative z-10">
              <div className="flex justify-between items-start">
                <DollarSign className="text-primary mb-4" size={20} />
                <span className="text-[10px] font-black text-primary uppercase">Revenue Active</span>
              </div>
              <p className="text-xs text-zinc-400">Yield Aggregator</p>
              <h2 className="text-3xl font-black text-white">${data.total_revenue.toLocaleString()}</h2>
           </div>
           <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 text-primary/10 group-hover:scale-110 transition-transform" />
        </Card>
      </div>

      {/* SECTION 3: GLANCEABLE TABLES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Real Research Glance */}
        <GlanceCard title="Intelligence Reports" icon={<Globe size={14}/>}>
            <div className="space-y-3">
                {data.intelligence.length > 0 ? data.intelligence.map((item: any) => (
                  <GlanceItem key={item.ID} label={item.query} time={new Date(item.CreatedAt).toLocaleDateString()} />
                )) : <p className="text-[10px] text-zinc-600">No reports found.</p>}
            </div>
        </GlanceCard>

        {/* Real Crypto Glance */}
        <GlanceCard title="Portfolio Snapshot" icon={<DollarSign size={14}/>}>
            <div className="space-y-3">
                {data.holdings.length > 0 ? data.holdings.map((h: any) => (
                  <HoldingItem key={h.ID} asset={h.asset} val={h.balance.toFixed(3)} color={h.Asset === 'BTC' ? 'text-orange-500' : 'text-purple-500'} />
                )) : <p className="text-[10px] text-zinc-600">No assets tracked.</p>}
            </div>
        </GlanceCard>

        {/* Real Task Glance */}
        <GlanceCard title="Active Task Queue" icon={<ListTodo size={14}/>}>
            <div className="space-y-3">
                {data.tasks.length > 0 ? data.tasks.map((t: any) => (
                  <GlanceItem key={t.ID} label={t.title} time={t.status} />
                )) : <p className="text-[10px] text-zinc-600">Queue empty.</p>}
            </div>
        </GlanceCard>

      </div>
    </div>
  );
}

// --- HELPER SUB-COMPONENTS ---
function DiagBox({ icon, label, value, color }: any) {
  return (
    <div className="p-3 bg-zinc-900/50 border border-zinc-800 rounded-xl">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-zinc-500">{icon}</span>
        <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
      </div>
      <p className={`text-sm font-mono font-bold ${color}`}>{value}</p>
    </div>
  );
}

function ShortcutBtn({ icon, label, onClick }: any) {
  return (
    <button onClick={onClick} className="flex items-center gap-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl hover:bg-zinc-800 transition-all group">
      <div className="p-1.5 bg-black rounded-lg text-zinc-500 group-hover:text-primary transition-colors">{icon}</div>
      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">{label}</span>
    </button>
  );
}

function GlanceCard({ title, icon, children }: any) {
  return (
    <Card className="bg-zinc-950/50 border-zinc-900 p-5">
      <div className="flex items-center gap-2 mb-4 border-b border-zinc-900 pb-3">
        <div className="text-zinc-600">{icon}</div>
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">{title}</h3>
      </div>
      {children}
    </Card>
  );
}

function GlanceItem({ label, time }: any) {
  return (
    <div className="flex justify-between items-center group cursor-pointer">
      <span className="text-xs text-zinc-300 group-hover:text-white transition-colors truncate pr-4">{label}</span>
      <span className="text-[9px] font-mono text-zinc-600 uppercase">{time}</span>
    </div>
  );
}

function HoldingItem({ asset, val, color }: any) {
  return (
    <div className="flex justify-between items-center">
      <span className={`text-[10px] font-black ${color}`}>{asset}</span>
      <span className="text-xs font-mono text-zinc-200">{val}</span>
    </div>
  );
}