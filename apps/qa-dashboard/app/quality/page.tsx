import { Suspense } from "react";
import { getQualityData } from "../../lib/parseQuality";
import QualityClient from "./QualityClient";

export default function QualityPage() {
  const projects = getQualityData();

  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Chargement du Test Level...</div>}>
      <QualityClient projects={projects} />
    </Suspense>
  );
}
