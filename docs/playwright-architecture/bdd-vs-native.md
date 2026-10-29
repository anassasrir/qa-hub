# 17 - BDD Gherkin vs Playwright Natif : Analyse & Recommandations

L'une des questions architecturales récurrentes en automatisation QA est le choix entre **BDD Gherkin (Cucumber / Playwright-BDD)** et **Playwright Natif (TypeScript avec `test.step`)**.

---

## ⚖️ Tableau Comparatif

| Critère | Playwright Natif (`test.step`) | BDD Gherkin (`.feature`) |
| :--- | :--- | :--- |
| **Coût de maintenance** | 🟢 **Très faible** : Code TypeScript direct, 1 seul niveau de code. | 🔴 **Élevé** : Triple maintenance (fichier `.feature`, fichier `steps.ts`, `PageObject.ts`). |
| **Refactoring & Renommage** | 🟢 **Immédiat** : L'IDE (VSCode, WebStorm) renomme symboles et méthodes partout. | 🟡 **Fragile** : Les regex Gherkin ne sont pas toujours refactorées automatiquement. |
| **Débogage & Tracing** | 🟢 **Natif** : Playwright Inspector et Trace Viewer affichent les étapes avec snapshots exacts. | 🟡 **Intermédiaire** : Nécessite une compilation intermédiaire vers du code de test temporaire. |
| **Typage strict & Autocomplétion** | 🟢 **100% TypeScript** : Aucun risque d'erreur de frappe non détectée au build. | 🔴 **Texte libre** : Les erreurs de formulation de step n'apparaissent qu'à l'exécution. |
| **Lisibilité pour les non-devs** | 🟡 **Très bonne** : Les `test.step("Étant donné...")` apparaissent en clair dans les rapports HTML. | 🟢 **Excellente** : Fichiers texte en langage naturel compréhensibles par tous. |

---

## 🔍 Pourquoi QA-Hub privilégie Playwright Natif par Défaut

1. **La fausse promesse du BDD en entreprise :**  
   Dans 90% des projets, les Product Owners et Business Analysts n'écrivent jamais directement les fichiers `.feature`. Ce sont les ingénieurs QA qui rédigent les scénarios Gherkin, créant une surcouche de glue-code inutile et coûteuse à maintenir.
2. **Le pattern `test.step` offre le meilleur des deux mondes :**  
   En utilisant `test.step`, le rapport Playwright HTML et le trace viewer découpent le test exactement comme un scénario BDD :
   ```typescript
   test('Souscription à un contrat', async ({ page }) => {
     await test.step('Étant donné un utilisateur authentifié', async () => {
       await loginPage.open();
       await loginPage.login('user@example.com', 'Pass123!');
     });

     await test.step('Quand il sélectionne le profil Équilibré', async () => {
       await simulatorPage.selectProfile('balanced');
     });

     await test.step('Alors le récapitulatif affiche les frais conformes', async () => {
       await expect(summaryPage.fees).toContainText('1.6%');
     });
   });
   ```
3. **Moins de flakiness, plus de vélocité :** Moins d'intermédiaires signifie des tests plus rapides à coder, plus faciles à auto-réparer par l'agent `@qa-healer`, et plus résilients dans la CI.

---

## 🔌 Et si un client EXIGE formellement Gherkin ?

Si un client impose Cucumber / Gherkin pour des raisons de conformité réglementaire ou organisationnelle, **QA-Hub** permet d'intégrer le package officiel `playwright-bdd`.  
Vos Page Objects existants dans `pages/<client>/` restent 100% réutilisables dans les Step Definitions sans aucune réécriture.
