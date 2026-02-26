import { useEffect, useState } from 'react';
import { Card, CardTitle } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';


function CryptoTerminal({ summary }: { summary: { total_expenses: number; recent_records: any[] } }) {
  // const [prices, setPrices] = useState({ BTC: 0, ETH: 0 });
  const [holdings, setHoldings] = useState<{ID: string, asset: string, balance: number}[]>([]);

  useEffect(() => {
      fetch(`${GATEWAY_URL}/api/v1/finance/holdings`)
          .then(res => res.json())
          .then(setHoldings);
  }, []);


  return (
    <div className="mt-8 space-y-4">
        <h3 className="text-xl font-bold text-zinc-400">Crypto Holdings</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {holdings.map((h) => (
                <Card key={h.ID} className="bg-zinc-950 border-zinc-800 p-4 serqet-glow">
                    <div className="flex justify-between items-center">
                        <span className="font-mono text-purple-400 font-bold">{h.asset}</span>
                        <span className="text-white font-bold">{h.balance.toFixed(4)}</span>
                    </div>
                </Card>
            ))}
        </div>
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 p-6 serqet-glow">
            <CardTitle className="text-zinc-500 text-xs uppercase">Liquidity Index</CardTitle>
            <div className="mt-2 text-2xl font-bold text-white">
              {holdings.length} Assets Tracked
            </div>
            <p className="text-[10px] text-green-500 mt-1">Live from Kraken API</p>
          </Card>

          {/* <Card className="bg-gradient-to-br from-zinc-900 to-black border-zinc-800 p-6">
            <CardTitle className="text-zinc-500 text-xs uppercase">Total Outflow</CardTitle>
            <div className="mt-2 text-2xl font-bold text-red-400">
              ${summary.total_expenses.toLocaleString()}
            </div>
            <p className="text-[10px] text-zinc-600 mt-1">Manual + AI recorded</p>
          </Card> */}
        </section>
    </div>

    // <div className="space-y-4">
    //   <h3 className="text-zinc-400">Live Crypto Holdings</h3>
    //   <div className="grid grid-cols-2 gap-4">
    //     <Card className="bg-zinc-900 border-zinc-800 p-4">
    //       <div className="flex justify-between">
    //           <span className="text-orange-500 font-bold">BTC</span>
    //           <span className="text-white">${prices.BTC}</span>
    //       </div>
    //       {/* Visual sparkline or indicator */}
    //     </Card>
    //     <Card className="bg-zinc-900 border-zinc-800 p-4">
    //       <div className="flex justify-between">
    //           <span className="text-blue-500 font-bold">ETH</span>
    //           <span className="text-white">${prices.ETH}</span>
    //       </div>
    //       {/* Visual sparkline or indicator */}
    //     </Card>
    //   </div>
    // </div>
  );
}

export function FinanceModule() {
  const [summary, setSummary] = useState<{total_expenses: number, recent_records: any[]}>({
    total_expenses: 0,
    recent_records: []
  });
  const [subTab, setSubTab] = useState<"fiat" | "crypto" | "crypto">("fiat");


  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/finance/summary`)
    .then(res => res.json())
    .then(setSummary);
  }, []);

  return (
    <div className="animate-in fade-in duration-500 space-y-6">
      <h2 className="text-3xl font-bold flex items-center gap-2"><DollarSign className="text-green-500" /> Finance Ledger</h2>
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button 
            onClick={() => setSubTab("fiat")}
            className={`px-4 py-1.5 rounded-md text-sm transition ${subTab === 'fiat' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
          >
            Fiat
          </button>
          <button 
            onClick={() => setSubTab("crypto")}
            className={`px-4 py-1.5 rounded-md text-sm transition ${subTab === 'crypto' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
          >
            Crypto
          </button>
        </div>
      {subTab === "fiat" ? (
      <div className="space-y-6">
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
      ) : (
        <CryptoTerminal summary={summary} />
      )}
    </div>
  );
}
