import { describe, it, expect } from "vitest";
import {
  extractTicket,
  sanitizeTestTitle,
  buildDetailsUrl,
  formatSlackMessage,
  buildSlackPayload,
  collectSlackReportData,
  DEFAULT_SLACK_CHANNEL,
  DEFAULT_BASE_URL,
  SlackReportData,
} from "./slackDashboardReport";
import { RunData } from "./utils";
import { VisualRunData } from "./parseVisual";

describe("slackDashboardReport", () => {
  describe("extractTicket", () => {
    it("devrait extraire un ticket TD correctement", () => {
      expect(
        extractTicket("TD-1492 - Cas Création : Créer un partenaire"),
      ).toBe("TD-1492");
      expect(extractTicket("[TD-1790] Parcours retraite")).toBe("TD-1790");
      expect(extractTicket("test TD-123")).toBe("TD-123");
    });

    it("devrait extraire une règle de gestion RG", () => {
      expect(extractTicket("RG4 - Consultation contrat")).toBe("RG4");
      expect(extractTicket("Règle RG25 : validation")).toBe("RG25");
      expect(extractTicket("RG-10 : souscription")).toBe("RG-10");
    });

    it("devrait retourner null s'il n'y a pas de ticket", () => {
      expect(extractTicket("Parcours visuel sans ticket")).toBeNull();
      expect(extractTicket("Login et vérification du profil")).toBeNull();
    });
  });

  describe("sanitizeTestTitle", () => {
    it("devrait retirer le préfixe du ticket s'il est présent au début", () => {
      const clean = sanitizeTestTitle(
        "TD-1492 - Cas Création : Créer un partenaire avec un statut différent",
        "TD-1492",
      );
      expect(clean).toBe(
        "Cas Création : Créer un partenaire avec un statut différent",
      );
    });

    it("devrait retirer les tags @playwright", () => {
      const clean = sanitizeTestTitle("Souscription @smoke @critical", null);
      expect(clean).toBe("Souscription");
    });

    it("devrait tronquer les titres trop longs avec des points de suspension", () => {
      const longTitle = "A".repeat(80);
      const clean = sanitizeTestTitle(longTitle, null, 50);
      expect(clean.length).toBe(50);
      expect(clean.endsWith("...")).toBe(true);
    });
  });

  describe("buildDetailsUrl", () => {
    it("devrait construire une URL conforme au format de /details", () => {
      const url = buildDetailsUrl(
        "https://qa.anatec.io",
        "tpbp",
        "CI Run - 2907482660",
        "failed",
        "TD-1492 - Cas Création",
      );
      expect(url).toContain("https://qa.anatec.io/details/?");
      expect(url).toContain("project=tpbp");
      expect(url).toContain("id=CI+Run+-+2907482660");
      expect(url).toContain("status=failed");
      expect(url).toContain("test=TD-1492+-+Cas+Cr%C3%A9ation");
    });
  });

  describe("formatSlackMessage", () => {
    it("devrait formater le message complet avec la structure demandée", () => {
      const mockData: SlackReportData = {
        date: "05/10/2026",
        dashboardUrl: "https://qa.anatec.io/",
        projects: [
          {
            projectId: "tpbp",
            projectLabel: "TPBP",
            envLabel: "Homologation",
            total: 80,
            passed: 77,
            failed: 1,
            flaky: 2,
            runId: "2",
          },
          {
            projectId: "wse",
            projectLabel: "WeSaveEpargne",
            envLabel: "Staging",
            total: 38,
            passed: 38,
            failed: 0,
            flaky: 0,
            runId: "1",
          },
        ],
        attentionPoints: [
          {
            projectId: "tpbp",
            projectLabel: "TPBP",
            ticket: "TD-1492",
            title: "TD-1492 - Cas Création",
            cleanTitle: "Cas Création : Créer un partenaire...",
            status: "failed",
            runId: "2",
            detailsUrl: "https://qa.anatec.io/details/?test=TD-1492",
          },
          {
            projectId: "tpbp",
            projectLabel: "TPBP",
            ticket: "RG4",
            title: "RG4 - Consultation",
            cleanTitle: "Consultation contrat assurance-vie",
            status: "flaky",
            runId: "2",
            detailsUrl: "https://qa.anatec.io/details/?test=RG4",
          },
        ],
      };

      const message = formatSlackMessage(mockData);

      expect(message).toContain("*Résultat tests — 05/10/2026*");
      expect(message).not.toContain("📋");
      expect(message).not.toContain("Statut par projet");
      expect(message).toContain(
        "✅ *WeSaveEpargne (Staging) :* 38/38 tests (100 %)",
      );
      expect(message).toContain(
        "❌ *TPBP (Homologation) :* 77/80 tests (96 %) — 1 échec, 2 instables",
      );
      expect(message).toContain(
        "<https://qa.anatec.io/|Accéder au tableau de bord complet>",
      );
    });

    it("devrait formater 1 seul écart visuel au singulier", () => {
      const mockData: SlackReportData = {
        date: "05/10/2026",
        dashboardUrl: "https://qa.anatec.io/",
        projects: [
          {
            projectId: "tpbp-visual",
            projectLabel: "TPBP (Visual)",
            envLabel: "Homologation",
            total: 10,
            passed: 9,
            failed: 1,
            flaky: 0,
            runId: "3",
            isVisual: true,
            isFullVisual: true,
            diffCount: 1,
          },
        ],
        attentionPoints: [],
      };

      const message = formatSlackMessage(mockData);
      expect(message).toContain(
        "❌ *TPBP (Visual) (Homologation) :* 1 écart détecté sur 10 tests",
      );
    });

    it("devrait formater 'Aucun écart détecté' quand les tests visuels n'ont pas de diff", () => {
      const mockData: SlackReportData = {
        date: "05/10/2026",
        dashboardUrl: "https://qa.anatec.io/",
        projects: [
          {
            projectId: "tpbp-visual",
            projectLabel: "TPBP (Visual)",
            envLabel: "Homologation",
            total: 50,
            passed: 50,
            failed: 0,
            flaky: 0,
            runId: "3",
            isVisual: true,
            isFullVisual: true,
            diffCount: 0,
          },
        ],
        attentionPoints: [],
      };

      const message = formatSlackMessage(mockData);
      expect(message).toContain(
        "✅ *TPBP (Visual) (Homologation) :* Aucun écart détecté sur 50 tests",
      );
    });

    it("devrait formater un run mixte avec écarts visuels détaillés (succès, instables, échecs, écarts visuels)", () => {
      const mockData: SlackReportData = {
        date: "13/10/2026",
        dashboardUrl: "https://qa.anatec.io/dashboard/",
        projects: [
          {
            projectId: "tpbp",
            projectLabel: "TPBP",
            envLabel: "Homologation",
            total: 119,
            passed: 109,
            successCount: 105,
            failed: 10,
            flaky: 4,
            runId: "CI Run - 2939601158",
            visualDiffCount: 17,
            visualFailedTestsCount: 10,
          },
        ],
        attentionPoints: [],
      };

      const message = formatSlackMessage(mockData);
      expect(message).toContain(
        "❌ *TPBP (Homologation) :* 109/119 tests (92 %) - Succès 105, Instables 4, Echecs 10; 17 écarts visuels détectés dans les 10 tests",
      );
    });

    it("devrait formater un run sans échec à 100%", () => {
      const mockData: SlackReportData = {
        date: "13/10/2026",
        dashboardUrl: "https://qa.anatec.io/dashboard/",
        projects: [
          {
            projectId: "tpbp",
            projectLabel: "TPBP",
            envLabel: "Homologation",
            total: 119,
            passed: 119,
            successCount: 119,
            failed: 0,
            flaky: 0,
            runId: "CI Run - 2939601158",
          },
        ],
        attentionPoints: [],
      };

      const message = formatSlackMessage(mockData);
      expect(message).toContain(
        "✅ *TPBP (Homologation) :* 119/119 tests (100 %)",
      );
    });
  });

  describe("buildSlackPayload", () => {
    it("devrait construire un payload ciblant C8AEEGP60", () => {
      const payload = buildSlackPayload("Hello Slack", DEFAULT_SLACK_CHANNEL);
      expect(payload.channel).toBe("C8AEEGP60");
      expect(payload.text).toBe("Hello Slack");
      expect(payload.blocks[0]?.text?.text).toBe("Hello Slack");
    });

    it("devrait construire un payload sans forcer channel pour les DMs privés", () => {
      const payload = buildSlackPayload("Hello Private DM");
      expect(payload.channel).toBeUndefined();
      expect(payload.text).toBe("Hello Private DM");
    });
  });

  describe("collectSlackReportData", () => {
    it("devrait agréger dynamiquement les données par projet à partir de runs", () => {
      const mockRuns: RunData[] = [
        {
          id: "CI Run - 100",
          date: "2026-10-05",
          stats: {
            total: 2,
            expected: 1,
            unexpected: 1,
            skipped: 0,
            flaky: 0,
            duration: 1000,
          },
          tests: [
            {
              title: "TD-200 - Test TPBP en échec",
              suite: "TPBP",
              file: "tests/tpbp/test2.spec.ts",
              project: "chrome",
              status: "failed",
              duration: 500,
              results: [],
            },
            {
              title: "TD-100 - Test WeSave",
              suite: "WeSave",
              file: "tests/wesave/test1.spec.ts",
              project: "chrome",
              status: "passed",
              duration: 500,
              results: [],
            },
          ],
        },
      ];

      const report = collectSlackReportData(
        mockRuns,
        [],
        DEFAULT_BASE_URL,
        "05/10/2026",
      );
      expect(report.date).toBe("05/10/2026");
      expect(report.projects.length).toBe(2);

      const tpbp = report.projects.find((p) => p.projectId === "tpbp");
      expect(tpbp).toBeDefined();
      expect(tpbp?.passed).toBe(0);
      expect(tpbp?.failed).toBe(1);

      const wse = report.projects.find((p) => p.projectId === "wse");
      expect(wse).toBeDefined();
      expect(wse?.passed).toBe(1);
      expect(wse?.failed).toBe(0);

      const failPoint = report.attentionPoints.find(
        (pt) => pt.ticket === "TD-200",
      );
      expect(failPoint).toBeDefined();
      expect(failPoint?.status).toBe("failed");
      expect(failPoint?.detailsUrl).toContain("project=tpbp");
    });

    it("devrait intégrer dynamiquement un run visuel avec diffCount", () => {
      const mockVisualRuns = [
        {
          pipelineId: "9999",
          jobId: "8888",
          branch: "main",
          commitHash: "abc1234",
          commitSubject: "Visual test",
          project: "tpbp-visual",
          environment: "tpbp-visual",
          runTimestamp: "2026-10-05T12:00:00Z",
          stats: {
            total: 20,
            failed: 4,
            avgDiffRatio: 0.05,
            maxDiffRatio: 0.1,
            categories: {},
          },
          items: [
            {
              id: "1",
              snapshot: null,
              expectedDim: null,
              receivedDim: null,
              deltaHeight: null,
              diffPixels: null,
              diffRatio: 0.05,
              diffPercent: "5%",
              category: "Layout",
              explanation: "Layout shift",
              specTitle: "Actualisation",
              testStatus: "failed",
              file: "actualisation.spec.ts",
            },
          ],
        },
      ] satisfies VisualRunData[];

      const report = collectSlackReportData(
        [],
        mockVisualRuns,
        DEFAULT_BASE_URL,
        "05/10/2026",
      );
      expect(report.projects.length).toBe(1);
      const visualProj = report.projects[0];
      expect(visualProj.projectId).toBe("tpbp-visual");
      expect(visualProj.isVisual).toBe(true);
      expect(visualProj.diffCount).toBe(4);
      expect(visualProj.total).toBe(20);
    });

    it("devrait prendre le run le plus récent d'un projet quand plusieurs sont présents", () => {
      const mockRuns: RunData[] = [
        {
          id: "CI Run - 200",
          project: "wse",
          date: "2026-10-05T15:00:00Z",
          environment: "staging",
          stats: {
            total: 10,
            expected: 10,
            unexpected: 0,
            skipped: 0,
            flaky: 0,
            duration: 100,
          },
          tests: [
            {
              title: "Test Recent",
              suite: "Suite",
              file: "tests/wse/recent.spec.ts",
              project: "wse",
              status: "passed",
              duration: 10,
              results: [],
            },
          ],
        },
        {
          id: "CI Run - 199",
          project: "wse",
          date: "2026-10-05T10:00:00Z",
          environment: "staging",
          stats: {
            total: 10,
            expected: 5,
            unexpected: 5,
            skipped: 0,
            flaky: 0,
            duration: 100,
          },
          tests: [
            {
              title: "Test Old",
              suite: "Suite",
              file: "tests/wse/old.spec.ts",
              project: "wse",
              status: "failed",
              duration: 10,
              results: [],
            },
          ],
        },
      ];

      const report = collectSlackReportData(
        mockRuns,
        [],
        DEFAULT_BASE_URL,
        "05/10/2026",
      );
      const wse = report.projects.find((p) => p.projectId === "wse");
      expect(wse).toBeDefined();
      expect(wse?.runId).toBe("CI Run - 200");
      expect(wse?.passed).toBe(1);
      expect(wse?.failed).toBe(0);
    });

    it("devrait filtrer uniquement les runs sur la branche main et ignorer les merge requests", () => {
      const mockRuns: RunData[] = [
        {
          id: "CI Run - 300",
          project: "wse",
          branch: "refs/merge-requests/999/merge",
          date: "2026-10-06T12:00:00Z",
          environment: "staging",
          stats: {
            total: 10,
            expected: 10,
            unexpected: 0,
            skipped: 0,
            flaky: 0,
            duration: 100,
          },
          tests: [
            {
              title: "Test MR",
              suite: "Suite",
              file: "tests/wse/mr.spec.ts",
              project: "wse",
              status: "passed",
              duration: 10,
              results: [],
            },
          ],
        },
        {
          id: "CI Run - 250",
          project: "wse",
          branch: "main",
          date: "2026-10-05T12:00:00Z",
          environment: "staging",
          stats: {
            total: 10,
            expected: 10,
            unexpected: 0,
            skipped: 0,
            flaky: 0,
            duration: 100,
          },
          tests: [
            {
              title: "Test Main",
              suite: "Suite",
              file: "tests/wse/main.spec.ts",
              project: "wse",
              status: "passed",
              duration: 10,
              results: [],
            },
          ],
        },
      ];

      const report = collectSlackReportData(
        mockRuns,
        [],
        DEFAULT_BASE_URL,
        "06/10/2026",
        "main",
      );
      const wse = report.projects.find((p) => p.projectId === "wse");
      expect(wse).toBeDefined();
      expect(wse?.runId).toBe("CI Run - 250");
    });
  });
});
