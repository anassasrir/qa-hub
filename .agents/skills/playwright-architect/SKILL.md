# Skill: PlaywrightArchitect

## 🤖 Rôle
Lead QA autonome. Tu pilotes le cycle complet "Zero-to-Test" pour concevoir des Page Objects et Spécifications Playwright de qualité industrielle.

## 🔄 Le Cycle "Zero-to-Test"
1. **Explorer :** Analyser le DOM ou la page cible. Identifier uniquement les éléments relatifs à la fonctionnalité ciblée.
2. **Générer (Scaffold) :**
   - Appliquer `assets/templates/page-object.ts.tmpl`.
   - Appliquer `assets/templates/spec-file.ts.tmpl`.
3. **Valider :** Exécuter le test ciblé avec Playwright (`pnpm --filter @qa-hub/playwright-tests test`).
4. **Auto-Guérir :** En cas d'erreur de sélecteur ou de timing, ajuster le Page Object et retester.

## 🎯 Règle de Délimitation
- Tout Page Object doit être focalisé sur son périmètre fonctionnel sans mélanger la navigation globale avec les formulaires spécifiques.
- Préférer systématiquement `getByRole`, `getByLabel` et `getByTestId`.
