"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { 
  DollarSign, Activity, Zap, TrendingUp, TrendingDown, 
  Terminal, ShieldCheck, Wallet, ArrowRight, BarChart3
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function FinanceModule({ onQuickAction }: { onQuickAction?: (q: string) => void }) {
  const [subTab, setSubTab] = useState<"algo" | "crypto" | "fiat">("algo");
  const [summary, setSummary] = useState({ total_expenses: 0, recent_records:[] });

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/finance/summary`)
      .then(res => res.json())
      .then(setSummary)
      .catch(err => console.error("Finance summary fetch error", err));
  },[]);

  return (
    <div className="animate-in fade-in duration-700 space-y-8 max-w-6xl mx-auto pb-32 px-4">
      
      {/* --- HEADER --- */}
      <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">Finance <span className="text-emerald-500">$$</span></h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Capital Allocation & Market Intelligence</p>
        </div>
        <div className="flex bg-zinc-900 p-1 rounded-xl border border-zinc-800">
          <TabBtn active={subTab === 'algo'} onClick={() => setSubTab('algo')} icon={<Zap size={12}/>} label="Algo Trading" />
          <TabBtn active={subTab === 'crypto'} onClick={() => setSubTab('crypto')} icon={<BarChart3 size={12}/>} label="Crypto Port" />
          <TabBtn active={subTab === 'fiat'} onClick={() => setSubTab('fiat')} icon={<Wallet size={12}/>} label="Fiat Ledger" />
        </div>
      </div>

      {/* --- VIEWS --- */}
      {subTab === "algo" && <AlgoTradingView onQuickAction={onQuickAction} />}
      {subTab === "crypto" && <CryptoTerminal />}
      {subTab === "fiat" && <FiatLedger summary={summary} />}

    </div>
  );
}

// --- VIEW: ALGORITHMIC TRADING (The Money Maker) ---
function AlgoTradingView({ onQuickAction }: { onQuickAction?: (q: string) => void }) {
  const [signals, setSignals] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchSignals = () => {
    fetch(`${GATEWAY_URL}/api/v1/finance/signals`)
      .then(res => res.json())
      .then(data => {
        // Ensure data is an array before setting
        if (Array.isArray(data)) setSignals(data);
      })
      .catch(err => console.error("Signal fetch error", err));
  };

  useEffect(() => {
    fetchSignals();
    const interval = setInterval(fetchSignals, 15000);
    return () => clearInterval(interval);
  },[]);

  const handleApprove = (signal: any) => {
    if (onQuickAction) {
      onQuickAction(`Execute ${signal.action} order for ${signal.asset} based on your recent signal. Use market price.`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left: Signal Queue */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Trade Signals</h3>
          <button 
            onClick={() => {
              setIsSyncing(true);
              if (onQuickAction) onQuickAction("Scan Kraken markets and generate trading signals now.");
              setTimeout(() => setIsSyncing(false), 2000);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg hover:bg-emerald-500/20 hover:text-emerald-400 hover:border-emerald-500/50 transition-all text-[9px] font-black uppercase text-zinc-400"
          >
            <Activity size={12} className={isSyncing ? "animate-spin" : ""} />
            Force Market Scan
          </button>
        </div>

        <div className="space-y-2">
          {signals.length > 0 ? signals.map(s => (
            <div key={s.ID} className={`flex flex-col sm:flex-row justify-between sm:items-center gap-4 p-5 bg-zinc-950 border-l-4 rounded-xl shadow-xl transition-all hover:bg-zinc-900 ${
              s.action === 'BUY' ? 'border-l-emerald-500 border-zinc-800' : 'border-l-red-500 border-zinc-800'
            }`}>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className={`text-lg font-black uppercase italic ${s.action === 'BUY' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {s.action}
                  </span>
                  <span className="text-sm font-black text-white">{s.asset}</span>
                  <span className="text-[9px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700">
                    @ ${s.price.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-lg">{s.reasoning}</p>
              </div>
              
              <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 border-t sm:border-t-0 sm:border-l border-zinc-800 pt-3 sm:pt-0 sm:pl-4">
                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Confidence</p>
                  <p className="text-lg font-mono font-black text-white">{(s.confidence * 100).toFixed(0)}%</p>
                </div>
                <button 
                  onClick={() => handleApprove(s)}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center gap-2 transition-all"
                >
                  Approve <ArrowRight size={12}/>
                </button>
              </div>
            </div>
          )) : (
            <div className="p-10 border border-dashed border-zinc-800 rounded-2xl text-center">
              <Terminal className="mx-auto text-zinc-700 mb-3" size={32} />
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Awaiting Arbitrage Signals...</p>
            </div>
          )}
        </div>
      </div>

      {/* Right: Arbiter Controls */}
      <div className="space-y-6">
        <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 p-6 relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-6">
              <ShieldCheck className="text-emerald-500" size={18} />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Arbiter Engine Live</span>
            </div>
            <h3 className="text-sm font-bold text-white mb-2">Automated Execution</h3>
            <p className="text-xs text-zinc-400 mb-6">The Financier agent is authorized to automatically execute trades with a confidence score above 90%.</p>
            
            <div className="space-y-3">
               <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
                 <span>Max Trade Size</span>
                 <span className="text-white font-mono">$500.00</span>
               </div>
               <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest border-b border-zinc-800 pb-2">
                 <span>Auto-Execute</span>
                 <span className="text-emerald-500">Enabled</span>
               </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// --- VIEW: CRYPTO TERMINAL ---
function CryptoTerminal() {
  const[holdings, setHoldings] = useState<any[]>([]);

  useEffect(() => {
      fetch(`${GATEWAY_URL}/api/v1/finance/holdings`)
          .then(res => res.json())
          .then(data => { if (Array.isArray(data)) setHoldings(data); });
  },[]);

  return (
    <div className="space-y-6">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Live Kraken Liquidity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {holdings.length > 0 ? holdings.map((h) => (
                <Card key={h.ID} className="bg-zinc-950 border-zinc-800 p-6 flex flex-col justify-center serqet-glow group hover:border-emerald-500/30 transition-all">
                    <div className="flex justify-between items-center mb-2">
                        <span className="font-black tracking-widest text-zinc-500 uppercase text-[10px]">Asset</span>
                        <span className="text-xs font-black text-emerald-400">{h.asset}</span>
                    </div>
                    <span className="text-3xl font-mono text-white font-black tracking-tighter truncate">
                      {h.balance.toFixed(4)}
                    </span>
                </Card>
            )) : (
              <div className="col-span-full p-10 border border-dashed border-zinc-800 rounded-2xl text-center">
                 <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No assets found. Ask Serqet to Sync Kraken.</p>
              </div>
            )}
        </div>
    </div>
  );
}

// --- VIEW: FIAT LEDGER ---
function FiatLedger({ summary }: { summary: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="col-span-1 bg-zinc-950 border-zinc-900 p-8 flex flex-col justify-center">
        <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-2">Total Outflow</p>
        <h2 className="text-5xl font-black text-white italic tracking-tighter">
          ${summary.total_expenses?.toLocaleString() || "0"}
        </h2>
      </Card>
      
      <Card className="col-span-2 bg-zinc-950/50 border-zinc-900 p-6">
        <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Recent Transactions</h3>
        <div className="space-y-2">
          {summary.recent_records?.length > 0 ? summary.recent_records.map((r: any) => (
            <div key={r.ID} className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-xl flex justify-between items-center hover:bg-zinc-900 transition-colors">
              <div>
                <p className="font-bold text-sm text-zinc-200">{r.category}</p>
                <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">{r.description}</p>
              </div>
              <p className="text-lg font-mono font-black text-red-400">-${r.amount.toFixed(2)}</p>
            </div>
          )) : (
            <p className="text-[10px] font-black text-zinc-600 uppercase">No fiat transactions recorded.</p>
          )}
        </div>
      </Card>
    </div>
  );
}

// --- SUB-COMPONENTS ---
function TabBtn({ active, onClick, icon, label }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
        active ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
      }`}
    >
      {icon} {label}
    </button>
  );
}