# 10 - Fixtures et Mocks Réseau

L'isolation des tests et la rapidité d'exécution dépendent d'une utilisation rigoureuse des fixtures Playwright et de l'interception réseau.

---

## 🧩 Les Fixtures Universelles (`src/fixtures/index.ts`)

Chaque test a accès aux dépendances injectées automatiquement par le framework :

| Fixture | Type | Description |
| :--- | :--- | :--- |
| `projectConfig` | `ProjectConfig` | Configuration complète issue du JSON du projet actif. |
| `targetEnv` | `{ name, env }` | Nom et URLs de l'environnement ciblé (ex: `staging`). |
| `visual` | `VisualComparator` | Instance configurée pour les comparaisons visuelles. |
| `logger` | `Logger` | Logger structuré préfixé avec le nom du scénario en cours. |

---

## 🌐 Bouchonnage Réseau (API Mocking)

Pour tester des cas limites sans dépendre de la disponibilité d'une API tierce :

```typescript
import { test, expect } from '../../src/fixtures/index.js';

test('Affichage du message d’erreur en cas de panne API 500', async ({ page, targetEnv }) => {
  // Intercepter l'appel backend
  await page.route('**/api/v1/orders', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'Internal Server Error' }),
    });
  });

  await page.goto(`${targetEnv.env.baseUrl}/checkout`);
  await expect(page.locator('.alert-error')).toBeVisible();
});
```
