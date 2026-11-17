-- Shop-n-Save MVP: run in your chosen Supabase project SQL editor.
create extension if not exists pgcrypto;
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(),
 barcode text unique,
 name text not null,
 brand text,
 category text,
 quantity numeric,
 unit text,
 normalized_key text not null unique,
 created_at timestamptz not null default now()
);
create table if not exists public.retailers (
 id text primary key,
 name text not null
);
insert into public.retailers(id,name) values
 ('tesco','Tesco'),('morrisons','Morrisons'),('asda','Asda'),
 ('sainsburys','Sainsbury''s'),('lidl','Lidl')
on conflict (id) do nothing;
create table if not exists public.price_observations (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id),
 retailer_id text not null references public.retailers(id),
 price_pence integer not null check(price_pence >= 0),
 pack_quantity numeric,
 pack_unit text,
 promotion_text text,
 source_name text not null,
 source_url text,
 source_license text,
 observed_at timestamptz not null,
 captured_at timestamptz not null default now(),
 confidence text not null default 'unverified' check(confidence in ('verified','provisional','unverified')),
 region text not null default 'GB',
 match_type text not null default 'exact' check(match_type in ('exact','substitute','size_mismatch')),
 unique(product_id,retailer_id,source_name,observed_at,price_pence)
);
create index if not exists price_latest_idx on public.price_observations(product_id,retailer_id,observed_at desc);
create table if not exists public.lookup_queue (
 id uuid primary key default gen_random_uuid(),
 product_id uuid not null references public.products(id),
 retailer_id text not null references public.retailers(id),
 status text not null default 'pending' check(status in ('pending','processing','completed','no_source','failed')),
 next_attempt_at timestamptz not null default now(),
 attempts integer not null default 0,
 updated_at timestamptz not null default now(),
 unique(product_id,retailer_id)
);
create table if not exists public.weekly_comparisons (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 week_start date not null,
 created_at timestamptz not null default now(),
 settings jsonb not null default '{}'::jsonb,
 unique(user_id,week_start)
);
create table if not exists public.comparison_items (
 comparison_id uuid not null references public.weekly_comparisons(id) on delete cascade,
 product_id uuid not null references public.products(id),
 quantity integer not null default 1 check(quantity between 1 and 99),
 primary key(comparison_id,product_id)
);
create table if not exists public.comparison_price_snapshots (
 comparison_id uuid not null references public.weekly_comparisons(id) on delete cascade,
 product_id uuid not null references public.products(id),
 retailer_id text not null references public.retailers(id),
 observation_id uuid references public.price_observations(id),
 price_pence integer,
 observed_at timestamptz,
 match_type text,
 primary key(comparison_id,product_id,retailer_id)
);
create or replace view public.latest_prices as
 select distinct on (product_id,retailer_id) *,
 case when observed_at >= now()-interval '7 days' then 'fresh'
      when observed_at >= now()-interval '14 days' then 'refresh_due'
      else 'historical' end as freshness
 from public.price_observations
 where confidence in ('verified','provisional') and region='GB'
 order by product_id,retailer_id,observed_at desc,captured_at desc;
alter table public.products enable row level security;
alter table public.retailers enable row level security;
alter table public.price_observations enable row level security;
alter table public.lookup_queue enable row level security;
alter table public.weekly_comparisons enable row level security;
alter table public.comparison_items enable row level security;
alter table public.comparison_price_snapshots enable row level security;
create policy "read products" on public.products for select to authenticated using (true);
create policy "read retailers" on public.retailers for select to authenticated using (true);
create policy "read prices" on public.price_observations for select to authenticated using (true);
create policy "own comparisons read" on public.weekly_comparisons for select to authenticated using (auth.uid()=user_id);
create policy "own comparisons insert" on public.weekly_comparisons for insert to authenticated with check(auth.uid()=user_id);
create policy "own items read" on public.comparison_items for select to authenticated using (exists(select 1 from public.weekly_comparisons c where c.id=comparison_id and c.user_id=auth.uid()));
create policy "own snapshots read" on public.comparison_price_snapshots for select to authenticated using (exists(select 1 from public.weekly_comparisons c where c.id=comparison_id and c.user_id=auth.uid()));
-- Mutations of prices, queue, items and snapshots must run through authenticated server functions.
-- Never expose the Supabase service role key in the browser.
