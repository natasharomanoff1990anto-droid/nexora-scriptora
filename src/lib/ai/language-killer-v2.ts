export const BANNED_AI_WORDS = [
  "esplorare", "approfondire", "arazzo", "testimonianza", "sinergia", 
  "viaggio", "complessità", "fondamentale", "essenziale", "unisciti a noi",
  "nel cuore di", "scopriremo insieme", "abbracciare", "sfumature"
];

export const PLATINUM_CONSTRAINTS = `
### REGOLE DI FERRO (LANGUAGE KILLER V2):
1. VIETATO usare: ${BANNED_AI_WORDS.join(", ")}.
2. NO RIASSUNTI: Non iniziare mai i capitoli con "In questo capitolo..." o "Vedremo...".
3. NO CONCLUSIONI MORALISTE: Non finire mai con "In conclusione..." o "Ricorda che...".
4. DENSITÀ MATERICA: Sostituisci ogni emozione astratta con un'azione fisica o un sostantivo pesante.
`;
