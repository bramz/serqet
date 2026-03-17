"use client";

import { useEffect, useState } from 'react';
import { ListTodo, CheckCircle2, Circle, AlertCircle } from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function TaskModule() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/tasks`).then(res => res.json()).then(setTasks);
  }, []);

  return (
    <div className="animate-in fade-in duration-700 space-y-8 max-w-4xl mx-auto pb-20">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">Executive Queue</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Active Task Prioritization</p>
        </div>
        <ListTodo className="text-amber-500 mb-1" size={24} />
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.ID} className="flex items-center gap-4 p-4 bg-zinc-950 border border-zinc-900 rounded-2xl group hover:bg-zinc-900/50 transition-all">
            <div className="text-zinc-700 group-hover:text-primary transition-colors">
              {task.status === 'Completed' ? <CheckCircle2 size={20} className="text-emerald-500" /> : <Circle size={20} />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-bold ${task.status === 'Completed' ? 'text-zinc-600 line-through' : 'text-zinc-200'}`}>
                {task.title}
              </p>
              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest"></p>
            </div>
            <div className="px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full">
               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-tighter">{task.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}