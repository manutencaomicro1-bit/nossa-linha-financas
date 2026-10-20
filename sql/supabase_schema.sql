-- =====================================================================
-- SCRIPT SQL PARA SINCRONIZAÇÃO EM NUVEM (SUPABASE GRATUITO)
-- =====================================================================
-- Como usar:
-- 1. Crie uma conta gratuita em https://supabase.com e crie um novo projeto.
-- 2. No menu lateral esquerdo, clique em "SQL Editor" -> "New query".
-- 3. Cole todo este conteúdo abaixo e clique em "Run".
-- 4. Depois, vá em "Project Settings" -> "API", copie a "Project URL" e a
--    chave "anon public" e cole na aba "Nuvem & Ajustes" do sistema!

create table if not exists public.couple_spaces (
  space_id text primary key,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

-- Habilita Row Level Security (RLS) com acesso pelo space_id compartilhado do casal
alter table public.couple_spaces enable row level security;

create policy "Acesso leitura/escrita para o espaço do casal"
  on public.couple_spaces
  for all
  using (true)
  with check (true);

-- Habilita atualização em tempo real (Realtime)
alter publication supabase_realtime add table public.couple_spaces;
