import { useEffect, useState } from 'react';
import { Card, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function FinanceModule() {
  const [summary, setSummary] = useState<{total_expenses: number, recent_records: any[]}>({
    total_expenses: 0,
    recent_records: []
  });

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/finance/summary`)
    .then(res => res.json())
    .then(setSummary);
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-2"><DollarSign className="text-green-500" /> Finance Ledger</h2>
      <Card className="bg-zinc-900 border-zinc-800 text-white p-6">
        <p className="text-zinc-400 text-sm">Total Tracked Expenses</p>
        <CardTitle className="text-3xl text-green-400 mt-2">${summary.total_expenses}</CardTitle>
      </Card>
            <div className="space-y-2">
        <h3 className="text-lg font-semibold text-zinc-400">Recent Transactions</h3>
        {summary.recent_records.map((r, i) => (
          <div key={i} className="p-4 bg-zinc-900 border border-zinc-800 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-medium">{r.category}</p>
              <p className="text-xs text-zinc-500">{r.description}</p>
            </div>
            <p className="text-red-400">-${r.amount}</p>
          </div>
        ))}
      </div>
    </div>

  );
}