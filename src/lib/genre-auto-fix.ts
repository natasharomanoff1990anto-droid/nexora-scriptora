/**
 * GENRE AUTO-FIX RULES — Publishing Brain™
 *
 * Maps each genre profile to a set of *automatic correction strategies*
 * the rewrite engine must apply when the Genre Coach detects weakness signals.
 *
 * HARD CONSTRAINTS (always enforced downstream):
 *  - Do NOT increase total rewrite beyond 15% of original length.
 *  - Do NOT change narrative meaning, plot, or character intent.
 *  - Only enhance clarity, immersion, rhythm, or structure.
 *
 * Used by:
 *  - supabase/functions/genre-coach/index.ts  → returns matched directives
 *  - supabase/functions/dominate-chapter/index.ts → injects them in the rewrite prompt
 */
import { resolveGenreKey, type GenreKey } from "./genre-intelligence";

/** A single targeted fix recipe. */
export interface AutoFixRule {
  /** Coach signal that triggers this rule. Matched against report.breaks/missing/excess (lowercased substring). */
  triggers: string[];
  /** Human-readable label used in the UI. */
  label: string;
  /** Operative directive injected verbatim into the rewrite prompt. */
  directive: string;
}

/** Per-genre rule book. Keep each rule surgical and bestseller-grade. */
const RULES: Partial<Record<GenreKey, AutoFixRule[]>> = {
  horror: [
    {
      triggers: ["hook", "opening", "incipit", "weak start", "no tension"],
      label: "Iniezione sensoriale + paura fisica",
      directive:
        "Riscrivi le aperture deboli iniettando UN dettaglio sensoriale concreto (odore / texture / suono) entro le prime 2 frasi. Converti ogni paura astratta in percezione fisica del corpo (pelle, respiro, temperatura). Vietato 'sentiva paura' → mostra il sintomo.",
    },
    {
      triggers: ["pacing", "rhythm", "slow", "lento", "tension"],
      label: "Frasi corte per tensione",
      directive:
        "Nei passaggi di tensione spezza i periodi: massimo 12 parole. Alterna una frase media a due frasi brevissime. Nessun avverbio inutile.",
    },
    {
      triggers: ["abstract", "telling", "spiega"],
      label: "Show don't tell del perturbante",
      directive:
        "Ogni emozione del perturbante deve essere mostrata attraverso un oggetto domestico fuori posto, non spiegata.",
    },
  ],

  children: [
    {
      triggers: ["rhythm", "ritmo", "flow", "read-aloud", "musical"],
      label: "Pattern ripetitivi + musicalità",
      directive:
        "Aggiungi pattern di ripetizione (parola/frase chiave che ritorna 2-3 volte). Inserisci almeno una rima interna o un'allitterazione per pagina. Il testo deve scorrere ad alta voce: leggi mentalmente e taglia ogni inciampo.",
    },
    {
      triggers: ["complex", "long sentence", "vocabulary", "difficult"],
      label: "Sintassi semplificata",
      directive:
        "Frasi soggetto-verbo-complemento, max 10 parole. Una sola idea per frase. Vocabolario adatto a 6-9 anni: sostituisci ogni parola astratta con immagine concreta.",
    },
    {
      triggers: ["dialogue", "voice", "character"],
      label: "Voci dei personaggi distinte",
      directive:
        "Ogni personaggio deve avere un tic verbale o una parola-firma riconoscibile. Niente dialoghi piatti.",
    },
  ],

  romance: [
    {
      triggers: ["explicit emotion", "telling feeling", "spiega sentimenti", "on-the-nose"],
      label: "Sottotesto al posto della spiegazione",
      directive:
        "Riduci ogni dichiarazione esplicita di sentimento. Mostra l'emozione attraverso il sottotesto: ciò che NON viene detto, le frasi interrotte, le pause.",
    },
    {
      triggers: ["tension", "chemistry", "spark", "micro"],
      label: "Micro-tensione fisica",
      directive:
        "Inserisci almeno 2 micro-beat di tensione per scena: uno sguardo trattenuto, un quasi-contatto, una pausa di 1 battito prima della risposta. Mostra il corpo che reagisce prima della mente.",
    },
    {
      triggers: ["dialogue flat", "dialoghi piatti"],
      label: "Dialoghi a doppio livello",
      directive:
        "Ogni scambio di dialogo deve avere un livello superficiale (cosa si dice) e un livello segreto (cosa si vuole davvero). Riscrivi i dialoghi piatti con questa doppiezza.",
    },
  ],

  "self-help": [
    {
      triggers: ["reframe", "unclear", "confusing", "vague"],
      label: "Reframe nitido",
      directive:
        "Identifica la convinzione che il capitolo vuole rompere e riscrivila in UNA frase netta del tipo 'Non è X. È Y.'. Mettila in apertura del paragrafo chiave.",
    },
    {
      triggers: ["closing", "ending", "weak conclusion", "finale"],
      label: "Quote-line di chiusura",
      directive:
        "Termina la sezione con UNA frase memorabile, sottolineabile, max 15 parole, che il lettore vorrà screenshotare. Tagliante, asimmetrica, vera.",
    },
    {
      triggers: ["actionable", "tool", "esercizio", "pratica", "missing application"],
      label: "Strumento operativo",
      directive:
        "Inserisci almeno UNO strumento applicabile entro 24 ore: domanda-pivot, micro-esercizio, o mini-protocollo in 3 passi. Concreto, non motivazionale.",
    },
  ],

  spirituality: [
    {
      triggers: ["abstract", "vago", "generic", "new age"],
      label: "Ancoraggio concreto",
      directive:
        "Ogni concetto spirituale deve essere ancorato a un'immagine sensoriale o a un gesto quotidiano. Vietate frasi vuote tipo 'energia universale' senza referente concreto.",
    },
    {
      triggers: ["closing", "ending", "finale"],
      label: "Domanda contemplativa",
      directive:
        "Chiudi con una domanda che il lettore porterà con sé per 24 ore. Non retorica, non motivazionale: una domanda vera.",
    },
  ],

  fantasy: [
    {
      triggers: ["exposition", "info-dump", "worldbuilding", "spiega mondo"],
      label: "Worldbuilding in azione",
      directive:
        "Elimina ogni info-dump esplicativo. Le regole del mondo devono emergere SOLO mentre i personaggi agiscono o si scontrano con esse. Mostra la regola attraverso la conseguenza.",
    },
    {
      triggers: ["intent", "passive", "no goal", "wandering"],
      label: "Intento per paragrafo",
      directive:
        "Ogni paragrafo deve contenere un'intenzione chiara di un personaggio (cosa vuole, ora, in questo istante). Riscrivi i paragrafi vaganti aggiungendo questo vettore.",
    },
    {
      triggers: ["pacing", "slow"],
      label: "Tagliare l'aria",
      directive:
        "Comprimi le descrizioni a max 3 frasi consecutive. Alterna sempre descrizione → azione/dialogo.",
    },
  ],

  thriller: [
    {
      triggers: ["pacing", "slow", "lento"],
      label: "Cliffhanger di paragrafo",
      directive:
        "Ogni 2-3 paragrafi inserisci una mini-rivelazione, un colpo di scena minore o una domanda urgente. Mai stallo informativo.",
    },
    {
      triggers: ["telling", "spiega"],
      label: "Solo azione + percezione",
      directive:
        "Sostituisci ogni spiegazione con azione o percezione del POV. Vietato narratore onnisciente che chiarisce.",
    },
  ],

  "sci-fi": [
    {
      triggers: ["exposition", "info-dump", "tecno"],
      label: "Tecnologia in uso",
      directive:
        "Le tecnologie e i concetti scientifici devono apparire in uso, mai descritti a freddo. Mostra il personaggio che interagisce, fallisce, adatta.",
    },
    {
      triggers: ["abstract", "cold", "freddo"],
      label: "Ancoraggio umano",
      directive:
        "Ogni passaggio concettuale deve agganciarsi a una reazione emotiva concreta del POV.",
    },
  ],
};

/** Public: returns all rules defined for a given genre key. */
export function getAutoFixRulesForGenre(key: GenreKey): AutoFixRule[] {
  return RULES[key] ?? [];
}

/**
 * Public: given a coach report, return the subset of rules whose triggers
 * match issues detected in breaks/missing/excess. Order preserved by genre book.
 */
export function matchAutoFixRules(
  genre: string,
  subcategory: string | undefined,
  report: { breaks?: string[]; missing?: string[]; excess?: string[] }
): AutoFixRule[] {
  const key = resolveGenreKey(genre, subcategory);
  const rules = getAutoFixRulesForGenre(key);
  if (!rules.length) return [];

  const haystack = [
    ...(report.breaks ?? []),
    ...(report.missing ?? []),
    ...(report.excess ?? []),
  ]
    .join(" \n ")
    .toLowerCase();

  return rules.filter((r) => r.triggers.some((t) => haystack.includes(t.toLowerCase())));
}

/**
 * Public: build a prompt block to be injected in the rewrite engine.
 * Always includes the hard 15% / no-meaning-change constraints.
 */
export function buildAutoFixPromptBlock(rules: AutoFixRule[]): string {
  if (!rules.length) return "";
  const list = rules
    .map((r, i) => `${i + 1}. [${r.label}] ${r.directive}`)
    .join("\n");
  return `
GENRE AUTO-FIX DIRECTIVES (apply surgically — do NOT rewrite the whole chapter):
${list}

HARD CONSTRAINTS:
- Total rewrite must NOT exceed 15% of the original chapter length.
- Do NOT change plot, character intent, or narrative meaning.
- Only enhance clarity, immersion, rhythm, or structure.
- Preserve the author's voice and POV.
`.trim();
}
