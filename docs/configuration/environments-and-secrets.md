# 05 - Gestion des Environnements & Secrets

**QA-Hub** est conçu pour s'adapter aux politiques de sécurité les plus strictes en entreprise tout en conservant une grande flexibilité en local.

---

## 🌍 Cibler un Environnement

Chaque projet JSON peut définir autant d'environnements que nécessaire (`local`, `dev`, `staging`, `uat`, `prod`).

Pour cibler un environnement lors d'une exécution :
```bash
# En local ou CI
PROJECT_ID=demo-ecommerce TARGET_ENV=dev pnpm test
```

Si `TARGET_ENV` n'est pas fourni, le framework utilise la valeur renseignée dans `environments.default`.

---

## 🔐 Gestionnaire de Secrets Hybride

Le framework supporte deux modes d'injection de secrets :

### Mode 1 : Fichiers `.env` Standard (Universel)
Créez un fichier `.env` à la racine de `packages/playwright-tests/` ou à la racine du monorepo :
```env
DEMO_QA_USER=admin@example.com
DEMO_QA_PASSWORD=SuperSecretPassword123!
```

### Mode 2 : Infisical CLI (Entreprise)
Si `secrets.provider` est positionné sur `"infisical"` dans la configuration du projet :
```bash
infisical run -- pnpm test
```
Les variables chiffrées sont injectées à la volée dans la session Node.js sans jamais être écrites sur disque.
