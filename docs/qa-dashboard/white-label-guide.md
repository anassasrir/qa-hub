# 06 - Guide Marque Blanche & Architecture du QA-Dashboard

Le composant **`qa-dashboard`** est l'exact héritier de la plateforme analytique éprouvée **TMS**, entièrement refactoré pour fonctionner en **marque blanche (White-Label)** et s'adapter à n'importe quel client.

---

## 🖥️ Les 8 Modules & Pages Intégrés

Le dashboard conserve 100% de la richesse fonctionnelle et du design originel :

| Route | Page | Description & Composants |
| :--- | :--- | :--- |
| **`/dashboard`** | **Tableau de Bord** | Vue d'ensemble, Radar d'échecs (`FailureRadar`), Radar de flakiness (`FlakinessRadar`), Tendance d'activité (`ActivityTrendChart`), Camembert des statuts (`TestResultPieChart`) et matrice globale par projet (`GlobalStatusBoard`). |
| **`/history`** | **Historique des Runs** | Chronologie complète de toutes les exécutions locales et CI avec filtres par date, statut et durée. |
| **`/compare`** | **Comparateur de Runs** | Analyse différentielle (`ComparisonSummaryChart`) entre deux exécutions pour identifier les régressions ou améliorations. |
| **`/visual`** | **Tests Visuels** | Galerie des captures d'écran, baselines graphiques et visualiseur de diffs pixels. |
| **`/details`** | **Dernier Run** | Vue granulaire test par test avec stacktraces, logs détaillés, captures d'écran sur échec et vidéos d'exécution. |
| **`/testplan`** | **Plan de Test Vivant** | Cartographie vivante de toutes les spécifications Playwright du code source avec catégories et tags fonctionnels. |
| **`/quality`** | **Qualité & Couverture** | Suivi des métriques de qualité de code (Sonar / Vitest coverage) et santé globale. |
| **`/generator`** | **Générateur Gherkin** | Outil interactif d'aide à la conception de scénarios de test assisté par IA. |

---

## 🎨 Personnalisation Marque Blanche

### 1. Titre & Nom de l'Organisation
Dans votre fichier `.env` ou lors du déploiement :
```env
NEXT_PUBLIC_DASHBOARD_TITLE="Acme Quality Hub"
```
Le titre de la barre de navigation haute, le header mobile et les balises `<title>` s'adaptent automatiquement sans modification de code.

### 2. Sélecteur Dynamique de Projets (`ProjectSelector.tsx`)
Le sélecteur de projet en haut à droite s'alimente directement avec les projets déclarés dans le framework (`demo-ecommerce`, etc.) et permet de filtrer l'ensemble des graphiques et données en un clic.

### 3. Charte Graphique & Tokens CSS (Tailwind v4)
Le design s'appuie sur le moteur **Tailwind CSS v4** et des variables sémantiques dans `app/globals.css` :
- Grille technique de fond (`.tech-grid`).
- Palette dark/light moderne avec tokens de marque (`--accent`, `--color-background`).

---

## ⚡ Commandes

```bash
# Démarrer en mode développement
pnpm dashboard:dev

# Compiler pour la production
pnpm dashboard:build

# Lancer la version compilée
pnpm dashboard:start
```
Accessible par défaut sur [http://localhost:3000](http://localhost:3000).
