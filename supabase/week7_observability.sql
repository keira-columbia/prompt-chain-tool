create extension if not exists pgcrypto;

create table if not exists public.prompt_chains (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.llm_providers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  base_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.llm_models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.llm_providers(id) on delete restrict,
  name text not null,
  model_key text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.prompt_chain_steps (
  id uuid primary key default gen_random_uuid(),
  prompt_chain_id uuid not null references public.prompt_chains(id) on delete cascade,
  step_order integer not null check (step_order > 0),
  name text not null,
  instruction text not null,
  created_at timestamptz not null default now(),
  unique(prompt_chain_id, step_order)
);
create table if not exists public.prompt_chain_mix (
  id integer primary key default 1 check (id = 1),
  relevance_weight integer not null default 45 check (relevance_weight between 0 and 100),
  humor_weight integer not null default 35 check (humor_weight between 0 and 100),
  novelty_weight integer not null default 20 check (novelty_weight between 0 and 100),
  updated_at timestamptz not null default now(),
  check (relevance_weight + humor_weight + novelty_weight = 100)
);
create table if not exists public.terms (
  id uuid primary key default gen_random_uuid(),
  term text not null unique,
  definition text not null,
  category text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.generation_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  prompt_chain_id uuid references public.prompt_chains(id) on delete set null,
  status text not null default 'queued' check (status in ('queued','running','succeeded','failed')),
  input_text text not null,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create table if not exists public.llm_responses (
  id uuid primary key default gen_random_uuid(),
  generation_request_id uuid references public.generation_requests(id) on delete cascade,
  model_id uuid references public.llm_models(id) on delete set null,
  status text not null default 'succeeded',
  response_text text,
  latency_ms integer,
  token_count integer,
  created_at timestamptz not null default now()
);
create table if not exists public.ai_generation_examples (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  input_prompt text not null,
  output_text text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.allowed_signup_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.whitelisted_emails (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.images (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  alt_text text,
  storage_path text not null unique,
  public_url text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.prompt_chain_mix (id) values (1) on conflict (id) do nothing;
insert into public.llm_providers (name, base_url) values ('Google Gemini','https://generativelanguage.googleapis.com') on conflict (name) do nothing;
insert into public.llm_models (provider_id,name,model_key)
select id,'Gemini Flash','gemini-flash-latest' from public.llm_providers where name='Google Gemini'
on conflict (model_key) do nothing;
insert into public.prompt_chains (name,description) values
('Campus Caption Chain','Analyzes a campus image, adds student context, and produces four caption candidates.'),
('Caption Quality Review','Checks generated captions for relevance, humor, and originality.')
on conflict (name) do nothing;
insert into public.prompt_chain_steps (prompt_chain_id,step_order,name,instruction)
select id,1,'Visual scan','Describe only the visible scene and important relationships.' from public.prompt_chains where name='Campus Caption Chain'
on conflict (prompt_chain_id,step_order) do nothing;
insert into public.prompt_chain_steps (prompt_chain_id,step_order,name,instruction)
select id,2,'Context pass','Combine the visual description with the uploader context and campus setting.' from public.prompt_chains where name='Campus Caption Chain'
on conflict (prompt_chain_id,step_order) do nothing;
insert into public.prompt_chain_steps (prompt_chain_id,step_order,name,instruction)
select id,3,'Caption generation','Produce four concise, distinct caption candidates.' from public.prompt_chains where name='Campus Caption Chain'
on conflict (prompt_chain_id,step_order) do nothing;
insert into public.prompt_chain_steps (prompt_chain_id,step_order,name,instruction)
select id,1,'Score outputs','Score candidates using the configured relevance, humor, and novelty mix.' from public.prompt_chains where name='Caption Quality Review'
on conflict (prompt_chain_id,step_order) do nothing;
insert into public.allowed_signup_domains (domain) values ('columbia.edu') on conflict (domain) do nothing;

alter table public.prompt_chains enable row level security;
alter table public.prompt_chain_steps enable row level security;
alter table public.prompt_chain_mix enable row level security;
alter table public.terms enable row level security;
alter table public.generation_requests enable row level security;
alter table public.ai_generation_examples enable row level security;
alter table public.llm_models enable row level security;
alter table public.llm_providers enable row level security;
alter table public.llm_responses enable row level security;
alter table public.allowed_signup_domains enable row level security;
alter table public.whitelisted_emails enable row level security;
alter table public.images enable row level security;

grant usage on schema public to service_role;
grant all on table public.prompt_chains, public.prompt_chain_steps, public.prompt_chain_mix, public.terms, public.generation_requests, public.ai_generation_examples, public.llm_models, public.llm_providers, public.llm_responses, public.allowed_signup_domains, public.whitelisted_emails, public.images to service_role;
