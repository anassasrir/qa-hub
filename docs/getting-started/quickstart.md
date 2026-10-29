# 02 - Guide de Démarrage Rapide (Quickstart)

Ce guide permet d'installer **QA-Hub** et d'exécuter un premier test en moins de 2 minutes.

---

## ⚡ 1. Cloner et Installer

```bash
git clone <url-du-repo> qa-hub
cd qa-hub

# Installation des dépendances et téléchargement des navigateurs Playwright
pnpm setup
```
> 💡 *Note : Si vous avez fait `pnpm install` manuellement, lancez simplement `pnpm test:install` pour télécharger les binaires Chromium de Playwright.*

---

## 🧪 2. Lancer la Suite de Test Démo

Par défaut, le projet `demo-ecommerce` est actif et configuré :

```bash
# Lancer les tests en mode headless
pnpm test

# Lancer avec l'interface graphique Playwright
pnpm --filter @qa-hub/playwright-tests test:ui
```

---

## 📊 3. Démarrer le Dashboard QA

```bash
pnpm dashboard:dev
```

Rendez-vous sur [http://localhost:3000](http://localhost:3000) pour observer :
- Les KPIs de santé en temps réel.
- Le radar d'instabilité des tests (flakiness).
- Le plan de test vivant.

---

## 🔐 4. Exécuter avec un Gestionnaire de Secrets

Si votre client utilise Infisical ou Doppler :
```bash
# Encapsule automatiquement selon le secrets.provider du projet
pnpm secrets:run -- pnpm test
```

---

## 🚀 5. Initialiser Votre Premier Client

```bash
# 1. Dupliquer le fichier de configuration modèle
cp projects/demo-ecommerce.json projects/mon-client.json

# 2. Ajuster l'ID, les URLs et le nom dans mon-client.json

# 3. Exécuter le scaffolder automatique
pnpm scaffold mon-client
```
Votre arborescence Playwright est immédiatement prête dans `packages/playwright-tests/tests/mon-client/` !
