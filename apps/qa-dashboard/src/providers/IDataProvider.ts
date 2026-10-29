import type { DashboardKpis, FlakinessMetric, LivingTestCase, TestRun } from '../types/dashboard.js';

export interface IDataProvider {
  getLatestRuns(projectId: string, limit?: number): Promise<TestRun[]>;
  getKpis(projectId: string): Promise<DashboardKpis>;
  getFlakinessRadar(projectId: string): Promise<FlakinessMetric[]>;
  getLivingTestPlan(projectId: string): Promise<LivingTestCase[]>;
}
