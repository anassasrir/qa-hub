"use client";

import React from "react";
import { TestData } from "../lib/utils";

// Logos officiels
const ChromeLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="#4285F4"
      d="M12 12m-5.45 0a5.45 5.45 0 1 0 10.9 0 5.45 5.45 0 1 0 -10.9 0"
    />
    <path
      fill="#EA4335"
      d="M12 6.07A5.94 5.94 0 0 1 17.72 10.3l3.6-6.24A12 12 0 0 0 12 0c-4.32 0-8.1 2.29-10.32 5.73l4.31 7.46A6.07 6.07 0 0 1 12 6.07z"
    />
    <path
      fill="#FBBC05"
      d="M5.89 10.3c-.45 1.25-.68 2.6-.68 4 0 4.14 2.21 7.78 5.49 9.8l3.9-6.75A6.07 6.07 0 0 1 5.89 10.3z"
    />
    <path
      fill="#34A853"
      d="M14.6 13.5c-1.32.82-2.84 1.32-4.5 1.32-2.14 0-4.04-.84-5.49-2.21l-3.6 6.24c2.22 3.44 6 5.73 10.32 5.73 4.31 0 8.1-.84 10.32-2.21L18.23 16c-1.04 1.83-2.6 3.25-4.53 3.84z"
    />
  </svg>
);

const FirefoxLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="#FF7139"
      d="M23.91,12.18c0.04,3.04-0.68,4.82-0.68,4.82s0.59-2.39,0-5.25c-0.59-2.86-2.37-5.52-4.12-7.3c-0.45-0.45-0.88-0.86-1.29-1.23c0.33,0.24,0.65,0.5,0.96,0.78c0,0-0.48-1.56-2.28-2.5c-1.8-0.94-3.75-0.8-3.75-0.8s1.25,0.7,1.25,1.8c0,1.1-0.9,1.6-2,1.6c-1.1,0-2.2-0.6-2.5-2.1c0,0-0.28,1.15,0.25,2.5c0.53,1.35,1.25,2,1.75,2.5z"
    />
    <path
      fill="#FFC131"
      d="M9.5,14c-1,1.5-1,4,1,5.5c2,1.5,4,0.5,4.5,0c0.5-0.5,1-1.5,0.5-3c0,0,0.5,1,0,2c-0.5,1-1.07,1.47-2.5,1"
    />
    <path
      fill="#004A9E"
      d="M12,24c4.31,0,8.1-.84,10.32-2.21L18.23,16c-1.04 1.83-2.6 3.25-4.53 3.84z"
    />
  </svg>
);

const SafariLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <circle
      cx="12"
      cy="12"
      r="11"
      fill="#FFFFFF"
      stroke="#006DFF"
      strokeWidth="1"
    />
    <path
      fill="#006DFF"
      d="M12,2C6.48,2,2,6.48,2,12s4.48,10,10,10s10-4.48,10-10S17.52,2,12,2z M12,20c-4.41,0-8-3.59-8-8s3.59-8,8-8s8,3.59,8,8 S16.41,20,12,20z"
    />
    <path
      fill="#EA4335"
      d="M17.65,7.15l-3.3,9.9c-0.1,0.3-0.3,0.5-0.6,0.6l-9.9,3.3C3.45,21.05,3.15,20.65,3.25,20.25l3.3-9.9 c0.1-0.3,0.3-0.5,0.6-0.6l9.9-3.3C17.45,6.35,17.75,6.75,17.65,7.15z M12.5,11.5c-0.3-0.3-0.7-0.3-1,0s-0.3,0.7,0,1s0.7,0.3,1,0 S12.8,11.8,12.5,11.5z"
    />
  </svg>
);

const AppleLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="#000000" className={className}>
    <path d="M18.71,19.5c-0.83,1.24-1.71,2.45-3.1,2.48c-1.34,0.03-1.77-0.79-3.29-0.79c-1.53,0-2.01,0.77-3.27,0.82 c-1.31,0.05-2.33-1.32-3.19-2.55C4.1,17.06,2.8,12.58,4.55,9.54c0.87-1.51,2.46-2.47,4.2-2.5c1.31-0.02,2.56,0.9,3.36,0.9 c0.8,0,2.33-1.12,3.91-0.96c0.66,0.03,2.53,0.27,3.73,1.97c-0.1,0.06-2.22,1.29-2.2,3.81c0.03,3.03,2.62,4.07,2.65,4.08 C20.19,16.89,19.54,18.26,18.71,19.5z M13,5.19c0.85-1.02,1.41-2.44,1.25-3.86c-1.22,0.05-2.7,0.81-3.58,1.84 c-0.79,0.92-1.47,2.37-1.28,3.75C10.7,7.01,12.12,6.23,13,5.19z" />
  </svg>
);

const AndroidLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className}>
    <path
      fill="#3DDC84"
      d="M17.52,11.2c0.46,0,0.84-0.38,0.84-0.84c0-0.46-0.38-0.84-0.84-0.84c-0.46,0-0.84,0.38-0.84,0.84 C16.68,10.82,17.06,11.2,17.52,11.2z M6.48,11.2c0.46,0,0.84-0.38,0.84-0.84c0-0.46-0.38-0.84-0.84-0.84 c-0.46,0-0.84,0.38-0.84,0.84C5.64,10.82,6.02,11.2,6.48,11.2z M17.88,12.88c0.11,0,0.2-0.09,0.2-0.2V11 c0-3.32-2.68-6-6-6s-6,2.68-6,6v1.68c0,0.11,0.09,0.2,0.2,0.2H17.88z M12,2C10.02,2,8.19,2.77,6.81,4.02L5.41,2.62 C5.22,2.43,4.9,2.43,4.71,2.62c-0.19,0.19-0.19,0.51,0,0.7l1.4,1.4C4.65,6.31,4,8.49,4,10.84V13c0,0.55,0.45,1,1,1h14 c0.55,0,1-0.45,1-1v-2.16c0-2.35-0.65-4.53-2.11-6.12l1.4-1.4c0.19-0.19,0.19-0.51,0-0.7c-0.19-0.19-0.51-0.19-0.7,0l-1.4,1.4 C15.81,2.77,13.98,2,12,2z"
    />
  </svg>
);

const DEVICES = [
  { id: "chrome", label: "Chrome", logo: ChromeLogo },
  { id: "firefox", label: "Firefox", logo: FirefoxLogo },
  { id: "safari", label: "Safari", logo: SafariLogo },
  { id: "iphone", label: "iPhone", logo: AppleLogo },
  { id: "android", label: "Android", logo: AndroidLogo },
];

const PROJECT_COLORS = {
  success: "#76B09A",
  failure: "#933F4D",
  flaky: "#E6B35F",
};

interface Props {
  tests: TestData[];
}

export default function DeviceSuccessCards({ tests }: Props) {
  const deviceStats = DEVICES.map((device) => {
    const deviceTests = tests.filter((t) => {
      const p = (t.project || "").toLowerCase();
      if (device.id === "chrome") return p.includes("chrome") || p.includes("chromium");
      if (device.id === "firefox") return p.includes("firefox");
      if (device.id === "safari") return p.includes("safari") || p.includes("webkit");
      if (device.id === "iphone") return p.includes("iphone") || p.includes("ios");
      if (device.id === "android") return p.includes("android") || p.includes("pixel");
      return p.includes(device.id);
    });
    if (deviceTests.length === 0) return { ...device, percentage: null };

    const passed = deviceTests.filter(
      (t) => t.status === "passed" || t.status === "expected",
    ).length;
    const percentage = Math.round((passed / deviceTests.length) * 100);

    return { ...device, percentage, total: deviceTests.length };
  });

  return (
    <div className="flex flex-wrap gap-3">
      {deviceStats.map((device) => (
        <div
          key={device.id}
          className="bg-white px-4 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3 transition-all hover:shadow-md group flex-1 min-w-[140px]"
        >
          <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
            <device.logo
              className={`w-7 h-7 transition-transform group-hover:scale-110 ${device.percentage === null ? "grayscale opacity-20" : ""}`}
            />
          </div>
          <div className="flex flex-col">
            <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">
              {device.label}
            </p>
            {device.percentage !== null ? (
              <div className="flex items-baseline gap-1.5">
                <span
                  className="text-sm font-black leading-none"
                  style={{
                    color:
                      device.percentage > 80
                        ? PROJECT_COLORS.success
                        : device.percentage > 50
                          ? PROJECT_COLORS.flaky
                          : PROJECT_COLORS.failure,
                  }}
                >
                  {device.percentage}%
                </span>
                <span className="text-[8px] font-bold text-slate-300 uppercase tracking-tighter leading-none">
                  {device.total} tests
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-bold text-slate-300 italic leading-none text-left">
                N/A
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
