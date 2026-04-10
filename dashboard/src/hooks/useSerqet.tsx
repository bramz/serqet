"use client";
 
import { useState, useEffect, useCallback } from "react";
import { GATEWAY_URL, DEFAULT_USER } from "@/lib/constants";
import { ChatMessage, IntentResponse, UploadResponse } from "@/types";
 
export function useSerqet(
  activeSessionId: string,
  onAction: (action: string) => void
) {
  const [chatHistory, setChatHistory]   = useState<ChatMessage[]>([]);
  const [loading, setLoading]           = useState(false);
 
  const buildWebUrl = useCallback((path: string | undefined) => {
    if (!path) return undefined;
    const idx = path.indexOf("/uploads/");
    const rel = idx !== -1 ? path.slice(idx) : path;
    const base = GATEWAY_URL.replace(/\/$/, "");
    return `${base}${rel.startsWith("/") ? rel : "/" + rel}`;
  }, []);
 
  // Load session history when session changes
  useEffect(() => {
    if (!activeSessionId) return;
    const load = async () => {
      try {
        const res = await fetch(`${GATEWAY_URL}/api/v1/history/${activeSessionId}`);
        if (!res.ok) return;
        const data = await res.json();
        setChatHistory(
          data.map((h: any) => ({
            role:      h.role as ChatMessage["role"],
            text:      h.text,
            image:     h.file_path ? buildWebUrl(h.file_path) : undefined,
            audio_url: h.audio_url ? buildWebUrl(h.audio_url) : undefined,
          }))
        );
      } catch (err) {
        console.error("[useSerqet] History load failed:", err);
      }
    };
    load();
  }, [activeSessionId, buildWebUrl]);
 
  const askSerqet = useCallback(async (query: string, file?: File | null) => {
    if ((!query && !file) || loading) return;
    setLoading(true);
 
    let brainPath = "";
    let displayUrl = "";
 
    try {
      // 1. Upload file if present
      if (file) {
        const form = new FormData();
        form.append("file", file);
        const up = await fetch(`${GATEWAY_URL}/api/v1/upload`, { method: "POST", body: form });
        if (!up.ok) throw new Error("Upload failed");
        const upData: UploadResponse = await up.json();
        brainPath  = upData.path;
        displayUrl = buildWebUrl(upData.url) ?? "";
      }
 
      // 2. Optimistic user message
      setChatHistory(prev => [...prev, {
        role:  "user",
        text:  query || (file?.type.startsWith("audio/") ? "Vocal Command" : "File Upload"),
        image: displayUrl || undefined,
      }]);
 
      // 3. Send intent — FIX: user_id read from env, not hardcoded "wired"
      const res = await fetch(`${GATEWAY_URL}/api/v1/intent`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id:    DEFAULT_USER,
          session_id: activeSessionId,
          query:      query || "Analyse attached audio/file.",
          file_path:  brainPath,
          web_url:    displayUrl ? displayUrl.replace(GATEWAY_URL, "") : "",
        }),
      });
 
      if (!res.ok) throw new Error(`Gateway error: ${res.status}`);
      const data: IntentResponse = await res.json();
 
      // 4. Agent response
      setChatHistory(prev => [...prev, {
        role:      "serqet",
        text:      data.message,
        audio_url: data.audio_url ? buildWebUrl(data.audio_url) : undefined,
      }]);
 
      if (data.action) onAction(data.action);
    } catch (err) {
      console.error("[useSerqet] Intent failed:", err);
      setChatHistory(prev => [...prev, {
        role: "error",
        text: "LINK FAILURE: The brain is not responding.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, activeSessionId, onAction, buildWebUrl]);
 
  return { chatHistory, askSerqet, loading };
}
