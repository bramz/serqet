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
          <LayoutDashboard className="text-blue-500" /> Serqet
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
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold mb-4 flex items-center gap-2"><MessageSquareText /> Social Hub</h2>
      <Card className="bg-zinc-900 border-zinc-800 text-white p-20 text-center">
        <p className="text-zinc-500 italic">No scheduled posts. Type "Write a post" below.</p>
      </Card>
    </div>
  );
}

function FinanceModule() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold mb-4 flex items-center gap-2"><DollarSign /> Finance Ledger</h2>
      <div className="grid grid-cols-3 gap-4">
        <Card className="bg-green-900/20 border-green-800 text-green-400 p-6"><CardTitle>$12,450</CardTitle>Balance</Card>
        <Card className="bg-red-900/20 border-red-800 text-red-400 p-6"><CardTitle>$1,200</CardTitle>Expenses</Card>
      </div>
    </div>
  );
}

function TaskModule() {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-3xl font-bold mb-4 flex items-center gap-2"><ListTodo /> Task Priority</h2>
      <ul className="space-y-2">
        <li className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg italic text-zinc-500">No active tasks.</li>
      </ul>
    </div>
  );
}