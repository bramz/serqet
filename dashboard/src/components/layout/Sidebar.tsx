"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Cpu, ChevronLeft, ChevronRight, 
  Settings, Zap, Database, MessageSquare, 
  Plus, BarChart3, Search, ShieldAlert,
  Terminal, Hash
} from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

interface Session {
  id: string;
  title: string;
  timestamp: string;
  active: boolean;
}

export function Sidebar({ isCollapsed, setIsCollapsed }: { 
  isCollapsed: boolean, 
  setIsCollapsed: (v: boolean) => void 
}) {
  const [sysHealth, setSysHealth] = useState({ gateway: 'online', brain: 'online' });
  
  // Mock Sessions - In the future, these will come from GET /api/v1/sessions
  const [sessions] = useState<Session[]>([
    { id: '1', title: 'Market Analysis: BTC', timestamp: '2m', active: true },
    { id: '2', title: 'Daily Workout Plan', timestamp: '1h', active: false },
    { id: '3', title: 'Revenue Arbitrage Log', timestamp: 'Yesterday', active: false }
  ]);

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
      animate={{ width: isCollapsed ? '72px' : '280px' }}
      className="h-screen bg-zinc-950 border-r border-zinc-900 flex flex-col relative z-50 shadow-2xl overflow-hidden"
    >
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-10 bg-primary text-white rounded-full p-1 border border-black shadow-xl hover:scale-110 transition-all z-50"
      >
        {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>

      {/* OS Branding */}
      <div className="p-6 flex items-center gap-4">
        <div className="min-w-[40px] h-10 w-10 bg-primary rounded-xl flex items-center justify-center serqet-glow shadow-lg shadow-primary/20">
          <Terminal size={22} className="text-white" />
        </div>
        {!isCollapsed && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">
            <span className="font-black tracking-tighter text-xl uppercase italic leading-none">Serqet</span>
            <span className="text-[10px] text-primary font-bold tracking-[0.3em] uppercase">Kernel v1.0</span>
          </motion.div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 space-y-8 mt-2 scrollbar-hide">
        
        {/* SECTION 1: SESSION MANAGER */}
        <section className="space-y-4">
          <div className="flex justify-between items-center px-2">
            {!isCollapsed && <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Active Sessions</p>}
            <button className="p-1 hover:bg-zinc-800 rounded text-primary transition-colors">
              <Plus size={16} />
            </button>
          </div>
          
          <div className="space-y-1">
            {sessions.map(s => (
              <div 
                key={s.id} 
                className={`flex items-center gap-3 p-3 rounded-xl transition-all cursor-pointer group 
                  ${s.active ? 'bg-primary/10 border border-primary/20' : 'hover:bg-zinc-900 border border-transparent'}`}
              >
                <MessageSquare size={16} className={s.active ? 'text-primary' : 'text-zinc-500'} />
                {!isCollapsed && (
                  <div className="flex-1 flex flex-col min-w-0">
                    <span className={`text-xs font-bold truncate ${s.active ? 'text-white' : 'text-zinc-400'}`}>
                      {s.title}
                    </span>
                    <span className="text-[9px] text-zinc-600 font-mono">{s.timestamp}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: WORKER THREADS (Background Processes) */}
        <section className="space-y-4 pt-4 border-t border-zinc-900">
          {!isCollapsed && <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Worker Threads</p>}
          <div className="space-y-1">
            <WorkerItem icon={<BarChart3 size={14}/>} label="Market Logic" status="Active" color="text-emerald-500" collapsed={isCollapsed} />
            <WorkerItem icon={<Search size={14}/>} label="Web Scraper" status="Sleeping" color="text-zinc-600" collapsed={isCollapsed} />
            <WorkerItem icon={<ShieldAlert size={14}/>} label="Security Audit" status="Nominal" color="text-blue-500" collapsed={isCollapsed} />
          </div>
        </section>

        {/* SECTION 3: SYSTEM METRICS (Pinned) */}
        <section className="space-y-4 pt-4 border-t border-zinc-900">
          {!isCollapsed && <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest px-2">Subsystems</p>}
          <div className="space-y-1">
             <StatusIndicator icon={<Cpu size={16}/>} label="Brain" status={sysHealth.brain} collapsed={isCollapsed} />
             <StatusIndicator icon={<Database size={16}/>} label="Gateway" status={sysHealth.gateway} collapsed={isCollapsed} />
          </div>
        </section>
      </div>

      {/* FOOTER: LIVE MONITOR */}
      {!isCollapsed && (
        <div className="mx-4 mb-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-center mb-2">
              <p className="text-[9px] font-black text-primary uppercase tracking-widest">Active Monitor</p>
              <Activity size={10} className="text-emerald-500 animate-pulse" />
            </div>
            <div className="flex justify-between items-end">
              <span className="text-[10px] font-bold text-zinc-500 italic">KRAKEN:BTC</span>
              <span className="text-sm font-mono font-black text-emerald-400">$70,102</span>
            </div>
        </div>
      )}

      <div className="p-4 border-t border-zinc-900">
        <button className="flex items-center gap-3 p-3 w-full rounded-xl hover:bg-zinc-900 transition-colors text-zinc-500 group">
          <Settings size={20} className="group-hover:rotate-90 transition-transform duration-700" />
          {!isCollapsed && <span className="text-xs font-bold uppercase tracking-widest">OS Settings</span>}
        </button>
      </div>
    </motion.aside>
  );
}

// --- Internal Helper Components ---

function WorkerItem({ icon, label, status, color, collapsed }: any) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg group">
      <div className={`${color}`}>{icon}</div>
      {!collapsed && (
        <div className="flex-1 flex justify-between items-center">
          <span className="text-[11px] font-bold text-zinc-500">{label}</span>
          <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${color} bg-current/10`}>
            {status}
          </span>
        </div>
      )}
    </div>
  );
}

function StatusIndicator({ icon, label, status, collapsed }: any) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg group">
      <div className={status === 'online' ? 'text-primary' : 'text-zinc-700'}>{icon}</div>
      {!collapsed && (
        <div className="flex-1 flex justify-between items-center">
          <span className="text-[11px] font-bold text-zinc-400 uppercase">{label}</span>
          <div className={`h-1 w-1 rounded-full ${status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
        </div>
      )}
    </div>
  );
}