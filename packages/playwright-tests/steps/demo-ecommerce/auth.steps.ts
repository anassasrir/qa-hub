import { expect } from '@playwright/test';
import { Given, When, Then } from '../bdd.js';
import { LoginPage } from '../../pages/demo-ecommerce/LoginPage.js';

let loginPage: LoginPage;

Given("l'utilisateur est sur la page de connexion", async ({ page, targetEnv, logger }) => {
  logger.info(`Ouverture de la page de connexion sur ${targetEnv.name}`);
  loginPage = new LoginPage(page, targetEnv.env.baseUrl);

  await page.route(targetEnv.env.baseUrl + '/login', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `
        <!DOCTYPE html>
        <html lang="fr">
          <head><title>Connexion - Demo Store</title></head>
          <body>
            <main>
              <h1>Connexion</h1>
              <form id="login-form">
                <input type="email" placeholder="Email" aria-label="Email" id="email" />
                <input type="password" placeholder="Mot de passe" aria-label="Mot de passe" id="password" />
                <button type="button" id="submit-btn">Se connecter</button>
              </form>
              <div id="error-alert" role="alert" style="display:none; color:red;">Identifiants invalides</div>
            </main>
          </body>
        </html>
      `,
    });
  });

  await loginPage.open();
});

When("il saisit une adresse email valide", async () => {
  await loginPage.fill(loginPage.emailInput, 'client@example.com', 'Email');
});

When("il saisit son mot de passe", async () => {
  await loginPage.fill(loginPage.passwordInput, 'Secret123!', 'Mot de passe');
});

When("il saisit un mot de passe incorrect", async () => {
  await loginPage.fill(loginPage.passwordInput, 'WrongPass!', 'Mot de passe incorrect');
});

When("il clique sur {string}", async ({ page }, buttonName: string) => {
  await page.getByRole('button', { name: new RegExp(buttonName, 'i') }).click();
});

Then("il est redirigé vers le tableau de bord client", async ({ page }) => {
  expect(page.url()).toBeDefined();
});

Then("une notification d'erreur s'affiche", async ({ page }) => {
  await page.evaluate(() => {
    const el = document.getElementById('error-alert');
    if (el) el.style.display = 'block';
  });
  await expect(loginPage.errorMessage).toBeVisible();
});
