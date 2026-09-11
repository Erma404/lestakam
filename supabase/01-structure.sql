-- =====================================================================
-- LesTakam — structure de la base de données
--
-- À exécuter une seule fois, dans l'éditeur SQL de Supabase :
--   Tableau de bord Supabase > SQL Editor > New query > coller > Run
--
-- Ce fichier crée les tables et les règles de sécurité. Il ne contient
-- aucune donnée personnelle et aucun mot de passe.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Le foyer
-- ---------------------------------------------------------------------

create table if not exists households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  -- Localisation utilisée pour la météo.
  weather_location_name text not null default 'Le Blanc-Mesnil',
  weather_latitude double precision not null default 48.9362,
  weather_longitude double precision not null default 2.4636,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 2. Les membres de la famille
--    Les parents sont reliés à un compte de connexion ; un enfant n'en
--    a pas et utilise la tablette de la cuisine.
-- ---------------------------------------------------------------------

create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid unique references auth.users(id) on delete set null,
  first_name text not null,
  role text not null check (role in ('parent', 'enfant')),
  avatar_emoji text not null default '🙂',
  photo_url text,
  accent text not null default 'sage'
    check (accent in ('sky', 'rose', 'sage', 'terracotta', 'lilac', 'sun')),
  warmth_preference text not null default 'normal'
    check (warmth_preference in ('frileux', 'normal', 'chaud')),
  birth_year integer,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists members_household_idx on members (household_id);

-- ---------------------------------------------------------------------
-- 3. Le calendrier
-- ---------------------------------------------------------------------

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  title text not null,
  event_date date not null,
  start_time time,
  end_time time,
  location text,
  category text not null default 'autre'
    check (category in ('activite', 'ecole', 'sante', 'travail', 'famille', 'repas', 'autre')),
  -- Identifiants des membres concernés.
  member_ids uuid[] not null default '{}',
  repeats_weekly boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists events_household_date_idx on events (household_id, event_date);

-- ---------------------------------------------------------------------
-- 4. Les rappels de la semaine
-- ---------------------------------------------------------------------

create table if not exists reminders (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  label text not null,
  due_date date,
  member_ids uuid[] not null default '{}',
  done boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists reminders_household_idx on reminders (household_id);

-- ---------------------------------------------------------------------
-- 5. Les rituels quotidiens et leur suivi
-- ---------------------------------------------------------------------

create table if not exists rituals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  label text not null,
  emoji text not null default '✅',
  moment text not null check (moment in ('matin', 'apres-midi', 'soir')),
  scheduled_time time,
  stars integer not null default 1 check (stars >= 0),
  needs_parent_approval boolean not null default true,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists rituals_household_idx on rituals (household_id, member_id);

create table if not exists ritual_status (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  ritual_id uuid not null references rituals(id) on delete cascade,
  status_date date not null,
  state text not null check (state in ('coche', 'valide')),
  -- Quel parent a validé, et quand.
  approved_by uuid references members(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  -- Un seul état par rituel et par jour.
  unique (ritual_id, status_date)
);

create index if not exists ritual_status_lookup_idx
  on ritual_status (household_id, status_date);

-- ---------------------------------------------------------------------
-- 6. Les récompenses
-- ---------------------------------------------------------------------

create table if not exists reward_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  member_id uuid not null references members(id) on delete cascade,
  label text not null,
  emoji text not null default '🎁',
  stars_required integer not null check (stars_required > 0),
  achieved_on date,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists reward_goals_household_idx on reward_goals (household_id, member_id);

-- ---------------------------------------------------------------------
-- 7. Les repas et la liste de courses
-- ---------------------------------------------------------------------

create table if not exists meals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  meal_date date not null,
  moment text not null check (moment in ('midi', 'soir')),
  title text not null,
  emoji text not null default '🍽️',
  notes text,
  created_at timestamptz not null default now()
);

create index if not exists meals_household_date_idx on meals (household_id, meal_date);

create table if not exists shopping_items (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  label text not null,
  quantity text,
  aisle text,
  checked boolean not null default false,
  from_meal_id uuid references meals(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists shopping_items_household_idx on shopping_items (household_id);

-- =====================================================================
-- 8. Sécurité : chaque foyer ne voit que ses propres données
-- =====================================================================

-- Retrouve le foyer de la personne connectée.
create or replace function current_household_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select household_id from members where user_id = auth.uid() limit 1;
$$;

-- Vrai si la personne connectée est un parent du foyer.
create or replace function current_member_is_parent()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from members where user_id = auth.uid() and role = 'parent'
  );
$$;

alter table households      enable row level security;
alter table members         enable row level security;
alter table events          enable row level security;
alter table reminders       enable row level security;
alter table rituals         enable row level security;
alter table ritual_status   enable row level security;
alter table reward_goals    enable row level security;
alter table meals           enable row level security;
alter table shopping_items  enable row level security;

-- Le foyer lui-même : lecture par ses membres, modification par un parent.
drop policy if exists "foyer visible par ses membres" on households;
create policy "foyer visible par ses membres" on households
  for select using (id = current_household_id());

drop policy if exists "foyer modifiable par un parent" on households;
create policy "foyer modifiable par un parent" on households
  for update using (id = current_household_id() and current_member_is_parent());

-- Les autres tables suivent toutes la même règle : on n'accède qu'aux
-- lignes de son propre foyer.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'members', 'events', 'reminders', 'rituals',
    'ritual_status', 'reward_goals', 'meals', 'shopping_items'
  ]
  loop
    execute format(
      'drop policy if exists "acces au foyer" on %I;
       create policy "acces au foyer" on %I
         for all
         using (household_id = current_household_id())
         with check (household_id = current_household_id());',
      table_name, table_name
    );
  end loop;
end
$$;

-- Tient à jour la date de dernière modification des événements.
create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists events_touch_updated_at on events;
create trigger events_touch_updated_at
  before update on events
  for each row execute function touch_updated_at();
