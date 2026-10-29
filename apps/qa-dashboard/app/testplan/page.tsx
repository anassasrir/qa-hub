import { Suspense } from "react";
import { getProjectTestPlan } from "../../lib/parseTests";
import { getAllRuns } from "../../lib/parseResults";
import TestPlanClient from "./TestPlanClient";

// On définit tous les mots-clés pour charger l'intégralité du plan au build
const ALL_PROJECT_KEYWORDS = [
  "savings",
  "wse",
  "wesave",
  "tpbp",
  "wealth",
  "lclmp",
  "advisory",
  "wsc",
  "cabp",
  "vpl",
  "blog",
  "backend",
  "b4b",
  "b4bank",
];

export default function TestPlanPage() {
  // En mode static export, on charge tout le plan et les runs au build
  const fullTestPlan = getProjectTestPlan(ALL_PROJECT_KEYWORDS);
  const allRuns = getAllRuns();

  return (
    <Suspense
      fallback={
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
          Chargement du plan de test...
        </div>
      }
    >
      <TestPlanClient initialTestPlan={fullTestPlan} allRuns={allRuns} />
    </Suspense>
  );
}
