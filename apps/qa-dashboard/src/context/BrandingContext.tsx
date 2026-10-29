'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface BrandingInfo {
  projectId: string;
  projectName: string;
  displayName: string;
  logoUrl?: string;
  primaryColor: string;
  accentColor?: string;
  issueTrackerBaseUrl?: string;
}

interface BrandingContextType {
  branding: BrandingInfo;
  availableProjects: string[];
  switchProject: (projectId: string) => void;
}

const defaultBranding: BrandingInfo = {
  projectId: 'demo-ecommerce',
  projectName: 'Demo E-Commerce Store',
  displayName: 'Demo Store QA Hub',
  logoUrl: '/branding/demo-store.svg',
  primaryColor: '#2563eb',
  accentColor: '#f59e0b',
  issueTrackerBaseUrl: 'https://jira.example.com/browse/',
};

const BrandingContext = createContext<BrandingContextType>({
  branding: defaultBranding,
  availableProjects: ['demo-ecommerce'],
  switchProject: () => {},
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [branding, setBranding] = useState<BrandingInfo>(defaultBranding);
  const [availableProjects] = useState<string[]>(['demo-ecommerce']);

  useEffect(() => {
    // Inject dynamic CSS variables into document root for white-label styling
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', branding.primaryColor);
    root.style.setProperty('--brand-accent', branding.accentColor || '#f59e0b');
    document.title = `${branding.displayName} - Observabilité QA`;
  }, [branding]);

  const switchProject = (projectId: string) => {
    // In production this can fetch the JSON from /api/projects/:id
    setBranding((prev) => ({
      ...prev,
      projectId,
      displayName: `${projectId.toUpperCase()} QA Hub`,
    }));
  };

  return (
    <BrandingContext.Provider value={{ branding, availableProjects, switchProject }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
