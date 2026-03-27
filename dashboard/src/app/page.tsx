"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { useSerqet } from "@/hooks/useSerqet";
import { useState, useEffect, useCallback } from "react";
import { OverviewModule } from "@/components/modules/OverviewModule";
import { FinanceModule } from "@/components/modules/FinanceModule";
import { SocialModule } from "@/components/modules/SocialModule";
import { ResearchModule } from "@/components/modules/ResearchModule";
import { JobModule } from "@/components/modules/JobModule";
import { TaskModule } from "@/components/modules/TaskModule";
import { HealthModule } from "@/components/modules/HealthModule";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { SettingsModule } from "@/components/modules/SettingsModule";

// Define the available modes
export type TerminalMode = 'collapsed' | 'half' | 'full';

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSessionId, setActiveSessionId] = useState<string>("default");
  const [terminalMode, setTerminalMode] = useState<TerminalMode>('collapsed');

  useEffect(() => {
    const savedSession = localStorage.getItem("serqet_active_session");
    if (savedSession) {
      setActiveSessionId(savedSession);
    }
  }, []);

  const handleSessionChange = (id: string) => {
    setActiveSessionId(id);
    localStorage.setItem("serqet_active_session", id);
  };

  const { chatHistory, askSerqet, loading } = useSerqet(activeSessionId, (action) => {
    if (action.startsWith("view_")) {
      setActiveTab(action.replace("view_", ""));
    }
  });

  const executeCommand = useCallback((query: string, file?: File | null) => {
    setTerminalMode('half'); 
    askSerqet(query, file);
  }, [askSerqet]);

  return (
    <div 
      className="flex h-screen bg-black text-white overflow-hidden"
      style={{ '--sidebar-width': isSidebarCollapsed ? '72px' : '280px' } as any}
    >
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionChange}
        onNavigate={(tab: string) => setActiveTab(tab)}
      />
      
      <main className="flex-1 relative flex flex-col min-w-0">
        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide pb-32">
          {activeTab === "overview" && (
            <OverviewModule onQuickAction={executeCommand} onNavigate={setActiveTab} />
          )}
          {activeTab === "finance" && <FinanceModule onQuickAction={executeCommand}/>}
          {activeTab === "social" && <SocialModule />}
          {activeTab === "research" && <ResearchModule />}
          {activeTab === "job" && <JobModule />}
          {activeTab === "task" && <TaskModule />}
          {activeTab === "health" && <HealthModule />}
          {activeTab === "settings" && <SettingsModule />}

          {activeTab !== "overview" && (
            <button 
              onClick={() => setActiveTab("overview")}
              className="fixed top-6 right-6 px-4 py-2 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-full text-[10px] font-black tracking-widest text-zinc-500 hover:text-primary transition-all z-40"
            >
              ← RETURN TO DASHBOARD
            </button>
          )}
        </div>

        <ChatInterface 
          history={chatHistory} 
          onSend={executeCommand} 
          loading={loading} 
          mode={terminalMode}
          setMode={setTerminalMode}
        />
      </main>
    </div>
  );
}