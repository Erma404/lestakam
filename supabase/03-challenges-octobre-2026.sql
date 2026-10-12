-- =====================================================================
-- Nouveaux challenges de Khloé (octobre 2026)
-- À exécuter une fois dans Supabase : SQL Editor > New query > Run.
-- Le script peut être relancé sans risque : il n'ajoute rien en double.
--
--  - « Réveil sans écran » : le matin, du lundi au vendredi (2 étoiles,
--    validé par un parent) ;
--  - « 15 min de lecture » : en semaine, après le goûter (la pause lecture
--    du week-end reste inchangée) ;
--  - « 3 heures sans écran » : l'après-midi du week-end seulement.
-- (Déjà appliqué le 12/10/2026 depuis Réglages > La journée de Khloé.)
-- =====================================================================

insert into rituals (household_id, member_id, label, emoji, moment, scheduled_time, stars, needs_parent_approval, sort_order, days)
select m.household_id, m.id, 'Réveil sans écran', '⏰', 'matin', '07:15', 2, true, 0, '{1,2,3,4,5}'
from members m
where m.first_name = 'Khloé'
  and not exists (
    select 1 from rituals r where r.member_id = m.id and r.label = 'Réveil sans écran'
  );

insert into rituals (household_id, member_id, label, emoji, moment, scheduled_time, stars, needs_parent_approval, sort_order, days)
select m.household_id, m.id, '15 min de lecture', '📚', 'apres-midi', '18:00', 1, false, 8, '{1,2,3,4,5}'
from members m
where m.first_name = 'Khloé'
  and not exists (
    select 1 from rituals r where r.member_id = m.id and r.label = '15 min de lecture'
  );

-- « 3 heures sans écran » : l'après-midi, le week-end seulement.
update rituals set moment = 'apres-midi', days = '{0,6}'
where label = '3 heures sans écran';

-- Vérification : les rituels de Khloé, dans l'ordre de la journée.
select label, moment, scheduled_time, stars, days
from rituals
order by case moment when 'matin' then 1 when 'apres-midi' then 2 else 3 end, scheduled_time;
