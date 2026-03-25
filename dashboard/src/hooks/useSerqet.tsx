"use client";

import { useState, useEffect } from 'react';
import { GATEWAY_URL } from '@/lib/constants';
import { ChatMessage, IntentResponse } from '@/types';

export function useSerqet(activeSessionId: string, onAction: (action: string) => void) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!activeSessionId) return;
    const loadHistory = async () => {
      const res = await fetch(`${GATEWAY_URL}/api/v1/history/${activeSessionId}`);
      if (res.ok) {
        const data = await res.json();
        setChatHistory(data.map((h: any) => ({
          role: h.role,
          text: h.text,
          image: h.file_path ? `${GATEWAY_URL}${h.file_path}` : undefined
        })));
      }
    };
    loadHistory();
  }, [activeSessionId]);

  const askSerqet = async (query: string, file?: File | null) => {
    setLoading(true);
    let filePath = "";
    let previewUrl = "";

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        const uploadRes = await fetch(`${GATEWAY_URL}/api/v1/upload`, { method: "POST", body: formData });
        const uploadData = await uploadRes.json();
        filePath = uploadData.path; 
        previewUrl = `${GATEWAY_URL}${uploadData.url}`;
      }

      setChatHistory(prev => [...prev, { role: 'user', text: query, image: previewUrl || undefined }]);

      const res = await fetch(`${GATEWAY_URL}/api/v1/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: "wired", 
          session_id: activeSessionId, 
          query,
          file_path: filePath 
        }),
      });
      
      const data: IntentResponse = await res.json();
      setChatHistory(prev => [...prev, { role: 'serqet', text: data.message }]);
      if (data.action) onAction(data.action);

    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'error', text: "Neural Link interrupted." }]);
    } finally {
      setLoading(false);
    }
  };

  return { chatHistory, askSerqet, loading };
}