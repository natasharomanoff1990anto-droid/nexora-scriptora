import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BarChart3, BookOpen, Search, ShieldAlert, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { runBestsellerRadar } from "@/services/bestsellerRadarService";

type RadarResult = {
  title: string;
  author: string;
  category: string;
  price: string;
  rating: string;
  reviews: string;
  demand: "Alta" | "Media" | "Bassa";
  competition: "Alta" | "Media" | "Bassa";
  potential: number;
  insight: string;
};

const sampleByGenre: Record<string, RadarResult[]> = {
  romance: [
    {
      title: "La promessa che non dovevo fare",
      author: "Autrice bestseller",
      category: "Romance contemporaneo",
      price: "€4,99",
      rating: "4.5",
      reviews: "3.200+",
      demand: "Alta",
      competition: "Alta",
      potential: 8.1,
      insight: "Funziona perché unisce promessa emotiva, ferita romantica e titolo immediatamente leggibile.",
    },
    {
      title: "Quando tornerai da me",
      author: "Autrice indipendente",
      category: "Second chance romance",
      price: "€3,99",
      rating: "4.3",
      reviews: "1.100+",
      demand: "Alta",
      competition: "Media",
      potential: 8.6,
      insight: "Buona opportunità: nicchia emotiva forte, titolo semplice, promessa chiara.",
    },
  ],
  thriller: [
    {
      title: "La casa senza finestre",
      author: "Autore crime",
      category: "Thriller psicologico",
      price: "€5,99",
      rating: "4.4",
      reviews: "2.800+",
      demand: "Alta",
      competition: "Alta",
      potential: 7.9,
      insight: "Titolo visuale e inquietante. Il mercato premia mistero domestico e segreti familiari.",
    },
    {
      title: "L’ultima bugia",
      author: "Autrice noir",
      category: "Suspense",
      price: "€4,49",
      rating: "4.2",
      reviews: "900+",
      demand: "Media",
      competition: "Media",
      potential: 7.4,
      insight: "Angolo classico ma efficace: promessa immediata, facile da comunicare in ads e copertina.",
    },
  ],
  selfhelp: [
    {
      title: "Smetti di tradirti",
      author: "Coach bestseller",
      category: "Crescita personale",
      price: "€6,99",
      rating: "4.6",
      reviews: "4.500+",
      demand: "Alta",
      competition: "Alta",
      potential: 8.3,
      insight: "Promessa forte, diretta, quasi dolorosa. Il lettore capisce subito il beneficio emotivo.",
    },
    {
      title: "La disciplina gentile",
      author: "Autore motivazionale",
      category: "Abitudini e mindset",
      price: "€5,49",
      rating: "4.4",
      reviews: "1.700+",
      demand: "Alta",
      competition: "Media",
      potential: 8.7,
      insight: "Ottimo spazio: unisce performance e tono morbido, quindi intercetta lettori stanchi del self-help aggressivo.",
    },
  ],
};

const fallbackResults = sampleByGenre.romance;

export default function BestsellerRadarPage() {
  const navigate = useNavigate();
  const [genre, setGenre] = useState("romance");
  const [keyword, setKeyword] = useState("");
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [liveResults, setLiveResults] = useState<RadarResult[] | null>(null);
  const [liveScore, setLiveScore] = useState<number | null>(null);
  const [liveSummary, setLiveSummary] = useState("");
  const [error, setError] = useState("");

  const results = useMemo(() => {
    return liveResults ?? sampleByGenre[genre] ?? fallbackResults;
  }, [genre]);

  const marketScore = useMemo(() => {
    const avg = results.reduce((sum, item) => sum + item.potential, 0) / results.length;
    return liveScore !== null ? liveScore.toFixed(1) : avg.toFixed(1);
  }, [results]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Dashboard
          </Button>

          <div className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-300">
            MVP Market Intelligence
          </div>
        </div>

        <section className="overflow-hidden rounded-3xl border border-border/70 bg-card/70 p-6 shadow-2xl backdrop-blur md:p-8">
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Bestseller Radar
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
                  Studia il mercato prima di scrivere.
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
                  {loading ? "Analisi..." : "Analizza"} titoli concorrenti, domanda, competizione e potenziale commerciale.
                  Non per copiare. Per capire dove colpire.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
                <select
                  value={genre}
                  onChange={(event) => setGenre(event.target.value)}
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none"
                >
                  <option value="romance">Romance</option>
                  <option value="thriller">Thriller</option>
                  <option value="selfhelp">Self-help</option>
                </select>

                <input
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="Keyword, nicchia o tema..."
                  className="h-11 rounded-xl border border-border bg-background px-3 text-sm outline-none"
                />

                <Button
                  disabled={loading}
                  onClick={async () => {
                    setSearched(true);
                    setLoading(true);
                    setError("");
                    try {
                      const res = await runBestsellerRadar({
                        genre,
                        keyword,
                        marketplace: "Amazon.it",
                      });
                      if (!res.ok) throw new Error(res.error || "Radar non disponibile");
                      setLiveResults(res.results?.length ? res.results : null);
                      setLiveScore(typeof res.marketScore === "number" ? res.marketScore : null);
                      setLiveSummary(res.summary || "");
                    } catch (err) {
                      setError(err instanceof Error ? err.message : "Errore durante l’analisi");
                      setLiveResults(null);
                      setLiveScore(null);
                    } finally {
                      setLoading(false);
                    }
                  }}
                  className="h-11 gap-2 rounded-xl"
                >
                  <Search className="h-4 w-4" />
                  Analizza
                </Button>
              </div>
            </div>

            <div className="grid gap-4 rounded-3xl border border-border/70 bg-background/70 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Market Score</span>
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div className="text-5xl font-black">{searched ? marketScore : "—"}</div>
              <p className="text-sm leading-6 text-muted-foreground">
                Punteggio stimato da Scriptora AI usando segnali pubblici, pattern editoriali e analisi competitiva.
              </p>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        )}

        {liveSummary && (
          <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-sm leading-6 text-muted-foreground">
            {liveSummary}
          </div>
        )}

        {searched && (
          <section className="grid gap-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h2 className="text-xl font-bold">Titoli concorrenti e opportunità</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {results.map((book) => (
                <article key={book.title} className="rounded-3xl border border-border/70 bg-card/70 p-5 shadow-lg">
                  <div className="flex gap-4">
                    <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded-2xl border border-border bg-muted">
                      <BookOpen className="h-8 w-8 text-muted-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="line-clamp-2 text-lg font-bold">{book.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{book.author}</p>
                      <p className="mt-2 text-xs font-medium text-primary">{book.category}</p>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-xl bg-background/80 p-2">
                          <div className="text-muted-foreground">Rating</div>
                          <div className="font-bold">{book.rating}</div>
                        </div>
                        <div className="rounded-xl bg-background/80 p-2">
                          <div className="text-muted-foreground">Review</div>
                          <div className="font-bold">{book.reviews}</div>
                        </div>
                        <div className="rounded-xl bg-background/80 p-2">
                          <div className="text-muted-foreground">Prezzo</div>
                          <div className="font-bold">{book.price}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div className="rounded-2xl border border-border bg-background/70 p-3">
                      <div className="text-muted-foreground">Domanda</div>
                      <div className="mt-1 font-bold">{book.demand}</div>
                    </div>
                    <div className="rounded-2xl border border-border bg-background/70 p-3">
                      <div className="text-muted-foreground">Concorrenza</div>
                      <div className="mt-1 font-bold">{book.competition}</div>
                    </div>
                    <div className="rounded-2xl border border-border bg-background/70 p-3">
                      <div className="text-muted-foreground">Potenziale</div>
                      <div className="mt-1 font-bold">{book.potential}/10</div>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-6 text-muted-foreground">{book.insight}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        <section className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100">
          <div className="mb-2 flex items-center gap-2 font-bold">
            <ShieldAlert className="h-4 w-4" />
            Nota importante
          </div>
          <p>
            I dati mostrati, inclusi domanda, concorrenza, potenziale commerciale e stime di mercato,
            sono elaborazioni generate da Scriptora AI sulla base di segnali pubblici, pattern editoriali
            e analisi automatica. Non rappresentano dati ufficiali né verificabili provenienti da Amazon
            o da fonti proprietarie. Servono come orientamento strategico, non come valori assoluti.
          </p>
        </section>
      </main>
    </div>
  );
}
