import { useState } from 'react';
import { GATEWAY_URL } from '@/lib/constants';
import { ChatMessage, IntentResponse } from '@/types';

export function useSerqet(onAction: (action: string) => void) {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);

  const askSerqet = async (query: string) => {
    if (!query) return;

    setLoading(true);
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);

    try {
      const res = await fetch(`${GATEWAY_URL}/api/v1/intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: "wired", query }),
      });
      
      const data: IntentResponse = await res.json();
      setChatHistory(prev => [...prev, { role: 'serqet', text: data.message }]);

      if (data.action) onAction(data.action);
    } catch (err) {
      setChatHistory(prev => [...prev, { role: 'error', text: "Connection lost to Gateway." }]);
    } finally {
      setLoading(false);
    }
  };

  return { chatHistory, askSerqet, loading };
}