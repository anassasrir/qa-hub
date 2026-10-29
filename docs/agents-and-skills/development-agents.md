# 14 - Agents de Développement (@qa-tester, @qa-validator, @qa-healer, @qa-visual, @qa-publisher)

Ces agents collaborent pour concevoir, tester, auditer et livrer le code des tests en assurant un niveau de qualité constant.

---

## 🎭 1. `@qa-tester` (Générateur)
- Conçoit les Page Objects en respectant les standards POM et COM.
- Produit des scénarios de test lisibles, fiables et s'appuyant sur des sélecteurs accessibles (`getByRole`).
- S'appuie sur le skill `PlaywrightArchitect`.

## 🛡️ 2. `@qa-validator` (Gatekeeper)
- Exécute `pnpm typecheck` et `pnpm lint`.
- Traque impitoyablement les anti-patterns :
  - Présence de `test.only` qui bloquerait la CI.
  - Attentes arbitraires `page.waitForTimeout` qui ralentissent la suite.
  - Variables de secrets ou mots de passe affichés dans la console.

## 🩺 3. `@qa-healer` (Auto-Guérisseur)
- Intervient de manière totalement autonome (mode YOLO) dès qu'un test échoue ou qu'une erreur TypeScript est signalée.
- Analyse le code source et le DOM, applique la correction chirurgicale et re-teste jusqu'au succès.

## 👁️ 4. `@qa-visual` (Analyste Graphique)
- Gère la détection des régressions visuelles responsives.
- Applique les masques d'exclusion sur les parties mouvantes de l'écran.

## 📦 5. `@qa-publisher` (Livreur)
- Analyse le `git status` et les diffs.
- Formate un commit conventionnel conforme aux scopes du projet.
- Prépare le template de Pull Request / Merge Request avec toutes les preuves de test associées.
