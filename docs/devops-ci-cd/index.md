# 15 - Intégration CI/CD Universelle

**QA-Hub** est nativement compatible avec les 4 principaux orchestrateurs CI/CD du marché.

---

## 📦 Matrice de Support CI/CD

| Plateforme | Fichier Template | Fonctionnalités Clés |
| :--- | :--- | :--- |
| **GitHub Actions** | `ci-templates/github-actions/qa-pipeline.yml` | Sharding natif, cache pnpm, upload artifacts multi-shards, workflow_dispatch. |
| **GitLab CI** | `ci-templates/gitlab-ci/.gitlab-ci.yml` | Support de la directive `parallel`, cache pnpm partagé, intégration JUnit GitLab. |
| **Azure DevOps** | `ci-templates/azure-devops/azure-pipelines.yml` | Stratégie matricielle, tâches officielles PublishTestResults et PublishBuildArtifacts. |
| **Bitbucket Pipelines**| `ci-templates/bitbucket/bitbucket-pipelines.yml` | Pipelines par branches, exécution sous image Docker Node.js. |

---

## ⚡ Déploiement Automatisé via l'Agent `@qa-devops`

Pour déployer la configuration CI chez un client :
```
@qa-devops configure la CI pour GitHub Actions
```
L'agent copie le template approprié, ajuste les variables d'environnement et configure le sharding en fonction de la taille de la suite de tests.
