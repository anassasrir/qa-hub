# 16 - Gouvernance Git & Conventional Commits Multi-Projets

Pour maintenir un historique Git clair et automatisable, **QA-Hub** applique une convention de commit stricte et dynamique.

---

## 📐 Format Obligatoire

```
<type>(<scope>): <description courte et impérative>
```

### Types Autorisés
- `feat` : Nouvelle fonctionnalité, nouveau Page Object, nouveau test E2E.
- `fix` : Correction d'un test qui échoue, mise à jour d'un sélecteur cassé.
- `docs` : Mise à jour de la documentation ou des schémas.
- `refactor` : Amélioration de code de test sans changement fonctionnel.
- `chore` : Maintenance du monorepo, mise à jour de dépendances.
- `ci` : Modifications des pipelines GitHub, GitLab ou Azure.

### Scopes Dynamiques
Les scopes autorisés dépendent directement de la configuration `git.scopes` définie dans `projects/<id>.json`.

Exemples valides :
```bash
# Pour le projet demo-ecommerce (scopes: auth, cart, checkout, catalog, account, ui)
git commit -m "feat(auth): add automated login scenario for DEMO-101"
git commit -m "fix(cart): update selector for checkout CTA button"

# Pour le cœur du framework
git commit -m "chore(core): upgrade playwright to 1.49"
```

---

## 🌿 Règles de Nommage des Branches

Chaque branche de fonctionnalité doit contenir la clé du ticket :
```
feat/DEMO-101-login-automation
fix/DEMO-102-cart-timeout
```
Cette règle est validée automatiquement par les hooks locaux avant tout `push`.
