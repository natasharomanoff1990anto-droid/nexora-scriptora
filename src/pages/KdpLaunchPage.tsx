import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Loader2, Rocket, Sparkles, TrendingUp, Trophy, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { KdpScoreBadge } from "@/components/kdp/KdpScoreBadge";
import { KdpTitleDomination } from "@/components/kdp/KdpTitleDomination";
import { fetchPlan, type PlanTier } from "@/lib/plan";
import {
  analyzeMarket, generateTitleVariants, kdpPackaging, predictSuccess,
  type MarketAnalysis, type TitleVariants, type KDPPackaging, type SuccessPrediction,
} from "@/lib/kdp/money-engine";
import { useFeatureGate } from "@/components/PaywallGuard";

type Step = "idea" | "market" | "title" | "packaging" | "predict";

/** Tiny inline badge: shows whether the result was grounded with live market data. */
function GroundingBadge({ meta }: { meta: { groundingUsed?: boolean; groundingResultsCount?: number } }) {
  if (meta?.groundingUsed) {
    return (
      <Badge variant="outline" className="border-primary/40 text-primary text-[10px] font-medium">
        ● Dati di mercato in tempo reale{meta.groundingResultsCount ? ` (${meta.groundingResultsCount})` : ""}
      </Badge>
    );
  }
  return <Badge variant="secondary" className="text-[10px]">Analisi base</Badge>;
}

export default function KdpLaunchPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("idea");
  const [loading, setLoading] = useState(false);
  // KDP base (market analysis + titles + packaging) requires Pro.
  const baseGate = useFeatureGate("kdp_market_base");
  // Bestseller prediction requires Premium.
  const predictGate = useFeatureGate("bestseller_prediction");

  // Inputs
  const [idea, setIdea] = useState("");
  const [genre, setGenre] = useState("Self-help");
  const [language, setLanguage] = useState("Italian");

  // Results
  const [market, setMarket] = useState<MarketAnalysis | null>(null);
  const [titles, setTitles] = useState<TitleVariants | null>(null);
  const [packaging, setPackaging] = useState<KDPPackaging | null>(null);
  const [prediction, setPrediction] = useState<SuccessPrediction | null>(null);
  const [chosenTitle, setChosenTitle] = useState<string>("");
  const [chosenSubtitle, setChosenSubtitle] = useState<string>("");

  async function getPlan(): Promise<PlanTier> {
    return await fetchPlan().catch(() => "free");
  }

  const runMarket = baseGate.guard(async () => {
    if (!idea.trim()) return toast.error("Inserisci un'idea per iniziare");
    setLoading(true);
    try {
      const plan = await getPlan();
      const m = await analyzeMarket(idea, { genre, language, plan });
      setMarket(m);
      setStep("market");
    } catch (e: any) {
      toast.error(e?.message || "Analisi fallita");
    } finally { setLoading(false); }
  });

  const runTitles = baseGate.guard(async () => {
    setLoading(true);
    try {
      const plan = await getPlan();
      const t = await generateTitleVariants(market?.recommendedAngle || idea, {
        genre,
        language,
        plan,
        subNiche: market?.subNiche,
        recommendedAngle: market?.recommendedAngle,
      });
      setTitles(t);
      const top = t.topPicks?.[0];
      if (top) { setChosenTitle(top.title); setChosenSubtitle(top.subtitle); }
      setStep("title");
    } catch (e: any) {
      toast.error(e?.message || "Generazione titoli fallita");
    } finally { setLoading(false); }
  });

  const runPackaging = baseGate.guard(async () => {
    if (!chosenTitle) return toast.error("Scegli un titolo");
    setLoading(true);
    try {
      const plan = await getPlan();
      const p = await kdpPackaging(
        { title: chosenTitle, subtitle: chosenSubtitle, promise: market?.recommendedAngle, genre, language },
        plan,
      );
      setPackaging(p);
      setStep("packaging");
    } catch (e: any) {
      toast.error(e?.message || "Packaging fallito");
    } finally { setLoading(false); }
  });

  const runPredict = predictGate.guard(async () => {
    setLoading(true);
    try {
      const plan = await getPlan();
      const pr = await predictSuccess(
        { title: chosenTitle, subtitle: chosenSubtitle, promise: market?.recommendedAngle, genre, language },
        plan,
      );
      setPrediction(pr);
      setStep("predict");
    } catch (e: any) {
      toast.error(e?.message || "Predizione fallita");
    } finally { setLoading(false); }
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl p-6 space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Rocket className="h-6 w-6 text-primary" /> KDP Launch
            </h1>
            <p className="text-sm text-muted-foreground">
              Crea un prodotto che vende su Amazon — non solo un libro.
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate(-1)}>← Indietro</Button>
        </header>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {(["idea", "market", "title", "packaging", "predict"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full border ${step === s ? "bg-primary text-primary-foreground border-primary" : "border-border"}`}>
                {i + 1}. {s}
              </span>
              {i < 4 && <ArrowRight className="h-3 w-3" />}
            </div>
          ))}
        </div>

        {/* STEP 1 — Idea */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> La tua idea</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Genere</Label>
                <Input value={genre} onChange={(e) => setGenre(e.target.value)} placeholder="Self-help, Romance…" />
              </div>
              <div>
                <Label>Lingua</Label>
                <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="Italian" />
              </div>
            </div>
            <div>
              <Label>Idea / promessa</Label>
              <Textarea
                rows={3}
                placeholder="Es. Un metodo in 30 giorni per smettere di procrastinare per imprenditori in burnout"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button onClick={runMarket} disabled={loading || !idea.trim()}>
                {loading && step === "idea" ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <TrendingUp className="h-4 w-4 mr-2" />}
                Analizza mercato
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* STEP 2 — Market */}
        {market && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Mercato</span>
                <div className="flex gap-2">
                  <KdpScoreBadge kind="profitability" score={market.profitabilityScore} />
                  <Badge variant="outline">Niche {market.nicheScore.toFixed(1)}/10</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div><span className="text-muted-foreground">Domanda:</span> <Badge variant="secondary">{market.demandLevel}</Badge></div>
                <div><span className="text-muted-foreground">Competizione:</span> <Badge variant="secondary">{market.competitionLevel}</Badge></div>
              </div>
              {market.subNiche && <p><span className="text-muted-foreground">Sotto-nicchia:</span> <strong>{market.subNiche}</strong></p>}
              <p className="leading-relaxed"><span className="text-muted-foreground">Angolo consigliato:</span><br />{market.recommendedAngle}</p>
              {market.reasoning && <p className="text-xs text-muted-foreground italic">{market.reasoning}</p>}
              {market.groundingUsed && (
                <p className="text-xs text-primary">✓ Dati di mercato in tempo reale</p>
              )}
              <div className="flex justify-end">
                <Button onClick={runTitles} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
                  Genera titoli vincenti
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 3 — Titles */}
        {titles && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><Wand2 className="h-4 w-4 text-primary" /> Top 3 combinazioni</span>
                <GroundingBadge meta={titles} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {titles.topPicks.map((p, i) => {
                const selected = chosenTitle === p.title;
                return (
                  <button
                    key={`stable-${i}`}
                    onClick={() => { setChosenTitle(p.title); setChosenSubtitle(p.subtitle); }}
                    className={`w-full text-left p-3 rounded-lg border transition ${selected ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50"}`}
                  >
                    <div className="font-semibold">{p.title}</div>
                    <div className="text-sm text-muted-foreground">{p.subtitle}</div>
                    <div className="text-xs text-muted-foreground italic mt-1">{p.reason}</div>
                  </button>
                );
              })}
              <Separator />
              <details className="text-xs">
                <summary className="cursor-pointer text-muted-foreground">Tutti i {titles.titles.length} titoli + {titles.subtitles.length} sottotitoli</summary>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <ul className="space-y-1">{titles.titles.map((t, i) => <li key={`stable-${i}`}>• {t}</li>)}</ul>
                  <ul className="space-y-1">{titles.subtitles.map((s, i) => <li key={`stable-${i}`}>• {s}</li>)}</ul>
                </div>
              </details>
              <div className="flex justify-end">
                <Button onClick={runPackaging} disabled={loading || !chosenTitle}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Rocket className="h-4 w-4 mr-2" />}
                  Crea packaging KDP
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 4 — Packaging */}
        {packaging && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Packaging Amazon</span>
                <GroundingBadge meta={packaging} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <Label>Descrizione</Label>
                <Textarea rows={8} readOnly value={packaging.amazonDescription} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Keyword backend</Label>
                  <ul className="text-xs space-y-1 mt-1">{packaging.backendKeywords.map((k, i) => <li key={`stable-${i}`}>• {k}</li>)}</ul>
                </div>
                <div>
                  <Label>Categorie KDP</Label>
                  <ul className="text-xs space-y-1 mt-1">{packaging.categories.map((c, i) => <li key={`stable-${i}`}>• {c}</li>)}</ul>
                </div>
              </div>
              <div>
                <Label>Bullet di vendita</Label>
                <ul className="text-xs space-y-1 mt-1">{packaging.bulletPoints.map((b, i) => <li key={`stable-${i}`}>• {b}</li>)}</ul>
              </div>
              <div className="flex justify-end">
                <Button onClick={runPredict} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trophy className="h-4 w-4 mr-2" />}
                  Calcola probabilità bestseller
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP 5 — Prediction */}
        {prediction && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Bestseller Prediction</span>
                <KdpScoreBadge kind="bestseller" score={prediction.successScore} />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="text-xs font-semibold text-primary mb-1">Forze</div>
                  <ul className="space-y-1">{prediction.strengths.map((x, i) => <li key={`stable-${i}`}>✓ {x}</li>)}</ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-destructive mb-1">Debolezze</div>
                  <ul className="space-y-1">{prediction.weaknesses.map((x, i) => <li key={`stable-${i}`}>✗ {x}</li>)}</ul>
                </div>
                <div>
                  <div className="text-xs font-semibold mb-1">Migliorie</div>
                  <ul className="space-y-1">{prediction.improvements.map((x, i) => <li key={`stable-${i}`}>→ {x}</li>)}</ul>
                </div>
              </div>
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setStep("idea")}>Nuova idea</Button>
                <Button onClick={() => navigate("/dashboard")}>Vai a scrivere il libro</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* === KDP Title Domination — incremental, isolated section === */}
        <KdpTitleDomination
          defaults={{
            idea,
            genre,
            language,
            mainProblem: market?.subNiche,
            desiredPromise: market?.recommendedAngle,
          }}
          onUseTitle={(t, s) => {
            setChosenTitle(t);
            setChosenSubtitle(s);
            if (step === "idea" || step === "market") setStep("title");
          }}
        />
      </div>
    </div>
  );
}
