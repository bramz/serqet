import { LayoutDashboard } from "lucide-react";
import { Module } from "@/types";

export function Sidebar({ modules, activeTab, onTabChange }: { 
  modules: Module[], 
  activeTab: string, 
  onTabChange: (id: string) => void 
}) {
  return (
    <nav className="w-64 border-r border-zinc-800 p-4 flex flex-col gap-2">
      <h1 className="text-xl font-bold mb-6 flex items-center gap-2">
        <LayoutDashboard className="text-blue-500 serqet-glow" /> Serqet
      </h1>
      <button 
        onClick={() => onTabChange("overview")}
        className={`p-3 rounded-lg text-left transition ${activeTab === 'overview' ? 'bg-zinc-800 border-zinc-700' : 'hover:bg-zinc-900'}`}
      >
        Overview
      </button>
      {modules.map(m => (
        <button 
          key={m.id}
          onClick={() => onTabChange(m.id)}
          className={`p-3 rounded-lg text-left transition ${activeTab === m.id ? 'bg-zinc-800 text-blue-400' : 'text-zinc-400'}`}
        >
          {m.name}
        </button>
      ))}
    </nav>
  );
}