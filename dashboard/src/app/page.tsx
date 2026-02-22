"use client";

import { useEffect, useState } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useSerqet } from '@/hooks/useSerqet';
import { GATEWAY_URL } from '@/lib/constants';
import { Module } from '@/types';

// Module Imports
import { OverviewModule } from '@/components/modules/OverviewModule';
import { SocialModule } from '@/components/modules/SocialModule';
import { FinanceModule } from '@/components/modules/FinanceModule';
import { TaskModule } from '@/components/modules/TaskModule';
import { JobModule } from '@/components/modules/JobModule';

export default function Home() {
  const [modules, setModules] = useState<Module[]>([]);
  const [activeTab, setActiveTab] = useState("overview");

  const { chatHistory, askSerqet, loading } = useSerqet((action) => {
    if (action.startsWith("view_")) {
      setActiveTab(action.replace("view_", ""));
    }
  });

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/modules`).then(res => res.json()).then(setModules);
  }, []);

  return (
    <div className="flex h-screen bg-black text-white">
      <Sidebar modules={modules} activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 flex flex-col relative overflow-hidden">
        <div className="flex-1 p-8 overflow-y-auto">
          {activeTab === "overview" && <OverviewModule modules={modules} />}
          {activeTab === "social" && <SocialModule />}
          {activeTab === "finance" && <FinanceModule />}
          {activeTab === "tasks" && <TaskModule />}
          {activeTab === "jobs" && <JobModule />}
        </div>

        <ChatInterface 
          history={chatHistory} 
          onSend={askSerqet} 
          loading={loading} 
        />
      </main>
    </div>
  );
}