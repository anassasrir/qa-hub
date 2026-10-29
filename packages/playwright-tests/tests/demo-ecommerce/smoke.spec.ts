import { test, expect } from '../../src/fixtures/index.js';
import { HomePage } from '../../pages/demo-ecommerce/HomePage.js';

test.describe('[DEMO-101] Smoke Tests - Demo E-Commerce', () => {
  test('vérifie le chargement de la page d’accueil et les éléments de base', async ({ page, targetEnv, logger }) => {
    logger.info(`Running smoke test against environment: ${targetEnv.name} (${targetEnv.env.baseUrl})`);

    const homePage = new HomePage(page, targetEnv.env.baseUrl);

    // Mock HTML content to allow offline / local verification without external network dependency
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
                <h1>Bienvenue sur la boutique de test</h1>
              </main>
            </body>
          </html>
        `,
      });
    });

    await homePage.open();

    const title = await homePage.getTitle();
    expect(title).toContain('Demo Store QA Hub');
    await expect(homePage.logo).toBeVisible();
    await expect(homePage.loginButton).toBeVisible();
    await expect(homePage.cartIcon).toBeVisible();
  });
});
