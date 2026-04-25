
import { useEffect, useState } from "react";
import { Sparkles, X, Save, Wand2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const SCRIPTORA_CHARACTER_BIBLE_KEY = "scriptora-character-bible-v1";

interface Props {
  open: boolean;
  onClose: () => void;
}

const GENRES = [
  "romance",
  "dark-romance",
  "thriller",
  "fantasy",
  "memoir",
  "historical",
  "horror",
  "sci-fi",
];

const LANGUAGES = ["Italian", "English", "Spanish", "French", "German"];

function fallbackCharacterBible(idea: string, genre: string, language: string) {
  const italian = language === "Italian";
  if (italian) {
    return `Nome: Laura
Cognome: Moretti
Età: 32
Ruolo nella storia: Protagonista
Aspetto fisico: Presenza naturale, sguardo attento, movimenti trattenuti.
Carattere: Sensibile, lucida, ferita ma non fragile. Tende a osservare prima di agire.
Ferita interiore: Ha perso fiducia nella possibilità di essere scelta davvero.
Desiderio esterno: Ricostruire una vita nuova partendo dall'idea del romanzo: ${idea}
Bisogno interiore: Smettere di confondere la sopravvivenza con l'amore.
Segreto: Teme che restare significhi perdere sé stessa.
Rapporto con gli altri personaggi: È il centro emotivo della storia.
Regole di continuità: Non cambiare mai nome, età, ruolo o ferita. Laura resta Laura per tutto il romanzo.

Nome: Elias
Cognome: Romano
Età: 36
Ruolo nella storia: Interesse romantico / figura specchio
Aspetto fisico: Lineamenti intensi, gesti misurati, presenza silenziosa.
Carattere: Protettivo, riservato, profondo, con dolore trattenuto.
Ferita interiore: Ha amato e perso, quindi teme di desiderare ancora.
Desiderio esterno: Restare fedele al proprio passato senza rinunciare al futuro.
Bisogno interiore: Capire che amare di nuovo non significa tradire ciò che ha perduto.
Segreto: Porta una colpa che non ha mai confessato.
Rapporto con gli altri personaggi: È attratto da Laura ma resiste per paura.
Regole di continuità: Non cambiare mai nome, età, ruolo o trauma. Elias resta Elias per tutto il romanzo.`;
  }

  return `Name: Laura
Surname: Moretti
Age: 32
Role: Protagonist
Physical description: Natural presence, attentive eyes, restrained movements.
Personality: Sensitive, lucid, wounded but not weak.
Core wound: She has lost faith in being truly chosen.
External desire: Rebuild her life through the story idea: ${idea}
Internal need: Stop confusing survival with love.
Secret: She fears that staying means losing herself.
Relationship to other characters: Emotional center of the story.
Strict continuity rules: Never rename Laura. Never change her age, role, wound or emotional arc.

Name: Elias
Surname: Romano
Age: 36
Role: Romantic lead / mirror character
Physical description: Intense features, measured gestures, quiet presence.
Personality: Protective, reserved, deep, emotionally guarded.
Core wound: He loved and lost, so he fears wanting again.
External desire: Stay loyal to his past without giving up the future.
Internal need: Understand that loving again does not betray what he lost.
Secret: He carries guilt he has never confessed.
Relationship to other characters: Drawn to Laura but resisting.
Strict continuity rules: Never rename Elias. Never change his age, role, trauma or relationship to Laura.`;
}

export function CharacterStudioDialog({ open, onClose }: Props) {
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("romance");
  const [language, setLanguage] = useState("Italian");
  const [tone, setTone] = useState("emotivo, cinematografico, bestseller");
  const [count, setCount] = useState(4);
  const [characterBible, setCharacterBible] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    try {
      const saved = sessionStorage.getItem(SCRIPTORA_CHARACTER_BIBLE_KEY) || localStorage.getItem(SCRIPTORA_CHARACTER_BIBLE_KEY) || "";
      if (saved && !characterBible) setCharacterBible(saved);
    } catch {
      // noop
    }
  }, [open, characterBible]);

  if (!open) return null;

  const saveBible = (text = characterBible) => {
    const clean = text.trim();
    if (!clean) {
      toast.error("Prima genera o scrivi i personaggi.");
      return;
    }

    sessionStorage.setItem(SCRIPTORA_CHARACTER_BIBLE_KEY, clean);
    localStorage.setItem(SCRIPTORA_CHARACTER_BIBLE_KEY, clean);
    toast.success("Personaggi salvati. Verranno collegati al prossimo romanzo creato da Nuovo Libro.");
  };

  const generateCharacters = async () => {
    if (idea.trim().length < 10) {
      toast.error("Scrivi almeno una piccola idea del romanzo.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("scriptora-character-bible", {
        body: {
          idea: idea.trim(),
          genre,
          language,
          tone,
          count,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const generated = String(data?.characterBible || "").trim();
      if (!generated) throw new Error("Scriptora non ha restituito personaggi validi.");

      setCharacterBible(generated);
      saveBible(generated);
    } catch (e) {
      const generated = fallbackCharacterBible(idea, genre, language);
      setCharacterBible(generated);
      saveBible(generated);
      toast.warning("Generazione cloud non disponibile: ho creato una base locale modificabile.");
    } finally {
      setLoading(false);
    }
  };

  const clearBible = () => {
    setCharacterBible("");
    sessionStorage.removeItem(SCRIPTORA_CHARACTER_BIBLE_KEY);
    localStorage.removeItem(SCRIPTORA_CHARACTER_BIBLE_KEY);
    toast.info("Character Bible svuotata.");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Chiudi"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mb-5 flex items-start gap-3 pr-10">
          <div className="h-10 w-10 rounded-xl bg-primary/15 text-primary flex items-center justify-center shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              Character Studio
              <Sparkles className="h-4 w-4 text-primary" />
            </h2>
            <p className="text-sm text-muted-foreground">
              Crea automaticamente il cast del romanzo. Scriptora lo userà come blocco di continuità quando apri Nuovo Libro.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
          <div className="md:col-span-2">
            <Label>Idea del romanzo</Label>
            <Textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              placeholder="Es. Una donna scappa nel deserto dopo una perdita e incontra un uomo che non riesce più ad amare."
              rows={3}
              disabled={loading}
            />
          </div>

          <div>
            <Label>Genere</Label>
            <Select value={genre} onValueChange={setGenre} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {GENRES.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Lingua</Label>
            <Select value={language} onValueChange={setLanguage} disabled={loading}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Label>Tono narrativo</Label>
            <Input
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              placeholder="emotivo, cinematografico, bestseller"
              disabled={loading}
            />
          </div>

          <div>
            <Label>Numero personaggi</Label>
            <Input
              type="number"
              min={2}
              max={8}
              value={count}
              onChange={(e) => setCount(Math.max(2, Math.min(8, Number(e.target.value) || 4)))}
              disabled={loading}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button onClick={generateCharacters} disabled={loading || idea.trim().length < 10}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
            Genera personaggi con Scriptora
          </Button>

          <Button variant="outline" onClick={() => saveBible()} disabled={loading || !characterBible.trim()}>
            <Save className="h-4 w-4 mr-2" />
            Salva e collega a Nuovo Libro
          </Button>

          <Button variant="ghost" onClick={clearBible} disabled={loading}>
            Svuota
          </Button>
        </div>

        <div>
          <Label>Character Bible generata</Label>
          <Textarea
            value={characterBible}
            onChange={(e) => setCharacterBible(e.target.value)}
            placeholder="Qui appariranno i personaggi canonici del romanzo..."
            rows={18}
            className="font-mono text-xs leading-relaxed"
            disabled={loading}
          />
          <p className="mt-2 text-xs text-muted-foreground">
            Quando crei un romanzo da “Nuovo Libro”, Scriptora aggancia automaticamente questi personaggi al progetto e li passa al motore di scrittura.
          </p>
        </div>
      </div>
    </div>
  );
}
