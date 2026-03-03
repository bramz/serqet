"use client";

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Globe, BookOpen, Search } from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function ResearchModule() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/research`)
      .then(res => res.json())
      .then(setReports);
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-2">
        <Search className="text-cyan-500" /> Research Hub
      </h2>

      <div className="grid grid-cols-1 gap-4">
        {reports.length > 0 ? reports.map((r) => (
          <Card key={r.ID} className="bg-zinc-900 border-zinc-800 text-white serqet-glow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-sm font-medium text-cyan-400">
                  {r.query}
                </CardTitle>
                <Globe size={14} className="text-zinc-600" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-zinc-300 leading-relaxed line-clamp-4">
                {r.findings}
              </p>
              <p className="text-[10px] text-zinc-600 mt-4 uppercase tracking-widest">
                Source: DuckDuckGo • {new Date(r.CreatedAt).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )) : (
          <div className="p-20 border border-dashed border-zinc-800 rounded-xl text-center text-zinc-500">
            Ask Serqet: "Research the current price of gold" or "Find remote Go jobs"
          </div>
        )}
      </div>
    </div>
  );
}