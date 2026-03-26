"use client";

import { useState, useEffect, useCallback } from 'react';
import { GATEWAY_URL } from '@/lib/constants';
import { ChatMessage, IntentResponse } from '@/types';

export function useSerqet(activeSessionId: string, onAction: (action: string) => void) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  // --- HELPER: Ensure clean URL assembly (No double slashes) ---
  const buildWebUrl = (path: string | undefined) => {
    if (!path) return undefined;
    // Strip absolute machine paths to keep only /uploads/...
    const uploadIndex = path.indexOf("/uploads/");
    const relativePath = uploadIndex !== -1 ? path.substring(uploadIndex) : path;
    
    const baseUrl = GATEWAY_URL.replace(/\/$/, "");
    const cleanPath = relativePath.startsWith('/') ? relativePath : `/${relativePath}`;
    return `${baseUrl}${cleanPath}`;
  };

  // --- PERSISTENCE: Load and Sanitize History ---
  useEffect(() => {
    if (!activeSessionId) return;

    const loadHistory = async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/v1/history/${activeSessionId}`);
        if (res.ok) {
          const data = await res.json();
          setChatHistory(data.map((h: any) => ({
            role: h.role,
            text: h.text,
            // Images/Docs use the file_path column
            image: h.file_path ? buildWebUrl(h.file_path) : undefined,
            // Audio responses use the audio_url column
            audio_url: h.audio_url ? buildWebUrl(h.audio_url) : undefined
          })));
        }
      } catch (err) {
        console.error("Failed to load session history:", err);
      }
    };

    loadHistory();
  }, [activeSessionId]);

  // --- EXECUTION: Handle Text, Vision, and Vocal Ingest ---
  const askSerqet = async (query: string, file?: File | null) => {
    if ((!query && !file) || loading) return;

    setLoading(true);
    let brainPath = "";      // Absolute path for Python disk access
    let displayUrl = "";     // Clean URL for React <img> or <audio>

    try {
      // 1. UPLOAD PHASE (Image, PDF, or Voice .webm)
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadRes = await fetch(`${GATEWAY_URL}/api/v1/upload`, { 
          method: "POST", 
          body: formData 
        });

        if (!uploadRes.ok) throw new Error("Upload failed");
        const uploadData = await uploadRes.json();
        
        brainPath = uploadData.path; 
        displayUrl = buildWebUrl(uploadData.url)!;
      }

      // 2. OPTIMISTIC UI
      setChatHistory(prev => [...prev, { 
        role: 'user', 
        text: query || (file?.type.startsWith('audio/') ? "Vocal Command" : "File Upload"), 
        image: displayUrl || undefined 
      }]);

      // 3. INTEL PHASE (Send to Kernel)
      const res = await fetch(`${GATEWAY_URL}/api/v1/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          user_id: "wired", 
          session_id: activeSessionId, 
          query: query || "Analyze attached audio/file.",
          file_path: brainPath, // Full path for Python
          web_url: displayUrl ? displayUrl.replace(GATEWAY_URL, "") : "" // Clean path for Go DB
        }),
      });
      
      const data: any = await res.json();
      
      // 4. AGENT RESPONSE (Text + Voice Output)
      const audioPath = data.audio_url ? buildWebUrl(data.audio_url) : undefined;

      setChatHistory(prev => [...prev, { 
        role: 'serqet', 
        text: data.message,
        audio_url: audioPath // The ChatInterface uses this to auto-play
      }]);

      // Handle UI navigation actions
      if (data.action) onAction(data.action);

    } catch (err) {
      console.error("Kernel Link Error:", err);
      setChatHistory(prev => [...prev, { 
        role: 'error', 
        text: "NEURAL LINK FAILURE: The Kernel is not responding." 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return { chatHistory, askSerqet, loading };
}