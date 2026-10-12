-- =====================================================================
-- Calendrier, rappels et liste de courses partagés entre les appareils
-- À exécuter une fois dans Supabase : SQL Editor > New query > Run.
-- Le script peut être relancé sans risque.
--
-- Chaque élément est rangé tel que l'application le manipule (JSON) :
-- les nouveautés du calendrier (plusieurs jours, jours de répétition,
-- hors vacances scolaires…) n'ont pas besoin de nouvelles colonnes.
-- =====================================================================

create table if not exists shared_items (
  household_id uuid not null references households(id) on delete cascade,
  kind text not null check (kind in ('evenement', 'rappel', 'course')),
  id text not null,
  data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (household_id, kind, id)
);

alter table shared_items enable row level security;

drop policy if exists "acces au foyer" on shared_items;
create policy "acces au foyer" on shared_items
  for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

drop trigger if exists shared_items_touch_updated_at on shared_items;
create trigger shared_items_touch_updated_at
  before update on shared_items
  for each row execute function touch_updated_at();

-- Mise à jour en direct sur les autres appareils.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'shared_items'
  ) then
    alter publication supabase_realtime add table shared_items;
  end if;
end
$$;
