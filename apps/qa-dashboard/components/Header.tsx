'use client';

import React from 'react';
import { useBranding } from '@/src/context/BrandingContext';
import { Layers, ShieldCheck, Activity } from 'lucide-react';

export const Header: React.FC = () => {
  const { branding, availableProjects, switchProject } = useBranding();

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '1rem 2rem',
      backgroundColor: '#0f172a',
      color: '#f8fafc',
      borderBottom: '1px solid #1e293b'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <div style={{
          backgroundColor: branding.primaryColor,
          padding: '0.5rem',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <ShieldCheck size={24} color="#ffffff" />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 'bold' }}>
            {branding.displayName}
          </h1>
          <p style={{ margin: 0, fontSize: '0.8rem', color: '#94a3b8' }}>
            Centre d'Observabilité & Qualité Logicielle
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
          <Activity size={16} color="#10b981" />
          <span style={{ color: '#10b981' }}>Pipeline Sain</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={16} color="#94a3b8" />
          <select
            value={branding.projectId}
            onChange={(e) => switchProject(e.target.value)}
            style={{
              backgroundColor: '#1e293b',
              color: '#f8fafc',
              border: '1px solid #334155',
              padding: '0.4rem 0.8rem',
              borderRadius: '6px',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            {availableProjects.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>
    </header>
  );
};
