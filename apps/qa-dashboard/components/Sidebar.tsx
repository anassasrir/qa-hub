"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Beaker,
  History,
  BookOpen,
  Menu,
  X,
  ShieldCheck,
  GitCompare,
  Sparkles,
  Eye,
} from "lucide-react";

const navigation = [
  { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard },
  { name: "Historique", href: "/history", icon: History },
  { name: "Comparaison des Runs", href: "/compare", icon: GitCompare },
  { name: "Tests Visuels", href: "/visual", icon: Eye },
  { name: "Dernier run", href: "/details", icon: FileText },
  { name: "Plan de test", href: "/testplan", icon: BookOpen },
  { name: "Qualité du code", href: "/quality", icon: ShieldCheck },
  { name: "Générateur Gherkin", href: "/generator", icon: Sparkles },
];

export default function Sidebar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentProject = searchParams.get("project");

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getHrefWithProject = (baseHref: string) => {
    return currentProject && currentProject !== "all"
      ? `${baseHref}?project=${currentProject}`
      : baseHref;
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-slate-900 border-b border-slate-800 text-slate-300 shadow-md">
      <div className="max-w-[1750px] mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link
          href={getHrefWithProject("/dashboard")}
          className="flex items-center gap-3 shrink-0 group transition-transform active:scale-95"
        >
          <div className="w-9 h-9 bg-blue-600 group-hover:bg-blue-500 rounded-xl flex items-center justify-center transition-colors shadow-md shadow-blue-600/30">
            <Beaker className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-black text-white tracking-tight whitespace-nowrap">
            {process.env.NEXT_PUBLIC_DASHBOARD_TITLE || "QA Engineering Hub"}
          </span>
        </Link>

        {/* Desktop Horizontal Navigation Bar */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 overflow-x-auto py-1">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href);
            const hrefWithProject = getHrefWithProject(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={hrefWithProject}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold tracking-wide transition-all duration-200 whitespace-nowrap group ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-900/30"
                    : "text-slate-400 hover:text-white hover:bg-slate-800/80"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400"
                  }`}
                />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Mobile Toggle Button */}
        <div className="lg:hidden flex items-center">
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="mobile-toggle"
            aria-label="Menu principal"
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors active:scale-95"
          >
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-800 bg-slate-900/98 backdrop-blur-md px-4 py-4 space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
          {navigation.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href);
            const hrefWithProject = getHrefWithProject(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={hrefWithProject}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-bold transition-all ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
