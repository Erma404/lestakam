-- =====================================================================
-- Notifications (rappels sur les téléphones et la tablette)
-- À exécuter une fois dans Supabase : SQL Editor > New query > Run.
-- Le script peut être relancé sans risque.
--
-- Aucun secret dans ce fichier : le mot de passe du planificateur est
-- saisi à la main, à part (voir la toute fin).
-- =====================================================================

-- Les appareils qui ont accepté les notifications.
create table if not exists push_subscriptions (
  endpoint text primary key,
  household_id uuid not null references households(id) on delete cascade,
  member_id uuid references members(id) on delete set null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table push_subscriptions enable row level security;
drop policy if exists "acces au foyer" on push_subscriptions;
create policy "acces au foyer" on push_subscriptions
  for all
  using (household_id = current_household_id())
  with check (household_id = current_household_id());

-- Ce qui est déjà parti, pour ne jamais envoyer deux fois la même chose.
-- Aucune règle d'accès : seules les fonctions ci-dessous y touchent.
create table if not exists notification_log (
  household_id uuid not null references households(id) on delete cascade,
  key text not null,
  sent_at timestamptz not null default now(),
  primary key (household_id, key)
);
alter table notification_log enable row level security;

-- Mot de passe partagé avec l'application en ligne. Aucune règle
-- d'accès : illisible depuis le navigateur.
create table if not exists app_secrets (
  name text primary key,
  value text not null
);
alter table app_secrets enable row level security;

create or replace function notifications_secret_ok(secret text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from app_secrets
    where name = 'notifications' and value = secret and length(value) >= 32
  );
$$;

-- Tout ce qu'il faut au planificateur, foyer par foyer.
create or replace function notifications_a_preparer(secret text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not notifications_secret_ok(secret) then
    raise exception 'acces refuse';
  end if;
  return coalesce((
    select jsonb_agg(jsonb_build_object(
      'household_id', h.id,
      'events', coalesce((select jsonb_agg(s.data) from shared_items s
                          where s.household_id = h.id and s.kind = 'evenement'), '[]'::jsonb),
      'reminders', coalesce((select jsonb_agg(s.data) from shared_items s
                             where s.household_id = h.id and s.kind = 'rappel'), '[]'::jsonb),
      'subscriptions', coalesce((select jsonb_agg(jsonb_build_object(
                                   'endpoint', p.endpoint,
                                   'keys', jsonb_build_object('p256dh', p.p256dh, 'auth', p.auth)))
                                 from push_subscriptions p where p.household_id = h.id), '[]'::jsonb),
      'sent', coalesce((select jsonb_agg(l.key) from notification_log l
                        where l.household_id = h.id and l.sent_at > now() - interval '3 days'), '[]'::jsonb)
    ))
    from households h
    where exists (select 1 from push_subscriptions p where p.household_id = h.id)
  ), '[]'::jsonb);
end;
$$;

create or replace function notification_envoyee(secret text, foyer uuid, cle text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not notifications_secret_ok(secret) then
    raise exception 'acces refuse';
  end if;
  insert into notification_log (household_id, key) values (foyer, cle)
  on conflict do nothing;
  delete from notification_log where sent_at < now() - interval '7 days';
end;
$$;

-- Un téléphone qui a retiré l'autorisation : on l'oublie.
create or replace function abonnement_perime(secret text, adresse text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not notifications_secret_ok(secret) then
    raise exception 'acces refuse';
  end if;
  delete from push_subscriptions where endpoint = adresse;
end;
$$;

grant execute on function notifications_a_preparer(text) to anon, authenticated;
grant execute on function notification_envoyee(text, uuid, text) to anon, authenticated;
grant execute on function abonnement_perime(text, text) to anon, authenticated;
revoke execute on function notifications_secret_ok(text) from anon, authenticated, public;

-- Le planificateur : toutes les 5 minutes, il demande à l'application
-- d'envoyer ce qui est dû.
create extension if not exists pg_cron;
create extension if not exists pg_net;

select cron.unschedule('lestakam-notifications')
where exists (select 1 from cron.job where jobname = 'lestakam-notifications');

select cron.schedule(
  'lestakam-notifications',
  '*/5 * * * *',
  $$
  select net.http_post(
    url := 'https://lestakam.vercel.app/api/notifications/envoyer',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select value from public.app_secrets where name = 'notifications')
    ),
    body := '{}'::jsonb
  );
  $$
);

-- ---------------------------------------------------------------------
-- À faire à la main, une seule fois, dans une requête à part :
--   insert into app_secrets (name, value) values ('notifications', 'VOTRE_MOT_DE_PASSE')
--   on conflict (name) do update set value = excluded.value;
-- avec le même mot de passe que NOTIFICATIONS_SECRET dans Vercel.
-- ---------------------------------------------------------------------
