"use client";

import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { Sidebar } from "@/components/layout/Sidebar";
import { useSerqet } from "@/hooks/useSerqet";

// Modules
import { OverviewModule } from "@/components/modules/OverviewModule";
import { FinanceModule } from "@/components/modules/FinanceModule";
import { SocialModule } from "@/components/modules/SocialModule";
import { ResearchModule } from "@/components/modules/ResearchModule";
import { JobModule } from "@/components/modules/JobModule";
import { TaskModule } from "@/components/modules/TaskModule";
import { HealthModule } from "@/components/modules/HealthModule";
// import { RevenueModule } from "@/components/modules/RevenueModule";

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // SESSION STATE: Initialize from localStorage to persist across refreshes
  const [activeSessionId, setActiveSessionId] = useState<string>("default");

  useEffect(() => {
    const savedSession = localStorage.getItem("serqet_active_session");
    if (savedSession) {
      setActiveSessionId(savedSession);
    }
  }, []);

  // Update localStorage whenever the session changes
  const handleSessionChange = (id: string) => {
    setActiveSessionId(id);
    localStorage.setItem("serqet_active_session", id);
  };

  // Pass activeSessionId to the hook so it can fetch the correct history
  const { chatHistory, askSerqet, loading } = useSerqet(activeSessionId, (action) => {
    if (action.startsWith("view_")) {
      setActiveTab(action.replace("view_", ""));
    }
  });

  return (
    <div 
      className="flex h-screen bg-black text-white overflow-hidden"
      style={{ '--sidebar-width': isSidebarCollapsed ? '72px' : '280px' } as React.CSSProperties}
    >
      <Sidebar 
        isCollapsed={isSidebarCollapsed} 
        setIsCollapsed={setIsSidebarCollapsed} 
        activeSessionId={activeSessionId}
        onSessionSelect={handleSessionChange}
      />
      
      <main className="flex-1 relative flex flex-col min-w-0">
        <div className="flex-1 p-6 overflow-y-auto scrollbar-hide pb-32">
          
          {activeTab === "overview" && (
            <OverviewModule 
              onQuickAction={askSerqet} 
              onNavigate={(tab: string) => setActiveTab(tab)} 
            />
          )}

          {activeTab === "finance" && <FinanceModule />}
          {activeTab === "social" && <SocialModule />}
          {activeTab === "research" && <ResearchModule />}
          {activeTab === "job" && <JobModule />}
          {activeTab === "task" && <TaskModule />}
          {activeTab === "health" && <HealthModule />}

          {activeTab !== "overview" && (
            <button 
              onClick={() => setActiveTab("overview")}
              className="fixed top-6 right-6 px-4 py-2 bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-full text-[10px] font-black tracking-widest text-zinc-500 hover:text-primary transition-all z-40"
            >
              ← RETURN TO DASHBOARD
            </button>
          )}
        </div>

        <ChatInterface history={chatHistory} onSend={askSerqet} loading={loading} />
      </main>
    </div>
  );
}