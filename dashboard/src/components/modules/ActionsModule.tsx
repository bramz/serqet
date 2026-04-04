"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Zap, Play, Edit3, CheckCircle, Clock } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import { GATEWAY_URL } from '@/lib/constants';

export function ActionsModule({ onQuickAction }: any) {
  const [actions, setActions] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/actions/pending`)
      .then(res => res.json())
      .then(setActions);
  }, []);

  return (
    <div className="animate-in fade-in duration-700 space-y-8 max-w-6xl mx-auto pb-40">
      <h2 className="text-5xl font-black italic text-white uppercase tracking-tighter">Action <span className="text-primary">Center</span></h2>
      
      <div className="grid grid-cols-1 gap-4">
        {actions.map((action) => (
          <Card key={action.ID} className="bg-zinc-950 border-zinc-900 p-6 group hover:border-primary/40 transition-all">
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded uppercase">{action.type}</span>
                  <h3 className="text-sm font-bold text-white uppercase">{action.title}</h3>
               </div>
               <span className="text-[10px] font-mono text-zinc-600">{action.priority} PRIORITY</span>
            </div>

            <div className="bg-black/40 p-5 rounded-2xl border border-zinc-900 mb-6 text-zinc-400 text-xs">
               <ReactMarkdown>{action.content}</ReactMarkdown>
            </div>

            <div className="flex justify-end gap-3">
              <button onClick={() => onQuickAction(`Refactor draft: ${action.title}`)} className="px-6 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-black text-zinc-500 hover:text-white uppercase">Refactor</button>
              <button onClick={() => onQuickAction(`Execute pending action: ${action.title}`)} className="px-8 py-2 bg-primary text-white text-[10px] font-black uppercase rounded-lg flex items-center gap-2 shadow-lg">
                <Play size={12}/> Deploy
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}