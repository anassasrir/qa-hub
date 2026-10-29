import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '../..');

interface ProjectConfig {
  id: string;
  name: string;
  description?: string;
  branding: {
    displayName: string;
    logoUrl?: string;
    primaryColor: string;
    accentColor?: string;
  };
  issueTracker: {
    type: string;
    baseUrl: string;
    ticketRegex: string;
    exampleTicket?: string;
  };
  git: {
    scopes: string[];
    branchPattern?: string;
  };
  ci: {
    provider: string;
    pipelineUrl?: string;
  };
  environments: {
    default: string;
    targets: Record<string, { baseUrl: string; apiBaseUrl?: string }>;
  };
  playwright: {
    testDir: string;
    pageObjectsDir: string;
    fixturesDir?: string;
  };
}

export function scaffoldProject(projectInput: string): void {
  let configPath = projectInput;
  if (!configPath.endsWith('.json')) {
    configPath = path.join(ROOT_DIR, 'projects', `${projectInput}.json`);
  } else if (!path.isAbsolute(configPath)) {
    configPath = path.resolve(process.cwd(), configPath);
  }

  if (!fs.existsSync(configPath)) {
    console.error(`❌ Fichier de configuration introuvable : ${configPath}`);
    process.exit(1);
  }

  const rawConfig = fs.readFileSync(configPath, 'utf-8');
  let config: ProjectConfig;
  try {
    config = JSON.parse(rawConfig) as ProjectConfig;
  } catch (err) {
    console.error(`❌ Impossible de parser le JSON :`, err);
    process.exit(1);
  }

  const { id, name, issueTracker, environments } = config;
  console.log(`\n🚀 Initialisation de l'infrastructure BDD pour le projet : ${name} (${id})`);

  const pwTestsRoot = path.join(ROOT_DIR, 'packages/playwright-tests');
  const pagesDir = path.join(pwTestsRoot, 'pages', id);
  const specsDir = path.join(pwTestsRoot, 'specs', id);
  const stepsDir = path.join(pwTestsRoot, 'steps', id);
  const fixturesDir = path.join(pwTestsRoot, 'fixtures', id);
  const docsDir = path.join(ROOT_DIR, 'docs/projects');

  // 1. Create directories
  [pagesDir, path.join(pagesDir, 'components'), specsDir, stepsDir, fixturesDir, docsDir].forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // 2. Generate HomePage.ts
  const homePagePath = path.join(pagesDir, 'HomePage.ts');
  if (!fs.existsSync(homePagePath)) {
    const homePageContent = `import type { Locator, Page } from '@playwright/test';
import { BasePage } from '../../src/core/BasePage.js';

/**
 * Page Object pour la page d'accueil de ${name}
 */
export class HomePage extends BasePage {
  public readonly header: Locator;
  public readonly primaryNavigation: Locator;

  constructor(page: Page, baseUrl = '') {
    super(page, baseUrl);
    this.header = page.locator('header, [role="banner"]');
    this.primaryNavigation = page.locator('nav, [role="navigation"]');
  }

  public async open(): Promise<void> {
    await this.goto('/');
  }
}
`;
    fs.writeFileSync(homePagePath, homePageContent, 'utf-8');
    console.log(`  ✅ Créé : ${path.relative(ROOT_DIR, homePagePath)}`);
  }

  // 3. Generate smoke.feature (Gherkin Living Spec)
  const sampleTicket = issueTracker.exampleTicket || 'QA-001';
  const smokeFeaturePath = path.join(specsDir, 'smoke.feature');
  if (!fs.existsSync(smokeFeaturePath)) {
    const smokeFeatureContent = `# language: fr
@${id} @smoke @p0
Fonctionnalité: Chargement et disponibilité de ${name}

  Scénario: vérifie la disponibilité de l'application
    Étant donné que l'utilisateur accède à l'application ${name}
    Quand la page d'accueil est chargée
    Alors l'entête principale est visible
`;
    fs.writeFileSync(smokeFeaturePath, smokeFeatureContent, 'utf-8');
    console.log(`  ✅ Créé : ${path.relative(ROOT_DIR, smokeFeaturePath)}`);
  }

  // 4. Generate smoke.steps.ts (Playwright BDD Steps)
  const smokeStepsPath = path.join(stepsDir, 'smoke.steps.ts');
  if (!fs.existsSync(smokeStepsPath)) {
    const smokeStepsContent = `import { expect } from '@playwright/test';
import { Given, When, Then } from '../bdd.js';
import { HomePage } from '../../pages/${id}/HomePage.js';

let homePage: HomePage;

Given("l'utilisateur accède à l'application ${name}", async ({ page, targetEnv, logger }) => {
  logger.info(\`Ouverture de l'application sur \${targetEnv.name} (\${targetEnv.env.baseUrl})\`);
  homePage = new HomePage(page, targetEnv.env.baseUrl);
  await homePage.open();
});

When("la page d'accueil est chargée", async () => {
  await homePage.waitForVisible(homePage.header);
});

Then("l'entête principale est visible", async () => {
  await expect(homePage.header).toBeVisible();
});
`;
    fs.writeFileSync(smokeStepsPath, smokeStepsContent, 'utf-8');
    console.log(`  ✅ Créé : ${path.relative(ROOT_DIR, smokeStepsPath)}`);
  }

  // 5. Generate Project Documentation
  const docPath = path.join(docsDir, `${id}.md`);
  if (!fs.existsSync(docPath)) {
    const defaultEnv = environments.default;
    const defaultUrl = environments.targets[defaultEnv]?.baseUrl || 'Non spécifié';
    const scopesList = config.git.scopes.map((s) => `\`${s}\``).join(', ');

    const docContent = `# Fiche Projet : ${name} (\`${id}\`)

## 📌 Présentation
- **ID Projet :** \`${id}\`
- **Issue Tracker :** [${issueTracker.type.toUpperCase()}](${issueTracker.baseUrl})
- **Ticket Regex :** \`${issueTracker.ticketRegex}\` (Exemple: \`${sampleTicket}\`)
- **Environnement par défaut :** \`${defaultEnv}\` (${defaultUrl})
- **Fournisseur CI :** \`${config.ci.provider}\`

---

## 📂 Organisation du Code (Playwright BDD)
- **Spécifications Gherkin :** \`packages/playwright-tests/specs/${id}/\`
- **Step Definitions :** \`packages/playwright-tests/steps/${id}/\`
- **Page Objects :** \`packages/playwright-tests/pages/${id}/\`
- **Fixtures :** \`packages/playwright-tests/fixtures/${id}/\`

---

## 🌿 Conventions Git & Commits
- **Scopes autorisés :** ${scopesList}
- **Format de branche recommandé :** \`feat/${sampleTicket}-nom-fonctionnalite\`
- **Exemple de commit :**
  \`\`\`bash
  git commit -m "feat(${config.git.scopes[0] || 'core'}): implémentation du flux ${sampleTicket}"
  \`\`\`

---

## ⚡ Commandes Rapides
\`\`\`bash
# Lancer les tests BDD de ce projet
PROJECT_ID=${id} pnpm test

# Lancer sur un environnement spécifique (ex: dev, staging, prod)
PROJECT_ID=${id} TARGET_ENV=dev pnpm test
\`\`\`
`;
    fs.writeFileSync(docPath, docContent, 'utf-8');
    console.log(`  ✅ Créé : ${path.relative(ROOT_DIR, docPath)}`);
  }

  // 6. Update Registry in qa-dashboard
  const syncPath = path.join(ROOT_DIR, 'tools/sync-projects.ts');
  if (fs.existsSync(syncPath)) {
    try {
      import('../sync-projects.js').then((m) => m.syncProjects?.());
    } catch {
      // Fallback
    }
  }

  console.log(`\n🎉 Projet '${id}' initialisé avec succès en mode Playwright BDD !`);
}

// CLI Execution support
const targetProject = process.argv[2];
if (targetProject) {
  scaffoldProject(targetProject);
}
