# 01 - Manifeste & Architecture Globale

## 🎯 Problématique Résolue

Dans les organisations et cabinets de conseil, l'automatisation de tests souffre souvent de deux écueils majeurs :
1. **L'enfermement dans un contexte client unique** : Des suites de tests couplées aux URLs, identifiants Jira et pipelines spécifiques, impossibles à réutiliser pour un nouveau projet sans réécriture massive.
2. **L'éparpillement des outils** : Des tests Playwright d'un côté, un tableau de bord maison de l'autre, des pipelines CI improvisés, et aucun guidage standard pour les ingénieurs QA.

**QA-Hub** résout ces limites en introduisant un socle monorepo universel combinant :
- Une **isolation stricte par projet JSON**.
- Un **dashboard d'observabilité qualité multi-tenant / marque blanche**.
- Une **couche Playwright basée sur les standards d'architecture POM/COM**.
- Un **workflow assisté par IA avec 9 agents spécialisés**.

---

## 🏗️ Schéma d'Architecture Globale

```
+--------------------------------------------------------------------------+
|                                 QA-HUB                                   |
+--------------------------------------------------------------------------+
|  projects/                                                               |
|    ├── client-a.json     <-- Configuration isolée client A               |
|    └── client-b.json     <-- Configuration isolée client B               |
+--------------------------------------------------------------------------+
|  apps/qa-dashboard (Next.js)                                             |
|    ├── Theme Engine (Marque Blanche : logos, couleurs par projet)         |
|    ├── KPI Dashboard (Taux de succès, durée, radar de flakiness)          |
|    ├── Living Test Plan (Documentation vivante générée depuis le code)   |
|    └── IDataProvider (Adaptateurs : Local, GitHub, GitLab, Azure)         |
+--------------------------------------------------------------------------+
|  packages/playwright-tests (Playwright + TypeScript)                     |
|    ├── Core (BasePage, BaseComponent, Logger, Assertions enrichies)      |
|    ├── Multi-Environment Loader (local, dev, staging, prod)              |
|    └── Tests & Page Objects segmentés par projet                         |
+--------------------------------------------------------------------------+
|  .agents/ (Système Agentique IA)                                         |
|    ├── @qa-scaffolder (Initialisation instantanée de nouveaux projets)   |
|    ├── @qa-devops     (Génération des pipelines CI multi-plateformes)    |
|    ├── @qa-tester     (Génération des tests selon les specs)             |
|    ├── @qa-healer     (Auto-réparation des erreurs TypeScript et DOM)    |
|    ├── @qa-validator  (Gatekeeper technique et respect des règles)       |
|    └── @qa-publisher  (Commit conventionnel atomique et PR templates)    |
+--------------------------------------------------------------------------+
```

---

## 🔒 Principes d'Ingénierie Inviolables

1. **Agnosticisme Radical** : Aucune constante métier ou identifiant client n'est écrit en dur dans le code du framework. Tout provient de `projects/<id>.json`.
2. **Zéro Régression de Locators** : L'utilisation de sélecteurs résilients (accessibilité, rôle ARIA, data-testid) et de cascades ordonnées.
3. **Traçabilité Totale** : Chaque action fait l'objet d'un commit conventionnel atomique, et chaque test est relié au référentiel d'exigences (Jira, Linear, Azure Boards).
4. **Validation Avant Publication** : Aucun code n'est poussé sans validation stricte (Typecheck, Linting, et exécution sans régression).
