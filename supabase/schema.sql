-- À exécuter dans Supabase > SQL Editor.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null,
  role text not null default 'member' check (role in ('member','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  number integer not null,
  title text not null,
  body text not null default '',
  updated_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.polls (
  id uuid primary key default gen_random_uuid(),
  question text not null check (char_length(question) between 1 and 180),
  options jsonb not null check (jsonb_typeof(options)='array' and jsonb_array_length(options) between 2 and 8),
  active boolean not null default true,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create table if not exists public.poll_responses (
  id uuid primary key default gen_random_uuid(),
  poll_id uuid not null references public.polls(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  option_index integer not null check (option_index >= 0),
  created_at timestamptz not null default now(),
  unique (poll_id,user_id)
);

create index if not exists comments_article_idx on public.comments(article_id,created_at);
create index if not exists poll_responses_poll_idx on public.poll_responses(poll_id);

alter table public.profiles enable row level security;
alter table public.articles enable row level security;
alter table public.comments enable row level security;
alter table public.polls enable row level security;
alter table public.poll_responses enable row level security;

-- Fonction utilisée par les règles RLS. SECURITY DEFINER évite une boucle de politiques.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid() and role='admin'); $$;

create or replace function public.is_member()
returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from public.profiles where id=auth.uid()); $$;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_member() to anon, authenticated;

create policy "profiles read own" on public.profiles for select to authenticated using (id=auth.uid() or public.is_admin());
create policy "profiles admin manage" on public.profiles for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "articles public read" on public.articles for select to anon, authenticated using (true);
create policy "articles admin insert" on public.articles for insert to authenticated with check (public.is_admin());
create policy "articles admin update" on public.articles for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "articles admin delete" on public.articles for delete to authenticated using (public.is_admin());

create policy "comments public read" on public.comments for select to anon, authenticated using (true);
create policy "members create comments" on public.comments for insert to authenticated
with check (public.is_member() and author_id=auth.uid() and (parent_id is null or exists(select 1 from public.comments c where c.id=parent_id and c.article_id=article_id)));
create policy "admins delete comments" on public.comments for delete to authenticated using (public.is_admin());

create policy "polls public read" on public.polls for select to anon, authenticated using (true);
create policy "admins create polls" on public.polls for insert to authenticated with check (public.is_admin() and created_by=auth.uid());
create policy "admins update polls" on public.polls for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins delete polls" on public.polls for delete to authenticated using (public.is_admin());

create policy "poll responses public read" on public.poll_responses for select to anon, authenticated using (true);
create policy "members vote once" on public.poll_responses for insert to authenticated
with check (
  public.is_member() and user_id=auth.uid()
  and exists(select 1 from public.polls p where p.id=poll_id and p.active=true
    and option_index < jsonb_array_length(p.options))
);

-- Exemple de contenu à personnaliser. Ne pas relancer si vous avez déjà vos propres articles.
insert into public.articles(number,title,body)
select 1,'Respect entre les membres','Chaque membre doit respecter les autres participants. Les insultes et les attaques personnelles ne sont pas acceptées.'
where not exists(select 1 from public.articles);
insert into public.articles(number,title,body)
select 2,'Fonctionnement de la communauté','Les membres respectent les décisions collectives et les règles de fonctionnement de la communauté.'
where not exists(select 1 from public.articles where number=2);
insert into public.articles(number,title,body)
select 3,'Application du règlement','Les administrateurs veillent au respect du règlement et peuvent intervenir en cas de problème.'
where not exists(select 1 from public.articles where number=3);

-- IMPORTANT : après votre première connexion membre, récupérez votre UUID dans
-- Authentication > Users, puis exécutez :
-- update public.profiles set role='admin' where id='VOTRE-UUID-ICI';
