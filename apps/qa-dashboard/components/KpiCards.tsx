'use client';

import React from 'react';
import type { DashboardKpis } from '@/src/types/dashboard';
import { CheckCircle2, PlayCircle, Clock, AlertTriangle } from 'lucide-react';

interface KpiCardsProps {
  kpis: DashboardKpis;
}

export const KpiCards: React.FC<KpiCardsProps> = ({ kpis }) => {
  const cards = [
    {
      title: 'Taux de Réussite',
      value: `${kpis.passRate}%`,
      icon: CheckCircle2,
      color: '#10b981',
      sub: 'Sur les dernières exécutions',
    },
    {
      title: 'Runs Totaux',
      value: kpis.totalRuns.toString(),
      icon: PlayCircle,
      color: '#3b82f6',
      sub: 'Local & Pipelines CI',
    },
    {
      title: 'Durée Moyenne',
      value: `${kpis.avgDurationSec}s`,
      icon: Clock,
      color: '#8b5cf6',
      sub: 'Temps d’exécution moyen',
    },
    {
      title: 'Tests Instables (Flaky)',
      value: kpis.activeFlakyTests.toString(),
      icon: AlertTriangle,
      color: kpis.activeFlakyTests > 0 ? '#f59e0b' : '#10b981',
      sub: 'Détectés sur les derniers runs',
    },
  ];

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '1.25rem',
      margin: '1.5rem 0'
    }}>
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.title}
            style={{
              backgroundColor: '#1e293b',
              padding: '1.25rem',
              borderRadius: '12px',
              border: '1px solid #334155',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.875rem', color: '#94a3b8' }}>{card.title}</span>
              <Icon size={20} color={card.color} />
            </div>
            <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#f8fafc' }}>
              {card.value}
            </div>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{card.sub}</span>
          </div>
        );
      })}
    </div>
  );
};
