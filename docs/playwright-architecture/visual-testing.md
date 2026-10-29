# 09 - Tests Visuels et A/B Testing

**QA-Hub** intègre un moteur de comparaison de snapshots graphiques (`VisualComparator`) pour valider la non-régression visuelle responsive et accompagner les refontes de Design System.

---

## 📸 Capture & Comparaison

```typescript
import { test, expect } from '../../src/fixtures/index.js';

test('Comparaison visuelle du header et du formulaire', async ({ page, visual }) => {
  await page.goto('/login');

  // 1. Comparaison d'un composant spécifique
  const form = page.locator('#login-form');
  await visual.compareElement(form, 'login-form-baseline');

  // 2. Comparaison de la page entière avec masquage des dates dynamiques
  const timestamp = page.locator('.server-timestamp');
  await visual.comparePage('login-page-full', {
    mask: [timestamp],
    maxDiffPixelRatio: 0.01, // 1% de tolérance
  });
});
```

---

## 🔄 Mise à Jour des Baselines

Lorsqu'une évolution visuelle voulue est livrée par l'équipe produit :
```bash
pnpm --filter @qa-hub/playwright-tests test --update-snapshots
```
Les nouvelles images de référence sont enregistrées et doivent être validées dans la Pull Request.
