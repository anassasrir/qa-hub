# 🚀 QA-Hub

> **Framework d'automatisation QA Entreprise, Starter Kit Agentique & Dashboard Marque Blanche.**

`qa-hub` est un monorepo agnostique conçu pour déployer une infrastructure d'assurance qualité logicielle complète, moderne et hautement automatisée chez n'importe quel client en quelques minutes.

---

## 🌟 Piliers Fondateurs

1. **Isolation Multi-Projets par Fichiers JSON (`projects/*.json`)** :  
   Ajoutez un nouveau client ou projet sans modifier le code source du framework. Définissez son issue tracker (Jira, Linear, Azure), ses scopes Git, ses environnements cibles et son fournisseur CI.
2. **Dashboard Marque Blanche (`apps/qa-dashboard`)** :  
   Centre de pilotage visuel (Next.js) intégrant le branding client dynamique (couleurs, logos), radar d'instabilité (flakiness), plan de test vivant, et ingestion de rapports multi-CI (GitHub Actions, GitLab CI, Azure Pipelines, Local).
3. **Moteur d'Automatisation Playwright (`packages/playwright-tests`)** :  
   Architecture industrielle POM/COM (Page & Component Object Model), gestion multi-environnements, fixtures avancées et moteur de tests visuels.
4. **Écosystème Multi-Agents IA (`.agents/`)** :  
   Orchestration de 9 agents spécialisés couvrant l'intégralité du cycle de test :
   - `@qa-scaffolder` : Initialisation instantanée d'un nouveau projet (dossiers Playwright + Dashboard).
   - `@qa-devops` : Génération automatique des pipelines CI/CD selon l'hébergeur.
   - `@qa-tester`, `@qa-healer`, `@qa-validator`, `@qa-visual`, `@qa-publisher`, `@qa-workflow`.
5. **Gouvernance Git & Traçabilité Complète** :  
   Conventional Commits et vérifications de branches automatisées par Husky, alignées sur les règles de chaque projet.

---

## 📂 Structure du Monorepo

```
qa-hub/
├── .agents/                      # Système Agentique & Prompts d'orchestration
├── apps/
│   └── qa-dashboard/             # Dashboard d'analyse qualité (Next.js) - Marque blanche
├── packages/
│   └── playwright-tests/         # Suite universelle de tests Playwright E2E
├── projects/                     # Configurations isolées par client / projet
│   └── demo-ecommerce.json       # Projet de démonstration
├── schemas/                      # Schémas de validation JSON
├── tools/                        # Outils internes (CLI Scaffolder, CI sync)
├── docs/                         # Documentation officielle du framework
├── package.json
└── pnpm-workspace.yaml
```

---

## ⚡ Démarrage Rapide

### Prérequis
- **Node.js** >= 20.0.0
- **pnpm** >= 9.0.0

### Installation
```bash
# Cloner le repository
git clone <votre-repo-url> qa-hub
cd qa-hub

# Installer les dépendances du monorepo
pnpm install
```

### Lancer la suite de test démo
```bash
pnpm test
```

### Lancer le Dashboard QA
```bash
pnpm dashboard:dev
```

Accédez à `http://localhost:3000` pour visualiser le dashboard aux couleurs du projet démo.

---

## 📖 Documentation Officielle

Consultez le dossier [`docs/`](./docs/README.md) pour accéder à l'ensemble des guides :
* [Architecture Globale](./docs/index.md)
* [Ajouter un Nouveau Client/Projet](./docs/projects-and-clients/adding-a-project.md)
* [Marque Blanche & Personnalisation du Dashboard](./docs/qa-dashboard/white-label-guide.md)
* [Matrice des Agents IA](./docs/agents-and-skills/master-workflow.md)
* [Intégration CI/CD](./docs/devops-ci-cd/index.md)
