"use client";

import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Wand2,
  Lock,
  Eye,
  EyeOff,
  FileCode,
  ExternalLink,
  MessageSquare,
  PlayCircle,
  Copy,
  Check,
  Zap,
  Send,
} from "lucide-react";

// Dictionnaire universel des correspondances sémantiques pour le Page Object Model (POM) WeSave / TPBP
const POM_METHOD_MAPPINGS: {
  [key: string]: string | ((args: string) => string);
} = {
  enableinhurry: 'j\'active le mode "In a Hurry"',
  disableinhurry: 'je désactive le mode "In a Hurry"',
  openoperationssimplemenu: "j'ouvre le menu des opérations simples",
  selectnouvellesouscription: 'je sélectionne "Nouvelle souscription"',
  selectoperation: 'je sélectionne "Effectuer une opération"',
  validate: "je valide",
  validateinformation: "je valide les informations",
  validatedepositaccount: "je valide le compte de dépôt",
  gotosituation: "je vais sur la page Situation",
  gotoupdatesituation:
    "je vais sur le formulaire d'actualisation de ma situation",
  gotopatrimony: "je vais sur la page Patrimoine",
  gotoupdatepatrimony:
    "je vais sur le formulaire d'actualisation de mon patrimoine",
  gotobudget: "je vais sur la page Budget",
  gotoupdatebudget: "je vais sur le formulaire d'actualisation de mon budget",
  gototransmisssion: "je vais sur la page Transmission",
  continue: 'je clique sur "Continuer"',
  setneutrepreferences:
    'je définis les préférences SFDR et Taxonomie sur "Neutre"',
  handlesessionmodal: "je valide le message de session",
  waitforreportloaded: "j'attends le chargement du rapport",

  // Méthodes dynamiques acceptant des arguments
  addfund: (args) => `j'ajoute le fonds ${args}`,
  fillinitialdeposit: (args) =>
    `je saisis un versement initial de ${args} euros`,
  fillmonthlydeposit: (args) =>
    `je saisis un versement programmé de ${args} euros`,
  fillcomplementaryinvestment: (args) =>
    `je saisis un versement complémentaire de ${args} euros`,
  fillinitialinvestment: (args) =>
    `je saisis un versement initial de ${args} euros`,
  fillprogrammedinvestment: (args) =>
    `je saisis un versement programmé de ${args} euros`,
  verifymetric: (args) => {
    const parts = args.split(",").map((p) => p.trim());
    return `je vérifie que la métrique ${parts[0] || ""} vaut ${parts[1] || ""}`;
  },
  verifyprojectamounts: (args) => {
    const parts = args.split(",").map((p) => p.trim());
    return `je vérifie que les montants du projet sont de ${parts[0] || ""} euros et ${parts[1] || ""} euros`;
  },
};

// Traducteur local Playwright -> Gherkin (FR) basé sur le dictionnaire de mapping universel
function translatePlaywrightToGherkin(code: string): string {
  const lines = code.split("\n");
  const gherkinLines: string[] = [];

  let featureName = "Fonctionnalité de test";
  let scenarioName = "Validation du parcours utilisateur";

  // Essayer d'extraire le nom de la feature ou du scénario à partir de test.describe ou test()
  const describeMatch = code.match(/test\.describe\((['"`])(.*?)\1/);
  if (describeMatch) featureName = describeMatch[2];

  const testMatch = code.match(/test\((['"`])(.*?)\1/);
  if (testMatch) scenarioName = testMatch[2];

  gherkinLines.push(`# language: fr`);
  gherkinLines.push(
    `# URL de départ : https://tpbp-dev.conseil.wesave.fr/#/synthese`,
  );
  gherkinLines.push(`@tpbp @visual @regression @flags:inHurry,designSystem`);
  gherkinLines.push(`Fonctionnalité: ${featureName}\n`);
  gherkinLines.push(`  Contexte:`);
  gherkinLines.push(
    `    Étant donné que je suis connecté en tant que "conseiller" avec l'identifiant "study-434624-8531350736.0@bankcare.io"`,
  );
  gherkinLines.push(
    `    Et que les feature flags activés sont "inHurry, isDesignSystemEnabled"`,
  );
  gherkinLines.push(`    Et que je suis sur la page "/synthese"\n`);
  gherkinLines.push(`  Scénario: ${scenarioName}`);

  let stepCount = 0;
  let hasAssertionBeenRendered = false; // Permet de chainer avec 'Et' au lieu de répéter 'Alors'

  // Dictionnaire de variables locators pour résoudre les variables intermédiaires locales
  const variableLocators: { [key: string]: string } = {};

  for (let line of lines) {
    line = line.trim();
    if (
      !line ||
      line.startsWith("//") ||
      line.startsWith("/*") ||
      line.startsWith("*") ||
      line.startsWith("import ") ||
      line.startsWith("test.beforeEach")
    ) {
      continue;
    }

    // --- EXCLUSION DES ATTENTES TECHNIQUES (WAIT) ---
    if (
      line.includes("waitForLoadState") ||
      line.includes("waitForTimeout") ||
      line.includes(".waitFor(")
    ) {
      continue;
    }

    // Extraction de l'élément cible (優先 : getByRole name, getByLabel, etc.)
    let target = "l'élément";
    const getByRoleMatch = line.match(
      /getByRole\(\s*(['"`])(.*?)\1\s*,\s*\{\s*name:\s*(['"\/])(.*?)\3/i,
    );
    const getByTextMatch = line.match(/getByText\(\s*(['"`])(.*?)\1/i);
    const getByLabelMatch = line.match(/getByLabel\(\s*(['"`])(.*?)\1/i);
    const getByPlaceholderMatch = line.match(
      /getByPlaceholder\(\s*(['"`])(.*?)\1/i,
    );
    const locatorMatch = line.match(/locator\(\s*(['"`])(.*?)\1/i);

    if (getByRoleMatch) {
      const cleanName = getByRoleMatch[4].replace(/[\/\^$]/g, "").trim();
      target = `le bouton "${cleanName}"`;
    } else if (getByTextMatch) {
      target = `le texte "${getByTextMatch[2]}"`;
    } else if (getByLabelMatch) {
      target = `le champ "${getByLabelMatch[2]}"`;
    } else if (getByPlaceholderMatch) {
      target = `le champ "${getByPlaceholderMatch[2]}"`;
    } else if (locatorMatch) {
      const cleanLocator = locatorMatch[2].replace(/[.#]/g, "").trim();
      target = `l'élément "${cleanLocator}"`;
    }

    // --- ENREGISTREMENT ET RÉSOLUTION DES VARIABLES LOCATORS ---
    const varDeclMatch = line.match(
      /(?:const|let|var)\s+([a-zA-Z0-9_]+)\s*=\s*(.*?)$/,
    );
    if (varDeclMatch) {
      const varName = varDeclMatch[1];
      if (target !== "l'élément") {
        variableLocators[varName] = target;
      } else {
        // Fallback propre : nom de la variable reformaté
        const cleanVarName = varName
          .replace(/([A-Z])/g, " $1")
          .toLowerCase()
          .trim();
        variableLocators[varName] = `l'élément "${cleanVarName}"`;
      }
      // Les déclarations de variables ne produisent pas directement de step Gherkin
      continue;
    }

    // Résoudre la variable si elle est appelée dans une méthode d'action
    const varMethodMatch = line.match(
      /await\s+([a-zA-Z0-9_]+)\.(click|fill|selectOption|check|uncheck|hover|waitFor)\(/i,
    );
    if (varMethodMatch) {
      const varName = varMethodMatch[1];
      if (variableLocators[varName]) {
        target = variableLocators[varName];
      }
    }

    const firstWord = stepCount === 0 ? "Quand" : "Et que";
    const firstActionWord = stepCount === 0 ? "Quand" : "Et que";

    // 1. Navigation
    const gotoMatch = line.match(/page\.goto\((['"`])(.*?)\1\)/);
    if (gotoMatch) {
      gherkinLines.push(
        `    ${firstWord} je navigue vers l'adresse "${gotoMatch[2]}"`,
      );
      stepCount++;
      hasAssertionBeenRendered = false;
      continue;
    }

    // 2. Click direct ou via variable
    if (line.includes(".click()")) {
      gherkinLines.push(`    ${firstActionWord} je clique sur ${target}`);
      stepCount++;
      hasAssertionBeenRendered = false;
      continue;
    }

    // 3. Saisie (Fill) direct ou via variable
    const fillMatch = line.match(/\.fill\((['"`])(.*?)\1\)/);
    if (fillMatch) {
      gherkinLines.push(
        `    ${firstActionWord} je saisis "${fillMatch[2]}" dans ${target}`,
      );
      stepCount++;
      hasAssertionBeenRendered = false;
      continue;
    }

    // 4. Sélection (SelectOption)
    const selectMatch = line.match(/\.selectOption\((['"`])(.*?)\1\)/);
    if (selectMatch) {
      gherkinLines.push(
        `    ${firstActionWord} je sélectionne l'option "${selectMatch[2]}" dans ${target}`,
      );
      stepCount++;
      hasAssertionBeenRendered = false;
      continue;
    }

    // 5. Coche de case (Check)
    if (line.includes(".check()") || line.includes(".setChecked(true)")) {
      gherkinLines.push(`    ${firstActionWord} je coche ${target}`);
      stepCount++;
      hasAssertionBeenRendered = false;
      continue;
    }
    if (line.includes(".uncheck()") || line.includes(".setChecked(false)")) {
      gherkinLines.push(`    ${firstActionWord} je décoche ${target}`);
      stepCount++;
      hasAssertionBeenRendered = false;
      continue;
    }

    // 6. Survol (Hover)
    if (line.includes(".hover()")) {
      gherkinLines.push(`    ${firstActionWord} je survole ${target}`);
      stepCount++;
      hasAssertionBeenRendered = false;
      continue;
    }

    // 7. Prise en charge intelligente du Page Object Model (POM)
    // Ex: await dashboardPage.goToUpdateSituation(); ou await summaryPage.verifyMetric(...)
    const pomMatch = line.match(
      /await\s+([a-zA-Z0-9]+Page|[a-zA-Z0-9]+)\.([a-zA-Z0-9_]+)\((.*?)\)/i,
    );
    if (
      pomMatch &&
      !line.includes("expect(") &&
      !line.includes(".click(") &&
      !line.includes(".fill(")
    ) {
      const methodName = pomMatch[2];
      const args = pomMatch[3];

      const lowerMethod = methodName.toLowerCase();
      let translation = "";

      if (POM_METHOD_MAPPINGS[lowerMethod]) {
        const mapping = POM_METHOD_MAPPINGS[lowerMethod];
        if (typeof mapping === "function") {
          translation = mapping(args);
        } else {
          translation = mapping;
        }
      } else {
        // Fallback si méthode de POM inconnue : traduire CamelCase
        const cleanMethod = methodName
          .replace(/([A-Z])/g, " $1")
          .toLowerCase()
          .trim();
        translation = `je réalise l'action : "${cleanMethod}${args ? " avec " + args : ""}"`;
      }

      const isAssertionPOM =
        lowerMethod.startsWith("verify") || lowerMethod.startsWith("expect");
      const currentWord = isAssertionPOM
        ? !hasAssertionBeenRendered
          ? "Alors"
          : "Et"
        : firstActionWord;

      if (isAssertionPOM) hasAssertionBeenRendered = true;
      else hasAssertionBeenRendered = false;

      gherkinLines.push(`    ${currentWord} ${translation}`);
      stepCount++;
      continue;
    }

    const assertionWord = !hasAssertionBeenRendered ? "Alors" : "Et";

    // --- ASSERTIONS STANDARDS ---
    // expectURL
    const urlMatch = line.match(/toHaveURL\((['"\/])(.*?)\1\)/);
    if (urlMatch) {
      const cleanUrl = urlMatch[2]
        .replace(/[\/\^$]/g, "")
        .replace(/\\\\/g, "/");
      gherkinLines.push(
        `    ${assertionWord} je suis redirigé vers "/${cleanUrl}"`,
      );
      stepCount++;
      hasAssertionBeenRendered = true;
      continue;
    }

    // toHaveScreenshot
    const screenshotMatch = line.match(/toHaveScreenshot\((.*?)\)/);
    if (screenshotMatch) {
      const content = screenshotMatch[1];
      const nameMatch = content.match(/['"](.*?)['"]/g);
      let name = "ecran-visuel";
      if (nameMatch && nameMatch.length > 0) {
        const lastPart = nameMatch[nameMatch.length - 1].replace(/['"]/g, "");
        name = lastPart.replace(/\.png$/, "");
      }
      gherkinLines.push(
        `    ${assertionWord} l'écran correspond au snapshot visuel "${name}"`,
      );
      stepCount++;
      hasAssertionBeenRendered = true;
      continue;
    }

    // toBeVisible
    if (line.includes("toBeVisible()")) {
      gherkinLines.push(`    ${assertionWord} ${target} est visible`);
      stepCount++;
      hasAssertionBeenRendered = true;
      continue;
    }
    // toBeHidden
    if (line.includes("toBeHidden()")) {
      gherkinLines.push(`    ${assertionWord} ${target} est masqué`);
      stepCount++;
      hasAssertionBeenRendered = true;
      continue;
    }
    // toBeEnabled
    if (line.includes("toBeEnabled()")) {
      gherkinLines.push(`    ${assertionWord} ${target} est activé`);
      stepCount++;
      hasAssertionBeenRendered = true;
      continue;
    }
    // toBeDisabled
    if (line.includes("toBeDisabled()")) {
      gherkinLines.push(`    ${assertionWord} ${target} est désactivé`);
      stepCount++;
      hasAssertionBeenRendered = true;
      continue;
    }
  }

  // Si aucun step n'a pu être traduit, renvoyer une erreur explicative
  if (stepCount === 0) {
    return `# language: fr\n# Erreur : Le texte saisi n'a pas pu être analysé comme du code Playwright valide.\n# Veuillez coller du code contenant par exemple page.goto(), locator.click(), ou expect().`;
  }

  return gherkinLines.join("\n");
}

// Colorateur syntaxique local et réactif pour le Gherkin / .feature
function highlightGherkin(text: string): React.ReactNode {
  const lines = text.split("\n");
  return (
    <div className="space-y-1 select-text">
      {lines.map((line, index) => {
        const trimmed = line.trim();

        // 1. Commentaires
        if (trimmed.startsWith("#")) {
          return (
            <div
              key={index}
              className="text-slate-500 font-normal italic whitespace-pre-wrap"
            >
              {line}
            </div>
          );
        }

        // 2. Tags (@tpbp, @visual, etc.)
        if (trimmed.startsWith("@")) {
          return (
            <div
              key={index}
              className="text-purple-400 font-bold tracking-wide whitespace-pre-wrap"
            >
              {line}
            </div>
          );
        }

        // Coloration des chaînes entre guillemets/apostrophes (ex: "valeur")
        const highlightQuotes = (str: string) => {
          const parts = str.split(/(".*?"|'.*?')/g);
          return parts.map((part, i) => {
            if (part.startsWith('"') || part.startsWith("'")) {
              return (
                <span
                  key={i}
                  className="text-yellow-200 font-bold bg-yellow-400/5 px-1 rounded border border-yellow-400/10 whitespace-pre"
                >
                  {part}
                </span>
              );
            }
            return (
              <span key={i} className="whitespace-pre">
                {part}
              </span>
            );
          });
        };

        // 3. Titre de la Fonctionnalité (Feature)
        if (
          trimmed.startsWith("Fonctionnalité:") ||
          trimmed.startsWith("Feature:")
        ) {
          const match = line.match(/^(\s*)(Fonctionnalité:|Feature:)(.*)$/);
          if (match) {
            return (
              <div
                key={index}
                className="text-rose-400 font-extrabold mt-2 whitespace-pre-wrap"
              >
                {match[1]}
                <span className="underline">{match[2]}</span>
                <span className="text-slate-100 font-bold">
                  {highlightQuotes(match[3])}
                </span>
              </div>
            );
          }
        }

        // 4. Scénario ou Contexte
        if (
          trimmed.startsWith("Scénario:") ||
          trimmed.startsWith("Scenario:") ||
          trimmed.startsWith("Contexte:") ||
          trimmed.startsWith("Background:")
        ) {
          const match = line.match(
            /^(\s*)(Scénario:|Scenario:|Contexte:|Background:)(.*)$/,
          );
          if (match) {
            return (
              <div
                key={index}
                className="text-sky-400 font-bold mt-4 whitespace-pre-wrap"
              >
                {match[1]}
                <span className="text-sky-400">{match[2]}</span>
                <span className="text-slate-100">
                  {highlightQuotes(match[3])}
                </span>
              </div>
            );
          }
        }

        // 5. Étapes Gherkin (Étant donné, Quand, Alors, Et, Donc)
        const stepPrefixes = [
          "Étant donné que",
          "Étant donné",
          "Et que",
          "Quand",
          "Alors",
          "Et",
          "Donc",
        ];

        for (const prefix of stepPrefixes) {
          if (trimmed.startsWith(prefix + " ")) {
            const rest = trimmed.substring(prefix.length);
            const leadingSpaces = line.substring(0, line.indexOf(trimmed));
            return (
              <div
                key={index}
                className="text-slate-300 leading-relaxed font-semibold whitespace-pre-wrap"
              >
                {leadingSpaces}
                <span className="text-emerald-400 font-extrabold">
                  {prefix}
                </span>
                <span className="text-slate-300">{highlightQuotes(rest)}</span>
              </div>
            );
          }
        }

        // Ligne classique par défaut
        return (
          <div key={index} className="text-slate-300 whitespace-pre-wrap">
            {line}
          </div>
        );
      })}
    </div>
  );
}

export default function GeneratorClient() {
  // Option active : "gemini-gem" (Option A), "ai" (Option B), "offline" (Option C)
  const [option, setOption] = useState<"offline" | "ai" | "gemini-gem">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("tms_generator_option");
      if (saved === "offline" || saved === "ai" || saved === "gemini-gem") {
        return saved;
      }
    }
    return "gemini-gem";
  });

  // --- États pour l'Option A (Assistant Hors-ligne) ---
  const [offlineInput, setOfflineInput] = useState("");

  // Génération Gherkin interactive locale si ce n'est pas du code
  const offlineResult = useMemo(() => {
    if (!offlineInput.trim()) return "";

    // Détecter si le texte ressemble à du code Playwright
    const hasCodeKeywords =
      offlineInput.includes("page.") ||
      offlineInput.includes("expect(") ||
      offlineInput.includes("await ");

    if (hasCodeKeywords) {
      return translatePlaywrightToGherkin(offlineInput);
    }

    // Sinon, générer un scénario nominal basé sur la description en respectant scrupuleusement les consignes @po-assistant
    const words = offlineInput.split(" ");
    const featureTitle =
      words.slice(0, 5).join(" ") + (words.length > 5 ? "..." : "");

    return `# language: fr
# URL de départ : https://tpbp-dev.conseil.wesave.fr/#/synthese
@tpbp @souscription @visual @flags:inHurry,designSystem
Fonctionnalité: ${featureTitle}

  Contexte:
    Étant donné que je suis connecté en tant que "conseiller" avec l'identifiant "study-434624-8531350736.0@bankcare.io"
    Et que les feature flags activés sont "inHurry, isDesignSystemEnabled"
    Et que je suis sur la page "/synthese"

  Scénario: Validation fonctionnelle de l'actualisation
    Quand je réalise l'action : "${offlineInput.trim()}"
    Alors l'écran correspond au snapshot visuel "ecran-synthese"
    Et le composant "Orientation" correspond au snapshot visuel "synthese-orientations"`;
  }, [offlineInput]);

  // --- États pour l'Option B (Assistant IA) ---
  const [aiDescription, setAiDescription] = useState("");
  const [aiResult, setAiResult] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  // Clé API Google Gemini stockée de manière sécurisée EN MÉMOIRE
  const [apiKey, setApiKey] = useState("");
  const [apiModel, setApiModel] = useState(() => {
    if (typeof window !== "undefined") {
      return (
        localStorage.getItem("tms_generator_model") ||
        "gemini-3.1-pro-preview"
      );
    }
    return "gemini-3.1-pro-preview";
  });
  const [showKey, setShowKey] = useState(false);

  const [copied, setCopied] = useState(false);

  const handleOptionChange = (newOption: "offline" | "ai" | "gemini-gem") => {
    localStorage.setItem("tms_generator_option", newOption);
    setOption(newOption);
  };

  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
  };

  const saveApiModelLocal = (modelName: string) => {
    localStorage.setItem("tms_generator_model", modelName);
    setApiModel(modelName);
  };

  const handleClearApiKey = () => {
    setApiKey("");
  };

  // --- Logique de l'Assistant IA (Option B) ---
  const handleGenerateAI = async () => {
    if (!aiDescription.trim() || !apiKey.trim()) return;
    setAiLoading(true);
    setAiResult("");

    try {
      let gherkinResult = "";
      try {
        const response = await fetch("/api/generate-gherkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: aiDescription,
            project: "all",
            apiKey: apiKey,
            model: apiModel,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          gherkinResult = data.gherkin;
        } else {
          // Si l'API retourne un code d'erreur, on lève une exception pour déclencher le fallback direct
          throw new Error("Next.js API route not successful");
        }
      } catch {
        console.warn("Local API route failed or not deployed (Static Export). Falling back to direct client-side Gemini API call...");
        
        const systemPrompt = `Vous êtes l'agent 'po-assistant', expert en analyse métier, méthodologie BDD et tests automatisés (Playwright). Votre rôle est de cadrer les besoins des Product Owners (PO) pour concevoir des fichiers de scénarios Gherkin (.feature) clairs, exhaustifs, extrêmement précis sur le plan de l'IHM et prêts à être automatisés pour WeSave.

---

### INSTRUCTIONS DE RÉDACTION GHERKIN (FR)

Rédigez le scénario en Gherkin (# language: fr).

#### RÈGLES STRICTES DE STYLE ET DE GRANULARITÉ :

1. Pas-à-pas séquentiel (Pas de Datatable sur les formulaires complexes) :
   - Ne regroupez PAS la saisie des champs d'un formulaire dans un tableau Datatable.
   - Rédigez une étape dédiée par champ, option ou saisie :
     - "Quand je saisis [type de champ] de \\"[valeur]\\""
     - "Et que je sélectionne [l'option/objectif/horizon] \\"[valeur]\\""

2. Validation systématique des URL et redirections :
   - À chaque changement d'écran, modalité ou validation majeure, insérez une étape de contrôle d'URL :
     - "Donc je suis redirigé vers \\"/#/route-de-l-ecran\\""

3. Gestion explicite des Modales et Fenêtres :
   - Lorsqu'un bouton déclenche une fenêtre pop-up ou modale, explicitez son apparition et l'interaction exacte :
     - "Donc la modale \\"[Nom de la modale]\\\" s'affiche"
     - "Quand je clique sur le bouton \\"[Nom du bouton]\\\" dans la modale"

4. Nommage des Snapshots Visuels :
   - Ne faites pas de snapshot générique. Spécifiez toujours un identifiant explicite de capture :
     - "Alors l'écran correspond au snapshot visuel \\"ecran-[nom-de-l-etape]\\""

5. Complétion contextuelle métier (SFDR & Préférences) :
   - Sur les parcours d'investissement (notamment TPBP), incluez explicitement les étapes par défaut requises à l'écran pour débloquer la suite du tunnel :
     - Préférences SFDR/Taxonomie réglées sur "Neutre"
     - Sélection/Désélection des secteurs PAI
     - Actions de validation intermédiaire (boutons "Enregistrer", "Valider et continuer")

6. Séparation des étapes d'allocation (Saisie + Validation) :
   - Pour les tableaux financiers, découpez l'action en deux étapes : la saisie de la valeur, puis l'enregistrement/validation du support.

#### Entêtes et Tags :
- Ajoutez les tags en en-tête : @produit (ex: @tpbp, @b4b, @wse, @advisory), @type (ex: @souscription, @visual, @regression), et @flags:inHurry,designSystem si requis.
- Précisez l'URL de départ en commentaire au-dessus du scénario.

Ne renvoyez QUE le code Gherkin valide (sans balises de bloc markdown comme \`\`\`gherkin ou d'explications superflues). Soyez extrêmement précis dans la génération de chaque étape.`;

        const userPrompt = `
Projet ciblé : all
Description fonctionnelle : ${aiDescription}

Génère le scénario Gherkin correspondant en français en suivant scrupuleusement toutes les règles ci-dessus.
`;

        const finalModel = apiModel || "gemini-3.1-pro-preview";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${apiKey}`;
        
        const directResponse = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }]
              }
            ]
          })
        });

        if (!directResponse.ok) {
          const errorText = await directResponse.text();
          throw new Error(`Erreur Gemini API Directe: ${errorText}`);
        }

        const resData = await directResponse.json();
        let gherkin = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
        gherkin = gherkin.replace(/```gherkin/g, "").replace(/```/g, "").trim();
        gherkinResult = gherkin;
      }

      setAiResult(gherkinResult);
    } catch (error: unknown) {
      console.error(error);
      const err = error as Error;
      alert(err.message || "Erreur lors de la génération de Gherkin.");
    } finally {
      setAiLoading(false);
    }
  };

  // Copie de résultat
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1600px] mx-auto h-[calc(100vh-96px)] lg:h-[calc(100vh-48px)] flex flex-col gap-6 overflow-hidden font-sans text-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-gray-100 pb-6 sticky top-0 bg-[#f6f8fa]/80 backdrop-blur-md z-40 gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="md:w-[380px] shrink-0">
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <Sparkles className="text-blue-600 w-6 h-6 animate-pulse" />
              Gherkin
            </h1>
          </div>
          <div className="hidden md:block h-8 w-px bg-slate-200"></div>

          {/* Option Selector */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => handleOptionChange("gemini-gem")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                option === "gemini-gem"
                  ? "bg-white text-purple-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              Option A : Google Gem
            </button>
            <button
              onClick={() => handleOptionChange("ai")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                option === "ai"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <span>Option B : Gemini intégré</span>
              <span className="text-[9px] leading-tight bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono">
                Under Test
              </span>
            </button>
            <button
              onClick={() => handleOptionChange("offline")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                option === "offline"
                  ? "bg-white text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              <span>Option C : Assistant hors-ligne</span>
              <span className="text-[9px] leading-tight bg-amber-500/10 text-amber-600 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider font-mono">
                Under Test
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* RENDER SELECTED OPTION PANEL */}
      {option === "offline" && (
        /* --- OPTION A: OFFLINE TRANSLATOR & COMPILER --- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-in fade-in duration-300 flex-grow h-full min-h-0 overflow-hidden">
          {/* Left Form Panel */}
          <div className="lg:col-span-6 flex flex-col h-full min-h-0">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col flex-grow space-y-6 overflow-hidden h-full min-h-0">
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Zap className="text-blue-600 w-5 h-5 animate-pulse" />
                  <h2 className="text-base font-bold text-slate-900">
                    Traducteur local instantané
                  </h2>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Collez du code Playwright ou décrivez votre test pour obtenir
                  un scénario formel
                </p>
              </div>

              {/* Textarea */}
              <div className="flex flex-col gap-2 flex-grow overflow-hidden h-full min-h-0">
                <label
                  htmlFor="offline-textarea"
                  className="text-xs font-bold text-slate-500 tracking-wide flex-shrink-0"
                >
                  Code Playwright (ex: `page.goto()`, `click()`) ou description
                </label>
                <textarea
                  id="offline-textarea"
                  value={offlineInput}
                  onChange={(e) => setOfflineInput(e.target.value)}
                  placeholder={`Collez votre script Playwright ici. Exemple :
await page.goto('/#/synthese');
await page.getByRole('button', { name: 'Actualiser' }).click();
await expect(page).toHaveURL(/#\\/transmission/);
await expect(page).toHaveScreenshot('synthese.png');`}
                  className="w-full flex-grow bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-mono font-bold text-sky-400 focus:outline-none focus:border-blue-500 transition-all placeholder:text-slate-600 leading-relaxed resize-none overflow-auto h-full min-h-0"
                />
              </div>

              {/* Reset Button */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-4 flex-shrink-0">
                <button
                  onClick={() => setOfflineInput("")}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                >
                  Effacer
                </button>
              </div>
            </div>
          </div>

          {/* Right Code Block Panel */}
          <div className="lg:col-span-6 flex flex-col h-full min-h-0">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col flex-grow h-full min-h-0 space-y-6 overflow-hidden">
              {/* Output Panel Header */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileCode className="text-slate-500 w-5 h-5" />
                  <h2 className="text-base font-bold text-slate-900">
                    Résultat Gherkin (.feature)
                  </h2>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Visualisez et copiez votre scénario de test formaté
                </p>
              </div>

              {/* Code Rendering Field - Matches the textarea style exactly */}
              <div className="flex flex-col gap-2 flex-grow overflow-hidden h-full min-h-0">
                <span className="text-xs font-bold text-slate-500 tracking-wide flex-shrink-0">
                  Aperçu de la syntaxe Gherkin
                </span>
                <div className="w-full flex-grow bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 leading-relaxed overflow-auto relative select-text h-full min-h-0">
                  {offlineResult ? (
                    highlightGherkin(offlineResult)
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-slate-500 gap-3">
                      <PlayCircle
                        size={36}
                        className="text-slate-700 animate-pulse"
                      />
                      <p className="text-xs font-bold uppercase tracking-widest">
                        En attente d&apos;entrée Playwright ou texte
                      </p>
                      <p className="text-[11px] text-slate-600 max-w-xs font-medium">
                        Entrez du code ou du texte dans le traducteur à gauche
                        pour compiler immédiatement en Gherkin.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Copy Button Footer */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-4 flex-shrink-0">
                <button
                  onClick={() => handleCopy(offlineResult)}
                  disabled={!offlineResult}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-400 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" /> Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copier le scénario
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {option === "ai" && (
        /* --- OPTION B: AI GENERATION (Requires in-memory API Key) --- */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch animate-in fade-in duration-300 flex-grow h-full min-h-0 overflow-hidden">
          {/* Left Form Panel */}
          <div className="lg:col-span-6 flex flex-col h-full min-h-0">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col flex-grow space-y-6 overflow-hidden h-full min-h-0">
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <h2 className="text-base font-bold text-slate-900">
                  Génération assistée par IA
                </h2>
              </div>

              {/* API Key validation warning if missing */}
              {!apiKey.trim() && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs text-rose-600 font-bold flex items-center gap-2 flex-shrink-0">
                  <Lock size={16} />
                  Clé API Google Gemini manquante. Configurez-la ci-dessous.
                </div>
              )}

              {/* Textarea */}
              <div className="flex flex-col gap-2 flex-grow overflow-hidden h-full min-h-0">
                <label
                  htmlFor="description-textarea"
                  className="text-xs font-bold text-slate-500 tracking-wide flex-shrink-0"
                >
                  Description du cas de test
                </label>
                <textarea
                  id="description-textarea"
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  disabled={!apiKey.trim()}
                  placeholder={
                    apiKey.trim()
                      ? "Saisissez votre cas de test en langage naturel..."
                      : "Saisissez votre clé API ci-dessous pour débloquer la génération..."
                  }
                  className="w-full flex-grow bg-slate-50 disabled:bg-slate-100/50 disabled:cursor-not-allowed border border-slate-200 rounded-2xl p-4 text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 transition-colors placeholder:text-slate-400 resize-none overflow-auto h-full min-h-0"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between flex-shrink-0">
                <button
                  onClick={() => setAiDescription("")}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 transition-all cursor-pointer"
                >
                  Effacer
                </button>
                <button
                  onClick={handleGenerateAI}
                  disabled={
                    aiLoading || !aiDescription.trim() || !apiKey.trim()
                  }
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 disabled:cursor-not-allowed rounded-xl text-xs font-bold uppercase tracking-wider text-white shadow-sm active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  {aiLoading ? (
                    <>Génération en cours...</>
                  ) : (
                    <>
                      <Wand2 size={14} /> Générer avec l&apos;IA
                    </>
                  )}
                </button>
              </div>

              {/* Local API Key Config */}
              <div className="border-t border-slate-100 pt-6 mt-auto flex-shrink-0">
                <details className="group" open={!apiKey.trim()}>
                  <summary className="flex items-center justify-between font-bold text-xs text-slate-400 uppercase tracking-wider cursor-pointer hover:text-slate-600 select-none">
                    <span className="flex items-center gap-1.5">
                      <Lock size={12} /> Configuration de la clé API
                    </span>
                    <span className="transition-transform group-open:rotate-180">
                      ▼
                    </span>
                  </summary>

                  <div className="pt-4 space-y-4 animate-in fade-in duration-200">
                    <p className="text-xs text-slate-400 font-medium">
                      La clé API Google Gemini est conservée uniquement en
                      mémoire pour la session active.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="gemini-key-input"
                          className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                          Clé API Gemini
                        </label>
                        <div className="relative">
                          <input
                            id="gemini-key-input"
                            type={showKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => handleApiKeyChange(e.target.value)}
                            placeholder="Saisir votre clé..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-3 pr-10 py-2 text-xs font-mono font-bold text-slate-600 focus:outline-none focus:border-blue-500"
                          />
                          <button
                            type="button"
                            onClick={() => setShowKey(!showKey)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          >
                            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label
                          htmlFor="gemini-model-input"
                          className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider"
                        >
                          Modèle
                        </label>
                        <select
                          id="gemini-model-input"
                          value={apiModel}
                          onChange={(e) => saveApiModelLocal(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                        >
                          <option value="gemini-3.1-pro-preview">
                            Gemini 3.1 Pro (Nouveau)
                          </option>
                          <option value="gemini-3.5-flash">
                            Gemini 3.5 Flash (Flagship)
                          </option>
                          <option value="gemini-3.1-flash-lite">
                            Gemini 3.1 Flash-Lite
                          </option>
                        </select>
                      </div>
                    </div>

                    {apiKey && (
                      <button
                        onClick={handleClearApiKey}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/50 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Effacer la clé
                      </button>
                    )}
                  </div>
                </details>
              </div>
            </div>
          </div>

          {/* Right Output Code Block Panel */}
          <div className="lg:col-span-6 flex flex-col h-full min-h-0">
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col flex-grow h-full min-h-0 space-y-6 overflow-hidden">
              {/* Output Panel Header */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <FileCode className="text-slate-500 w-5 h-5" />
                  <h2 className="text-base font-bold text-slate-900">
                    Résultat Gherkin (.feature)
                  </h2>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Visualisez et copiez votre scénario de test formaté par
                  l&apos;IA
                </p>
              </div>

              {/* Code Rendering Field - Matches the textarea style exactly */}
              <div className="flex flex-col gap-2 flex-grow overflow-hidden h-full min-h-0">
                <span className="text-xs font-bold text-slate-500 tracking-wide flex-shrink-0">
                  Aperçu de la syntaxe Gherkin
                </span>
                <div className="w-full flex-grow bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 leading-relaxed overflow-auto relative select-text h-full min-h-0">
                  {aiResult ? (
                    highlightGherkin(aiResult)
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center h-full text-slate-500 gap-3">
                      {aiLoading ? (
                        <>
                          <Wand2 className="w-8 h-8 text-blue-500 animate-spin" />
                          <p className="text-xs font-bold uppercase tracking-wider text-blue-500">
                            Génération en cours...
                          </p>
                        </>
                      ) : (
                        <>
                          <PlayCircle
                            size={36}
                            className="text-slate-700 animate-pulse"
                          />
                          <p className="text-xs font-bold uppercase tracking-widest">
                            En attente de génération par IA
                          </p>
                          <p className="text-[11px] text-slate-600 max-w-xs font-medium">
                            Saisissez votre cas de test et votre clé Gemini,
                            puis cliquez sur Générer pour lancer l&apos;IA.
                          </p>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Copy Button Footer */}
              <div className="flex items-center justify-between border-t border-slate-50 pt-4 flex-shrink-0">
                <button
                  onClick={() => handleCopy(aiResult)}
                  disabled={!aiResult}
                  className="px-5 py-2.5 bg-white border border-slate-200 hover:border-blue-600 hover:text-blue-600 disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-400 rounded-xl text-xs font-bold text-slate-600 transition-all active:scale-95 shadow-sm hover:shadow flex items-center gap-1.5 cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-500" /> Copié
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" /> Copier le scénario
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {option === "gemini-gem" && (
        /* --- OPTION C: GOOGLE GEM EXTERNAL REDIRECT --- */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden flex flex-col flex-grow h-full min-h-0 animate-in fade-in duration-300">
          {/* Mock Topbar */}
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" />
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                Google Gem &quot;WeSave PO&quot; — c78e9511da01
              </h2>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-white border border-slate-200 px-2 py-0.5 rounded-md font-mono">
              Agent IA Externe
            </span>
          </div>

          {/* Mock Chat Body */}
          <div className="flex-grow bg-slate-50/50 p-8 flex flex-col items-center justify-center relative overflow-hidden h-full min-h-0">
            {/* Decorative subtle chat speech bubbles in background */}
            <div className="absolute top-10 left-10 p-4 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-xs opacity-20 pointer-events-none">
              <p className="text-xs font-semibold text-slate-600">
                Peux-tu me générer le scénario de test pour la souscription ?
              </p>
            </div>
            <div className="absolute bottom-20 right-10 p-4 bg-purple-50 rounded-2xl shadow-sm border border-purple-100 max-w-xs opacity-20 pointer-events-none">
              <p className="text-xs font-semibold text-purple-700">
                Voici le scénario Gherkin correspondant à votre demande...
              </p>
            </div>

            {/* Central Action Card */}
            <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-xl border border-slate-100 text-center space-y-6 z-10 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
                <Sparkles size={32} className="animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-slate-900">
                  Lancer la session Google Gem
                </h3>
                <p className="text-xs text-slate-400 font-medium leading-relaxed">
                  Par mesure de sécurité, Google interdit l&apos;incrustation
                  directe de son application `gemini.google.com` (blocage des
                  navigateurs via l&apos;en-tête `X-Frame-Options`).
                  <br />
                  <span className="font-semibold text-purple-600">
                    Cliquez sur le bouton ci-dessous pour démarrer
                    instantanément votre agent de rédaction Gherkin :
                  </span>
                </p>
              </div>

              <a
                href="https://gemini.google.com/gem/c78e9511da01"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider active:scale-95 shadow-md transition-all hover:-translate-y-0.5"
              >
                Démarrer le Gem WeSave PO
                <ExternalLink size={14} className="text-slate-400" />
              </a>
            </div>

            {/* Mock Chat Input Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-4 flex-shrink-0 w-full mt-auto">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400">
                <MessageSquare size={18} />
              </div>
              <div className="flex-grow relative">
                <input
                  type="text"
                  disabled
                  placeholder="Écrivez à votre agent intelligent WeSave PO pour générer votre Gherkin..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-2.5 text-xs font-semibold text-slate-400 cursor-not-allowed placeholder:text-slate-300"
                />
                <button
                  disabled
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-200 text-slate-400 rounded-lg cursor-not-allowed"
                >
                  <Send size={12} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
