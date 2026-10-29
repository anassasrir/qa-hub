"use client";

import React from "react";
import { RotateCcw } from "lucide-react";

export interface ProjectConfig {
  id: string;
  label: string;
  keywords?: string[];
  excludeKeywords?: string[];
}

import rawProjects from "../lib/projects-registry.json";

export const PROJECTS_CONFIG: ProjectConfig[] = rawProjects as ProjectConfig[];

export interface ProjectSelectorProps {
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
  className?: string;
  exclude?: string[];
}

export default function ProjectSelector({
  selectedProject,
  onProjectChange,
  className = "",
  exclude = [],
}: ProjectSelectorProps) {
  const filteredProjects = PROJECTS_CONFIG.filter(
    (p) => !exclude.includes(p.id),
  );

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex gap-1.5 p-1 bg-slate-100 rounded-xl">
        {filteredProjects.map((p) => (
          <button
            key={p.id}
            id={`project-btn-${p.id}`}
            onClick={() => onProjectChange(p.id)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
              selectedProject === p.id
                ? "bg-white text-blue-600 shadow-sm"
                : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
            }`}
          >
            {p.label}
          </button>
        ))}{" "}
      </div>
      <button
        onClick={() => onProjectChange("all")}
        disabled={selectedProject === "all"}
        title="Réinitialiser le projet"
        className={`p-2 rounded-lg transition-all ${
          selectedProject !== "all"
            ? "text-blue-600 hover:bg-slate-100"
            : "text-slate-300 opacity-50 cursor-not-allowed"
        }`}
      >
        <RotateCcw size={16} />
      </button>
    </div>
  );
}
