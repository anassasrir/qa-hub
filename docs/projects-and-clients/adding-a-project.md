# 04 - Ajouter & Onboarder un Nouveau Projet

L'ajout d'un nouveau projet dans **QA-Hub** se fait sans jamais modifier le cœur du framework.

---

## ⚡ Méthode 1 : Avec l'Agent IA `@qa-scaffolder` (Recommandé)

1. Créez simplement le fichier de configuration `projects/<votre-client>.json` (ou demandez à l'agent de le concevoir).
2. Lancez la commande suivante dans votre terminal IA :
   ```
   @qa-scaffolder initialiser le projet acme-crm
   ```
3. L'agent valide le schéma, instancie l'arborescence Playwright, crée les Page Objects initiaux, configure le Dashboard et génère la documentation.

---

## 🛠️ Méthode 2 : Via le Script CLI

```bash
# 1. Créer le fichier projects/acme-crm.json en copiant le modèle demo-ecommerce.json
cp projects/demo-ecommerce.json projects/acme-crm.json

# 2. Renseigner les champs du client (URLs, Jira, Scopes)

# 3. Lancer le scaffolder
pnpm scaffold acme-crm
```

---

## 🔍 Ce que le Scaffolder génère automatiquement :

| Élément | Chemin | Rôle |
| :--- | :--- | :--- |
| **Page Object** | `packages/playwright-tests/pages/<id>/HomePage.ts` | Page d'accueil initiale avec sélecteurs |
| **Composants** | `packages/playwright-tests/pages/<id>/components/` | Dossier réservé aux modales et formulaires |
| **Tests Smoke** | `packages/playwright-tests/tests/<id>/smoke.spec.ts` | Test de validation de connectivité |
| **Fixtures** | `packages/playwright-tests/fixtures/<id>/` | Dossier des jeux de données de simulation |
| **Documentation** | `docs/projects/<id>.md` | Fiche récapitulative du projet et commandes |
| **Dashboard** | `apps/qa-dashboard/src/config/projects-registry.json` | Enregistrement dans le catalogue multi-projets |
