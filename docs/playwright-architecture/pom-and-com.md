# 08 - Architecture POM & COM (Playwright)

Dans **QA-Hub**, l'organisation des tests repose sur le découplage strict entre la description de l'interface (Page Objects et Composants) et la logique d'assertion métier (Specs).

---

## 🏛️ Les 2 Niveaux d'Abstraction

### 1. Page Object Model (`BasePage`)
Chaque page ou écran applicatif hérite de `BasePage` (`packages/playwright-tests/src/core/BasePage.ts`).

- **Responsabilités :**
  - Navigation sécurisée via `this.goto(path)`.
  - Encapsulation des sélecteurs (`Locator`) sous forme de propriétés publiques ou privées.
  - Actions utilisateurs résilientes (`click`, `fill`, `waitForVisible`) avec logs intégrés.
- **Règle d'or :** Un Page Object ne doit jamais contenir d'assertions `expect(...)` sur le résultat du test (sauf assertions structurelles d'état interne de page). Les assertions de validation du cas de test appartiennent au fichier `.spec.ts`.

### 2. Component Object Model (`BaseComponent`)
Pour éviter la duplication des éléments répétitifs (barres de navigation, modales, bandeaux de cookies, tables de données complexes), on utilise `BaseComponent`.

- **Responsabilités :**
  - Scoper les sélecteurs sous un élément racine (`root: Locator`).
  - Permettre la réutilisation du même composant à travers plusieurs Page Objects.

---

## 📁 Arborescence Standard par Projet

Pour chaque projet configuré dans `projects/<id>.json`, le moteur de test applique l'arborescence suivante :

```
packages/playwright-tests/
├── src/
│   ├── core/                  # BasePage, BaseComponent, Logger, ConfigLoader
│   └── fixtures/              # Fixtures universelles injectant le projet et l'env
├── pages/
│   └── <project-id>/          # Page Objects spécifiques au projet
│       ├── components/        # Modales, widgets, formulaires réutilisables
│       ├── HomePage.ts
│       └── LoginPage.ts
├── tests/
│   └── <project-id>/          # Spécifications E2E par domaine fonctionnel
│       ├── auth/
│       │   └── login.spec.ts
│       └── smoke.spec.ts
└── fixtures/
    └── <project-id>/          # Payloads JSON de simulation & bouchons
```

---

## 💡 Exemple d'Utilisation dans un Test

```typescript
import { test, expect } from '../../src/fixtures/index.js';
import { LoginPage } from '../../pages/demo-ecommerce/LoginPage.js';

test.describe('[ACM-102] Authentification', () => {
  test('Connexion utilisateur réussie', async ({ page, targetEnv, logger }) => {
    logger.info(`Exécution sur l'environnement ${targetEnv.name}`);
    const loginPage = new LoginPage(page, targetEnv.env.baseUrl);

    await loginPage.open();
    await loginPage.login('user@example.com', 'SecurePass123!');

    await expect(page).toHaveURL(/.*dashboard/);
  });
});
```
