import { useEffect, useState } from "react";
import { Settings, X, Check, Languages, Type, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  SCRIPTORA_BACKGROUNDS,
  WRITING_FONTS,
  loadScriptoraAppearance,
  saveScriptoraAppearance,
  type ScriptoraBackgroundId,
  type ScriptoraWritingFont,
} from "@/lib/scriptora-appearance";
import { getUILanguage, setUILanguage, UI_LANGUAGES, type UILanguage } from "@/lib/i18n";

interface Props {
  open: boolean;
  onClose: () => void;
  onLanguageChanged?: () => void;
}


function normalizeLanguageOption(option: any): { value: string; label: string } {
  if (typeof option === "string") {
    return { value: option, label: option };
  }

  const value = String(
    option?.value ??
    option?.code ??
    option?.id ??
    option?.lang ??
    option?.language ??
    "Italian"
  );

  const label = String(
    option?.label ??
    option?.name ??
    option?.title ??
    value
  );

  return { value, label };
}

function safeUpper(value: any): string {
  return String(value ?? "").toUpperCase();
}

export function AdvancedAppearanceDialog({ open, onClose, onLanguageChanged }: Props) {
  const [backgroundId, setBackgroundId] = useState<ScriptoraBackgroundId>("midnight-ink");
  const [writingFont, setWritingFont] = useState<ScriptoraWritingFont>("system");
  const [uiLanguage, setUiLanguage] = useState<UILanguage>(getUILanguage());

  useEffect(() => {
    if (!open) return;
    const saved = loadScriptoraAppearance();
    setBackgroundId(saved.backgroundId);
    setWritingFont(saved.writingFont);
    setUiLanguage(getUILanguage());
  }, [open]);

  const saveSettings = () => {
    try {
      localStorage.setItem("scriptora-appearance-settings", JSON.stringify(settings));
      applyScriptoraAppearance();
      onLanguageChanged?.();
      window.dispatchEvent(new Event("scriptora-language-change"));
      window.dispatchEvent(new Event("scriptora-appearance-change"));
    } catch (e) {
      console.warn("[Scriptora settings] save/apply failed", e);
    }

    toast.success("Impostazioni salvate.");
    onClose();
  };

  if (!open) return null;

  const changeBackground = (id: ScriptoraBackgroundId) => {
    try {
      setSettings((prev) => {
        const next = { ...prev, backgroundId: id };
        localStorage.setItem("scriptora-appearance-settings", JSON.stringify(next));
        return next;
      });
      document.documentElement.setAttribute("data-scriptora-bg", id);
      applyScriptoraAppearance();
      toast.success("Sfondo aggiornato.");
    } catch (e) {
      console.warn("[Scriptora settings] background change failed", e);
      toast.error("Non sono riuscito a cambiare sfondo.");
    }
  };

  const changeFont = (id: ScriptoraWritingFontId) => {
    try {
      setSettings((prev) => {
        const next = { ...prev, writingFontId: id };
        localStorage.setItem("scriptora-appearance-settings", JSON.stringify(next));
        return next;
      });
      document.documentElement.setAttribute("data-scriptora-font", id);
      applyScriptoraAppearance();
      toast.success("Carattere aggiornato.");
    } catch (e) {
      console.warn("[Scriptora settings] font change failed", e);
      toast.error("Non sono riuscito a cambiare carattere.");
    }
  };

  const changeLanguage = (value: any) => {
    const next = normalizeLanguageOption(value).value as any;
    try {
      setUILanguage(next);
      setUiLanguage(next);
      onLanguageChanged?.();
      window.dispatchEvent(new Event("scriptora-language-change"));
      toast.success("Lingua app aggiornata.");
    } catch (e) {
      console.warn("[Scriptora settings] language change failed", e);
      toast.error("Non sono riuscito a cambiare lingua.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-2xl border border-border bg-card shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card/95 p-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Impostazioni avanzate Scriptora</h2>
              <p className="text-xs text-muted-foreground">Lingua app, sfondo e carattere di scrittura.</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
        </div>

        <div className="space-y-6 p-5">
          <section className="rounded-2xl border border-border/70 bg-background/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Languages className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Lingua dell’app</h3>
            </div>
            <p className="mb-3 text-xs text-muted-foreground">Cambia solo l’interfaccia. La lingua dei libri resta dentro “Nuovo Libro”.</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
              {UI_LANGUAGES.map((lang) => {
                const active = uiLanguage === lang;
                return (
                  <button key={lang} type="button" onClick={() => changeLanguage(normalizeLanguageOption(lang).value as any)}
                    className={`rounded-xl border px-3 py-2 text-sm transition-all ${active ? "border-primary bg-primary/15 text-foreground" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/50 hover:text-foreground"}`}>
                    {active && <Check className="mr-1 inline h-3 w-3" />}
                    {safeUpper(normalizeLanguageOption(lang).label)}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-background/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Sfondi Scriptora</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {SCRIPTORA_BACKGROUNDS.map((bg) => {
                const active = backgroundId === bg.id;
                return (
                  <button key={bg.id} type="button" onClick={() => changeBackground(bg.id)}
                    className={`overflow-hidden rounded-2xl border text-left transition-all ${active ? "border-primary ring-2 ring-primary/30" : "border-border/70 hover:border-primary/50"}`}>
                    <div className="h-24" style={{ background: bg.css }} />
                    <div className="space-y-1 bg-card/90 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{bg.name}</p>
                        {active && <Check className="h-4 w-4 text-primary" />}
                      </div>
                      <p className="text-xs text-muted-foreground">{bg.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-border/70 bg-background/40 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Carattere di scrittura</h3>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              {WRITING_FONTS.map((font) => {
                const active = writingFont === font.id;
                return (
                  <button key={font.id} type="button" onClick={() => changeFont(font.id)}
                    className={`rounded-xl border p-3 text-left transition-all ${active ? "border-primary bg-primary/15" : "border-border bg-muted/20 hover:border-primary/50"}`}
                    style={{ fontFamily: font.css }}>
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold">{font.name}</p>
                      {active && <Check className="h-4 w-4 text-primary" />}
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">La prima frase è una porta. La seconda decide se il lettore entra.</p>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <div className="sticky bottom-0 border-t border-border bg-card/95 p-4 backdrop-blur">
          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border px-4 py-2 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
            >
              Chiudi
            </button>
            <button
              type="button"
              onClick={saveSettings}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Salva impostazioni
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
