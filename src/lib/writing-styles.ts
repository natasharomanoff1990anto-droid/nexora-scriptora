import { resolveGenreKey, type GenreKey } from "@/lib/genre-intelligence";

export interface WritingStylePreset {
  id: string;
  label: string;
  kind: "author" | "style";
  hint: string;
  promptDirective: string;
}

export const UNIVERSAL_STYLES: WritingStylePreset[] = [
  {
    id: "style-platinum",
    label: "Standard Platino Scriptora",
    kind: "style",
    hint: "Il massimo impatto editoriale contemporaneo.",
    promptDirective: "STRUTTURA: Alterna 3 frasi poetiche a 1 secca in grassetto. Metafore architettoniche. Zero aggettivi astratti. Sostantivi pesanti."
  }
];

export const AUTHORS_BY_GENRE: Partial<Record<GenreKey, WritingStylePreset[]>> = {
  "self-help": [
    { 
      id: "auth-platinum-ghostwriter", 
      label: "Ghostwriter d'Elite (Platino)", 
      kind: "author", 
      hint: "Stile Brianna Wiest + Mark Manson radicale.",
      promptDirective: "Canalizza Brianna Wiest e Mark Manson: schiettezza radicale, verità universali brutali, incipit su dettaglio fisico microscopico, metafore biologiche. **Usa il grassetto per le verità isolate.**" 
    }
  ]
};

export function getStylesForGenre(genre: string): WritingStylePreset[] {
  return [...(AUTHORS_BY_GENRE[genre as GenreKey] || []), ...UNIVERSAL_STYLES];
}
