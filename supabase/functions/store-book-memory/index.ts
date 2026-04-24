import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  const { projectId, chapterIndex, content } = await req.json()
  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!)

  // Generazione embedding tramite DeepSeek o OpenAI (assumendo configurazione env)
  const res = await fetch("https://api.deepseek.com/v1/embeddings", {
    method: "POST",
    headers: { "Authorization": `Bearer ${Deno.env.get("DEEPSEEK_API_KEY")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "deepseek-embed", input: content })
  })
  const { data } = await res.json()

  const { error } = await supabase.from("book_memories").insert({
    project_id: projectId,
    chapter_index: chapterIndex,
    content: content,
    embedding: data[0].embedding
  })

  return new Response(JSON.stringify({ success: !error }), { headers: { "Content-Type": "application/json" } })
})
