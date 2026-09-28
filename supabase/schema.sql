-- AI Article Writer schema
-- Run this in the Supabase SQL editor.
-- Tables stay closed to the browser: RLS is forced on, and anon/authenticated have no policies.
-- The Next.js server uses the service role key, which bypasses RLS.

do $$ begin
  create type public.template_type as enum ('writing', 'checking');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.article_status as enum ('draft', 'published', 'saved');
exception when duplicate_object then null;
end $$;

create table if not exists public.instruction_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type public.template_type not null,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.generated_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  description text not null default '',
  slug text not null default '',
  content text not null default '',
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  featured_image_url text,
  wp_post_id integer,
  status public.article_status not null default 'saved',
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists instruction_templates_type_idx
  on public.instruction_templates (type, created_at desc);

create index if not exists generated_articles_created_at_idx
  on public.generated_articles (created_at desc);

alter table public.instruction_templates enable row level security;
alter table public.generated_articles enable row level security;
alter table public.app_settings enable row level security;

alter table public.instruction_templates force row level security;
alter table public.generated_articles force row level security;
alter table public.app_settings force row level security;

revoke all privileges on table public.instruction_templates from public, anon, authenticated;
revoke all privileges on table public.generated_articles from public, anon, authenticated;
revoke all privileges on table public.app_settings from public, anon, authenticated;

grant select, insert, update, delete on table public.instruction_templates to service_role;
grant select, insert, update, delete on table public.generated_articles to service_role;
grant select, insert, update, delete on table public.app_settings to service_role;

insert into public.instruction_templates (name, type, content)
select
  'Default writing',
  'writing',
  $tpl$Write a clear, original article from the user request.
Use markdown headings, short paragraphs, and a natural tone.
Suggest practical categories and tags.
Do not invent citations or statistics.$tpl$
where not exists (
  select 1 from public.instruction_templates where name = 'Default writing' and type = 'writing'
);

insert into public.instruction_templates (name, type, content)
select
  'Default checking',
  'checking',
  $tpl$Review this article for clarity, grammar, structure, and unsupported claims.
Rewrite it while keeping the author's intent.
Use these fields when present: {{title}} {{description}} {{content}}
Describe each meaningful edit in changes_summary.$tpl$
where not exists (
  select 1 from public.instruction_templates where name = 'Default checking' and type = 'checking'
);
