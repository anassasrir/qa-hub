import React, { Suspense } from "react";
import { getAllRuns } from "../../lib/parseResults";
import CompareClient from "./CompareClient";

export default function ComparePage() {
  const history = getAllRuns() || [];

  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Chargement du module de comparaison...</div>}>
      <CompareClient history={history} />
    </Suspense>
  );
}
