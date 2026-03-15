"use client";

import { motion } from 'framer-motion';
import { Card, CardTitle } from "@/components/ui/card";
import { Globe, Activity, Zap, TrendingUp, ArrowUpRight, Cpu, DollarSign } from "lucide-react";

export function OverviewModule({ onQuickAction }: { onQuickAction: (q: string) => void }) {
  return (
    <div className="space-y-12 max-w-6xl mx-auto animate-in fade-in duration-1000">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-white uppercase italic">Dashboard</h1>
          <p className="text-zinc-500 mt-2 font-bold text-sm tracking-wide">Overview</p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 bg-zinc-900 rounded-full border border-zinc-800">
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em]">Neural Link Active</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Money Maker Card */}
        <Card className="md:col-span-2 bg-gradient-to-br from-purple-900/20 to-black border-purple-500/20 p-10 relative overflow-hidden group cursor-pointer" 
              onClick={() => onQuickAction("Research a new revenue opportunity")}>
          <DollarSign className="text-purple-500 mb-6" size={40} />
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Revenue</h2>
          <p className="text-zinc-500 mt-2 text-sm max-w-sm">Scanning live data for market discrepancies and affiliate opportunities across modules.</p>
          <div className="mt-8 flex items-center gap-2 text-purple-400 text-[10px] font-black uppercase tracking-widest">
             INITIALIZE TASK <ArrowUpRight size={14}/>
          </div>
          <TrendingUp className="absolute -right-10 -bottom-10 w-64 h-64 text-purple-500/5 group-hover:text-purple-500/10 transition-all rotate-12" />
        </Card>

        {/* Quick Action Tiles */}
        <div className="space-y-6">
          <QuickTile 
            icon={<Globe className="text-cyan-400"/>} 
            title="Intelligence" 
            desc="Run Web Research" 
            onClick={() => onQuickAction("Perform a web search for latest AI news")} 
          />
          <QuickTile 
            icon={<Activity className="text-red-400"/>} 
            title="Bio-Metric" 
            desc="Log Health Metrics" 
            onClick={() => onQuickAction("I want to log my health data")} 
          />
        </div>
      </div>

      {/* OS Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBox label="Memories" value="1.2k" unit="VEC" />
          <StatBox label="Signals" value="09" unit="ACT" />
          <StatBox label="Health" value="88%" unit="SCORE" />
          <StatBox label="Uptime" value="99.9" unit="%" />
      </div>
    </div>
  );
}

function QuickTile({ icon, title, desc, onClick }: any) {
  return (
    <div onClick={onClick} className="p-6 bg-zinc-900/40 border border-zinc-800 rounded-3xl hover:bg-zinc-800 transition-all cursor-pointer flex items-center gap-5">
      <div className="p-4 bg-black rounded-2xl">{icon}</div>
      <div>
        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{title}</p>
        <p className="text-sm text-zinc-200 font-bold">{desc}</p>
      </div>
    </div>
  );
}

function StatBox({ label, value, unit }: any) {
  return (
    <div className="p-8 bg-zinc-900/20 border border-zinc-900 rounded-3xl">
      <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-2">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-4xl font-black text-white">{value}</span>
        <span className="text-[10px] font-bold text-purple-500">{unit}</span>
      </div>
    </div>
  );
}