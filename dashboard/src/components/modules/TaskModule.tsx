import { useEffect, useState } from 'react';
import { ListTodo } from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function TaskModule() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/tasks`)
      .then(res => res.json())
      .then(setTasks)
      .catch(err => console.error("Error fetching tasks:", err));
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-2">
        <ListTodo className="text-purple-500" /> Tasks
      </h2>
      
      <div className="space-y-3">
        {tasks.length > 0 ? tasks.map((task) => (
          <div key={task.ID} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center serqet-glow">
            <div className="flex items-center gap-3">
              <div className={`w-2 h-2 rounded-full ${task.status === 'Pending' ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'}`} />
              <span className={task.status === 'Completed' ? 'line-through text-zinc-500' : 'text-zinc-200'}>
                {task.title}
              </span>
            </div>
            <span className="text-[10px] uppercase tracking-widest text-zinc-600 font-bold">
              {task.status}
            </span>
          </div>
        )) : (
          <p className="text-zinc-500 italic text-center p-10">No tasks on the radar.</p>
        )}
      </div>
    </div>
  );
}