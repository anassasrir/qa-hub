# 03 - Schéma de Configuration JSON des Projets

Le cœur de l'agnosticisme de **QA-Hub** réside dans le découplage des projets. Chaque client ou application testée possède un fichier dédié dans le dossier `projects/<id>.json`.

---

## 📄 Structure Complète du Fichier Projet

```json
{
  "$schema": "../schemas/project-config.schema.json",
  "id": "acme-shop",
  "name": "Acme E-Commerce Portal",
  "description": "Portail web de vente en ligne et gestion de panier",
  "active": true,
  "branding": {
    "displayName": "Acme Quality Portal",
    "logoUrl": "/branding/acme.svg",
    "primaryColor": "#0284c7",
    "accentColor": "#f59e0b"
  },
  "issueTracker": {
    "type": "jira",
    "baseUrl": "https://acme.atlassian.net/browse/",
    "ticketRegex": "ACM-[0-9]+",
    "exampleTicket": "ACM-102"
  },
  "git": {
    "scopes": ["auth", "cart", "checkout", "catalog", "account"],
    "branchPattern": "^(feat|fix|test|chore)/ACM-[0-9]+-[a-z0-9-]+$"
  },
  "ci": {
    "provider": "github-actions",
    "pipelineUrl": "https://github.com/acme/qa/actions"
  },
  "environments": {
    "default": "staging",
    "targets": {
      "local": {
        "baseUrl": "http://localhost:3000",
        "apiBaseUrl": "http://localhost:4000/api"
      },
      "dev": {
        "baseUrl": "https://dev.shop.acme.com",
        "apiBaseUrl": "https://api-dev.shop.acme.com"
      },
      "staging": {
        "baseUrl": "https://staging.shop.acme.com",
        "apiBaseUrl": "https://api-staging.shop.acme.com"
      },
      "prod": {
        "baseUrl": "https://shop.acme.com",
        "apiBaseUrl": "https://api.shop.acme.com"
      }
    }
  },
  "secrets": {
    "provider": "env",
    "prefix": "ACME_QA_"
  },
  "playwright": {
    "testDir": "tests/acme-shop",
    "pageObjectsDir": "pages/acme-shop",
    "fixturesDir": "fixtures/acme-shop",
    "defaultTimeout": 30000,
    "retries": {
      "ci": 2,
      "local": 0
    }
  }
}
```

---

## 🔍 Détail des Sections

### 1. Métadonnées & Identification
- `id` *(obligatoire)* : Identifiant unique au format `kebab-case`. Utilisé pour nommer les dossiers de tests, les tags et les URLs.
- `name` *(obligatoire)* : Nom lisible du client ou de l'application.
- `active` *(booléen)* : Permet de désactiver temporairement un projet sans supprimer sa configuration.

### 2. Branding (Marque Blanche Dashboard)
- `displayName` : Titre affiché dans la barre de navigation et sur les exports PDF/rapports.
- `logoUrl` : Chemin relatif dans `public/` ou URL absolue vers le logo du client.
- `primaryColor` & `accentColor` : Codes hexadécimaux injectés dans le système de variables CSS du dashboard.

### 3. Issue Tracker & Traçabilité
- `type` : Supporte `"jira"`, `"linear"`, `"github"`, `"gitlab"`, `"azure-boards"`, ou `"none"`.
- `baseUrl` : URL racine vers laquelle pointer lorsqu'un ticket est cliqué dans le dashboard.
- `ticketRegex` : Expression régulière validant les clés de tickets dans les noms de branches et les commits.

### 4. Environnements cibles
- `default` : Nom de l'environnement utilisé par défaut si aucun n'est spécifié via le CLI.
- `targets` : Dictionnaire des URLs cibles (`local`, `dev`, `staging`, `prod` ou tout environnement customisé comme `uat`, `review-1`, etc.).

### 5. Playwright & Chemins
- Définit l'emplacement exact des tests, des Page Objects et des fixtures pour ce projet dans `packages/playwright-tests/`.

### 6. Qualité de Code, Sonar & Repositories (`quality`)
- `sonar` : Configuration globale SonarQube / SonarCloud (`hostUrl`, `organization`, `projectKey`).
- `repositories` : Liste des dépôts sources (frontend, backend, microservices, etc.) à auditer :
  - `id` : Identifiant unique du repository (ex: `qa-dashboard`, `demo-store-frontend`).
  - `name` : Nom lisible du composant.
  - `type` : `"frontend"`, `"backend"`, `"fullstack"`, `"mobile"`, ou `"qa"`.
  - `repoUrl` : URL Git vers le dépôt source.
  - `branch` : Branche par défaut auditée (ex: `main` ou `develop`).
  - `sonarKey` : Clé de projet Sonar dédiée au composant.
  - `ci` : Fournisseur CI (`github-actions`, `gitlab-ci`), nom du job de scan (`jobName`) et URL du pipeline.
