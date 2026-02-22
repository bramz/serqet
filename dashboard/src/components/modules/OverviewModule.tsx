import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Module } from "@/types";

export function OverviewModule({ modules }: { modules: Module[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="bg-zinc-900 border-zinc-800 text-white col-span-2">
        <CardHeader>
          <CardTitle className="text-blue-400">System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-zinc-300">All systems operational.</p>
          <p className="text-zinc-500 text-sm mt-2">{modules.length} active modules synchronized with Serqet Brain.</p>
        </CardContent>
      </Card>
      
      {/* Quick Stats Grid */}
      <div className="col-span-2 grid grid-cols-4 gap-4 mt-4">
        {modules.map(m => (
          <div key={m.id} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg text-center">
            <p className="text-xs text-zinc-500 uppercase font-bold">{m.name}</p>
            <p className="text-green-500 text-xs mt-1">Online</p>
          </div>
        ))}
      </div>
    </div>
  );
}