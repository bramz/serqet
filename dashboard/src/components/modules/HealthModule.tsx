"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Dumbbell, Activity } from "lucide-react";
import { GATEWAY_URL } from '@/lib/constants';

export function HealthModule() {
  const [subTab, setSubTab] = useState<"diet" | "fitness">("diet");
  const [data, setData] = useState<{diet: any[], fitness: any[]}>({ diet: [], fitness: [] });

  useEffect(() => {
    fetch(`${GATEWAY_URL}/api/v1/health/stats`)
      .then(res => res.json())
      .then(setData);
  }, []);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold flex items-center gap-2">
          <Activity className="text-red-500" /> Health
        </h2>
        {/* Sub-Module Navigation */}
        <div className="flex bg-zinc-900 p-1 rounded-lg border border-zinc-800">
          <button 
            onClick={() => setSubTab("diet")}
            className={`px-4 py-1.5 rounded-md text-sm transition ${subTab === 'diet' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
          >
            Diet
          </button>
          <button 
            onClick={() => setSubTab("fitness")}
            className={`px-4 py-1.5 rounded-md text-sm transition ${subTab === 'fitness' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
          >
            Fitness
          </button>
        </div>
      </div>

      {subTab === "diet" ? (
        <div className="space-y-4">
          <h3 className="text-zinc-400 flex items-center gap-2"><Utensils size={18}/> Calorie Log</h3>
          {data.diet.map((item) => (
            <Card key={item.ID} className="bg-zinc-900 border-zinc-800 text-white">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold">{item.food_item}</p>
                  <p className="text-xs text-zinc-500">P: {item.protein}g | C: {item.carbs}g | F: {item.fats}g</p>
                </div>
                <p className="text-red-400 font-mono">{item.calories} kcal</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-zinc-400 flex items-center gap-2"><Dumbbell size={18}/> Strength & Cardio</h3>
          {data.fitness.map((item) => (
            <Card key={item.ID} className="bg-zinc-900 border-zinc-800 text-white">
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <p className="font-bold">{item.exercise}</p>
                  <p className="text-xs text-zinc-500">
                    {item.sets > 0 ? `${item.sets} sets x ${item.reps} reps @ ${item.weight}kg` : `${item.duration} mins`}
                  </p>
                </div>
                <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Dumbbell size={14} className="text-red-500"/>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}