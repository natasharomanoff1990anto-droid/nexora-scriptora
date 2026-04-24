-- Abilita le estensioni necessarie
create extension if not exists vector;

-- Crea la tabella per i frammenti di memoria del libro
create table if not exists book_memories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade,
  chapter_index int,
  content text,
  embedding vector(1536),
  created_at timestamp with time zone default now()
);

-- Indice per ricerca rapida
create index on book_memories using ivfflat (embedding vector_cosine_ops);

-- Funzione per la ricerca semantica dei ricordi del libro
create or replace function match_book_memories (
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_project_id uuid
)
returns table (
  id uuid,
  content text,
  chapter_index int,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    book_memories.id,
    book_memories.content,
    book_memories.chapter_index,
    1 - (book_memories.embedding <=> query_embedding) as similarity
  from book_memories
  where book_memories.project_id = p_project_id
    and 1 - (book_memories.embedding <=> query_embedding) > match_threshold
  order by similarity desc
  limit match_count;
end;
$$;
