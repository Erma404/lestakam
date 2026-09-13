-- =====================================================================
-- LesTakam — création du foyer et des données de départ
--
-- À exécuter APRÈS le fichier 01-structure.sql, et APRÈS que Stéphane et
-- Ernestine se soient connectés au moins une fois à l'application (c'est
-- cette première connexion qui crée leur compte).
--
-- Avant de lancer : remplacez les deux adresses e-mail ci-dessous par les
-- vraies. Rien d'autre n'est à modifier.
-- =====================================================================

do $$
declare
  -- ⬇️ LES DEUX SEULES LIGNES À MODIFIER ⬇️
  email_pere  text := 'a-remplacer-pere@exemple.fr';
  email_mere  text := 'a-remplacer-mere@exemple.fr';
  -- ⬆️ ------------------------------------ ⬆️

  foyer_id     uuid;
  user_pere    uuid;
  user_mere    uuid;
  membre_pere  uuid;
  membre_mere  uuid;
  membre_khloe uuid;
begin
  -- Retrouve les comptes créés lors de la première connexion.
  select id into user_pere from auth.users where lower(email) = lower(email_pere);
  select id into user_mere from auth.users where lower(email) = lower(email_mere);

  if user_pere is null then
    raise exception 'Aucun compte trouvé pour %. Connectez-vous une première fois à l''application avec cette adresse, puis relancez ce script.', email_pere;
  end if;
  if user_mere is null then
    raise exception 'Aucun compte trouvé pour %. Connectez-vous une première fois à l''application avec cette adresse, puis relancez ce script.', email_mere;
  end if;

  -- Le foyer n'est créé qu'une fois, même si le script est relancé.
  select id into foyer_id from households where name = 'LesTakam';
  if foyer_id is null then
    insert into households (name) values ('LesTakam') returning id into foyer_id;
  end if;

  -- Les trois membres de la famille.
  insert into members (household_id, user_id, first_name, role, avatar_emoji, accent, warmth_preference, sort_order)
  values (foyer_id, user_pere, 'Stéphane', 'parent', '👨🏾', 'sky', 'chaud', 1)
  on conflict (user_id) do update set household_id = excluded.household_id
  returning id into membre_pere;

  insert into members (household_id, user_id, first_name, role, avatar_emoji, accent, warmth_preference, sort_order)
  values (foyer_id, user_mere, 'Ernestine', 'parent', '👩🏾', 'rose', 'frileux', 2)
  on conflict (user_id) do update set household_id = excluded.household_id
  returning id into membre_mere;

  -- Khloé n'a pas de compte : elle utilise la tablette de la cuisine.
  select id into membre_khloe
  from members
  where household_id = foyer_id and first_name = 'Khloé';

  if membre_khloe is null then
    insert into members (household_id, first_name, role, avatar_emoji, accent, warmth_preference, birth_year, sort_order)
    values (foyer_id, 'Khloé', 'enfant', '👧🏾', 'sun', 'normal', 2021, 3)
    returning id into membre_khloe;
  end if;

  -- Les rituels quotidiens de Khloé, par moment de la journée.
  -- days : jours où le rituel s'applique (0 = dimanche … 6 = samedi),
  -- NULL = tous les jours. Le cartable ne se prépare qu'en semaine ; la
  -- pause lecture est propre au week-end, pas de journée d'école.
  if not exists (select 1 from rituals where member_id = membre_khloe) then
    insert into rituals (household_id, member_id, label, emoji, moment, scheduled_time, stars, needs_parent_approval, sort_order, days)
    values
      (foyer_id, membre_khloe, 'Brosser les dents',          '🪥', 'matin',      '07:30', 1, true,  1,  null),
      (foyer_id, membre_khloe, 'Nettoyer le visage',         '🧼', 'matin',      '07:35', 1, true,  2,  null),
      (foyer_id, membre_khloe, 'S''habiller toute seule',    '👗', 'matin',      '07:45', 1, false, 3,  null),
      (foyer_id, membre_khloe, 'Préparer le cartable',       '🎒', 'matin',      '08:00', 1, false, 4,  '{1,2,3,4,5}'),
      (foyer_id, membre_khloe, 'Goûter et ranger l''assiette','🍎', 'apres-midi', '16:30', 1, false, 5,  null),
      (foyer_id, membre_khloe, '3 heures sans écran',        '📵', 'apres-midi', '17:00', 2, true,  6,  null),
      (foyer_id, membre_khloe, 'Ranger les jouets',          '🧸', 'apres-midi', '17:30', 1, true,  7,  null),
      (foyer_id, membre_khloe, 'Pause lecture (15 min)',     '📚', 'apres-midi', '15:00', 1, false, 8,  '{0,6}'),
      (foyer_id, membre_khloe, 'Prendre sa douche',          '🚿', 'soir',       '19:30', 1, true,  9,  null),
      (foyer_id, membre_khloe, 'Brosser les dents',          '🪥', 'soir',       '20:30', 1, true,  10, null),
      (foyer_id, membre_khloe, 'Histoire du soir',           '📖', 'soir',       '20:45', 1, false, 11, null),
      (foyer_id, membre_khloe, 'Dodo',                       '🌙', 'soir',       '21:00', 2, true,  12, null);
  end if;

  -- Les objectifs de récompense.
  if not exists (select 1 from reward_goals where member_id = membre_khloe) then
    insert into reward_goals (household_id, member_id, label, emoji, stars_required, sort_order)
    values
      (foyer_id, membre_khloe, 'Après-midi au parc', '🛝',  20, 1),
      (foyer_id, membre_khloe, 'Séance de cinéma',   '🍿',  40, 2),
      (foyer_id, membre_khloe, 'Surprise mystère',   '🎁',  60, 3);
  end if;

  raise notice 'Foyer LesTakam prêt. Stéphane, Ernestine et Khloé sont enregistrés.';
end
$$;
