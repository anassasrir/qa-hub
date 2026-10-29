import { expect } from '@playwright/test';
import { Given, When, Then } from '../bdd.js';
import { HomePage } from '../../pages/demo-ecommerce/HomePage.js';

let homePage: HomePage;

Given("l'utilisateur accède à la boutique démo", async ({ page, targetEnv, logger }) => {
  logger.info(`Navigation vers ${targetEnv.env.baseUrl}`);
  homePage = new HomePage(page, targetEnv.env.baseUrl);

  // Bouchonnage réseau pour test hors-ligne
  await page.route(targetEnv.env.baseUrl + '/', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html lang="fr">
          <head><title>Demo Store QA Hub</title></head>
          <body>
            <header>
              <div data-testid="brand-logo">Demo Store</div>
              <a href="/login">Connexion</a>
              <input placeholder="Rechercher un produit..." />
              <div data-testid="cart-badge">0</div>
            </header>
            <main>
              <h1>Bienvenue sur la boutique démo</h1>
            </main>
          </body>
        </html>
      `,
    });
  });

  await homePage.open();
});

When("la page d'accueil est chargée", async () => {
  await homePage.waitForVisible(homePage.header);
});

Then("le titre de la page contient {string}", async ({}, expectedTitle: string) => {
  const title = await homePage.getTitle();
  expect(title).toContain(expectedTitle);
});

Then("le logo de la marque est visible", async () => {
  await expect(homePage.logo).toBeVisible();
});

Then("le bouton de connexion est disponible", async () => {
  await expect(homePage.loginButton).toBeVisible();
});

Then("le badge du panier est initialisé", async () => {
  await expect(homePage.cartIcon).toBeVisible();
});
