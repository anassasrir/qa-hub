import { getAllRuns } from "../../lib/parseResults";
import DetailsClient from "./DetailsClient";
import { Suspense } from "react";

export default function DetailsPage() {
  const allRuns = getAllRuns();

  return (
    <Suspense
      fallback={
        <div className="p-20 text-center text-slate-400 font-medium">
          Chargement du rapport...
        </div>
      }
    >
      <DetailsClient allRuns={allRuns} />
    </Suspense>
  );
}
