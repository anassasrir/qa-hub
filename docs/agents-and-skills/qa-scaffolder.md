# 12 - Agent @qa-scaffolder (Génération d'Infrastructure)

L'agent `@qa-scaffolder` est le point d'entrée pour étendre le framework à de nouvelles applications ou de nouveaux clients.

---

## 🎯 Rôle & Responsabilités
- **Audit de configuration :** Valide la syntaxe et la complétude du fichier `projects/<id>.json` selon `schemas/project-config.schema.json`.
- **Génération Playwright :**
  - Instancie l'arborescence des pages, tests et fixtures.
  - Génère le `HomePage.ts` et le test `smoke.spec.ts` associés.
- **Intégration Dashboard :**
  - Enregistre le projet dans le catalogue `projects-registry.json` du dashboard.
- **Documentation Vivante :**
  - Rédige la fiche de synthèse dans `docs/projects/<id>.md`.
- **Gouvernance Git :**
  - Enregistre les nouveaux scopes de commit autorisés dans la configuration Husky.

---

## 💬 Commandes Vocabulaire

| Commande | Action |
| :--- | :--- |
| `@qa-scaffolder /scaffold <id>` | Lance l'initialisation complète à partir du fichier `projects/<id>.json`. |
| `@qa-scaffolder /new-client` | Lance un dialogue interactif guidé pour générer le JSON puis l'arborescence. |
| `@qa-scaffolder /verify <id>` | Vérifie que tous les fichiers requis d'un projet sont bien présents et compilables. |
