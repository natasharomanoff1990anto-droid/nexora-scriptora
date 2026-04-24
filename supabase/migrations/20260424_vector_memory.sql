-- Abilita l'estensione vector
create extension if not exists vector;

-- Crea la tabella per i frammenti di memoria del libro
create table if not exists book_memories (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  chapter_index int,
  content text,
  embedding vector(1536), -- Dimensioni per OpenAI/DeepSeek embeddings
  created_at timestamp with time zone default now()
);

-- Indice per ricerca rapida
create index on book_memories using ivfflat (embedding vector_cosine_ops);
