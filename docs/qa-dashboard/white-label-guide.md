# 06 - Guide Marque Blanche & Personnalisation du QA-Dashboard

Le composant **`qa-dashboard`** est une application Next.js conçue pour fonctionner en marque blanche intégrale ("White-Label by Design").

---

## 🎨 Système d'Injection de Thème Dynamique

Le dashboard charge la configuration du projet actif et injecte dynamiquement des variables CSS au niveau du nœud racine `<html>` :

```css
:root {
  --brand-primary: #0284c7;
  --brand-accent: #f59e0b;
  --brand-logo: url('/branding/acme.svg');
  --brand-name: 'Acme QA Hub';
}
```

### 1. Composant ThemeProvider
Un composant React `BrandingProvider` enveloppe l'application et assure :
- Le remplacement du titre du document (`<title>Acme Quality Hub - Dashboard</title>`).
- L'affichage du logo client dans la barre latérale et le header.
- La teinte des boutons primaires, des badges d'état et des indicateurs de santé aux couleurs de la charte client.

### 2. Sélecteur Multi-Projets vs Mode Dédié
- **Mode Régie / Multi-Clients** : Si plusieurs fichiers `projects/*.json` sont présents et actifs, un menu déroulant dans la navbar permet de basculer instantanément d'un projet à un autre. Toutes les métriques (flakiness, runs, plan de test) se rechargent selon le projet sélectionné.
- **Mode Dédié (Chez le client)** : En définissant la variable d'environnement :
  ```env
  NEXT_PUBLIC_ACTIVE_PROJECT=acme-shop
  ```
  Le sélecteur de projet est masqué, et l'application s'affiche comme le portail QA officiel et exclusif du client.

---

## 🔌 Abstraction des Données : `IDataProvider`

Le dashboard n'a aucune dépendance directe avec un outil tiers de CI. Il implémente le pattern **Provider** :

```typescript
export interface IDataProvider {
  getProjects(): Promise<ProjectConfig[]>;
  getLatestRuns(projectId: string, limit?: number): Promise<TestRun[]>;
  getRunDetails(runId: string): Promise<TestRunDetails>;
  getFlakinessMetrics(projectId: string): Promise<FlakinessMetric[]>;
  getLivingTestPlan(projectId: string): Promise<TestPlanItem[]>;
}
```

### Les 4 Adaptateurs Disponibles :
1. **`LocalFileSystemProvider`** : Lit les artefacts générés localement dans le dossier `artifact/`. Idéal pour le développement ou une utilisation offline sans compte cloud.
2. **`GitLabCIProvider`** : Récupère les jobs, pipelines et artefacts de tests via l'API GitLab.
3. **`GitHubActionsProvider`** : Récupère les workflow runs et les archives zip de rapports via l'API GitHub REST.
4. **`AzureDevOpsProvider`** : Interroge les API Test Runs d'Azure DevOps.

---

## 🔗 Liens Hypertextes Dynamiques vers les Tickets

Dans l'ensemble de l'interface (tableaux d'exécution, radar d'instabilité, plan de test), chaque référence à un ticket (ex: `ACM-102` ou `JIRA-405`) est détectée via l'expression régulière du projet et transformée en lien direct cliquable vers le Jira, Linear ou Azure Boards du client.
