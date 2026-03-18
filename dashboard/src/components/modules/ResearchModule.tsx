"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Globe, Search, FileText, Terminal, Layers } from "lucide-react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GATEWAY_URL } from '@/lib/constants';

export function ResearchModule() {
  const [reports, setReports] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/research`)
      .then(res => res.json())
      .then(setReports);
  }, []);

  return (
    <div className="animate-in fade-in duration-700 space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">Intelligence Hub</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Active Web Research & Deep Analysis</p>
        </div>
        <Layers className="text-primary mb-1" size={24} />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {reports.length > 0 ? reports.map((r) => (
          <Card key={r.ID} className="bg-zinc-950 border-zinc-800 overflow-hidden group hover:border-primary/40 transition-all shadow-2xl">
            {/* Dossier Header */}
            <div className="bg-zinc-900/50 border-b border-zinc-800 p-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-black rounded-lg">
                  <FileText size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Report Query</p>
                  <h3 className="text-sm font-bold text-white uppercase tracking-tight">{r.query}</h3>
                </div>
              </div>
              <div className="text-right font-mono">
                <p className="text-[9px] font-black text-zinc-600 uppercase">Timestamp</p>
                <p className="text-[10px] text-zinc-400">{new Date(r.CreatedAt).toLocaleString()}</p>
              </div>
            </div>

            <CardContent className="p-6">
              <div className="flex gap-2 mb-4">
                <span className="text-[8px] font-black bg-primary/10 text-cyan-500 px-2 py-0.5 rounded uppercase tracking-widest border border-primary/20">Source: DuckDuckGo</span>
                <span className="text-[8px] font-black bg-zinc-900 text-zinc-500 px-2 py-0.5 rounded uppercase tracking-widest">Type: Live_Scrape</span>
              </div>
              
              {/* Structured Markdown Content */}
              <div className="prose prose-invert prose-sm max-w-none 
                text-zinc-300 
                prose-p:text-zinc-300 
                prose-p:leading-relaxed
                prose-headings:text-white 
                prose-strong:text-primary 
                prose-code:text-cyan-400
                prose-li:text-zinc-300
                prose-table:text-zinc-300
                border-t border-zinc-900 pt-4"
              >
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {r.findings}
                </ReactMarkdown>
              </div>

            </CardContent>

            <div className="bg-zinc-900/20 p-3 border-t border-zinc-900 flex justify-between items-center">
               <span className="text-[9px] font-mono text-zinc-700 uppercase">Encrypted_Object_ID: {r.ID.slice(0,8)}</span>
               <button className="text-[9px] font-black text-primary hover:text-white uppercase tracking-widest transition-colors">Generate Summary →</button>
            </div>
          </Card>
        )) : (
          <div className="p-20 border border-dashed border-zinc-800 rounded-3xl text-center">
            <Terminal className="mx-auto text-zinc-800 mb-4" size={48} />
            <p className="text-zinc-500 font-black uppercase tracking-widest text-xs">No intelligence data found in local database.</p>
          </div>
        )}
      </div>
    </div>
  );
}