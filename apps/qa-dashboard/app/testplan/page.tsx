import { Suspense } from "react";
import { getProjectTestPlan } from "../../lib/parseTests";
import { getAllRuns } from "../../lib/parseResults";
import TestPlanClient from "./TestPlanClient";

export default function TestPlanPage() {
  // Charge l'intégralité du plan de test de tous les projets configurés
  const fullTestPlan = getProjectTestPlan();
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
