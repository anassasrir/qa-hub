'use client';

import React from 'react';
import type { FlakinessMetric } from '@/src/types/dashboard';
import { useBranding } from '@/src/context/BrandingContext';
import { AlertCircle, ExternalLink } from 'lucide-react';

interface FlakinessRadarProps {
  metrics: FlakinessMetric[];
}

export const FlakinessRadar: React.FC<FlakinessRadarProps> = ({ metrics }) => {
  const { branding } = useBranding();

  return (
    <div style={{
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '1px solid #334155',
      padding: '1.5rem',
      marginBottom: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <AlertCircle size={20} color="#f59e0b" />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
          Radar d'Instabilité (Flaky Tests)
        </h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #334155', color: '#94a3b8' }}>
              <th style={{ padding: '0.75rem 0.5rem' }}>Scénario / Spec</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Ticket</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Runs</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Taux d'échec</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Score d'Instabilité</th>
            </tr>
          </thead>
          <tbody>
            {metrics.map((m) => {
              const ticketUrl = m.ticketKey && branding.issueTrackerBaseUrl ? `${branding.issueTrackerBaseUrl}${m.ticketKey}` : undefined;
              return (
                <tr key={m.testId} style={{ borderBottom: '1px solid #334155' }}>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#f8fafc' }}>
                    <div style={{ fontWeight: 500 }}>{m.title}</div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{m.specPath}</div>
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    {m.ticketKey && ticketUrl ? (
                      <a
                        href={ticketUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem',
                          color: '#38bdf8',
                          textDecoration: 'none'
                        }}
                      >
                        {m.ticketKey}
                        <ExternalLink size={12} />
                      </a>
                    ) : (
                      <span style={{ color: '#64748b' }}>-</span>
                    )}
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#cbd5e1' }}>{m.totalRuns}</td>
                  <td style={{ padding: '0.75rem 0.5rem', color: '#f87171' }}>
                    {(m.failureRate * 100).toFixed(1)}%
                  </td>
                  <td style={{ padding: '0.75rem 0.5rem' }}>
                    <span style={{
                      backgroundColor: m.flakinessScore > 20 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                      color: m.flakinessScore > 20 ? '#ef4444' : '#f59e0b',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 'bold'
                    }}>
                      {m.flakinessScore}/100
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
