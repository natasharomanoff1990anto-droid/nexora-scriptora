import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { projectId, queryContent, limit = 3 } = await req.json()
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

  // 1. Genera embedding per la query corrente
  const res = await fetch("https://api.deepseek.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${Deno.env.get("DEEPSEEK_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-embed", input: queryContent })
  })
  const { data } = await res.json()
  const embedding = data[0].embedding

  // 2. RPC call a Supabase per trovare i frammenti più simili
  // Nota: richiede una funzione SQL 'match_book_memories' nel DB
  const { data: memories, error } = await supabase.rpc('match_book_memories', {
    query_embedding: embedding,
    match_threshold: 0.7,
    match_count: limit,
    p_project_id: projectId
  })

  return new Response(JSON.stringify({ memories, error }), { headers: { "Content-Type": "application/json" } })
})
