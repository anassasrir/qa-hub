import { Suspense } from "react";
import { getAllRuns } from "../../lib/parseResults";
import HistoryClient from "./HistoryClient";

export default function HistoryPage() {
  const history = getAllRuns() || [];

  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Chargement de l&apos;historique...</div>}>
      <HistoryClient history={history} />
    </Suspense>
  );
}
