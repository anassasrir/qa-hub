"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getStoredProject } from "../lib/utils";

function RedirectToDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const projectInUrl = params.get("project");

    if (!projectInUrl) {
      const savedProject = getStoredProject();
      if (savedProject) {
        params.set("project", savedProject);
      }
    } else if (projectInUrl === "all") {
      params.delete("project");
    }

    const query = params.toString();
    const target = query ? `/dashboard?${query}` : "/dashboard";
    router.replace(target);
  }, [router, searchParams]);

  return (
    <>
      <noscript>
        <meta httpEquiv="refresh" content="0;url=/dashboard" />
      </noscript>
      <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
        Redirection vers le tableau de bord...
      </div>
    </>
  );
}

export default function RootPage() {
  return (
    <Suspense
      fallback={
        <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest animate-pulse">
          Chargement...
        </div>
      }
    >
      <RedirectToDashboard />
    </Suspense>
  );
}
