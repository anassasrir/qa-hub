import React from 'react';
import { BrandingProvider } from '../src/context/BrandingContext.js';

export const metadata = {
  title: 'QA Dashboard - Marque Blanche',
  description: 'Plateforme d’observabilité de la qualité logicielle et des tests Playwright',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#090d16',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}>
        <BrandingProvider>
          {children}
        </BrandingProvider>
      </body>
    </html>
  );
}
