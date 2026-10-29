# Fiche Projet : Demo E-Commerce Store (`demo-ecommerce`)

## 📌 Présentation
- **ID Projet :** `demo-ecommerce`
- **Issue Tracker :** [JIRA](https://jira.example.com/browse/)
- **Ticket Regex :** `DEMO-[0-9]+` (Exemple: `DEMO-101`)
- **Environnement par défaut :** `staging` (https://staging.store.example.com)
- **Fournisseur CI :** `github-actions`

---

## 📂 Organisation du Code
- **Tests Playwright :** `packages/playwright-tests/tests/demo-ecommerce/`
- **Page Objects :** `packages/playwright-tests/pages/demo-ecommerce/`
- **Fixtures :** `packages/playwright-tests/fixtures/demo-ecommerce/`

---

## 🌿 Conventions Git & Commits
- **Scopes autorisés :** `auth`, `cart`, `checkout`, `catalog`, `account`, `search`, `ui`
- **Format de branche recommandé :** `feat/DEMO-101-nom-fonctionnalite`
- **Exemple de commit :**
  ```bash
  git commit -m "feat(auth): implémentation du flux DEMO-101"
  ```

---

## ⚡ Commandes Rapides
```bash
# Lancer les tests de ce projet uniquement
PROJECT_ID=demo-ecommerce pnpm test

# Lancer sur un environnement spécifique (ex: dev, staging, prod)
PROJECT_ID=demo-ecommerce TARGET_ENV=dev pnpm test
```
