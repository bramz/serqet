"use client";

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Activity, Cpu, ChevronLeft, ChevronRight, 
  Settings, Zap, Database, Bell, Signal 
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function Sidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean, setIsCollapsed: (v: boolean) => void }) {
  const [sysHealth, setSysHealth] = useState({ gateway: 'online', brain: 'online' });

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/health`);
        setSysHealth(prev => ({ ...prev, gateway: res.ok ? 'online' : 'offline' }));
      } catch {
        setSysHealth(prev => ({ ...prev, gateway: 'offline' }));
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.aside 
      initial={false}
      animate={{ width: isCollapsed ? '64px' : '260px' }}
      className="h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col relative z-50 shadow-2xl"
    >
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-12 bg-purple-600 text-white rounded-full p-1 border border-black shadow-xl hover:bg-purple-500 transition-all"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      <div className="p-8 flex items-center gap-4">
        <div className="min-w-[36px] h-9 w-9 bg-purple-600 rounded-xl flex items-center justify-center serqet-glow shadow-lg shadow-purple-500/20">
          <Zap size={20} className="fill-white text-white" />
        </div>
        {!isCollapsed && (
          <span className="font-black tracking-tighter text-2xl uppercase italic">Serqet</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8 mt-4 scrollbar-hide">
        <section className="space-y-3">
          {!isCollapsed && <p className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] px-3">Subsystems</p>}
          <StatusItem icon={<Cpu size={16}/>} label="Brain" status={sysHealth.brain} collapsed={isCollapsed} />
          <StatusItem icon={<Database size={16}/>} label="Gateway" status={sysHealth.gateway} collapsed={isCollapsed} />

        </section>

        {!isCollapsed && (
          <section className="space-y-4 animate-in fade-in slide-in-from-left-2">
            <div className="flex justify-between items-center px-3">
              <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Active Monitor</p>
              <Activity size={12} className="text-emerald-500 animate-pulse" />
            </div>
            <div className="bg-purple-500/5 rounded-2xl border border-purple-500/10 p-4">
              <p className="text-[10px] font-bold text-zinc-500 uppercase mb-1">BTC/USD</p>
              <p className="text-xl font-mono font-black text-emerald-400">$70,102</p>
            </div>
          </section>
        )}
      </div>

      <div className="p-6">
        <button className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-zinc-900 transition-colors text-zinc-500 group">
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-500" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-widest">OS Settings</span>}
        </button>
      </div>
    </motion.aside>
  );
}

function StatusItem({ icon, label, status, collapsed }: any) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-zinc-900 transition-colors cursor-pointer group">
      <div className={status === 'online' ? 'text-purple-500' : 'text-zinc-700'}>{icon}</div>
      {!collapsed && (
        <div className="flex-1 flex justify-between items-center">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tight">{label}</span>
          <div className={`h-1 w-1 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
        </div>
      )}
    </div>
  );
}