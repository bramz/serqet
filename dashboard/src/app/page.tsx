"use client";

import { useState } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { ChatInterface } from "@/components/chat/ChatInterface";
import { useSerqet } from "@/hooks/useSerqet";

// Modules
import { OverviewModule } from "@/components/modules/OverviewModule";
import { FinanceModule } from "@/components/modules/FinanceModule";
import { SocialModule } from "@/components/modules/SocialModule";
import { ResearchModule } from "@/components/modules/ResearchModule";
import { JobModule } from "@/components/modules/JobModule";
import { TaskModule } from "@/components/modules/TaskModule";
import { HealthModule } from "@/components/modules/HealthModule";

export default function Home() {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  const { chatHistory, askSerqet, loading } = useSerqet((action) => {
    if (action.startsWith("view_")) {
      setActiveTab(action.replace("view_", ""));
    }
  });

  return (
    <div 
      className="flex h-screen bg-black text-white overflow-hidden"
      style={{ '--sidebar-width': isSidebarCollapsed ? '72px' : '280px' } as React.CSSProperties}
    >
      <Sidebar isCollapsed={isSidebarCollapsed} setIsCollapsed={setIsSidebarCollapsed} />
      
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