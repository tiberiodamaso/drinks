-- =========================================================
-- Bar do Tibs — pedidos e avaliações anônimos
-- Rode inteiro no SQL Editor do Supabase (pode rodar de novo:
-- tudo é "if not exists" / "or replace").
--
-- O site usa só a chave anon, sem login. Por isso:
--   * as tabelas aceitam apenas INSERT do público — ninguém lê,
--     altera ou apaga linha nenhuma pelo site;
--   * a leitura é feita pelas views `ranking_drinks` e
--     `comentarios_recentes`, que não expõem o id do aparelho e
--     não usam "security definer" (sem alerta no Security Advisor).
-- =========================================================

create table if not exists public.pedidos (
  id          bigint generated always as identity primary key,
  drink_id    text not null check (char_length(drink_id) between 1 and 60),
  dispositivo uuid,
  criado_em   timestamptz not null default now()
);

create table if not exists public.avaliacoes (
  id          bigint generated always as identity primary key,
  drink_id    text not null check (char_length(drink_id) between 1 and 60),
  nota        smallint not null check (nota between 1 and 5),
  comentario  text check (comentario is null or char_length(comentario) <= 500),
  dispositivo uuid,
  criado_em   timestamptz not null default now()
);

create index if not exists pedidos_drink_idx on public.pedidos (drink_id);
create index if not exists avaliacoes_drink_disp_idx on public.avaliacoes (drink_id, dispositivo, criado_em desc);

-- ---------- Permissões: o público só insere ----------
alter table public.pedidos enable row level security;
alter table public.avaliacoes enable row level security;

revoke all on public.pedidos, public.avaliacoes from anon, authenticated;
grant insert on public.pedidos, public.avaliacoes to anon, authenticated;

drop policy if exists "publico registra pedido" on public.pedidos;
create policy "publico registra pedido" on public.pedidos
  for insert to anon, authenticated with check (true);

drop policy if exists "publico registra avaliacao" on public.avaliacoes;
create policy "publico registra avaliacao" on public.avaliacoes
  for insert to anon, authenticated with check (true);

-- ---------- Leitura agregada ----------
-- A contagem é feita por funções no schema `privado`, que a API não
-- expõe. Elas rodam com o dono (security definer) e por isso leem as
-- tabelas; o público só enxerga o resultado agregado, via as views de
-- `public`, que rodam com a permissão de quem consulta (security_invoker).
create schema if not exists privado;
revoke all on schema privado from public, anon, authenticated;
grant usage on schema privado to anon, authenticated; -- só para chamar as funções abaixo

-- Vale só a avaliação mais recente de cada aparelho para cada drink
-- (quem avalia de novo corrige a nota, não soma outra).
create or replace view privado.avaliacoes_validas with (security_invoker = on) as
  select distinct on (drink_id, coalesce(dispositivo::text, id::text))
         id, drink_id, nota, comentario, criado_em
    from public.avaliacoes
   order by drink_id, coalesce(dispositivo::text, id::text), criado_em desc;
revoke all on privado.avaliacoes_validas from public, anon, authenticated;

-- Contagem absoluta de pedidos (desde sempre) + nota média por drink
create or replace function privado.ranking_drinks()
returns table (drink_id text, pedidos int, avaliacoes int, media numeric)
language sql stable security definer set search_path = ''
as $$
  select d.drink_id,
         coalesce(p.pedidos, 0)::int,
         coalesce(a.avaliacoes, 0)::int,
         a.media
    from (select drink_id from public.pedidos
          union
          select drink_id from privado.avaliacoes_validas) d
    left join (select drink_id, count(*) as pedidos
                 from public.pedidos group by drink_id) p using (drink_id)
    left join (select drink_id, count(*) as avaliacoes, round(avg(nota), 2) as media
                 from privado.avaliacoes_validas group by drink_id) a using (drink_id);
$$;

create or replace function privado.comentarios_recentes()
returns table (drink_id text, nota smallint, comentario text, criado_em timestamptz)
language sql stable security definer set search_path = ''
as $$
  select drink_id, nota, comentario, criado_em
    from privado.avaliacoes_validas
   where comentario is not null and btrim(comentario) <> ''
   order by criado_em desc
   limit 30;
$$;

revoke all on function privado.ranking_drinks(), privado.comentarios_recentes() from public, anon, authenticated;
grant execute on function privado.ranking_drinks(), privado.comentarios_recentes() to anon, authenticated;

-- Views públicas (o que o site lê). "drop" porque a primeira versão
-- deste arquivo criava as duas como security definer.
drop view if exists public.ranking_drinks;
drop view if exists public.comentarios_recentes;

create view public.ranking_drinks with (security_invoker = on) as
  select * from privado.ranking_drinks();

create view public.comentarios_recentes with (security_invoker = on) as
  select * from privado.comentarios_recentes();

revoke all on public.ranking_drinks, public.comentarios_recentes from anon, authenticated;
grant select on public.ranking_drinks, public.comentarios_recentes to anon, authenticated;
