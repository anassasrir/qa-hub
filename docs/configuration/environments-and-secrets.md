# 05 - Gestion des Environnements & Secrets

**QA-Hub** est conçu pour s'adapter aux politiques de sécurité les plus strictes en entreprise tout en restant immédiat en local.

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

## 🔐 Gestionnaire de Secrets Agnostique (`pnpm secrets:run`)

Plutôt que d'imposer un outil unique (comme Infisical), **QA-Hub** fournit un exécuteur agnostique qui lit la configuration `secrets` du projet actif et encapsule la commande avec l'outil adéquat.

### Configuration dans `projects/<id>.json` :

```json
"secrets": {
  "provider": "infisical", // "infisical" | "doppler" | "vault" | "env"
  "env": "staging",
  "projectSlug": "mon-projet-slug",
  "prefix": "ACME_QA_"
}
```

### Exécution Universelle :
```bash
# Lance les tests avec injection dynamique des secrets
pnpm secrets:run -- pnpm test
```

### Comportement selon le `provider` configuré :
1. **`infisical`** : Exécute en sous-main `infisical run --env staging -- <commande>`.
2. **`doppler`** : Exécute en sous-main `doppler run --config stg -- <commande>`.
3. **`vault`** : Exécute `vault run -- <commande>`.
4. **`env`** : Exécute directement avec le chargement standard des variables `.env` / process.env.
