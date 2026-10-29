import React, { Suspense } from "react";
import GeneratorClient from "./GeneratorClient";

export default function GeneratorPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">Chargement du générateur Gherkin...</div>}>
      <GeneratorClient />
    </Suspense>
  );
}
