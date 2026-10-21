# LesTakam — Backend Schema

Plateforme : Supabase (Postgres, Auth, Realtime, pg_cron, pg_net).
Scripts à exécuter dans l'ordre, dans le SQL Editor : `01-structure.sql`, `02-donnees-de-depart.sql`
(après la première connexion des deux parents), `03-challenges-octobre-2026.sql`,
`04-listes-partagees.sql`, `05-notifications.sql`. Tous sont rejouables sans doublon.

## 1. Modèle de données

```
households 1---n members 1---n rituals 1---n ritual_status
     |                 \---n reward_goals
     |---n shared_items  (kind: evenement | rappel | course)
     |---n push_subscriptions
     |---n notification_log
auth.users 1---0..1 members   (parents seulement)
```

### households
`id uuid pk`, `name`, `weather_location_name`, `weather_latitude`, `weather_longitude` (coordonnées
de la météo, valeurs par défaut définies dans le SQL), `created_at`.

### members
`id`, `household_id fk`, `user_id uuid unique fk auth.users (set null)`, `first_name`,
`role in (parent, enfant)`, `avatar_emoji`, `photo_url`, `accent in (sky, rose, sage,
terracotta, lilac, sun)`, `warmth_preference in (frileux, normal, chaud)`, `birth_year`,
`sort_order`, `created_at`. Index `(household_id)`. Un enfant n'a pas de compte.

### rituals
`id`, `household_id`, `member_id fk`, `label`, `emoji`, `moment in (matin, apres-midi, soir)`,
`scheduled_time`, `stars >= 0` (défaut 1), `needs_parent_approval` (défaut true), `active`,
`sort_order`, `days smallint[]` (0 = dimanche à 6 = samedi, NULL = tous les jours).

### ritual_status
`id`, `household_id`, `ritual_id fk`, `status_date`, `state in (coche, valide)`,
`approved_by fk members`, `approved_at`, `created_at`. **Unique `(ritual_id, status_date)`**.
Le total d'étoiles est dérivé de cette table (état `valide`), pas stocké.

### reward_goals
`id`, `household_id`, `member_id`, `label`, `emoji` (défaut cadeau), `stars_required > 0`,
`achieved_on date`, `sort_order`. Gestion des tours : `achieved_on` remis à NULL quand un
nouveau tour démarre (`needsNewRound`).

### shared_items (table réellement utilisée pour calendrier, rappels, courses)
`household_id fk`, `kind in (evenement, rappel, course)`, `id text`, `data jsonb`,
`created_at`, `updated_at`. **PK `(household_id, kind, id)`**. Trigger `touch_updated_at`.
Publiée dans `supabase_realtime`.

Forme du JSON `evenement` (type `CalendarEvent`) : `id`, `title`, `date`, `endDate?`,
`startTime?`, `endTime?`, `location?`, `category`, `memberIds[]`, `repeatsWeekly?`,
`repeatDays?[]`, `skipSchoolHolidays?`, `notes?`.
`rappel` : `id`, `label`, `dueDate?`, `memberIds[]`, `done`.
`course` : `id`, `label`, `quantity?`, `aisle?`, `checked`.

### push_subscriptions
`endpoint text pk`, `household_id fk`, `member_id fk (set null)`, `p256dh`, `auth`, `created_at`.

### notification_log
`(household_id, key) pk`, `sent_at`. RLS activée sans politique : accessible seulement aux
fonctions `security definer`. Nettoyage au-delà de 7 jours.

### app_secrets
`name pk`, `value`. RLS sans politique. Contient `notifications` (>= 32 caractères), saisi à la main.

### Tables héritées, non utilisées par l'app
`events`, `reminders`, `shopping_items`, `meals` (créées par `01-structure.sql`). À supprimer
ou à réactiver explicitement (voir IMPLEMENTATION_PLAN).

## 2. Sécurité (RLS)

- Fonctions : `current_household_id()` (foyer du `auth.uid()`), `current_member_is_parent()`,
  toutes deux `stable security definer`, `search_path = public`.
- `households` : SELECT pour les membres, UPDATE pour un parent.
- `members`, `rituals`, `ritual_status`, `reward_goals`, `shared_items`, `push_subscriptions`
  (et tables héritées) : politique « acces au foyer » `for all`, `using` et `with check` sur
  `household_id = current_household_id()`.
- Limite actuelle : tout membre connecté, parent ou non, peut écrire sur les tables du foyer ;
  seule `households` distingue le rôle parent.

## 3. Fonctions RPC (notifications)

| Fonction | Effet |
| --- | --- |
| `notifications_secret_ok(secret)` | Interne, vérifie `app_secrets` (>= 32 car.) ; droits retirés aux clients |
| `notifications_a_preparer(secret) -> jsonb` | Par foyer ayant des abonnements : événements, rappels, abonnements, clés envoyées sur 3 jours |
| `notification_envoyee(secret, foyer, cle)` | Journalise une clé, purge > 7 jours |
| `abonnement_perime(secret, adresse)` | Supprime un abonnement expiré |

Exécutables par `anon` et `authenticated`, mais bloquées sans le bon secret (`acces refuse`).

## 4. Planification

Extensions `pg_cron` et `pg_net`. Tâche `lestakam-notifications` toutes les 5 minutes :
`POST https://lestakam.vercel.app/api/notifications/envoyer` avec
`Authorization: Bearer <app_secrets.notifications>`.

## 5. Stockage local (mode sans base)

Préfixe `lestakam:` dans localStorage via `useStoredState` (`localStore.ts`), avec cache
analysé par clé et synchronisation entre onglets. Repère d'import : `lestakam:partage-importe:<kind>`.
Clés notables : `etoiles` (journal d'étoiles local).

## 6. Données de départ

Foyer « LesTakam », Stéphane (sky, chaud), Ernestine (rose, frileux), Khloé (sun, normal,
née en 2021). Rituels de Khloé par moment, avec jours (`days`) et étoiles. Objectifs :
parc (20), cinéma (40), surprise mystère (60). Objectif « Repas au restaurant » (20) ajouté
ultérieurement depuis l'app.
