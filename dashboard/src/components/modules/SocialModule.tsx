"use client";

import { useEffect, useState } from 'react';
import { Card } from "@/components/ui/card";
import { MessageSquare, Share2, Send, Clock, Twitter, Linkedin } from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function SocialModule() {
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/social/posts`).then(res => res.json()).then(setPosts);
  }, []);

  return (
    <div className="animate-in fade-in duration-700 space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-end border-b border-zinc-800 pb-6">
        <div>
          <h2 className="text-5xl font-black italic tracking-tighter text-white uppercase">Social Hub</h2>
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.3em] mt-2">Content Orchestration & Drafting</p>
        </div>
        <Share2 className="text-purple-500 mb-1" size={24} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {posts.map((post) => (
          <Card key={post.ID} className="bg-zinc-950 border-zinc-800 p-6 flex flex-col justify-between hover:border-purple-500/40 transition-all group">
            <div>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  {post.platform.toLowerCase() === 'x' ? <Twitter size={16} className="text-white"/> : <Linkedin size={16} className="text-blue-400"/>}
                  <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{post.platform} Output</span>
                </div>
                <div className="flex items-center gap-2 px-2 py-0.5 bg-zinc-900 rounded border border-zinc-800">
                  <Clock size={10} className="text-zinc-600" />
                  <span className="text-[9px] font-black text-zinc-500 uppercase">{post.status}</span>
                </div>
              </div>
              <p className="text-sm font-medium leading-relaxed text-zinc-200">
                {post.content}
              </p>
            </div>

            <div className="mt-8 flex gap-2">
              <button className="flex-1 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] font-black text-zinc-500 hover:text-white transition-all uppercase">Edit Draft</button>
              <button className="flex-1 py-2 bg-purple-600 rounded-lg text-[10px] font-black text-white hover:bg-purple-500 transition-all uppercase flex items-center justify-center gap-2">
                <Send size={12}/> Deploy Post
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}