# 13 - Agent @qa-devops (CI/CD Multi-Plateforme)

L'agent `@qa-devops` est le spécialiste de l'infrastructure d'intégration et de livraison continues.

---

## 🎯 Rôle & Responsabilités
- **Détection d'Environnement :** Identifie la plateforme hôte du client (GitLab, GitHub, Azure DevOps, Bitbucket).
- **Génération & Synchronisation de Pipeline :**
  - Installe ou met à jour le fichier de pipeline racine (`.github/workflows/e2e.yml`, `.gitlab-ci.yml`, `azure-pipelines.yml`).
  - Configure le parallélisme et le sharding optimal selon le nombre de tests.
  - Active le cache des dépendances `pnpm` et des binaires de navigateurs Playwright.
- **Gestion des Secrets :**
  - Guide l'équipe sur les variables d'environnement à injecter (clés API, identifiants de test, jetons de reporting).
- **Intégration Dashboard :**
  - Configure l'étape de publication des rapports vers `qa-dashboard` ou vers les pages d'artefacts hébergées.

---

## 💬 Commandes Vocabulaire

| Commande | Action |
| :--- | :--- |
| `@qa-devops /setup-ci <provider>` | Génère la pipeline pour le provider spécifié (`github`, `gitlab`, `azure`, `bitbucket`). |
| `@qa-devops /tune-sharding <shardsCount>` | Ajuste la matrice de parallélisation (ex: 2, 4 ou 8 shards). |
| `@qa-devops /audit-pipeline` | Contrôle la validité de la pipeline existante et vérifie les bonnes pratiques de cache. |
