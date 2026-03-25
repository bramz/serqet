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

// Define the available modes
export type TerminalMode = 'collapsed' | 'half' | 'full';

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSessionId, setActiveSessionId] = useState<string>("default");
  
  // Tri-state terminal control
  const [terminalMode, setTerminalMode] = useState<TerminalMode>('collapsed');

  const { chatHistory, askSerqet, loading } = useSerqet(activeSessionId, (action) => {
    if (action.startsWith("view_")) setActiveTab(action.replace("view_", ""));
  });

  const executeCommand = useCallback((query: string, file?: File | null) => {
    // Auto-open to half-screen when a command is triggered
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
        onSessionSelect={setActiveSessionId}
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