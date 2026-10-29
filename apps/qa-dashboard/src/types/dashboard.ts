export interface TestRun {
  id: string;
  projectId: string;
  timestamp: string;
  status: 'passed' | 'failed' | 'flaky' | 'running';
  durationMs: number;
  totalTests: number;
  passedCount: number;
  failedCount: number;
  flakyCount: number;
  environment: string;
  commitHash?: string;
  branch?: string;
  ticketKey?: string;
  reportUrl?: string;
}

export interface FlakinessMetric {
  testId: string;
  title: string;
  specPath: string;
  ticketKey?: string;
  totalRuns: number;
  failureRate: number; // 0 to 1
  flakinessScore: number; // 0 to 100
  lastFailureDate: string;
}

export interface LivingTestCase {
  id: string;
  title: string;
  ticketKey?: string;
  specFile: string;
  status: 'automated' | 'manual' | 'deprecated';
  tags: string[];
}

export interface DashboardKpis {
  passRate: number; // percentage (0 - 100)
  totalRuns: number;
  avgDurationSec: number;
  activeFlakyTests: number;
}
