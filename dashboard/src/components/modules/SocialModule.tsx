import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function SocialModule() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/social/posts`)
      .then(res => res.json())
      .then(setPosts)
      .catch(() => console.error("Social offline"));
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-2">
        <MessageSquareText className="text-purple-500" /> Social Hub
      </h2>
      <div className="grid grid-cols-1 gap-4">
        {posts.map((post, i) => (
          <Card key={i} className="bg-zinc-900 border-zinc-800 text-white p-6 serqet-glow">
            <div className="flex justify-between mb-4">
              <span className="px-2 py-1 rounded bg-purple-900/30 text-purple-400 text-[10px] font-bold uppercase">
                {post.platform}
              </span>
              <span className="text-xs text-zinc-500">{post.status}</span>
            </div>
            <p className="text-lg text-zinc-200">{post.content}</p>
          </Card>
        ))}
        {posts.length === 0 && <p className="text-zinc-500 italic">No social drafts found.</p>}
      </div>
    </div>
  );
}