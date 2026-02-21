"use client";

import { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquareText, DollarSign, ListTodo, LayoutDashboard } from "lucide-react";

// --- Types ---
interface Module {
  id: string;
  name: string;
  icon: string;
}

interface IntentResponse {
  status: string;
  message: string;
  action?: string;
}

const GATEWAY_URL = "http://localhost:8001";

export default function Home() {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [query, setQuery] = useState("");
  const [chatHistory, setChatHistory] = useState<{role: string, text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Load modules on mount
  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/modules`)
      .then(res => res.json())
      .then(data => setModules(data))
      .catch(err => console.error("Gateway error:", err));
  }, []);

  // 2. Handle AI Query
  const handleQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    const userMsg = query;
    setQuery("");
    setChatHistory(prev => [...prev, { role: "user", text: userMsg }]);

    try {
      const res = await fetch(`${GATEWAY_URL}/api/v1/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "wired", query: userMsg }),
      });
      
      const data: IntentResponse = await res.json();
      
      setChatHistory(prev => [...prev, { role: "serqet", text: data.message }]);

      if (data.action && data.action.startsWith("view_")) {
        const targetModule = data.action.replace("view_", "");
        setActiveTab(targetModule);
      }
    } catch (err) {
      setChatHistory(prev => [...prev, { role: "error", text: "Connection lost to Gateway." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-black text-white font-sans">
      {/* SIDEBAR */}
      <nav className="w-64 border-r border-zinc-800 p-4 flex flex-col gap-2">
        <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
          <LayoutDashboard className="text-blue-500 serqet-glow" /> Serqet
        </h1>
        
        <button 
          onClick={() => setActiveTab("overview")}
          className={`p-3 rounded-lg text-left transition ${activeTab === 'overview' ? 'bg-zinc-800 border border-zinc-700' : 'hover:bg-zinc-900'}`}
        >
          Overview
        </button>

        {modules.map(m => (
          <button 
            key={m.id}
            onClick={() => setActiveTab(m.id)}
            className={`p-3 rounded-lg text-left transition flex justify-between items-center ${activeTab === m.id ? 'bg-zinc-800 border border-zinc-700 text-blue-400' : 'hover:bg-zinc-900 text-zinc-400'}`}
          >
            {m.name}
            {activeTab === m.id && <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />}
          </button>
        ))}
      </nav>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        
        {/* Module Content Viewport */}
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === "overview" && <OverviewView modules={modules} />}
          {activeTab === "social" && <SocialModule />}
          {activeTab === "finance" && <FinanceModule />}
          {activeTab === "task" && <TaskModule />}
          {activeTab === "jobs" && <JobModule />}
        </div>

        {/* AI CHAT INTERFACE (Fixed at bottom) */}
        <div className="p-6 bg-zinc-950 border-t border-zinc-800">
          <div className="max-w-3xl mx-auto">
            <div className="mb-4 space-y-2 max-h-40 overflow-y-auto p-2">
              {chatHistory.slice(-3).map((msg, i) => (
                <div key={i} className={`text-sm ${msg.role === 'user' ? 'text-zinc-500' : 'text-blue-400'}`}>
                  <span className="font-bold uppercase tracking-tighter mr-2">{msg.role}:</span> {msg.text}
                </div>
              ))}
            </div>
            
            <form onSubmit={handleQuery} className="relative">
              <Input 
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter a command..."
                className="bg-zinc-900 border-zinc-700 h-12 pr-20 focus:ring-blue-500"
                disabled={loading}
              />
              <Button 
                type="submit" 
                className="absolute right-1 top-1 bottom-1 bg-blue-600 hover:bg-blue-500"
                disabled={loading}
              >
                {loading ? "..." : "Send"}
              </Button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

// Module Sub Components

function OverviewView({ modules }: { modules: Module[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <Card className="bg-zinc-900 border-zinc-800 text-white col-span-2">
        <CardHeader><CardTitle>System Status</CardTitle></CardHeader>
        <CardContent>All systems operational. {modules.length} modules loaded.</CardContent>
      </Card>
    </div>
  );
}

function SocialModule() {
  const [drafts, setDrafts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/social/posts`)
      .then(res => res.json())
      .then(setDrafts);
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-2"><MessageSquareText className="text-purple-500" /> Social Hub</h2>
      
      <div className="grid grid-cols-1 gap-4">
        {drafts.length > 0 ? drafts.map((d, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800 text-white p-6 serqet-glow">
            <div className="flex justify-between items-start mb-4">
              <span className="px-2 py-1 rounded bg-purple-900/30 text-purple-400 text-xs font-bold uppercase">
                {d.platform}
              </span>
              <span className="text-xs text-zinc-500">{new Date(d.CreatedAt).toLocaleDateString()}</span>
            </div>
            <p className="text-lg mb-4">{d.content}</p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="border-zinc-700 hover:bg-zinc-800">Edit</Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700">Post to {d.platform}</Button>
            </div>
          </Card>
        )) : (
          <p className="text-center text-zinc-500 p-20 border border-dashed border-zinc-800 rounded-xl">
            No drafts found. Tell Serqet: "Draft a post about..."
          </p>
        )}
      </div>
    </div>
  );
}

function FinanceModule() {
  const [summary, setSummary] = useState<{total_expenses: number, recent_records: any[]}>({
    total_expenses: 0,
    recent_records: []
  });

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/finance/summary`)
      .then(res => res.json())
      .then(setSummary);
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-2"><DollarSign className="text-green-500" /> Finance Ledger</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-zinc-900 border-zinc-800 text-white p-6">
          <p className="text-zinc-400 text-sm">Total Tracked Expenses</p>
          <CardTitle className="text-3xl text-green-400 mt-2">
            ${summary.total_expenses.toLocaleString()}
          </CardTitle>
        </Card>
      </div>

      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-zinc-400">Recent Transactions</h3>
        {summary.recent_records.map((r, i) => (
          <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium">{r.category}</p>
              <p className="text-xs text-zinc-500">{r.description}</p>
            </div>
            <p className="text-red-400">-${r.amount}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskModule() {
  const [tasks, setTasks] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/tasks`)
      .then(res => res.json())
      .then(setTasks)
      .catch(err => console.error("Task fetch error:", err));
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

function JobModule() {
  const [jobs, setJobs] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/jobs`)
      .then(res => res.json())
      .then(setJobs);
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-2">
        <LayoutDashboard className="text-orange-500" /> Job Tracker
      </h2>
      
      <div className="grid grid-cols-1 gap-4">
        {jobs.length > 0 ? jobs.map((job) => (
          <Card key={job.ID} className="bg-zinc-900 border-zinc-800 text-white p-6 serqet-glow">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">{job.role}</h3>
                <p className="text-zinc-400">{job.company}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                job.status === 'Interviewing' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'
              }`}>
                {job.status}
              </span>
            </div>
            {job.link && (
              <a href={job.link} target="_blank" className="text-blue-400 text-sm mt-4 inline-block hover:underline">
                View Listing →
              </a>
            )}
          </Card>
        )) : (
          <p className="text-zinc-500 italic text-center p-10">No jobs tracked yet. Tell Serqet: "I just applied at Tesla."</p>
        )}
      </div>
    </div>
  );
}