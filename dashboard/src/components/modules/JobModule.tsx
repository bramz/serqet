import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { LayoutDashboard } from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function JobModule() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/jobs`)
      .then(res => res.json())
      .then(setJobs);
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-2">
        <LayoutDashboard className="text-orange-500" /> Job Tracker
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {jobs.map((job) => (
          <Card key={job.ID} className="bg-zinc-900 border-zinc-800 text-white p-6 serqet-glow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-white">{job.role}</h3>
                <p className="text-zinc-400">{job.company}</p>
              </div>
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-orange-900/40 text-orange-400 uppercase">
                {job.status}
              </span>
            </div>
            {job.link && (
              <a href={job.link} target="_blank" className="text-blue-400 text-xs mt-4 block hover:underline">
                View Posting →
              </a>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}