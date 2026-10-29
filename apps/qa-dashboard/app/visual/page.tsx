import React, { Suspense } from "react";
import { getAllVisualRuns } from "../../lib/parseVisual";
import VisualClient from "./VisualClient";

export default function VisualPage() {
  const runs = getAllVisualRuns();

  return (
    <Suspense
      fallback={
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
          Chargement du module de régression visuelle...
        </div>
      }
    >
      <VisualClient runs={runs} />
    </Suspense>
  );
}
