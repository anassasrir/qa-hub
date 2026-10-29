import React from 'react';
import { Header } from '../components/Header.js';
import { KpiCards } from '../components/KpiCards.js';
import { FlakinessRadar } from '../components/FlakinessRadar.js';
import { LivingTestPlan } from '../components/LivingTestPlan.js';
import { LocalFileSystemProvider } from '../src/providers/LocalFileSystemProvider.js';

export default async function DashboardPage() {
  const provider = new LocalFileSystemProvider();
  const projectId = 'demo-ecommerce';

  const [kpis, flakinessMetrics, testCases] = await Promise.all([
    provider.getKpis(projectId),
    provider.getFlakinessRadar(projectId),
    provider.getLivingTestPlan(projectId),
  ]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header />
      <main style={{ maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '1.5rem 2rem' }}>
        <KpiCards kpis={kpis} />
        <FlakinessRadar metrics={flakinessMetrics} />
        <LivingTestPlan testCases={testCases} />
      </main>
    </div>
  );
}
