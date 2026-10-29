'use client';

import React from 'react';
import type { LivingTestCase } from '../src/types/dashboard.js';
import { BookOpen, CheckCircle } from 'lucide-react';

interface LivingTestPlanProps {
  testCases: LivingTestCase[];
}

export const LivingTestPlan: React.FC<LivingTestPlanProps> = ({ testCases }) => {
  return (
    <div style={{
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      border: '1px solid #334155',
      padding: '1.5rem'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <BookOpen size={20} color="#38bdf8" />
        <h2 style={{ fontSize: '1.1rem', fontWeight: 'bold', margin: 0, color: '#f8fafc' }}>
          Plan de Test Vivant (Living Test Plan)
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {testCases.map((tc) => (
          <div
            key={tc.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0.75rem 1rem',
              backgroundColor: '#0f172a',
              borderRadius: '8px',
              border: '1px solid #334155'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <CheckCircle size={18} color="#10b981" />
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 500, color: '#f8fafc' }}>
                  [{tc.id}] {tc.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {tc.specFile}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {tc.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#94a3b8',
                    padding: '0.2rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.7rem'
                  }}
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
