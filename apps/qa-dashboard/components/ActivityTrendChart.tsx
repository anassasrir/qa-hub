"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { THEME } from "../lib/utils";

interface RunData {
  id: string;
  date: string;
  stats: {
    total: number;
    expected: number;
    unexpected: number;
    skipped: number;
    flaky: number;
  };
}

interface Props {
  history: RunData[];
}

interface CustomTickProps {
  x?: number;
  y?: number;
  payload?: { index?: number };
  chartData?: Array<{ buildNumber: string; date: string }>;
}

function CustomXAxisTick({ x, y, payload, chartData }: CustomTickProps) {
  if (!payload || payload.index === undefined || !chartData) return null;
  const item = chartData[payload.index];
  if (!item) return null;

  const showDate =
    payload.index === 0 ||
    item.date !== chartData[payload.index - 1].date;

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={10}
        textAnchor="middle"
        fill={THEME.colors.slate[400]}
        fontSize={9}
        fontWeight={700}
      >
        {item.buildNumber}
      </text>
      {showDate && (
        <text
          x={0}
          y={0}
          dy={22}
          textAnchor="middle"
          fill={THEME.colors.slate[500]}
          fontSize={9}
          fontWeight={800}
        >
          {item.date}
        </text>
      )}
    </g>
  );
}

export default function ActivityTrendChart({ history }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const COLORS = THEME.colors;

  const chartData = [...history]
    .slice(0, 20)
    .reverse()
    .map((run) => {
      let buildNumber = run.id;
      if (run.id.startsWith("CI Run - ")) {
        buildNumber = run.id.replace("CI Run - ", "");
      } else if (run.id.startsWith("Local Run - ")) {
        const timePart = run.id.replace("Local Run - ", "").split("T")[1];
        buildNumber = timePart ? timePart.substring(0, 5).replace("-", ":") : "Local";
      }

      const dateStr = run.date || run.id;
      let dateObj = new Date(dateStr);
      if (isNaN(dateObj.getTime())) {
        const dateMatch = run.id.match(/\d{4}-\d{2}-\d{2}/);
        if (dateMatch) {
          dateObj = new Date(dateMatch[0]);
        }
      }

      let formattedDate = "";
      let fullDatetimeStr = "N/A";
      if (!isNaN(dateObj.getTime())) {
        const day = String(dateObj.getDate()).padStart(2, "0");
        const month = String(dateObj.getMonth() + 1).padStart(2, "0");
        const year = dateObj.getFullYear();
        const hours = String(dateObj.getHours()).padStart(2, "0");
        const minutes = String(dateObj.getMinutes()).padStart(2, "0");
        const seconds = String(dateObj.getSeconds()).padStart(2, "0");
        formattedDate = `${day}/${month}`;
        fullDatetimeStr = `${day}/${month}/${year} à ${hours}:${minutes}:${seconds}`;
      } else {
        formattedDate = "N/A";
        fullDatetimeStr = run.id;
      }

      return {
        id: run.id,
        buildNumber,
        date: formattedDate,
        datetime: fullDatetimeStr,
        Succès: run.stats.expected,
        Échecs: run.stats.unexpected,
        Instables: run.stats.flaky,
        Ignorés: run.stats.skipped,
      };
    });

  const handleBarClick = (
    state: { activePayload?: { payload: { id: string } }[] } | null,
  ) => {
    if (state && state.activePayload && state.activePayload.length > 0) {
      const runId = state.activePayload[0].payload.id;
      const params = new URLSearchParams(searchParams.toString());
      params.set("id", runId);
      router.push(`/details?${params.toString()}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm w-full h-[320px] flex flex-col">
      <h2 className="text-lg font-bold text-slate-900 mb-6">
        Historique d&apos;activité
      </h2>
      <div className="flex-grow w-full overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 0, right: 10, left: -25, bottom: 25 }}
            barSize={24}
            onClick={handleBarClick}
            className="cursor-pointer"
          >
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke={THEME.colors.slate[100]}
            />
            <XAxis
              dataKey="buildNumber"
              axisLine={false}
              tickLine={false}
              tick={(tickProps) => (
                <CustomXAxisTick {...tickProps} chartData={chartData} />
              )}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{
                fill: THEME.colors.slate[400],
                fontSize: 10,
                fontWeight: 700,
              }}
            />
            <Tooltip
              cursor={{ fill: THEME.colors.slate[50], radius: 8 }}
              labelFormatter={(label, payload) => {
                if (payload && payload.length > 0) {
                  const item = payload[0].payload;
                  return (
                    <span className="block mb-1.5">
                      <span className="font-bold block text-slate-900">Build {label}</span>
                      <span className="text-slate-400 text-[10px] block font-normal mt-0.5">{item.datetime}</span>
                    </span>
                  );
                }
                return label;
              }}
              contentStyle={{
                borderRadius: "16px",
                border: "none",
                boxShadow:
                  "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
                fontSize: "11px",
                fontWeight: 600,
                padding: "12px",
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{
                paddingBottom: "25px",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            />
            <Bar dataKey="Succès" stackId="a" fill={COLORS.passed} />
            <Bar dataKey="Instables" stackId="a" fill={COLORS.flaky} />
            <Bar dataKey="Ignorés" stackId="a" fill={COLORS.skipped} />
            <Bar
              dataKey="Échecs"
              stackId="a"
              fill={COLORS.failed}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
