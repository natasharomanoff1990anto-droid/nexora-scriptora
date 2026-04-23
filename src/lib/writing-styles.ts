/**
 * WRITING STYLES ENGINE
 *
 * Preset di stili di scrittura coerenti per ogni genere.
 * Include autori famosi (Authors-DNA) + stili tecnici (narrativo, minimalista, ecc.)
 * Ogni preset genera un PROMPT BLOCK dedicato che viene iniettato nel system prompt
 * per garantire che la generazione AI rispecchi REALMENTE lo stile scelto.
 */

import { resolveGenreKey, type GenreKey } from "@/lib/genre-intelligence";

export type StyleKind = "author" | "style";

export interface WritingStylePreset {
  /** ID stabile, usato come valore */
  id: string;
  /** Nome visualizzato (autore o stile) */
  label: string;
  /** Tipo: autore famoso o stile tecnico */
  kind: StyleKind;
  /** Breve descrizione UX (1 riga) */
  hint: string;
  /** Direttive concrete iniettate nel prompt AI: ritmo, frasi, vocabolario */
  promptDirective: string;
}

/* ============ Stili tecnici universali (validi per quasi ogni genere) ============ */

const UNIVERSAL_STYLES: WritingStylePreset[] = [
  {
    id: "style-minimalist",
    label: "Minimalista",
    kind: "style",
    hint: "Frasi brevi, zero ornamenti, massima densità.",
    promptDirective:
      "Stile MINIMALISTA: frasi 5-12 parole, paragrafi 2-4 righe, vocabolario concreto, zero avverbi, zero metafore decorative. Ogni parola pesa. Carver/Hemingway-like.",
  },
  {
    id: "style-narrative",
    label: "Narrativo immersivo",
    kind: "style",
    hint: "Scena, ritmo, sensorialità. Mostra non spiegare.",
    promptDirective:
      "Stile NARRATIVO IMMERSIVO: descrizioni sensoriali, scene mostrate (non riassunte), dialoghi naturali, varietà di lunghezza frase, ritmo cinematografico.",
  },
  {
    id: "style-conversational",
    label: "Conversazionale",
    kind: "style",
    hint: "Come parlare a un amico. Diretto, caldo, accessibile.",
    promptDirective:
      "Stile CONVERSAZIONALE: seconda persona singolare, contrazioni, domande retoriche, ritmo da chiacchierata, esempi quotidiani. Niente gergo accademico.",
  },
  {
    id: "style-academic",
    label: "Accademico",
    kind: "style",
    hint: "Rigoroso, citazionale, terza persona.",
    promptDirective:
      "Stile ACCADEMICO: terza persona, definizioni precise, frasi articolate, riferimenti impliciti a fonti, terminologia tecnica spiegata al primo uso.",
  },
  {
    id: "style-poetic",
    label: "Poetico/Lirico",
    kind: "style",
    hint: "Immagini forti, ritmo musicale, metafore.",
    promptDirective:
      "Stile POETICO/LIRICO: ritmo musicale (allitterazioni, cadenze), metafore originali, immagini visive forti, paragrafi brevi, pause espressive.",
  },
  {
    id: "style-journalistic",
    label: "Giornalistico",
    kind: "style",
    hint: "Lead forte, fatti, citazioni, ritmo serrato.",
    promptDirective:
      "Stile GIORNALISTICO: lead in apertura (chi/cosa/quando), frasi dichiarative, citazioni dirette, fatti verificabili, paragrafi brevi, struttura piramide rovesciata.",
  },
  {
    id: "style-technical",
    label: "Tecnico/Manuale",
    kind: "style",
    hint: "Procedurale, numerato, esempi e warning.",
    promptDirective:
      "Stile TECNICO: linguaggio procedurale, numerazione, blocchi codice/esempi, callout 'Attenzione/Nota', linguaggio neutro, zero emozioni.",
  },
  {
    id: "style-ironic",
    label: "Ironico/Sarcastico",
    kind: "style",
    hint: "Tagliente, autoironico, ritmo comico.",
    promptDirective:
      "Stile IRONICO: tono autoironico, paradossi, understatement, timing comico (regola del tre), zero moralismi.",
  },
];

/* ============ Autori per genere ============ */

const AUTHORS_BY_GENRE: Partial<Record<GenreKey, WritingStylePreset[]>> = {
  "self-help": [
    { id: "auth-brianna-wiest", label: "Brianna Wiest", kind: "author", hint: "Poetico, introspettivo, universale.",
      promptDirective: "Canalizza BRIANNA WIEST: prosa poetica e introspettiva, frasi-aforisma, capitoli brevi tematici, seconda persona, verità universali in linguaggio quotidiano." },
    { id: "auth-mark-manson", label: "Mark Manson", kind: "author", hint: "Crudo, ironico, anti-bullshit.",
      promptDirective: "Canalizza MARK MANSON: tono crudo e ironico, profanità misurata, controintuitivo, esempi concreti, ridicolizza il pensiero motivazionale tipico." },
    { id: "auth-james-clear", label: "James Clear", kind: "author", hint: "Chiaro, sistematico, basato su evidenze.",
      promptDirective: "Canalizza JAMES CLEAR: chiarezza chirurgica, framework numerati, esempi scientifici brevi, frasi memorizzabili, struttura problema→meccanismo→sistema." },
    { id: "auth-eckhart-tolle", label: "Eckhart Tolle", kind: "author", hint: "Spirituale, contemplativo, presenza.",
      promptDirective: "Canalizza ECKHART TOLLE: tono contemplativo, ripetizioni intenzionali, focus sul 'momento presente', metafore spirituali, frasi che invitano alla pausa." },
    { id: "auth-robin-sharma", label: "Robin Sharma", kind: "author", hint: "Aspirazionale, parabole, leadership.",
      promptDirective: "Canalizza ROBIN SHARMA: tono aspirazionale, parabole orientali, liste di principi, lettera al lettore, vocabolario di leadership e maestria." },
    { id: "auth-don-miguel-ruiz", label: "Don Miguel Ruiz", kind: "author", hint: "Saggezza tolteca, semplice e potente.",
      promptDirective: "Canalizza DON MIGUEL RUIZ: tono di saggezza ancestrale, frasi semplici e potenti, ripetizione di principi-chiave, esempi mitologici/spirituali." },
  ],
  business: [
    { id: "auth-seth-godin", label: "Seth Godin", kind: "author", hint: "Brevissimo, provocatorio, post da blog.",
      promptDirective: "Canalizza SETH GODIN: capitoli brevi (300-800 parole), tono provocatorio, domande dirette, niente filler, ogni paragrafo è un'unità autonoma." },
    { id: "auth-malcolm-gladwell", label: "Malcolm Gladwell", kind: "author", hint: "Storie + ricerca, tesi controintuitiva.",
      promptDirective: "Canalizza MALCOLM GLADWELL: apri con una storia umana dettagliata, lega a una ricerca/dato, costruisci una tesi controintuitiva, chiudi tornando alla storia." },
    { id: "auth-simon-sinek", label: "Simon Sinek", kind: "author", hint: "WHY/HOW/WHAT, leadership ispirazionale.",
      promptDirective: "Canalizza SIMON SINEK: framework 'Start with Why', linguaggio inclusivo ('noi'), case study di leader visionari, tono ispirazionale ma argomentato." },
    { id: "auth-peter-thiel", label: "Peter Thiel", kind: "author", hint: "Contrarian, filosofico, monopolio.",
      promptDirective: "Canalizza PETER THIEL: domande contrarian ('Cosa di vero credi su X che pochi credono?'), riferimenti filosofici, tesi nette, zero corporate-speak." },
    { id: "auth-ray-dalio", label: "Ray Dalio", kind: "author", hint: "Principi numerati, sistemico.",
      promptDirective: "Canalizza RAY DALIO: principi numerati e indentati, tono di mentore esperto, framework sistemici, esempi finanziari/macroeconomici." },
  ],
  philosophy: [
    { id: "auth-alain-de-botton", label: "Alain de Botton", kind: "author", hint: "Filosofia accessibile, vita quotidiana.",
      promptDirective: "Canalizza ALAIN DE BOTTON: filosofia applicata al quotidiano, tono garbato e ironico, riferimenti a filosofi classici, esempi dalla vita comune." },
    { id: "auth-marcus-aurelius", label: "Marco Aurelio (stoico)", kind: "author", hint: "Massime brevi, autoesortazione.",
      promptDirective: "Canalizza MARCO AURELIO: massime brevi e autoesortative, seconda persona ('ricordati che...'), tono stoico, frasi-meditazione numerate." },
    { id: "auth-nietzsche", label: "Nietzsche (aforistico)", kind: "author", hint: "Aforismi taglienti, provocatori.",
      promptDirective: "Canalizza NIETZSCHE: aforismi taglienti, provocazioni filosofiche, paradossi, vocabolario evocativo, ribaltamento dei valori comuni." },
  ],
  memoir: [
    { id: "auth-mary-karr", label: "Mary Karr", kind: "author", hint: "Voce viscerale, sud, dettaglio sensoriale.",
      promptDirective: "Canalizza MARY KARR: voce viscerale, dettagli sensoriali del Sud, dialoghi vernacolari, scene mostrate con precisione cinematografica." },
    { id: "auth-michelle-obama", label: "Michelle Obama", kind: "author", hint: "Caldo, riflessivo, aspirazionale.",
      promptDirective: "Canalizza MICHELLE OBAMA: tono caldo e riflessivo, dettagli familiari, archi di crescita personale, vocabolario inclusivo e aspirazionale." },
    { id: "auth-trevor-noah", label: "Trevor Noah", kind: "author", hint: "Aneddoti, ironia, contesto sociale.",
      promptDirective: "Canalizza TREVOR NOAH: aneddoti vivaci, ironia, intreccio storia personale e contesto sociopolitico, dialoghi brillanti." },
  ],
  romance: [
    { id: "auth-nicholas-sparks", label: "Nicholas Sparks", kind: "author", hint: "Emotivo, ambientazione provinciale, malinconia.",
      promptDirective: "Canalizza NICHOLAS SPARKS: emotività trattenuta, ambientazione provinciale americana, descrizioni naturali, malinconia, focus sui dettagli affettivi." },
    { id: "auth-emily-henry", label: "Emily Henry", kind: "author", hint: "Brillante, dialoghi serrati, rom-com.",
      promptDirective: "Canalizza EMILY HENRY: dialoghi serrati e brillanti, banter, riferimenti pop, tensione sessuale slow-burn, voce contemporanea." },
    { id: "auth-jane-austen", label: "Jane Austen", kind: "author", hint: "Ironia sociale, dialoghi spiritosi.",
      promptDirective: "Canalizza JANE AUSTEN: ironia sociale, dialoghi spiritosi e formali, free indirect speech, osservazioni acute sulla classe sociale." },
  ],
  "dark-romance": [
    { id: "auth-penelope-douglas", label: "Penelope Douglas", kind: "author", hint: "Tensione, morally grey, intensità.",
      promptDirective: "Canalizza PENELOPE DOUGLAS: tensione costante, protagonisti morally grey, scene intense, POV alternati in prima persona, atmosfera ossessiva." },
    { id: "auth-h-d-carlton", label: "H. D. Carlton", kind: "author", hint: "Stalking-romance, oscurità, twist.",
      promptDirective: "Canalizza H. D. CARLTON: oscurità senza compromessi, twist psicologici, ossessione esplicita, prima persona pulsante, capitoli brevissimi a cliffhanger." },
  ],
  thriller: [
    { id: "auth-gillian-flynn", label: "Gillian Flynn", kind: "author", hint: "Voci inaffidabili, twist, prosa tagliente.",
      promptDirective: "Canalizza GILLIAN FLYNN: narratori inaffidabili, prosa tagliente e cinica, twist psicologici, voci alternate in prima persona, dettagli inquietanti." },
    { id: "auth-harlan-coben", label: "Harlan Coben", kind: "author", hint: "Pacing veloce, capitoli brevi, suburbia.",
      promptDirective: "Canalizza HARLAN COBEN: pacing veloce, capitoli brevissimi a cliffhanger, ambientazione suburbana americana, segreti familiari, dialogo battente." },
    { id: "auth-lee-child", label: "Lee Child", kind: "author", hint: "Frasi staccate, eroe stoico, azione cinetica.",
      promptDirective: "Canalizza LEE CHILD: frasi corte e staccate. Verbi forti. Eroe stoico in terza persona. Azione cinetica descritta tecnicamente." },
  ],
  fantasy: [
    { id: "auth-brandon-sanderson", label: "Brandon Sanderson", kind: "author", hint: "Magic system rigoroso, world-building.",
      promptDirective: "Canalizza BRANDON SANDERSON: magic system con regole esplicite, world-building dettagliato, terza persona limitata, archi di personaggio chiari." },
    { id: "auth-tolkien", label: "J.R.R. Tolkien", kind: "author", hint: "Epica, lirico, mitologico.",
      promptDirective: "Canalizza TOLKIEN: tono epico e lirico, descrizioni naturalistiche estese, vocabolario arcaicizzante, riferimenti mitologici, ritmo lento e cerimoniale." },
    { id: "auth-leigh-bardugo", label: "Leigh Bardugo", kind: "author", hint: "Voci multiple, atmosfera, heist.",
      promptDirective: "Canalizza LEIGH BARDUGO: voci multiple in terza persona, atmosfera densa, ambientazioni russo-mitteleuropee, tensione politica e magica." },
  ],
  horror: [
    { id: "auth-stephen-king", label: "Stephen King", kind: "author", hint: "Quotidiano che si incrina, voce intima.",
      promptDirective: "Canalizza STEPHEN KING: ambientazione americana ordinaria, voce intima dei personaggi, escalation lenta, mostruoso suggerito mai mostrato del tutto." },
    { id: "auth-shirley-jackson", label: "Shirley Jackson", kind: "author", hint: "Perturbante domestico, ambiguità.",
      promptDirective: "Canalizza SHIRLEY JACKSON: perturbante domestico, ambiguità tra reale e psicologico, prosa controllata, finali sospesi." },
    { id: "auth-paul-tremblay", label: "Paul Tremblay", kind: "author", hint: "Ambiguità totale, narratore inaffidabile.",
      promptDirective: "Canalizza PAUL TREMBLAY: ambiguità radicale (è soprannaturale o psicologico?), narratore inaffidabile, struttura frammentata." },
  ],
  "sci-fi": [
    { id: "auth-ted-chiang", label: "Ted Chiang", kind: "author", hint: "Concettuale, premessa filosofica.",
      promptDirective: "Canalizza TED CHIANG: una premessa concettuale forte esplorata con rigore, prosa pulita, implicazioni filosofiche, struttura saggistica." },
    { id: "auth-andy-weir", label: "Andy Weir", kind: "author", hint: "Hard sci-fi, problem solving, ironia.",
      promptDirective: "Canalizza ANDY WEIR: hard sci-fi, prima persona, problem solving tecnico passo-passo, monologhi ironici, dettagli scientifici plausibili." },
    { id: "auth-ursula-leguin", label: "Ursula K. Le Guin", kind: "author", hint: "Antropologico, mondi credibili.",
      promptDirective: "Canalizza URSULA K. LE GUIN: tono antropologico, mondi alieni con culture credibili, prosa lirica, focus su lingua/società/genere." },
  ],
  historical: [
    { id: "auth-hilary-mantel", label: "Hilary Mantel", kind: "author", hint: "POV stretto, presente storico, sensoriale.",
      promptDirective: "Canalizza HILARY MANTEL: terza persona stretta al tempo presente, dettaglio sensoriale d'epoca, dialoghi credibili senza arcaismi forzati." },
    { id: "auth-ken-follett", label: "Ken Follett", kind: "author", hint: "Saga, multi-POV, dettaglio storico.",
      promptDirective: "Canalizza KEN FOLLETT: saga multi-personaggio, capitoli alternati, ricostruzione storica accurata, archi narrativi su decadi." },
  ],
  children: [
    { id: "auth-julia-donaldson", label: "Julia Donaldson", kind: "author", hint: "Rima, ritmo, ripetizione.",
      promptDirective: "Canalizza JULIA DONALDSON: rime baciate, ritmo cantilenante, ripetizioni memorizzabili, vocabolario semplice, animali protagonisti." },
    { id: "auth-roald-dahl", label: "Roald Dahl", kind: "author", hint: "Macabro divertente, parole inventate.",
      promptDirective: "Canalizza ROALD DAHL: macabro giocoso, adulti grotteschi, bambini astuti, parole inventate divertenti, narratore complice." },
    { id: "auth-eric-carle", label: "Eric Carle", kind: "author", hint: "Frasi brevi, ripetizione, sensoriale.",
      promptDirective: "Canalizza ERIC CARLE: frasi brevissime, struttura ripetitiva accumulativa, focus sensoriale (colori/suoni/conteggi), per età 0-5." },
    { id: "auth-jacqueline-wilson", label: "Jacqueline Wilson", kind: "author", hint: "Voce bambina, temi reali.",
      promptDirective: "Canalizza JACQUELINE WILSON: prima persona di bambina/o, voce autentica, temi reali (famiglia/scuola/amicizia), tono empatico per età 8-12." },
  ],
  poetry: [
    { id: "auth-rupi-kaur", label: "Rupi Kaur", kind: "author", hint: "Verso libero, brevissimo, instagrammabile.",
      promptDirective: "Canalizza RUPI KAUR: verso libero brevissimo, lowercase, niente punteggiatura, immagini concrete del corpo/emozioni, una poesia per pagina." },
    { id: "auth-mary-oliver", label: "Mary Oliver", kind: "author", hint: "Natura, contemplazione, domanda finale.",
      promptDirective: "Canalizza MARY OLIVER: osservazione della natura, ritmo contemplativo, domanda esistenziale finale, immagini precise di animali/piante." },
    { id: "auth-pablo-neruda", label: "Pablo Neruda", kind: "author", hint: "Sensuale, metafora estesa, ode.",
      promptDirective: "Canalizza PABLO NERUDA: sensualità terrena, metafore estese, ode all'oggetto comune, ritmo lungo e respirante." },
    { id: "auth-bukowski", label: "Charles Bukowski", kind: "author", hint: "Crudo, antieroico, prosaico.",
      promptDirective: "Canalizza BUKOWSKI: crudo e antieroico, vita ai margini, alcol/donne/lavoro, ritmo prosaico, finali a pugno." },
  ],
  spirituality: [
    { id: "auth-thich-nhat-hanh", label: "Thich Nhat Hanh", kind: "author", hint: "Mindfulness, semplice, presente.",
      promptDirective: "Canalizza THICH NHAT HANH: prosa semplice e presente, esercizi di consapevolezza, gatha (versi brevi), tono pacato." },
    { id: "auth-pema-chodron", label: "Pema Chödrön", kind: "author", hint: "Buddismo applicato, vulnerabilità.",
      promptDirective: "Canalizza PEMA CHÖDRÖN: buddismo applicato al dolore quotidiano, tono vulnerabile, aneddoti personali, pratiche concrete." },
    { id: "auth-ram-dass", label: "Ram Dass", kind: "author", hint: "Trasformativo, aforistico, amore.",
      promptDirective: "Canalizza RAM DASS: tono trasformativo, frasi-aforisma sull'amore e la coscienza, ripetizioni meditative, esempi dal proprio percorso." },
  ],
  cookbook: [
    { id: "auth-julia-child", label: "Julia Child", kind: "author", hint: "Conviviale, dettagliato, didattico.",
      promptDirective: "Canalizza JULIA CHILD: tono conviviale ed entusiasta, istruzioni dettagliate, spiegazione del PERCHÉ tecnico, aneddoti francesi." },
    { id: "auth-yotam-ottolenghi", label: "Yotam Ottolenghi", kind: "author", hint: "Mediterraneo, ingredienti audaci.",
      promptDirective: "Canalizza OTTOLENGHI: ingredienti mediorientali audaci, intro evocativa, attenzione a colori/contrasti, varianti vegetariane." },
    { id: "auth-massimo-bottura", label: "Massimo Bottura", kind: "author", hint: "Italiano d'autore, narrativo.",
      promptDirective: "Canalizza MASSIMO BOTTURA: tono narrativo italiano, ricetta come storia, riferimenti a tradizione e innovazione, lirismo gastronomico." },
  ],
  fitness: [
    { id: "auth-jeff-cavaliere", label: "Jeff Cavaliere (Athlean-X)", kind: "author", hint: "Tecnico, anatomico, science-based.",
      promptDirective: "Canalizza JEFF CAVALIERE: linguaggio anatomico preciso, science-based, callout 'errori comuni', focus su execution e progressione." },
    { id: "auth-arnold", label: "Arnold Schwarzenegger", kind: "author", hint: "Aspirazionale, esperienza, intensità.",
      promptDirective: "Canalizza ARNOLD: tono aspirazionale e da mentore, aneddoti dalla propria carriera, intensità mentale, vocabolario di disciplina." },
  ],
  productivity: [
    { id: "auth-cal-newport", label: "Cal Newport", kind: "author", hint: "Deep work, anti-distrazione, rigore.",
      promptDirective: "Canalizza CAL NEWPORT: tono accademico-applicato, framework chiari (deep work, slow productivity), critica alla cultura della distrazione, esempi di studiosi/scrittori." },
    { id: "auth-tim-ferriss", label: "Tim Ferriss", kind: "author", hint: "Hack, esperimenti, interviste.",
      promptDirective: "Canalizza TIM FERRISS: tono da sperimentatore, hack numerati, interviste a esperti, '4-Hour' framework, dettagli tattici concreti." },
  ],
  education: [
    { id: "auth-richard-feynman", label: "Richard Feynman", kind: "author", hint: "Spiega come a un bambino, curiosità.",
      promptDirective: "Canalizza FEYNMAN: spiegazioni dal primo principio, analogie concrete, tono di curiosità contagiosa, 'spiegalo come a un bambino di 12 anni'." },
  ],
};

/* ============ Stili speciali per generi creativi ============ */

const SPECIAL_STYLES: Partial<Record<GenreKey, WritingStylePreset[]>> = {
  poetry: [
    { id: "style-haiku", label: "Haiku (5-7-5)", kind: "style", hint: "Tre versi, immagine naturale, kigo.",
      promptDirective: "Stile HAIKU: tre versi sillabati 5-7-5, una immagine naturale (kigo stagionale), un kireji (taglio) tra immagine e rivelazione, niente metafore astratte." },
    { id: "style-sonnet", label: "Sonetto", kind: "style", hint: "14 versi, schema rimico classico.",
      promptDirective: "Stile SONETTO: 14 versi endecasillabi, schema ABBA ABBA CDC DCD, volta tematica al verso 9, chiusa epigrammatica." },
    { id: "style-free-verse", label: "Verso libero",  kind: "style", hint: "Niente metro, ritmo interno.",
      promptDirective: "Stile VERSO LIBERO: niente metro fisso, ritmo basato su respiri e tagli di verso, immagini concrete, enjambement strategico." },
  ],
  children: [
    { id: "style-rhyme", label: "Rima cantilenante", kind: "style", hint: "Rime baciate, ripetizione, lettura ad alta voce.",
      promptDirective: "Stile RIMA: rime baciate AABB, ritmo cantilenante regolare, ripetizioni accumulative, pensato per lettura ad alta voce." },
    { id: "style-fairy-tale", label: "Fiaba classica", kind: "style", hint: "C'era una volta, archetipi, morale.",
      promptDirective: "Stile FIABA: incipit 'C'era una volta', archetipi (eroe/aiutante/antagonista), prove a tre, morale finale, linguaggio evocativo ma semplice." },
    { id: "style-bedtime", label: "Storia della buonanotte", kind: "style", hint: "Calmo, ripetitivo, finale rassicurante.",
      promptDirective: "Stile BUONANOTTE: tono calmo e cullante, ripetizione di una formula chiusura, descrizioni morbide, finale rassicurante con il personaggio che si addormenta." },
  ],
  jokes: [
    { id: "style-one-liner", label: "One-liner", kind: "style", hint: "Una frase, punchline secca.",
      promptDirective: "Stile ONE-LINER: una sola frase, set-up brevissimo + punchline secca, regola del rovesciamento, niente filler." },
    { id: "style-observational", label: "Osservazionale", kind: "style", hint: "Set-up quotidiano, twist.",
      promptDirective: "Stile OSSERVAZIONALE (alla Seinfeld): set-up su situazione quotidiana riconoscibile, escalation in tre tempi, twist finale assurdo ma logico." },
    { id: "style-pun", label: "Giochi di parole", kind: "style", hint: "Doppi sensi, calembour.",
      promptDirective: "Stile PUN: gioco fonetico/semantico esplicito, doppio senso, paradosso linguistico, eventuale 'groan-worthy' finale." },
    { id: "style-absurd", label: "Assurdo/Surreale", kind: "style", hint: "Logica impossibile, non sequitur.",
      promptDirective: "Stile ASSURDO: premessa surreale trattata con serietà, non sequitur, escalation di nonsense, finale che ribalta anche l'assurdo." },
  ],
  manual: [
    { id: "style-step-by-step", label: "Passo-passo numerato", kind: "style", hint: "Ogni step un'azione, screenshot/schemi.",
      promptDirective: "Stile PASSO-PASSO: ogni step inizia con verbo imperativo, prerequisiti elencati, output atteso dopo ogni step, callout per errori frequenti." },
    { id: "style-troubleshooting", label: "Troubleshooting", kind: "style", hint: "Sintomo→causa→soluzione.",
      promptDirective: "Stile TROUBLESHOOTING: tabelle Sintomo→Causa probabile→Soluzione, ordinate per frequenza, ogni soluzione testabile in <5 minuti." },
  ],
};

/* ============ Public API ============ */

/**
 * Restituisce la lista di stili disponibili per un genere (autori + stili tecnici universali + speciali del genere).
 */
export function getStylesForGenre(genre: string, subcategory?: string): WritingStylePreset[] {
  const key = resolveGenreKey(genre, subcategory);
  const authors = AUTHORS_BY_GENRE[key] ?? [];
  const special = SPECIAL_STYLES[key] ?? [];
  // Stili universali in coda (sempre disponibili, ma autori del genere prima)
  return [...authors, ...special, ...UNIVERSAL_STYLES];
}

/**
 * Trova un preset per id (cercando in tutti i registri).
 */
export function findStylePresetById(id: string): WritingStylePreset | null {
  for (const list of Object.values(AUTHORS_BY_GENRE)) {
    const hit = list?.find(p => p.id === id);
    if (hit) return hit;
  }
  for (const list of Object.values(SPECIAL_STYLES)) {
    const hit = list?.find(p => p.id === id);
    if (hit) return hit;
  }
  return UNIVERSAL_STYLES.find(p => p.id === id) ?? null;
}

/**
 * Trova un preset per label (legacy: il vecchio campo `authorStyle` salvato come stringa).
 */
export function findStylePresetByLabel(label: string): WritingStylePreset | null {
  const norm = (s: string) => s.toLowerCase().trim();
  const target = norm(label);
  for (const list of Object.values(AUTHORS_BY_GENRE)) {
    const hit = list?.find(p => norm(p.label) === target);
    if (hit) return hit;
  }
  for (const list of Object.values(SPECIAL_STYLES)) {
    const hit = list?.find(p => norm(p.label) === target);
    if (hit) return hit;
  }
  return UNIVERSAL_STYLES.find(p => norm(p.label) === target) ?? null;
}

/**
 * Costruisce il blocco prompt da iniettare nel system prompt per garantire
 * che l'AI generi nello stile selezionato. Funziona sia con preset noti
 * (riconosciuti via id o label) sia con stili custom inseriti a mano.
 */
export function buildWritingStyleBlock(authorStyle: string): string {
  if (!authorStyle?.trim()) return "";
  const preset = findStylePresetById(authorStyle) ?? findStylePresetByLabel(authorStyle);
  if (preset) {
    return `WRITING STYLE LOCK — ${preset.label.toUpperCase()} (${preset.kind})
${preset.promptDirective}

Rispetta questo stile in OGNI paragrafo, non solo all'inizio. Se la generazione devia, ricalibra subito.`;
  }
  // Stile custom (testo libero)
  return `WRITING STYLE LOCK — CUSTOM
Stile richiesto dall'autore: "${authorStyle}".
Interpreta letteralmente: ritmo, lunghezza frasi, vocabolario, struttura paragrafi devono riflettere questo stile in ogni capitolo. Mantienilo coerente dall'inizio alla fine.`;
}
