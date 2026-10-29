import React, { Suspense } from "react";
import { getAllRuns } from "../../lib/parseResults";
import DashboardClient from "./DashboardClient";

export default function Home() {
  const history = getAllRuns() || [];

  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Chargement du dashboard...</div>}>
      <DashboardClient history={history} />
    </Suspense>
  );
}
