# 18 - Observabilité de la Qualité de Code & Sonar Multi-Repos

Le module **Qualité du code (`/quality`)** permet de centraliser la santé statique et la sécurité de l'ensemble des dépôts d'un client (applications frontend, APIs backend, microservices, ou encore le portail de test lui-même).

---

## 🎯 Architecture Multi-Repositories & Découplage

Dans **QA-Hub**, chaque projet configure ses propres dépôts et son organisation Sonar dans son fichier `projects/<id>.json` :

```json
"quality": {
  "sonar": {
    "hostUrl": "https://sonarcloud.io",
    "organization": "mon-organisation",
    "projectKey": "projet-global"
  },
  "repositories": [
    {
      "id": "qa-dashboard",
      "name": "QA Dashboard Portal",
      "type": "frontend",
      "repoUrl": "https://github.com/mon-org/qa-hub",
      "branch": "main",
      "sonarKey": "mon-org_qa-dashboard",
      "ci": {
        "provider": "github-actions",
        "jobName": "lint-and-typecheck",
        "pipelineUrl": "https://github.com/mon-org/qa-hub/actions"
      }
    },
    {
      "id": "client-api",
      "name": "Customer REST API",
      "type": "backend",
      "repoUrl": "https://gitlab.com/mon-org/client-api",
      "branch": "main",
      "sonarKey": "mon-org_client-api",
      "ci": {
        "provider": "gitlab-ci",
        "jobName": "quality-scan",
        "pipelineUrl": "https://gitlab.com/mon-org/client-api/-/pipelines"
      }
    }
  ]
}
```

---

## 📊 Les 7 Indicateurs Analysés par Composant

Pour chaque dépôt, le dashboard agrège les métriques issues des pipelines CI ou de scans locaux :

| Métrique | Fichier source | Objectif Quality Gate |
| :--- | :--- | :--- |
| **Linter (ESLint)** | `data/<id>/eslint.json` | 0 erreur, contrôle des règles de code |
| **Vue Lint** | `data/<id>/vuetsclint.json` | 0 erreur sur les composants Vue/React |
| **Typage strict** | `data/<id>/typecheck.json` | 0 erreur TypeScript |
| **Sécurité Prod** | `data/<id>/auditProd.json` | 0 vulnérabilité Critique ou Haute |
| **Sécurité Dev** | `data/<id>/auditDev.json` | 0 vulnérabilité Critique ou Haute |
| **Couverture** | `data/<id>/coverage.json` | Seuil minimum configurable (ex: >= 75%) |
| **SonarQube / SonarCloud**| `data/<id>/sonar.json` | Notes A en Sécurité, Fiabilité, Maintenabilité et 100% Hotspots |

---

## ⚡ Lancer un Scan Qualité Local

Pour générer immédiatement les métriques réelles d'un composant présent dans le workspace (comme `qa-dashboard`) :

```bash
# Scan complet de qa-dashboard (TypeScript, ESLint, Audit, Sonar, Couverture)
pnpm scan:quality qa-dashboard
```

Les rapports sont automatiquement écrits dans `apps/qa-dashboard/data/qa-dashboard/` et la carte du dashboard passe instantanément au vert avec le détail des notes.
