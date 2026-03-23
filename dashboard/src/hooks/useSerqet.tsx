"use client";

import { useState, useEffect } from 'react';
import { GATEWAY_URL } from '@/lib/constants';
import { ChatMessage, IntentResponse } from '@/types';

export function useSerqet(activeSessionId: string, onAction: (action: string) => void) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // --- PERSISTENCE: Load history when session changes ---
  useEffect(() => {
    if (!activeSessionId) return;

    const loadPersistedHistory = async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/v1/history/${activeSessionId}`);
        const data = await res.json();

        // Ensure we map any saved file paths to the displayable URL
        setChatHistory(data.map((h: any) => ({
          role: h.role,
          text: h.text,
          image: h.file_path ? `${GATEWAY_URL}${h.file_path}` : undefined
        })));
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };

    loadPersistedHistory();
  }, [activeSessionId]);

  // --- SUPERAGENT EXECUTION: Handle Text + Vision ---
  const askSerqet = async (query: string, file?: File | null) => {
    if ((!query && !file) || loading) return;

    setLoading(true);
    let filePathForBrain = "";
    let displayUrlForUI = "";

    try {
      // 1. PHASE 1: Handle File Ingestion (Vision/PDF)
      if (file) {
        const formData = new FormData();
        formData.append("file", file);

        const uploadRes = await fetch(`${GATEWAY_URL}/api/v1/upload`, {
          method: "POST",
          body: formData,
        });

        if (!uploadRes.ok) throw new Error("File upload failed");
        
        const uploadData = await uploadRes.json();
        filePathForBrain = uploadData.path; // Absolute path for Python to read
        displayUrlForUI = `${GATEWAY_URL}${uploadData.url}`; // Web URL for React <img>
      }

      // 2. PHASE 2: Optimistic UI Update
      // Show the user's query and their uploaded image immediately
      setChatHistory(prev => [...prev, { 
        role: 'user', 
        text: query, 
        image: displayUrlForUI || undefined 
      }]);

      // 3. PHASE 3: Neural Intent Request
      const res = await fetch(`${GATEWAY_URL}/api/v1/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: "wired", 
          session_id: activeSessionId, 
          query,
          file_path: filePathForBrain // The Python  sees this
        }),
      });
      
      const data: IntentResponse = await res.json();
      
      // 4. PHASE 4: Update with Agent Response
      setChatHistory(prev => [...prev, { role: 'serqet', text: data.message }]);

      // Trigger navigation or tools if requested by Agent
      if (data.action) onAction(data.action);

    } catch (err) {
      console.error("Superagent Link Failure:", err);
      setChatHistory(prev => [...prev, { 
        role: 'error', 
        text: "CRITICAL: Neural Link interrupted. Check Gateway/Brain logs." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return { chatHistory, askSerqet, loading };
}