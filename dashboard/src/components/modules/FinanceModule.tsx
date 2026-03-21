"use client";

import { useEffect, useState } from 'react';
import { Card, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, Activity, Zap, TrendingUp, TrendingDown, 
  Terminal, ShieldCheck, Wallet, ArrowRight, BarChart3,
  Rocket, Target, ArrowUpRight, Globe, AlertCircle, RefreshCw
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function FinanceModule({ onQuickAction }: { onQuickAction?: (q: string) => void }) {
  const [subTab, setSubTab] = useState<"algo" | "crypto" | "ventures" | "fiat">("algo");
  const [summary, setSummary] = useState({ total_expenses: 0, total_income: 0, recent_records: [] });

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/finance/summary`)
      .then(res => res.json())
      .then(setSummary)
      .catch(err => console.error("Finance summary fetch error", err));
  }, []);

  return (
    <div className="animate-in fade-in duration-700 space-y-8 max-w-7xl mx-auto pb-32 px-4">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-8 gap-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">Finance<span className="text-emerald-500">$</span></h2>
          <div className="flex gap-6 mt-4">
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Liquidity In</span>
                <span className="text-xl font-mono font-black text-emerald-500 italic">${summary.total_income?.toLocaleString() || "0.00"}</span>
             </div>
             <div className="h-10 w-[1px] bg-zinc-800" />
             <div className="flex flex-col">
                <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Total Operating Out</span>
                <span className="text-xl font-mono font-black text-red-500 italic">${summary.total_expenses?.toLocaleString() || "0.00"}</span>
             </div>
          </div>
        </div>

        <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-800">
          <TabBtn active={subTab === 'algo'} onClick={() => setSubTab('algo')} icon={<Zap size={12}/>} label="Algo" />
          <TabBtn active={subTab === 'crypto'} onClick={() => setSubTab('crypto')} icon={<BarChart3 size={12}/>} label="Holdings" />
          <TabBtn active={subTab === 'ventures'} onClick={() => setSubTab('ventures')} icon={<Rocket size={12}/>} label="Ventures" />
          <TabBtn active={subTab === 'fiat'} onClick={() => setSubTab('fiat')} icon={<Wallet size={12}/>} label="Ledger" />
        </div>
      </div>

      {/* --- DYNAMIC VIEWPORT --- */}
      <div className="animate-in slide-in-from-bottom-2 duration-500">
        {subTab === "algo" && <AlgoTradingView onQuickAction={onQuickAction} />}
        {subTab === "crypto" && <CryptoTerminal />}
        {subTab === "ventures" && <VentureHub onQuickAction={onQuickAction} />}
        {subTab === "fiat" && <FiatLedger summary={summary} />}
      </div>
    </div>
  );
}

function AlgoTradingView({ onQuickAction 
}: { onQuickAction?: (q: string) => void }) {
  const [signals, setSignals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSignals = async () => {
    try {
      const res = await fetch(`${GATEWAY_URL}/api/v1/finance/signals`);
      const data = await res.json();
      // Ensure we are setting an array and mapping keys correctly
      if (Array.isArray(data)) {
        setSignals(data);
      } else {
        setSignals([]);
      }
    } catch (err) {
      console.error("Signal fetch error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-10 font-black text-[10px] text-zinc-600 uppercase tracking-widest animate-pulse">Synchronizing Signals...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-primary animate-ping" />
           <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Signals</h3>
        </div>
        <button 
          onClick={() => onQuickAction?.("Run a deep market analysis for BTC and ETH and provide new trade signals.")}
          className="text-[9px] font-black uppercase text-white hover:text-emerald-500 transition-colors flex items-center gap-2"
        >
          <RefreshCw size={10} /> Force Re-Scan
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {signals.length > 0 ? signals.map(s => (
          <div key={s.ID || s.id} className={`p-6 bg-zinc-950 border-l-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-zinc-900 transition-all ${
            s.action === 'BUY' ? 'border-l-emerald-500 border-zinc-900' : 'border-l-red-500 border-zinc-900'
          }`}>
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-4">
                <span className={`text-2xl font-black italic tracking-tighter ${s.action === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.action}
                </span>
                <span className="text-lg font-black text-white uppercase">{s.asset}</span>
                <span className="font-mono text-xs text-zinc-500">ENTRY: ${s.price?.toLocaleString()}</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">"{s.reasoning}"</p>
              
              <div className="flex gap-3 pt-2">
                 <span className="text-[9px] font-black text-zinc-600 uppercase border border-zinc-800 px-2 py-0.5 rounded">Confidence: {(s.confidence * 100).toFixed(0)}%</span>
                 <span className="text-[9px] font-black text-zinc-600 uppercase border border-zinc-800 px-2 py-0.5 rounded">Source: Kernel/Fin-Agent</span>
              </div>
            </div>

            <button 
              onClick={() => onQuickAction?.(`Execute ${s.action} order for ${s.asset} at market price. Reference Signal ID ${s.ID || s.id}.`)}
              className="w-full md:w-auto px-8 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:bg-emerald-600 hover:text-white hover:border-emerald-500 transition-all flex items-center justify-center gap-2"
            >
              Authorize Deployment <ArrowUpRight size={14}/>
            </button>
          </div>
        )) : (
          <div className="py-20 border border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center">
             <AlertCircle className="text-zinc-800 mb-4" size={40} />
             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">
               No active signals detected. <br/> 
               <span className="text-cyan-500 cursor-pointer hover:underline" onClick={() => onQuickAction?.("Generate trading signals")}>
                 Initialize Scan
               </span>
             </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-VIEW: VENTURE HUB
function VentureHub({ onQuickAction }: { onQuickAction?: (q: string) => void }) {
  const [ventures, setVentures] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVentures = () => {
    fetch(`${GATEWAY_URL}/api/v1/finance/ventures`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setVentures(data);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchVentures();
    const interval = setInterval(fetchVentures, 20000); // Periodic sync
    return () => clearInterval(interval);
  }, []);

  if (loading) return <div className="p-10 font-black text-[10px] text-zinc-600 uppercase tracking-widest animate-pulse">Synchronizing Incubator...</div>;

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-between items-center bg-zinc-900/30 p-4 rounded-2xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Target className="text-emerald-500" size={18} />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Revenue Intelligence</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase">Active Projects: {ventures.length}</p>
          </div>
        </div>
        <button 
          onClick={() => onQuickAction?.("Perform a deep-web scout for a new automated revenue niche. Analyze profitability and propose a 3-step venture plan.")}
          className="px-6 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:opacity-90 transition-all border-t border-white/10 shadow-lg"
        >
          Initialize New Scout
        </button>
      </div>

      {/* Venture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {ventures.length > 0 ? ventures.map((v) => (
          <Card key={v.ID || v.id} className="bg-zinc-950 border-zinc-900 overflow-hidden hover:border-primary/40 transition-all group">
            <div className="p-6">
              {/* Top Row: Meta */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-2">
                  <span className="text-[8px] font-black bg-zinc-900 text-primary border border-primary/20 px-2 py-0.5 rounded uppercase tracking-widest">
                    {v.category}
                  </span>
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${
                    v.status === 'Active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'
                  }`}>
                    {v.status}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[9px] font-mono text-zinc-600">
                  <Globe size={10} />
                  <span>{v.platform}</span>
                </div>
              </div>

              {/* Title & Strategy */}
              <h3 className="text-xl font-black text-white uppercase italic tracking-tighter mb-2 group-hover:text-primary transition-colors">
                {v.name}
              </h3>
              <div className="bg-black/40 p-3 rounded-lg border border-zinc-900 mb-6">
                <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">
                  <span className="text-primary font-black mr-2">STRATEGY:</span>
                  {v.strategy_summary}
                </p>
              </div>

              {/* Financial Progress */}
              <div className="grid grid-cols-2 gap-4 border-t border-zinc-900 pt-4">
                <div>
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Projected ROI</p>
                  <p className="text-lg font-mono font-black text-white">{v.projected_roi}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Realized Yield</p>
                  <p className="text-lg font-mono font-black text-emerald-500">${v.revenue_earned?.toLocaleString() || "0.00"}</p>
                </div>
              </div>
            </div>

            {/* Action Footer */}
            <div className="bg-zinc-900/50 p-3 border-t border-zinc-900 flex gap-2">
              <button 
                onClick={() => onQuickAction?.(`Analyze the performance of my '${v.name}' venture. Provide 3 optimization steps to scale revenue.`)}
                className="flex-1 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-[9px] font-black text-zinc-500 hover:text-white uppercase tracking-widest transition-all"
              >
                Analyze Performance
              </button>
              <button 
                onClick={() => onQuickAction?.(`I have earned new revenue for '${v.name}'. Log a profit of $XX.XX to the database.`)}
                className="flex-1 py-2 bg-zinc-950 border border-zinc-800 rounded-lg text-[9px] font-black text-zinc-500 hover:text-emerald-500 uppercase tracking-widest transition-all"
              >
                Log Revenue
              </button>
            </div>
          </Card>
        )) : (
          <div className="col-span-full py-20 border border-dashed border-zinc-800 rounded-3xl flex flex-col items-center justify-center bg-zinc-900/10">
             <Rocket className="text-zinc-800 mb-4" size={48} />
             <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest text-center">
               Venture Incubator Empty. <br/> 
               <span 
                className="text-primary cursor-pointer hover:underline" 
                onClick={() => onQuickAction?.("Scout for new automated revenue opportunities.")}
               >
                 Initialize Arbiter Protocol
               </span>
             </p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- SUB-VIEW: CRYPTO TERMINAL ---
function CryptoTerminal() {
  const [holdings, setHoldings] = useState<any[]>([]);

  useEffect(() => {
      fetch(`${GATEWAY_URL}/api/v1/finance/holdings`)
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setHoldings(data); });
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {holdings.map((h) => (
            <Card key={h.ID || h.id} className="bg-zinc-950 border-zinc-900 p-6 flex flex-col justify-center serqet-glow">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-black text-zinc-600 uppercase text-[9px]">Asset</span>
                    <span className="text-xs font-black text-primary italic uppercase">{h.asset}</span>
                </div>
                <span className="text-3xl font-mono text-white font-black tracking-tighter">
                  {h.balance?.toFixed(4) || "0.0000"}
                </span>
            </Card>
        ))}
    </div>
  );
}

// --- SUB-VIEW: FIAT LEDGER ---
function FiatLedger({ summary }: { summary: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="col-span-1 bg-zinc-950 border-zinc-900 p-8 flex flex-col justify-center border-l-4 border-l-red-500">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">Total Monthly Outflow</p>
        <h2 className="text-5xl font-black text-white italic tracking-tighter">
          ${summary.total_expenses?.toLocaleString() || "0"}
        </h2>
      </Card>
      
      <Card className="col-span-2 bg-zinc-950 border-zinc-900 p-6">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Standard Ledger</h3>
        <div className="space-y-2">
          {summary.recent_records?.map((r: any) => (
            <div key={r.ID || r.id} className="p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg flex justify-between items-center hover:bg-zinc-900 transition-colors">
              <div>
                <p className="font-bold text-xs text-zinc-200 uppercase">{r.category}</p>
                <p className="text-[9px] text-zinc-600 mt-1">{r.description}</p>
              </div>
              <p className="text-sm font-mono font-black text-red-400">-${r.amount?.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// --- HELPER COMPONENTS ---
function TabBtn({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-primary text-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'
      }`}
    >
      {icon} {label}
    </button>
  );
}