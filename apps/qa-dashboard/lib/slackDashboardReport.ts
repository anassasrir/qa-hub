import axios from "axios";
import { getAllRuns } from "./parseResults";
import { getAllVisualRuns, VisualRunData } from "./parseVisual";
import { RunData, TestData } from "./utils";

export interface ProjectReportStatus {
  projectId: string;
  projectLabel: string;
  envLabel: string;
  total: number;
  passed: number;
  failed: number;
  flaky: number;
  runId: string;
  isVisual?: boolean;
  isFullVisual?: boolean;
  diffCount?: number;
  successCount?: number;
  visualDiffCount?: number;
  visualFailedTestsCount?: number;
}

export interface AttentionPoint {
  projectId: string;
  projectLabel: string;
  ticket: string | null;
  title: string;
  cleanTitle: string;
  status: "failed" | "flaky";
  runId: string;
  detailsUrl: string;
}

export interface SlackReportData {
  date: string;
  projects: ProjectReportStatus[];
  attentionPoints: AttentionPoint[];
  dashboardUrl: string;
}

export const DEFAULT_SLACK_CHANNEL = "C8AEEGP60";
export const DEFAULT_BASE_URL = "https://qa.anatec.io";
export const DEFAULT_TARGET_BRANCH = "main";

export interface ProjectMetadata {
  label: string;
  env?: string;
  keywords?: string[];
  excludeKeywords?: string[];
  isVisual?: boolean;
}

export const KNOWN_PROJECTS: Record<string, ProjectMetadata> = {
  wse: {
    label: "WeSaveEpargne",
    env: "Staging",
    keywords: ["wse", "wesave", "savings"],
  },
  tpbp: {
    label: "TPBP",
    env: "Homologation",
    keywords: ["tpbp", "wealth", "lclmp"],
  },
  "tpbp-visual": {
    label: "TPBP",
    env: "Visual",
    keywords: ["visual-tests", "tpbp-visual", "visual"],
    isVisual: true,
  },
  b4b: {
    label: "B4Bank",
    env: "Staging",
    keywords: ["b4b", "b4bank"],
  },
  advisory: {
    label: "Advisory",
    env: "Dev",
    keywords: ["advisory", "wsc", "cabp", "vpl"],
  },
  tms: {
    label: "QA Dashboard",
    env: "Staging",
    keywords: ["apps/tms", "tms"],
  },
};

// Exporté pour compatibilité ascendante
export const PROJECT_CONFIGS = KNOWN_PROJECTS;

export function getProjectLabel(projectId: string): string {
  if (KNOWN_PROJECTS[projectId]?.label) {
    return KNOWN_PROJECTS[projectId].label;
  }
  return projectId
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function normalizeEnvironmentLabel(
  env?: string,
  projectId?: string,
): string {
  if (!env) {
    if (projectId?.startsWith("tpbp")) return "Homologation";
    return KNOWN_PROJECTS[projectId || ""]?.env || "Staging";
  }
  const lower = env.toLowerCase();
  if (lower.includes("homologation")) return "Homologation";
  if (lower.includes("dev")) return "Dev";
  if (lower.includes("prod")) return "Production";
  if (
    projectId?.startsWith("tpbp") &&
    (lower.includes("staging") || lower.includes("tpbp-visual"))
  ) {
    return "Homologation";
  }
  if (lower.includes("staging")) return "Staging";
  if (lower === "tpbp-visual" || lower === "visual") return "Visual";
  return env.charAt(0).toUpperCase() + env.slice(1);
}

/**
 * Extrait un ticket Jira (ex: TD-1492) ou une règle de gestion (ex: RG4, RG25) du titre.
 */
export function extractTicket(title: string): string | null {
  const match = title.match(/\b(TD-\d+|RG-?\d+)\b/i);
  return match ? match[1].toUpperCase() : null;
}

/**
 * Nettoie le titre d'un test pour Slack en retirant le préfixe du ticket s'il est répété
 * et en limitant la longueur pour un affichage lisible.
 */
export function sanitizeTestTitle(
  title: string,
  ticket: string | null,
  maxLength = 65,
): string {
  let cleaned = title.trim();

  if (ticket) {
    const ticketPrefixRegex = new RegExp(`^${ticket}\\s*[-:]\\s*`, "i");
    cleaned = cleaned.replace(ticketPrefixRegex, "").trim();
  }

  // Nettoyage des tags Playwright @...
  cleaned = cleaned
    .replace(/@[\w-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length > maxLength) {
    return `${cleaned.slice(0, maxLength - 3)}...`;
  }
  return cleaned;
}

/**
 * Construit l'URL profonde vers la page de détails d'un test dans TMS.
 * Conforme au format éprouvé du Dashboard :
 * https://qa.anatec.io/details/?project=${project}&id=${runId}&status=${status}&test=${testTitle}
 */
export function buildDetailsUrl(
  baseUrl: string,
  projectId: string,
  runId: string,
  status: "failed" | "flaky",
  testTitle: string,
): string {
  const normalizedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const params = new URLSearchParams({
    project: projectId,
    id: runId,
    status: status,
    test: testTitle,
  });
  return `${normalizedBase}details/?${params.toString()}`;
}

/**
 * Génère le texte formaté pour Slack selon la structure ultra-épurée demandée.
 */
export function formatSlackMessage(data: SlackReportData): string {
  const lines: string[] = [];

  // Titre épuré
  lines.push(`*Résultat tests — ${data.date}*`);

  for (const proj of data.projects) {
    if (proj.total === 0 && !proj.isVisual && !proj.isFullVisual) continue;

    let statusEmoji = "✅";

    // Cas 1 : Run full visual
    if (proj.isFullVisual || (proj.isVisual && !proj.visualDiffCount)) {
      const diffCount = proj.diffCount ?? proj.failed ?? 0;
      const totalSuffix = proj.total > 0 ? ` sur ${proj.total} tests` : "";
      if (diffCount > 0) {
        statusEmoji = "❌";
        lines.push(
          `${statusEmoji} *${proj.projectLabel} (${proj.envLabel}) :* ${diffCount} écart${diffCount > 1 ? "s" : ""} détecté${diffCount > 1 ? "s" : ""}${totalSuffix}`,
        );
      } else {
        statusEmoji = "✅";
        lines.push(
          `${statusEmoji} *${proj.projectLabel} (${proj.envLabel}) :* Aucun écart détecté${totalSuffix}`,
        );
      }
      continue;
    }

    const rate = Math.round((proj.passed / proj.total) * 100);

    // Cas 2 : Run mixte avec écarts visuels (ex: TPBP sur Homologation)
    if (proj.failed > 0 && proj.visualDiffCount && proj.visualDiffCount > 0) {
      statusEmoji = "❌";
      const visualFailed = proj.visualFailedTestsCount ?? proj.failed;
      const successCount = proj.successCount ?? (proj.passed - proj.flaky);
      lines.push(
        `${statusEmoji} *${proj.projectLabel} (${proj.envLabel}) :* ${proj.passed}/${proj.total} tests (${rate} %) - Succès ${successCount}, Instables ${proj.flaky}, Echecs ${proj.failed}; ${proj.visualDiffCount} écart${proj.visualDiffCount > 1 ? "s" : ""} visuel${proj.visualDiffCount > 1 ? "s" : ""} détecté${proj.visualDiffCount > 1 ? "s" : ""} dans les ${visualFailed} tests`,
      );
      continue;
    }

    // Cas 3 : Run avec échecs (sans écarts visuels, ex: WeSaveEpargne)
    if (proj.failed > 0) {
      statusEmoji = "❌";
      const parts: string[] = [];
      parts.push(`${proj.failed} échec${proj.failed > 1 ? "s" : ""}`);
      if (proj.flaky > 0) {
        parts.push(`${proj.flaky} instable${proj.flaky > 1 ? "s" : ""}`);
      }
      const detailSuffix = ` — ${parts.join(", ")}`;
      lines.push(
        `${statusEmoji} *${proj.projectLabel} (${proj.envLabel}) :* ${proj.passed}/${proj.total} tests (${rate} %)${detailSuffix}`,
      );
      continue;
    }

    // Cas 4 : Run sans échec
    statusEmoji = "✅";
    if (proj.flaky > 0) {
      const detailSuffix = ` — ${proj.flaky} instable${proj.flaky > 1 ? "s" : ""}`;
      lines.push(
        `${statusEmoji} *${proj.projectLabel} (${proj.envLabel}) :* ${proj.passed}/${proj.total} tests (${rate} %)${detailSuffix}`,
      );
    } else {
      lines.push(
        `${statusEmoji} *${proj.projectLabel} (${proj.envLabel}) :* ${proj.total}/${proj.total} tests (100 %)`,
      );
    }
  }

  // Séparateur et lien vers le dashboard complet
  lines.push("");
  lines.push("");
  lines.push(`<${data.dashboardUrl}|Accéder au tableau de bord complet>`);

  return lines.join("\n");
}

export interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
}

export interface SlackPayload {
  text: string;
  username: string;
  icon_url: string;
  blocks: SlackBlock[];
  channel?: string;
}

/**
 * Construit le payload Block Kit Slack.
 * Note : les Incoming Webhooks modernes publient directement dans le canal ou le DM
 * configuré lors de l'installation du webhook dans Slack.
 */
export function buildSlackPayload(text: string, channel?: string): SlackPayload {
  const payload: SlackPayload = {
    text,
    username: "TMS QA Reporter",
    icon_url: "https://qa.anatec.io/bot-icon.png",
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text,
        },
      },
    ],
  };

  if (channel) {
    payload.channel = channel;
  }

  return payload;
}

/**
 * Récupère les données consolidées du dernier run pour chaque projet et prépare le rapport.
 * Découvre dynamiquement les projets disponibles dans les rapports (runs et visual-runs).
 */
export function collectSlackReportData(
  runs: RunData[],
  visualRuns: VisualRunData[] = [],
  baseUrl: string = DEFAULT_BASE_URL,
  customDate?: string,
  targetBranch: string = process.env.SLACK_TARGET_BRANCH || DEFAULT_TARGET_BRANCH,
): SlackReportData {
  const dateFormatted =
    customDate ||
    new Intl.DateTimeFormat("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      timeZone: "Europe/Paris",
    }).format(new Date());

  const projects: ProjectReportStatus[] = [];
  const attentionPoints: AttentionPoint[] = [];

  // Privilégier les vrais runs de pipeline (CI) s'ils sont présents dans les rapports
  const hasCiRuns = runs.some((r) => r.id?.startsWith("CI Run -"));
  let pipelineRuns = hasCiRuns
    ? runs.filter((r) => r.id?.startsWith("CI Run -"))
    : runs;

  // Filtrer uniquement sur la branche cible (ex: 'main')
  if (targetBranch) {
    pipelineRuns = pipelineRuns.filter(
      (r) => !r.branch || r.branch === targetBranch,
    );
  }

  // Filtrer les runs visuels sur la branche cible si spécifié
  let filteredVisualRuns = visualRuns;
  if (targetBranch) {
    filteredVisualRuns = visualRuns.filter(
      (vr) => !vr.branch || vr.branch === targetBranch,
    );
  }

  // 1. Découverte dynamique de tous les projets disponibles dans les rapports
  const discoveredProjectIds = new Set<string>();

  for (const r of pipelineRuns) {
    if (r.project && r.project !== "chrome" && r.project !== "N/A") {
      discoveredProjectIds.add(r.project);
    }
  }

  for (const [knownId, meta] of Object.entries(KNOWN_PROJECTS)) {
    if (discoveredProjectIds.has(knownId)) continue;
    if (meta.isVisual) continue;
    const hasMatchingTest = pipelineRuns.some((r) =>
      (r.tests || []).some((t) => {
        const f = (t.file || "").toLowerCase();
        return (
          meta.keywords?.some((kw) => f.includes(kw)) &&
          !meta.excludeKeywords?.some((ekw) => f.includes(ekw))
        );
      }),
    );
    if (hasMatchingTest) {
      discoveredProjectIds.add(knownId);
    }
  }

  // Découverte des projets visuels autonomes (seulement s'ils ne sont pas déjà couverts par les pipelineRuns)
  for (const vr of filteredVisualRuns) {
    if (vr.project) {
      const alreadyHandledInPipelines = pipelineRuns.some(
        (r) =>
          r.id.includes(vr.pipelineId) &&
          (r.tests || []).some(
            (t) => !(t.file || "").toLowerCase().includes("visual"),
          ),
      );
      if (!alreadyHandledInPipelines && !discoveredProjectIds.has(vr.project)) {
        discoveredProjectIds.add(
          vr.project.includes("visual") ? vr.project : `${vr.project}-visual`,
        );
      }
    }
  }

  // 2. Récupération du dernier run pour chaque projet découvert
  for (const projectId of discoveredProjectIds) {
    const isExplicitVisualProject =
      projectId.includes("visual") || Boolean(KNOWN_PROJECTS[projectId]?.isVisual);
    const baseProjectId = projectId.replace(/-visual$/, "");

    // Éviter les doublons si le projet de base ou son équivalent visuel est déjà présent
    if (
      projects.some(
        (p) =>
          p.projectId === projectId ||
          p.projectId === baseProjectId ||
          p.projectId.replace(/-visual$/, "") === baseProjectId,
      )
    ) {
      continue;
    }

    const meta = KNOWN_PROJECTS[projectId] || KNOWN_PROJECTS[baseProjectId];
    const keywords = meta?.keywords || [baseProjectId];
    const excludeKeywords = meta?.excludeKeywords || [];

    // Recherche d'abord dans pipelineRuns
    let latestProjectRun: RunData | null = null;
    let filteredTests: TestData[] = [];

    for (const run of pipelineRuns) {
      const tests = (run.tests || []).filter((t) => {
        if (run.project && (run.project === projectId || run.project === baseProjectId)) {
          return !excludeKeywords.some((ekw) =>
            (t.file || "").toLowerCase().includes(ekw),
          );
        }
        const f = (t.file || "").toLowerCase();
        return (
          keywords.some((kw) => f.includes(kw)) &&
          !excludeKeywords.some((ekw) => f.includes(ekw))
        );
      });

      if (tests.length > 0) {
        latestProjectRun = run;
        filteredTests = tests;
        break;
      }
    }

    // Si aucun run dans pipelineRuns, vérifier s'il existe dans visualRuns (run full visual autonome)
    if (!latestProjectRun || filteredTests.length === 0) {
      const projectVisuals = filteredVisualRuns.filter(
        (vr) =>
          (vr.project || "tpbp-visual") === projectId ||
          (vr.project || "tpbp") === baseProjectId,
      );
      if (projectVisuals.length > 0) {
        const latestVisual = projectVisuals[0];
        const total =
          latestVisual.stats?.total || latestVisual.items?.length || 0;
        const diffCount =
          latestVisual.stats?.failed ??
          latestVisual.items?.filter((i) => i.testStatus !== "passed").length ??
          0;
        const passed = Math.max(0, total - diffCount);
        const envLabel = normalizeEnvironmentLabel(
          latestVisual.environment || "Visual",
          projectId,
        );

        projects.push({
          projectId,
          projectLabel: getProjectLabel(baseProjectId),
          envLabel,
          total,
          passed,
          failed: diffCount,
          flaky: 0,
          runId: latestVisual.pipelineId || "visual",
          isVisual: true,
          isFullVisual: true,
          diffCount,
          visualDiffCount: diffCount,
        });

        // Extraire les diffs visuels pour les points d'attention
        if (diffCount > 0 && latestVisual.items) {
          const seenVisualTitles = new Set<string>();
          latestVisual.items
            .filter((item) => item.testStatus !== "passed")
            .forEach((item) => {
              const rawTitle = item.specTitle || item.file;
              if (seenVisualTitles.has(rawTitle) || seenVisualTitles.size >= 3)
                return;
              seenVisualTitles.add(rawTitle);

              const ticket = extractTicket(rawTitle);
              const clean = sanitizeTestTitle(rawTitle, ticket);
              const detailsUrl = buildDetailsUrl(
                baseUrl,
                projectId,
                latestVisual.pipelineId || "visual",
                "failed",
                rawTitle,
              );
              attentionPoints.push({
                projectId,
                projectLabel: getProjectLabel(baseProjectId),
                ticket,
                title: rawTitle,
                cleanTitle: clean,
                status: "failed",
                runId: latestVisual.pipelineId || "visual",
                detailsUrl,
              });
            });
        }
      }
      continue;
    }

    // Le projet a des tests dans pipelineRuns
    const isAllVisualTests =
      filteredTests.length > 0 &&
      filteredTests.every((t) => (t.file || "").toLowerCase().includes("visual"));
    const isFullVisual = isExplicitVisualProject || isAllVisualTests;

    const failed = filteredTests.filter(
      (t) => t.status === "failed" || t.status === "unexpected",
    ).length;
    const flaky = filteredTests.filter((t) => t.status === "flaky").length;
    const successCount = filteredTests.filter(
      (t) => t.status === "passed" || t.status === "expected",
    ).length;
    const passed = successCount + flaky;
    const total = filteredTests.length;

    // Chercher si un run visuel correspond à la même pipeline
    const pipelineId = latestProjectRun.id
      .replace(/^CI\s*Run\s*-\s*/i, "")
      .replace(/^CI-/i, "")
      .trim();

    const matchingVisual = (filteredVisualRuns || visualRuns).find(
      (vr) => vr.pipelineId === pipelineId || vr.jobId === pipelineId,
    );

    const visualFailedTests = filteredTests.filter(
      (t) =>
        (t.status === "failed" || t.status === "unexpected") &&
        (t.file || "").toLowerCase().includes("visual"),
    ).length;

    let visualDiffCount = 0;
    if (matchingVisual) {
      visualDiffCount =
        matchingVisual.stats?.total || matchingVisual.items?.length || 0;
    } else if (isFullVisual) {
      visualDiffCount = failed;
    } else if (visualFailedTests > 0) {
      visualDiffCount = visualFailedTests;
    }

    const diffCount = isFullVisual
      ? visualDiffCount
      : visualDiffCount > 0
        ? visualDiffCount
        : undefined;

    const envLabel = normalizeEnvironmentLabel(
      isFullVisual ? "Visual" : latestProjectRun.environment,
      projectId,
    );

    projects.push({
      projectId,
      projectLabel: getProjectLabel(baseProjectId),
      envLabel,
      total,
      passed,
      failed,
      flaky,
      runId: latestProjectRun.id,
      isVisual: isFullVisual,
      isFullVisual,
      diffCount,
      successCount,
      visualDiffCount:
        !isFullVisual && visualDiffCount > 0 ? visualDiffCount : undefined,
      visualFailedTestsCount:
        !isFullVisual && visualFailedTests > 0
          ? visualFailedTests
          : undefined,
    });

    const seenProjectTitles = new Set<string>();

    // Points d'attention pour les échecs (max 3 par projet)
    const failedTests = filteredTests.filter(
      (t) => t.status === "failed" || t.status === "unexpected",
    );
    for (const test of failedTests) {
      if (seenProjectTitles.has(test.title) || seenProjectTitles.size >= 3)
        continue;
      seenProjectTitles.add(test.title);

      const ticket = extractTicket(test.title);
      const clean = sanitizeTestTitle(test.title, ticket);
      const detailsUrl = buildDetailsUrl(
        baseUrl,
        projectId,
        latestProjectRun.id,
        "failed",
        test.title,
      );
      attentionPoints.push({
        projectId,
        projectLabel: getProjectLabel(projectId),
        ticket,
        title: test.title,
        cleanTitle: clean,
        status: "failed",
        runId: latestProjectRun.id,
        detailsUrl,
      });
    }

    // Points d'attention pour les flaky (max 2 par projet)
    let addedFlakyCount = 0;
    const flakyTests = filteredTests.filter((t) => t.status === "flaky");
    for (const test of flakyTests) {
      if (seenProjectTitles.has(test.title) || addedFlakyCount >= 2) continue;
      seenProjectTitles.add(test.title);
      addedFlakyCount++;

      const ticket = extractTicket(test.title);
      const clean = sanitizeTestTitle(test.title, ticket);
      const detailsUrl = buildDetailsUrl(
        baseUrl,
        projectId,
        latestProjectRun.id,
        "flaky",
        test.title,
      );
      attentionPoints.push({
        projectId,
        projectLabel: getProjectLabel(projectId),
        ticket,
        title: test.title,
        cleanTitle: clean,
        status: "flaky",
        runId: latestProjectRun.id,
        detailsUrl,
      });
    }
  }

  // 3. Tri préférentiel des projets
  const preferredOrder = [
    "wse",
    "tpbp",
    "tpbp-visual",
    "b4b",
    "advisory",
    "tms",
  ];

  projects.sort((a, b) => {
    const idxA = preferredOrder.indexOf(a.projectId);
    const idxB = preferredOrder.indexOf(b.projectId);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.projectId.localeCompare(b.projectId);
  });

  const normalizedDashboardUrl = `${baseUrl.replace(/\/+$/, "")}/dashboard/`;

  return {
    date: dateFormatted,
    projects,
    attentionPoints,
    dashboardUrl: normalizedDashboardUrl,
  };
}

/**
 * Envoie la notification Slack vers le webhook configuré.
 */
export async function sendSlackReport(options?: {
  webhookUrl?: string;
  channel?: string;
  baseUrl?: string;
  targetBranch?: string;
  dryRun?: boolean;
}): Promise<{ success: boolean; message: string; payload: SlackPayload }> {
  const webhookUrl = options?.webhookUrl || process.env.SLACK_WEBHOOK_URL;
  const channel =
    options?.channel || process.env.SLACK_CHANNEL || DEFAULT_SLACK_CHANNEL;
  const baseUrl =
    options?.baseUrl || process.env.TMS_BASE_URL || DEFAULT_BASE_URL;
  const targetBranch =
    options?.targetBranch ||
    process.env.SLACK_TARGET_BRANCH ||
    DEFAULT_TARGET_BRANCH;
  const isDryRun =
    options?.dryRun ?? (process.argv.includes("--dry-run") || !webhookUrl);

  let runs = getAllRuns();
  let visualRuns = getAllVisualRuns();

  const hasCiRuns = runs.some((r) => r.id?.startsWith("CI Run -"));
  if (!hasCiRuns && process.env.GITLAB_TOKEN) {
    console.log(
      "ℹ️ Aucun run CI trouvé localement. Synchronisation automatique depuis GitLab...",
    );
    try {
      const { syncGitlab } = await import("./syncGitlab");
      await syncGitlab();
      runs = getAllRuns();
      visualRuns = getAllVisualRuns();
    } catch (e: unknown) {
      const err = e as Error;
      console.warn(
        "⚠️ Synchronisation automatique depuis GitLab ignorée :",
        err.message,
      );
    }
  }

  const reportData = collectSlackReportData(
    runs,
    visualRuns,
    baseUrl,
    undefined,
    targetBranch,
  );
  const textMessage = formatSlackMessage(reportData);
  const targetChannel = options?.channel || process.env.SLACK_CHANNEL;
  const payload = buildSlackPayload(textMessage, targetChannel);

  if (isDryRun) {
    console.log("=== [SLACK REPORT - DRY RUN] ===");
    console.log(textMessage);
    console.log("================================");
    return { success: true, message: textMessage, payload };
  }

  if (!webhookUrl) {
    throw new Error(
      "Variable d'environnement SLACK_WEBHOOK_URL manquante. Veuillez la configurer dans Infisical ou passer --dry-run pour prévisualiser.",
    );
  }

  try {
    const response = await axios.post(webhookUrl!, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });
    console.log(
      `✅ Notification Slack envoyée avec succès sur ${channel} (Status: ${response.status})`,
    );
    return { success: true, message: textMessage, payload };
  } catch (error: unknown) {
    const err = error as Error;
    console.error(
      "❌ Erreur lors de l'envoi de la notification Slack :",
      err.message,
    );
    throw error;
  }
}
