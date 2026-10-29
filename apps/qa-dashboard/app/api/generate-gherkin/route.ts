import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { description, project, apiKey, model } = await request.json();

    if (!description) {
      return NextResponse.json({ error: "La description est requise" }, { status: 400 });
    }

    const systemPrompt = `Vous êtes l'agent 'po-assistant', expert en analyse métier, méthodologie BDD et tests automatisés (Playwright). Votre rôle est de cadrer les besoins des Product Owners (PO) pour concevoir des fichiers de scénarios Gherkin (.feature) clairs, exhaustifs, extrêmement précis sur le plan de l'IHM et prêts à être automatisés avec Playwright.

---

### INSTRUCTIONS DE RÉDACTION GHERKIN (FR)

Rédigez le scénario en Gherkin (# language: fr).

#### RÈGLES STRICTES DE STYLE ET DE GRANULARITÉ :

1. Pas-à-pas séquentiel (Pas de Datatable sur les formulaires complexes) :
   - Ne regroupez PAS la saisie des champs d'un formulaire dans un tableau Datatable.
   - Rédigez une étape dédiée par champ, option ou saisie :
     - "Quand je saisis [type de champ] de \"[valeur]\""
     - "Et que je sélectionne [l'option] \"[valeur]\""

2. Validation systématique des URL et redirections :
   - À chaque changement d'écran, modalité ou validation majeure, insérez une étape de contrôle d'URL :
     - "Donc je suis redirigé vers \"/#/route-de-l-ecran\""

3. Gestion explicite des Modales et Fenêtres :
   - Lorsqu'un bouton déclenche une fenêtre pop-up ou modale, explicitez son apparition et l'interaction exacte :
     - "Donc la modale \"[Nom de la modale]\" s'affiche"
     - "Quand je clique sur le bouton \"[Nom du bouton]\" dans la modale"

4. Nommage des Snapshots Visuels :
   - Ne faites pas de snapshot générique. Spécifiez toujours un identifiant explicite de capture :
     - "Alors l'écran correspond au snapshot visuel \"ecran-[nom-de-l-etape]\""

5. Complétion contextuelle et formulaires :
   - Sur les formulaires à étapes, incluez explicitement les interactions requises pour débloquer la suite du tunnel :
     - Remplissage des champs obligatoires
     - Clic sur les boutons de validation ("Valider", "Suivant", "Enregistrer")

#### Entêtes et Tags :
- Ajoutez les tags en en-tête : @projet (ex: @demo-ecommerce, @crm), @type (ex: @smoke, @visual, @regression).
- Précisez l'URL de départ en commentaire au-dessus du scénario.

Ne renvoyez QUE le code Gherkin valide (sans balises de bloc markdown comme \`\`\`gherkin ou d'explications superflues). Soyez extrêmement précis dans la génération de chaque étape.`;

    const userPrompt = `
Projet ciblé : ${project}
Description fonctionnelle : ${description}

Génère le scénario Gherkin correspondant en français en suivant scrupuleusement toutes les règles ci-dessus.
`;

    // Utiliser la clé fournie ou essayer de lire process.env
    const finalApiKey = apiKey || process.env.GEMINI_API_KEY;

    if (!finalApiKey) {
      // Générateur local intelligent de substitution
      const words = description.split(" ");
      const featureName = words.slice(0, 5).join(" ") + (words.length > 5 ? "..." : "");
      
      const mockGherkin = `# language: fr
# URL : https://tpbp-dev.conseil.wesave.fr/#/synthese
@${project} @souscription @visual
Fonctionnalité: ${featureName}

  Scénario: Validation fonctionnelle nominative de l'actualisation
    Étant donné que je suis sur la page d'accueil de l'application "${project}"
    Quand je réalise l'action : "${description}"
    Alors le comportement attendu est validé avec succès
`;
      return NextResponse.json({ gherkin: mockGherkin, isMock: true });
    }

    const finalModel = model || "gemini-3.1-pro-preview";

    // Google Gemini API Call (Using dynamic model for Gherkin generation)
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${finalModel}:generateContent?key=${finalApiKey}`;
    const response = await fetch(url, {
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

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: `Erreur Gemini API: ${errorText}` }, { status: response.status });
    }

    const resData = await response.json();
    let gherkin = resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
    gherkin = gherkin.replace(/```gherkin/g, "").replace(/```/g, "").trim();

    return NextResponse.json({ gherkin });
  } catch (error: unknown) {
    console.error("Gherkin generator API error:", error);
    const message = error instanceof Error ? error.message : "Erreur interne du serveur";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
