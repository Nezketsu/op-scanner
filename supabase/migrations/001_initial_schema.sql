-- Sets (extensions One Piece)
create table public.sets (
  id            text primary key,
  name          text not null,
  release_date  date,
  total_cards   int,
  logo_url      text
);

alter table public.sets enable row level security;

create policy "sets are publicly readable"
  on public.sets for select using (true);

-- Cards (cache partagé, toutes variantes)
create table public.cards (
  id               text primary key,
  set_id           text references public.sets,
  card_number      int,
  name             text not null,
  image_url        text,
  rarity           text,
  variants         jsonb,
  market_price     decimal(10,2),
  price_source     text check (price_source in ('tcgapi', 'tcgfast', 'cache')),
  price_updated_at timestamptz
);

alter table public.cards enable row level security;

create policy "cards are publicly readable"
  on public.cards for select using (true);

create index cards_set_id_idx on public.cards (set_id, card_number);

-- Collection (données personnelles de l'utilisateur)
create table public.collection (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  card_id    text references public.cards not null,
  variant_id text,
  quantity   int default 1,
  added_at   timestamptz default now(),
  unique (user_id, card_id, variant_id)
);

alter table public.collection enable row level security;

create policy "users can view own collection"
  on public.collection for select using (auth.uid() = user_id);

create policy "users can insert into own collection"
  on public.collection for insert with check (auth.uid() = user_id);

create policy "users can update own collection"
  on public.collection for update using (auth.uid() = user_id);

create policy "users can delete from own collection"
  on public.collection for delete using (auth.uid() = user_id);
