import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  parseSpecFile,
  parseMarkdownSpec,
  parseGherkinSpec,
  getProjectTestPlan,
  consolidateTestSuites,
} from "./parseTests";
import fs from "fs";
import { TestSuite } from "./utils";

vi.mock("fs", () => ({
  default: {
    readFileSync: vi.fn(),
    existsSync: vi.fn(),
    lstatSync: vi.fn(),
    readdirSync: vi.fn(),
  },
}));

describe("parseTests", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe("parseSpecFile", () => {
    it("should parse a simple spec file correctly", () => {
      const mockContent = `
        test.describe('My Suite', () => {
          test('My Test', async ({ page }) => {
            await test.step('Step 1', async () => {});
          });
        });
      `;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const result = parseSpecFile("path/to/spec.ts", "spec.ts");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("My Suite");
      expect(result[0].testCases).toHaveLength(1);
      expect(result[0].testCases[0].title).toBe("My Test");
      expect(result[0].testCases[0].steps).toHaveLength(1);
      expect(result[0].testCases[0].steps[0].title).toBe("Step 1");
    });
  });

  describe("parseMarkdownSpec", () => {
    it("should parse a markdown spec file correctly", () => {
      const mockContent = `
# Suite Title

## Application Overview
Some overview

## Test Scenarios

### Feature A
#### Scenario 1
**Steps:**
  1. Step 1
    - expect: result 1
  2. Step 2
      `;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const result = parseMarkdownSpec("path/to/spec.md", "spec.md");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Feature A");
      expect(result[0].testCases[0].title).toBe("Scenario 1");
    });
  });

  describe("parseGherkinSpec", () => {
    it("should parse a gherkin spec file correctly", () => {
      const mockContent = `
Fonctionnalité: Authentification
  Description de la feature

  Scénario: Connexion réussie
    Etant donné que je suis sur la page de connexion
    Quand je saisis mes identifiants
    Alors je suis redirigé
      `;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const result = parseGherkinSpec("path/to/spec.feature", "spec.feature");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Authentification");
      expect(result[0].testCases).toHaveLength(1);
      expect(result[0].testCases[0].title).toBe("Connexion réussie");
      expect(result[0].testCases[0].steps).toHaveLength(3);
    });

    it("should parse gherkin spec with Contexte and accented keywords", () => {
      const mockContent = `
@tpbp @visual
Fonctionnalité: Actualisation
  Contexte:
    Étant donné que je suis sur la page d'accueil
    Et que les flags sont activés

  Scénario: Actualiser situation
    Quand je clique sur Actualiser
    Donc je suis redirigé
    Alors le résultat correspond au snapshot
      `;
      vi.mocked(fs.readFileSync).mockReturnValue(mockContent);

      const result = parseGherkinSpec("path/to/actualisation.feature", "tpbp/visual/actualisation.feature");

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Actualisation");
      expect(result[0].testCases).toHaveLength(1);
      expect(result[0].testCases[0].title).toBe("Actualiser situation");
      expect(result[0].testCases[0].steps).toHaveLength(5);
      expect(result[0].testCases[0].steps[0].title).toBe("Étant donné que je suis sur la page d'accueil");
      expect(result[0].testCases[0].steps[1].title).toBe("Et que les flags sont activés");
      expect(result[0].testCases[0].steps[2].title).toBe("Quand je clique sur Actualiser");
      expect(result[0].testCases[0].steps[3].title).toBe("Donc je suis redirigé");
      expect(result[0].testCases[0].steps[4].title).toBe("Alors le résultat correspond au snapshot");
    });
  });

  describe("getProjectTestPlan", () => {
    it("should scan specs directory and match with implementation (.feature)", () => {
      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.readdirSync).mockImplementation(((p: fs.PathLike) => {
        const pathStr = p.toString();
        if (pathStr.endsWith("specs")) return ["savings"];
        if (pathStr.endsWith("savings") && pathStr.includes("specs")) return ["auth.feature"];
        if (pathStr.endsWith("tests")) return ["savings"];
        if (pathStr.endsWith("savings") && pathStr.includes("tests")) return ["auth.spec.ts"];
        return [];
      }) as unknown as typeof fs.readdirSync);

      vi.mocked(fs.lstatSync).mockImplementation((p) => {
        const pathStr = p.toString();
        return {
          isDirectory: () => !pathStr.endsWith(".feature") && !pathStr.endsWith(".ts"),
        } as unknown as fs.Stats;
      });

      vi.mocked(fs.readFileSync).mockImplementation((p) => {
        const pathStr = p.toString();
        if (pathStr.endsWith(".feature")) {
          return `Fonctionnalité: Auth\nScénario: Login\nQuand je saisis...`;
        }
        if (pathStr.endsWith(".ts")) {
          return `test.describe('Auth', () => { test('Login', () => {}) })`;
        }
        return "";
      });

      const allTests = getProjectTestPlan(["savings"]);

      expect(allTests).toHaveLength(1);
      expect(allTests[0].title).toBe("Auth");
      expect(allTests[0].testCases[0].automated).toBe(true);
    });
  });

  describe("consolidateTestSuites", () => {
    it("should group tpbp components, visual, and bloc-vous suites together", () => {
      const rawSuites: TestSuite[] = [
        {
          id: "suite-date-picker",
          title: "Composant DatePicker",
          file: "tpbp/components/date-picker.feature",
          automatedCount: 2,
          testCases: [
            { id: "tc-dp-1", title: "DatePicker Situation", steps: [], file: "tpbp/components/date-picker.feature" },
            { id: "tc-dp-2", title: "DatePicker Donation", steps: [], file: "tpbp/components/date-picker.feature" },
          ],
        },
        {
          id: "suite-delete-modal",
          title: "Composant DeleteModal",
          file: "tpbp/components/delete-modal.feature",
          automatedCount: 1,
          testCases: [
            { id: "tc-dm-1", title: "DeleteModal Budget", steps: [], file: "tpbp/components/delete-modal.feature" },
          ],
        },
        {
          id: "suite-visual-actu",
          title: "Régression visuelle actualisation",
          file: "tpbp/visual/actualisation.feature",
          automatedCount: 1,
          testCases: [
            { id: "tc-vis-1", title: "Visuel Actualisation", steps: [], file: "tpbp/visual/actualisation.feature" },
          ],
        },
        {
          id: "suite-bloc-vous-prof",
          title: "Bloc Vous - Professions",
          file: "tpbp/bloc-vous/limitation-professions.feature",
          automatedCount: 1,
          testCases: [
            { id: "tc-bv-1", title: "Limite 3 professions", steps: [], file: "tpbp/bloc-vous/limitation-professions.feature" },
          ],
        },
        {
          id: "suite-auth",
          title: "Authentification",
          file: "tpbp/auth.feature",
          automatedCount: 1,
          testCases: [
            { id: "tc-auth-1", title: "Login", steps: [], file: "tpbp/auth.feature" },
          ],
        },
      ];

      const consolidated = consolidateTestSuites(rawSuites);

      expect(consolidated).toHaveLength(4);
      
      const compSuite = consolidated.find((s) => s.title === "Composants");
      expect(compSuite).toBeDefined();
      expect(compSuite?.testCases).toHaveLength(3);
      expect(compSuite?.automatedCount).toBe(3);

      const visSuite = consolidated.find((s) => s.title === "Tests Visuels");
      expect(visSuite).toBeDefined();
      expect(visSuite?.testCases).toHaveLength(1);

      const bvSuite = consolidated.find((s) => s.title === "Bloc Vous");
      expect(bvSuite).toBeDefined();
      expect(bvSuite?.testCases).toHaveLength(1);

      const authSuite = consolidated.find((s) => s.title === "Authentification");
      expect(authSuite).toBeDefined();
      expect(authSuite?.testCases).toHaveLength(1);
    });

    it("should group b4bank Souscription GL suites under Souscription Gestion Libre", () => {
      const b4bSuites: TestSuite[] = [
        {
          id: "suite-gl-details",
          title: "Souscription GL - Page détail d'un fonds",
          file: "b4b/gestion-libre/subscription-fund-details.feature",
          automatedCount: 1,
          testCases: [
            { id: "tc-gl-1", title: "Détail fonds", steps: [], file: "b4b/gestion-libre/subscription-fund-details.feature" },
          ],
        },
        {
          id: "suite-gl-summary",
          title: "Souscription GL - Récapitulatif de l'allocation",
          file: "b4b/gl-subscription-summary.feature",
          automatedCount: 1,
          testCases: [
            { id: "tc-gl-2", title: "Récapitulatif allocation", steps: [], file: "b4b/gl-subscription-summary.feature" },
          ],
        },
        {
          id: "suite-b4b-auth",
          title: "Authentification",
          file: "b4b/auth.feature",
          automatedCount: 1,
          testCases: [
            { id: "tc-b4b-auth-1", title: "Login B4B", steps: [], file: "b4b/auth.feature" },
          ],
        },
      ];

      const consolidated = consolidateTestSuites(b4bSuites);

      expect(consolidated).toHaveLength(2);

      const glSubSuite = consolidated.find((s) => s.title === "Souscription Gestion Libre");
      expect(glSubSuite).toBeDefined();
      expect(glSubSuite?.testCases).toHaveLength(2);
      expect(glSubSuite?.automatedCount).toBe(2);

      const authSuite = consolidated.find((s) => s.title === "Authentification");
      expect(authSuite).toBeDefined();
    });
  });
});
