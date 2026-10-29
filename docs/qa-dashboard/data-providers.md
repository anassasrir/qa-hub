# 07 - Connecteurs de Données Multi-CI du QA-Dashboard

Le dashboard s'appuie sur une interface agnostique `IDataProvider` permettant d'alimenter les KPIs, le radar de stabilité et le plan de test depuis n'importe quelle source.

---

## 🔌 L'Interface `IDataProvider`

```typescript
export interface IDataProvider {
  getLatestRuns(projectId: string, limit?: number): Promise<TestRun[]>;
  getKpis(projectId: string): Promise<DashboardKpis>;
  getFlakinessRadar(projectId: string): Promise<FlakinessMetric[]>;
  getLivingTestPlan(projectId: string): Promise<LivingTestCase[]>;
}
```

---

## 🛠️ Les Adaptateurs Disponibles

### 1. `LocalFileSystemProvider` (Par Défaut)
- **Fonctionnement :** Lit directement les fichiers JSON produits par Playwright lors des runs locaux dans `artifact/reports/playwright-results.json`.
- **Cas d'usage :** Idéal pour exécuter le dashboard en local sans avoir besoin de configurer de jetons de CI ou de compte externe.

### 2. `GitHubActionsProvider`
- **Fonctionnement :** Interroge l'API GitHub (`/repos/:owner/:repo/actions/runs`) avec un `GITHUB_TOKEN`. Télécharge automatiquement l'artefact `playwright-report` du run le plus récent.
- **Variables requises :**
  - `GITHUB_TOKEN`
  - `GITHUB_REPOSITORY`

### 3. `GitLabCIProvider`
- **Fonctionnement :** Interroge l'API GitLab (`/projects/:id/pipelines` et `/jobs`) avec un `GITLAB_TOKEN`.
- **Variables requises :**
  - `GITLAB_TOKEN`
  - `GITLAB_PROJECT_ID`
  - `GITLAB_URL` (si instance privée)

### 4. `AzureDevOpsProvider`
- **Fonctionnement :** Interroge les API Test Runs d'Azure DevOps via un Personal Access Token (PAT).
- **Variables requises :**
  - `AZURE_DEVOPS_PAT`
  - `AZURE_DEVOPS_ORG`
  - `AZURE_DEVOPS_PROJECT`
