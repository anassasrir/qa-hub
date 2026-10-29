"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Props {
  passed: number;
  failed: number;
  total: number;
}

export default function TestSummaryChart({ passed, failed, total }: Props) {
  // On calcule les "skipped" ou autres si nécessaire, ici on reste sur Passed/Failed
  const data = [
    { name: "Succès", value: passed, color: "#10b981" }, // Emerald 500
    { name: "Échecs", value: failed, color: "#ef4444" }, // Red 500
  ];

  return (
    <div className="flex flex-col md:flex-row items-center h-full w-full">
      {/* Le Donut à gauche */}
      <div className="w-full md:w-1/2 h-[250px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              innerRadius={75}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
              startAngle={90}
              endAngle={450}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-slate-800 tracking-tighter">
            {total}
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">
            Tests
          </span>
        </div>
      </div>

      {/* La légende style Testmo à droite */}
      <div className="w-full md:w-1/2 space-y-5 pl-0 md:pl-10 mt-6 md:mt-0">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Statistiques d&apos;automatisation
        </h3>
        {data.map((item) => (
          <div
            key={item.name}
            className="flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm font-semibold text-slate-600 group-hover:text-slate-900 transition-colors">
                {item.name}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-slate-800">
                {item.value}
              </span>
              <span className="text-[11px] font-medium text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md min-w-[45px] text-center">
                {total > 0 ? Math.round((item.value / total) * 100) : 0}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
