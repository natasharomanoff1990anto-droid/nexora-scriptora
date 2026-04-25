import { useEffect, useMemo, useState } from "react";
import { Users, Wand2, Save, X, Loader2, BookOpen, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const SCRIPTORA_CHARACTER_BIBLE_KEY = "scriptora-character-bible-v1";
export const SCRIPTORA_CHARACTER_PROJECT_KEY = "scriptora-character-project-v1";

interface Props {
  open: boolean;
  onClose: () => void;
}

const GENRES = [
  { value: "romance", label: "Romance" },
  { value: "dark-romance", label: "Dark Romance" },
  { value: "thriller", label: "Thriller" },
  { value: "fantasy", label: "Fantasy" },
  { value: "memoir", label: "Memoir / Narrativa autobiografica" },
  { value: "historical", label: "Historical fiction" },
  { value: "horror", label: "Horror" },
  { value: "sci-fi", label: "Sci-fi" },
];

const LANGUAGES = ["Italian", "English", "Spanish", "French", "German"];

function fallbackCharacterBible(input: {
  idea: string;
  genre: string;
  subcategory: string;
  tone: string;
  language: string;
}) {
  const isItalian = input.language === "Italian";
  const protagonistName = isItalian ? "Laura" : "Laura";
  const loveName = input.genre.includes("romance") ? (isItalian ? "Elias" : "Elias") : (isItalian ? "Marco" : "Marcus");

  return `Nome: ${protagonistName}
Cognome:
Età: 32
Ruolo nella storia: Protagonista
Aspetto fisico: Da definire con coerenza durante la scrittura, senza contraddizioni.
Carattere: Sensibile, osservatrice, ferita ma non fragile. Tende a scappare quando una verità emotiva diventa troppo vicina.
Ferita interiore: Ha perso fiducia nella possibilità di appartenere davvero a qualcuno o a un luogo.
Desiderio esterno: Ricominciare altrove e trovare una direzione concreta.
Bisogno interiore: Smettere di scappare e imparare a scegliere.
Segreto: Nasconde una paura profonda di essere vista davvero.
Rapporto con gli altri personaggi: Il suo rapporto con ${loveName} deve crescere lentamente, attraverso tensione, silenzi, gesti e conseguenze.
Regole di continuità: Non rinominare mai ${protagonistName}. Non trasformarla in un'altra persona. Ogni capitolo deve rispettare la sua ferita, il suo desiderio e il suo arco emotivo.

Nome: ${loveName}
Cognome:
Età: 35
Ruolo nella storia: Interesse romantico / figura di svolta
Aspetto fisico: Presenza intensa, concreta, non patinata. Deve sembrare una persona reale, non un archetipo generico.
Carattere: Riservato, magnetico, segnato dal passato. Mostra più con i gesti che con le parole.
Ferita interiore: Porta una perdita o un fallimento che lo ha reso prudente nell'amore.
Desiderio esterno: Proteggere il suo mondo e non perdere il controllo.
Bisogno interiore: Accettare che amare di nuovo non significa tradire il passato.
Segreto: C'è una parte della sua storia che non racconta subito.
Rapporto con gli altri personaggi: Con ${protagonistName} deve esserci attrazione, paura, resistenza e progressiva fiducia.
Regole di continuità: Non rinominare mai ${loveName}. Non farlo confessare troppo presto. Ogni intimità deve avere una conseguenza narrativa.`;
}

export function CharacterStudioDialog({ open, onClose }: Props) {
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("romance");
  const [subcategory, setSubcategory] = useState("");
  const [tone, setTone] = useState("poetic, emotional, cinematic, slow-burn");
  const [language, setLanguage] = useState("Italian");
  const [characterBible, setCharacterBible] = useState("");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!open) return;
    try {
      const savedProject = localStorage.getItem(SCRIPTORA_CHARACTER_PROJECT_KEY);
      const savedBible = localStorage.getItem(SCRIPTORA_CHARACTER_BIBLE_KEY);
      if (savedProject) {
        const parsed = JSON.parse(savedProject);
        if (parsed.idea) setIdea(parsed.idea);
        if (parsed.genre) setGenre(parsed.genre);
        if (parsed.subcategory) setSubcategory(parsed.subcategory);
        if (parsed.tone) setTone(parsed.tone);
        if (parsed.language) setLanguage(parsed.language);
        if (parsed.characterBible) setCharacterBible(parsed.characterBible);
      } else if (savedBible) {
        setCharacterBible(savedBible);
      }
    } catch {
      /* noop */
    }
  }, [open]);

  const canGenerate = idea.trim().length >= 8;

  const projectPayload = useMemo(() => ({
    idea: idea.trim(),
    genre,
    subcategory: subcategory.trim(),
    tone: tone.trim(),
    language,
    category: "Fiction",
    bookType: "novel",
    characterBible: characterBible.trim(),
    createdAt: new Date().toISOString(),
  }), [idea, genre, subcategory, tone, language, characterBible]);

  const generate = async () => {
    if (!canGenerate || loading) return;
    setLoading(true);
    setSaved(false);

    try {
      const { data, error } = await supabase.functions.invoke("scriptora-character-bible", {
        body: {
          idea: idea.trim(),
          genre,
          subcategory: subcategory.trim(),
          tone: tone.trim(),
          language,
        },
      });

      if (error) throw error;

      const output =
        data?.characterBible ||
        data?.bible ||
        data?.text ||
        data?.result ||
        "";

      const finalText = String(output || "").trim() || fallbackCharacterBible({
        idea,
        genre,
        subcategory,
        tone,
        language,
      });

      setCharacterBible(finalText);
      toast.success("Personaggi generati. Ora salvali e collegali a Nuovo Libro.");
    } catch (e) {
      const finalText = fallbackCharacterBible({
        idea,
        genre,
        subcategory,
        tone,
        language,
      });
      setCharacterBible(finalText);
      toast.warning("AI non disponibile: ho creato una Character Bible locale di sicurezza.");
    } finally {
      setLoading(false);
    }
  };

  const saveAndLink = () => {
    const bible = characterBible.trim();
    if (!bible) {
      toast.error("Prima genera o scrivi i personaggi.");
      return;
    }

    const payload = {
      ...projectPayload,
      characterBible: bible,
      savedAt: new Date().toISOString(),
    };

    localStorage.setItem(SCRIPTORA_CHARACTER_BIBLE_KEY, bible);
    sessionStorage.setItem(SCRIPTORA_CHARACTER_BIBLE_KEY, bible);
    localStorage.setItem(SCRIPTORA_CHARACTER_PROJECT_KEY, JSON.stringify(payload));
    sessionStorage.setItem(SCRIPTORA_CHARACTER_PROJECT_KEY, JSON.stringify(payload));

    window.dispatchEvent(new Event("scriptora-character-bible-change"));
    setSaved(true);
    toast.success("Personaggi collegati. Ora apri Nuovo Libro: Scriptora li userà nel romanzo.");
  };

  const clear = () => {
    localStorage.removeItem(SCRIPTORA_CHARACTER_BIBLE_KEY);
    sessionStorage.removeItem(SCRIPTORA_CHARACTER_BIBLE_KEY);
    localStorage.removeItem(SCRIPTORA_CHARACTER_PROJECT_KEY);
    sessionStorage.removeItem(SCRIPTORA_CHARACTER_PROJECT_KEY);
    setCharacterBible("");
    setSaved(false);
    toast.info("Character Bible rimossa.");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-pink-500/15 text-pink-400 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">Scriptora Character Studio</h2>
              <p className="text-xs text-muted-foreground">
                Crea personaggi canonici e collegali al prossimo romanzo.
              </p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 space-y-5">
          <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-4">
            <div>
              <Label>Idea del romanzo</Label>
              <Textarea
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                rows={3}
                placeholder="Es. Una scrittrice americana arriva nel deserto per fuggire dal passato e incontra un uomo segnato da una perdita..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <Label>Genere romanzo</Label>
                <Select value={genre} onValueChange={setGenre}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {GENRES.map((g) => (
                      <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Filone / sottogenere</Label>
                <Input
                  value={subcategory}
                  onChange={(e) => setSubcategory(e.target.value)}
                  placeholder="slow burn, desert romance..."
                />
              </div>

              <div>
                <Label>Lingua</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l} value={l}>{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Tono</Label>
                <Input
                  value={tone}
                  onChange={(e) => setTone(e.target.value)}
                  placeholder="poetico, intenso..."
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={generate} disabled={!canGenerate || loading}>
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                Genera personaggi con Scriptora
              </Button>

              <Button variant="secondary" onClick={saveAndLink} disabled={!characterBible.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Salva e collega a Nuovo Libro
              </Button>

              <Button variant="ghost" onClick={clear}>
                Svuota
              </Button>
            </div>

            {saved && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 mt-0.5" />
                <div>
                  <strong>Collegamento attivo.</strong> Quando apri “Nuovo Libro”, Scriptora sa già che stai creando un romanzo di genere <strong>{genre}</strong>{subcategory ? ` / ${subcategory}` : ""} e userà questi personaggi come Character Lock.
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>Output personaggi / Character Bible</Label>
              <span className="text-[11px] text-muted-foreground">
                Questo testo viene passato al motore di scrittura
              </span>
            </div>
            <Textarea
              value={characterBible}
              onChange={(e) => {
                setCharacterBible(e.target.value);
                setSaved(false);
              }}
              rows={18}
              placeholder="Qui apparirà la Character Bible generata da Scriptora..."
              className="font-mono text-xs leading-relaxed"
            />
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <BookOpen className="h-4 w-4 text-primary mt-0.5" />
              <p>
                Dopo il salvataggio, vai su <strong>Nuovo Libro</strong>. Se il genere è narrativo, Scriptora collega automaticamente cast, filone, tono e continuità al progetto. Il motore non deve più inventare nomi a caso.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
