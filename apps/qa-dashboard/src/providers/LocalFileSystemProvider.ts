import fs from 'node:fs';
import path from 'node:path';
import type { IDataProvider } from './IDataProvider.js';
import type { DashboardKpis, FlakinessMetric, LivingTestCase, TestRun } from '../types/dashboard.js';

export class LocalFileSystemProvider implements IDataProvider {
  private baseDir: string;

  constructor(baseDir = process.cwd()) {
    this.baseDir = baseDir;
  }

  public async getLatestRuns(projectId: string, limit = 10): Promise<TestRun[]> {
    const reportPath = path.resolve(this.baseDir, '../../artifact/reports/playwright-results.json');
    if (fs.existsSync(reportPath)) {
      try {
        const raw = JSON.parse(fs.readFileSync(reportPath, 'utf-8'));
        // Parse Playwright JSON reporter output if available
        const duration = raw.stats?.duration || 14200;
        const total = raw.suites?.reduce((acc: number, s: { specs?: unknown[] }) => acc + (s.specs?.length || 0), 0) || 1;
        return [
          {
            id: 'local-latest',
            projectId,
            timestamp: new Date().toISOString(),
            status: raw.stats?.unexpected === 0 ? 'passed' : 'failed',
            durationMs: duration,
            totalTests: total,
            passedCount: raw.stats?.expected || 1,
            failedCount: raw.stats?.unexpected || 0,
            flakyCount: raw.stats?.flaky || 0,
            environment: 'staging',
            branch: 'main',
            ticketKey: 'DEMO-101',
          },
        ];
      } catch {
        // Fallback
      }
    }

    // Default mock runs for local demonstration
    return [
      {
        id: 'run-104',
        projectId,
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        status: 'passed',
        durationMs: 18400,
        totalTests: 12,
        passedCount: 12,
        failedCount: 0,
        flakyCount: 0,
        environment: 'staging',
        branch: 'main',
        ticketKey: 'DEMO-101',
      },
      {
        id: 'run-103',
        projectId,
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        status: 'flaky',
        durationMs: 24100,
        totalTests: 12,
        passedCount: 11,
        failedCount: 0,
        flakyCount: 1,
        environment: 'staging',
        branch: 'feat/DEMO-102-cart-checkout',
        ticketKey: 'DEMO-102',
      },
      {
        id: 'run-102',
        projectId,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        status: 'passed',
        durationMs: 17900,
        totalTests: 10,
        passedCount: 10,
        failedCount: 0,
        flakyCount: 0,
        environment: 'dev',
        branch: 'main',
      },
    ].slice(0, limit);
  }

  public async getKpis(projectId: string): Promise<DashboardKpis> {
    const runs = await this.getLatestRuns(projectId);
    const passed = runs.filter((r) => r.status === 'passed').length;
    const passRate = runs.length > 0 ? Math.round((passed / runs.length) * 100) : 100;
    const avgDuration = runs.length > 0 ? Math.round(runs.reduce((a, b) => a + b.durationMs, 0) / runs.length / 1000) : 0;

    return {
      passRate,
      totalRuns: runs.length,
      avgDurationSec: avgDuration,
      activeFlakyTests: runs.reduce((a, b) => a + b.flakyCount, 0),
    };
  }

  public async getFlakinessRadar(projectId: string): Promise<FlakinessMetric[]> {
    return [
      {
        testId: `${projectId}-cart-timeout`,
        title: 'Validation du panier avec promotion dynamique',
        specPath: `tests/${projectId}/cart.spec.ts`,
        ticketKey: 'DEMO-102',
        totalRuns: 24,
        failureRate: 0.12,
        flakinessScore: 28,
        lastFailureDate: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
      },
      {
        testId: `${projectId}-auth-sso`,
        title: 'Redirection OAuth2 et persistance session',
        specPath: `tests/${projectId}/auth.spec.ts`,
        ticketKey: 'DEMO-101',
        totalRuns: 40,
        failureRate: 0.05,
        flakinessScore: 10,
        lastFailureDate: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      },
    ];
  }

  public async getLivingTestPlan(projectId: string): Promise<LivingTestCase[]> {
    return [
      {
        id: 'TC-01',
        title: 'Chargement de la page d’accueil et vérification du branding',
        ticketKey: 'DEMO-101',
        specFile: `tests/${projectId}/smoke.spec.ts`,
        status: 'automated',
        tags: ['smoke', 'p0', 'branding'],
      },
      {
        id: 'TC-02',
        title: 'Authentification utilisateur avec mot de passe',
        ticketKey: 'DEMO-101',
        specFile: `tests/${projectId}/auth.spec.ts`,
        status: 'automated',
        tags: ['auth', 'security'],
      },
      {
        id: 'TC-03',
        title: 'Ajout d’un article au panier et mise à jour du compteur',
        ticketKey: 'DEMO-102',
        specFile: `tests/${projectId}/cart.spec.ts`,
        status: 'automated',
        tags: ['ecommerce', 'cart'],
      },
    ];
  }
}
