"use client";

import React from "react";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Activity, Zap } from "lucide-react";
import { TestData } from "../lib/utils";

// --- Feature/Module Health ---
export function FeatureHealthChart({ tests }: { tests: TestData[] }) {
  const healthMap: Record<string, { total: number; passed: number }> = {};

  tests.forEach((t) => {
    const fileName = t.file.split("/").pop() || "unknown";
    if (!healthMap[fileName]) healthMap[fileName] = { total: 0, passed: 0 };
    healthMap[fileName].total++;
    if (t.status === "passed" || t.status === "expected") healthMap[fileName].passed++;
  });

  const data = Object.entries(healthMap)
    .map(([name, stats]) => ({
      name: name.replace(".spec.ts", ""),
      score: Math.round((stats.passed / stats.total) * 100),
    }))
    .sort((a, b) => a.score - b.score);

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[350px] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
          <Activity size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Santé des Modules</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase">% de succès par fichier</p>
        </div>
      </div>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: -20 }}>
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 9, fontWeight: 700, fill: "#64748b" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ fill: "transparent" }}
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const d = payload[0].payload as { name: string; score: number };
                  return (
                    <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-[10px]">
                      <p className="font-bold text-slate-900">{d.name}</p>
                      <p className="font-black text-emerald-600 uppercase">{d.score}% de succès</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={12}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.score > 90 ? "#10b981" : entry.score > 70 ? "#f59e0b" : "#ef4444"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// --- Failure Motif Analysis ---
export function FailureTypeChart({ tests }: { tests: TestData[] }) {
  const failureMotifs = {
    timeout: 0,
    assertion: 0,
    other: 0,
  };

  const failedTests = tests.filter((t) => t.status === "failed" || t.status === "unexpected");

  failedTests.forEach((t) => {
    const error = t.results?.[t.results.length - 1]?.error;
    const msg = (error?.message || "").toLowerCase();
    if (msg.includes("timeout") || msg.includes("timed out")) failureMotifs.timeout++;
    else if (msg.includes("expect") || msg.includes("received")) failureMotifs.assertion++;
    else failureMotifs.other++;
  });

  const data = [
    { name: "Timeouts", value: failureMotifs.timeout, color: "#933F4D" },
    { name: "Assertions", value: failureMotifs.assertion, color: "#E6B35F" },
    { name: "Autres", value: failureMotifs.other, color: "#A3A3A3" },
  ].filter((d) => d.value > 0);

  const hasData = data.length > 0;

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[350px] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
          <Zap size={20} />
        </div>
        <div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Motifs d&apos;Échec</h3>
          <p className="text-[10px] text-slate-400 font-bold uppercase">Analyse technique des erreurs</p>
        </div>
      </div>
      <div className="flex-1 min-h-0 relative">
        {!hasData ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-300">
             <Activity size={32} className="mb-2 opacity-20" />
             <p className="text-[9px] font-black uppercase tracking-widest">Aucun échec détecté</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius="60%" outerRadius="80%" paddingAngle={5} dataKey="value" stroke="none">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as { name: string; value: number; color: string };
                    return (
                      <div className="bg-white p-3 border border-slate-100 shadow-xl rounded-xl text-[10px]">
                        <p className="font-bold text-slate-900">{d.name}</p>
                        <p className="font-black" style={{ color: d.color }}>{d.value} occurrences</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      {hasData && (
        <div className="flex justify-center gap-4 mt-2">
           {data.map(d => (
             <div key={d.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                <span className="text-[9px] font-bold text-slate-500 uppercase">{d.name}</span>
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
