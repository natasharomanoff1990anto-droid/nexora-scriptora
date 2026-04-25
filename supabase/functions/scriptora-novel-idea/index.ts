
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY") || "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function callDeepSeek(system: string, user: string) {
  if (!DEEPSEEK_API_KEY) throw new Error("DEEPSEEK_API_KEY missing");

  const r = await fetch("https://api.deepseek.com/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.95,
      max_tokens: 1100,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  if (!r.ok) {
    const t = await r.text();
    throw new Error(`DeepSeek error ${r.status}: ${t.slice(0, 300)}`);
  }

  const data = await r.json();
  return String(data?.choices?.[0]?.message?.content || "").trim();
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const genre = String(body.genre || "romance").trim();
    const subcategory = String(body.subcategory || "").trim();
    const tone = String(body.tone || "").trim();
    const intensity = String(body.intensity || "").trim();
    const centralDynamic = String(body.centralDynamic || "").trim();
    const protagonistType = String(body.protagonistType || "").trim();
    const language = String(body.language || "Italian").trim();

    const system = `Sei Scriptora Novel Concept Architect.
Crei idee di romanzo commerciali, emotive, fresche e non ripetitive.
Scrivi in ${language}.
Output SOLO l'idea del romanzo, niente elenco, niente spiegazioni, niente markdown.
Ogni generazione deve sembrare nuova, concreta, vendibile e pronta per creare personaggi e trama.`;

    const user = `Crea UNA idea di romanzo originale usando queste coordinate:

Genere: ${genre}
Filone / sottogenere: ${subcategory || "da scegliere in modo coerente"}
Tono: ${tone || "cinematografico, emotivo, bestseller"}
Intensità: ${intensity || "medium"}
Dinamica centrale: ${centralDynamic || "desiderio, conflitto e segreto"}
Tipo protagonista: ${protagonistType || "protagonista ferita ma attiva"}

Regole:
- 4-7 frasi massimo.
- Deve contenere protagonista, ferita, desiderio, conflitto, atmosfera e promessa narrativa.
- Deve essere specifica, non generica.
- Deve evitare cliché banali.
- Deve poter alimentare una Character Bible e un romanzo completo.
- Non ripetere formule tipo “una donna arriva…” se non necessario.
- Non usare titoli.
- Non scrivere note tecniche.`;

    const idea = await callDeepSeek(system, user);

    return new Response(JSON.stringify({ idea }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Errore sconosciuto" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
