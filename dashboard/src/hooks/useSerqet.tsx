"use client";

import { useState, useEffect } from 'react';
import { GATEWAY_URL } from '@/lib/constants';
import { ChatMessage, IntentResponse } from '@/types';

export function useSerqet(activeSessionId: string, onAction: (action: string) => void) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeSessionId) return;

    const loadPersistedHistory = async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/v1/history/${activeSessionId}`);
        const data = await res.json();

        setChatHistory(data.map((h: any) => ({
          role: h.role,
          text: h.text
        })));
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };

    loadPersistedHistory();
  }, [activeSessionId]);

  const askSerqet = async (query: string) => {
    if (!query || loading) return;

    setLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);

    try {
      const res = await fetch(`${GATEWAY_URL}/api/v1/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: "wired", 
          session_id: activeSessionId, 
          query 
        }),
      });
      
      const data: IntentResponse = await res.json();
      
      setChatHistory(prev => [...prev, { role: 'serqet', text: data.message }]);

      if (data.action) onAction(data.action);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'error', text: "Kernel link interrupted." }]);
    } finally {
      setLoading(false);
    }
  };

  return { chatHistory, askSerqet, loading };
}