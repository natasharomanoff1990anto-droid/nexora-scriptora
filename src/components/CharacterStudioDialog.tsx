import { useEffect, useState } from "react";
import { Users, Save, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const SCRIPTORA_CHARACTER_BIBLE_KEY = "scriptora-character-bible-draft";

interface Props {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_BIBLE = `Nome:
Cognome:
Età:
Ruolo nella storia:
Aspetto fisico:
Carattere:
Ferita interiore:
Desiderio esterno:
Bisogno interiore:
Segreto:
Rapporto con gli altri personaggi:
Regole di continuità: non cambiare nome, ruolo, ferita, desiderio o relazione senza decisione dell'autore.

Nome:
Cognome:
Età:
Ruolo nella storia:
Aspetto fisico:
Carattere:
Ferita interiore:
Desiderio esterno:
Bisogno interiore:
Segreto:
Rapporto con gli altri personaggi:
Regole di continuità: non cambiare nome, ruolo, ferita, desiderio o relazione senza decisione dell'autore.`;

export function CharacterStudioDialog({ open, onClose }: Props) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (!open) return;
    try {
      const saved = localStorage.getItem(SCRIPTORA_CHARACTER_BIBLE_KEY);
      setText(saved || DEFAULT_BIBLE);
    } catch {
      setText(DEFAULT_BIBLE);
    }
  }, [open]);

  if (!open) return null;

  const save = () => {
    const clean = text.trim();
    if (!clean || clean.length < 20) {
      toast.error("Aggiungi almeno un personaggio prima di salvare.");
      return;
    }

    localStorage.setItem(SCRIPTORA_CHARACTER_BIBLE_KEY, clean);
    sessionStorage.setItem(SCRIPTORA_CHARACTER_BIBLE_KEY, clean);
    toast.success("Personaggi salvati. Verranno collegati al prossimo romanzo.");
    onClose();
  };

  const clear = () => {
    localStorage.removeItem(SCRIPTORA_CHARACTER_BIBLE_KEY);
    sessionStorage.removeItem(SCRIPTORA_CHARACTER_BIBLE_KEY);
    setText(DEFAULT_BIBLE);
    toast.success("Bibbia personaggi svuotata.");
  };

  const generateTemplate = () => {
    setText(DEFAULT_BIBLE);
    toast.info("Schema personaggi pronto da compilare.");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Character Studio</h2>
                <p className="text-xs text-muted-foreground">
                  Crea i personaggi canonici prima del romanzo. Scriptora userà questi nomi e queste regole durante la scrittura.
                </p>
              </div>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-3">
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <strong className="text-foreground">A cosa serve:</strong> evita che Scriptora trasformi Laura in Lucia, cambi età,
            inventi protagonisti inutili o rompa la continuità emotiva del romanzo.
          </div>

          <div>
            <Label htmlFor="character-bible">Bibbia personaggi</Label>
            <Textarea
              id="character-bible"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={18}
              className="mt-2 font-mono text-xs"
              placeholder="Inserisci nomi, ruoli, relazioni, ferite, desideri e regole di continuità..."
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={generateTemplate}>
                <Sparkles className="mr-2 h-4 w-4" />
                Schema
              </Button>
              <Button type="button" variant="ghost" onClick={clear}>
                Svuota
              </Button>
            </div>

            <Button type="button" onClick={save}>
              <Save className="mr-2 h-4 w-4" />
              Salva personaggi
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
