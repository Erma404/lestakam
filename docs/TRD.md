# LesTakam — Technical Requirements Document

## 1. Stack

| Domaine | Choix | Version (package.json) |
| --- | --- | --- |
| Framework | Next.js, App Router | 16.3.4 (changements cassants : lire `node_modules/next/dist/docs/` avant de coder) |
| UI | React, TypeScript, Tailwind CSS | 19.2.8, 5.x, 4.x |
| Base et auth | Supabase (`@supabase/supabase-js`, `@supabase/ssr`) | 2.116 / 0.12 |
| IA | AI SDK (`ai`) via Vercel AI Gateway | 7.0.97 |
| Validation | Zod | 4.6 |
| Push | `web-push` | 3.6.7 |
| Tests | Vitest, Playwright (captures) | 5.0 / 1.63 |
| Lint | ESLint 9, `eslint-config-next` | 9 / 16.3.4 |
| Hébergement | Vercel | continu depuis GitHub |

Scripts : `dev`, `build`, `start`, `lint`, `test` (`vitest run`).

## 2. Variables d'environnement

| Variable | Où | Rôle | Secret |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Vercel, `.env.local` | URL du projet | Non |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Vercel, `.env.local` | Clé publique, protégée par RLS | Non |
| `NOTIFICATIONS_SECRET` (>= 32 car.) | Vercel | Autorise l'appel du planificateur | Oui |
| `ELEVENLABS_API_KEY` | Vercel | Voix de Tak | Oui |
| Clés VAPID (publique / privée) | Vercel | Web Push, lues par `pushServer.ts` | Privée : oui |

Absence de Supabase : mode local, aucune erreur. Absence d'ElevenLabs : 503 puis voix du téléphone.
Absence de clés push : 503 « Notifications non configurées ».

## 3. Exigences fonctionnelles techniques

| Réf. | Exigence |
| --- | --- |
| TR-01 | Les données de la famille fonctionnent en local et en partagé avec la même interface de hook |
| TR-02 | Les écritures partagées envoient uniquement le différentiel (upsert, delete) |
| TR-03 | Un appareil qui se connecte importe son local vers `shared_items` sans écraser l'existant, une seule fois (`lestakam:partage-importe:<kind>`) |
| TR-04 | Mises à jour temps réel via publication `supabase_realtime`, un canal unique par instance (`useId`) |
| TR-05 | Les occurrences d'événements sont calculées par `expandEvents` : répétition, `repeatDays`, `skipSchoolHolidays`, `endDate` |
| TR-06 | Le niveau, la série et le cycle de récompenses se calculent uniquement depuis le journal d'étoiles |
| TR-07 | Les étoiles sont déduites de `ritual_status.state = 'valide'` joint à `rituals.stars` |
| TR-08 | Tak : sortie structurée plate nullable, conversion typée, action incomplète écartée |
| TR-09 | Tak : historique tronqué à 10 tours de 2 000 car., contexte à 12 000 car. |
| TR-10 | Voix : texte nettoyé par `speakableText`, 700 caractères maximum, mp3 44,1 kHz 64 kbps |
| TR-11 | Notifications : plages horaires, pas de doublon grâce à `notification_log` (clé unique par foyer) |
| TR-12 | Météo : appel serveur uniquement, tolérance à la panne, rafraîchissement 15 min |

## 4. Sécurité

- RLS activée sur toutes les tables ; politique unique « acces au foyer » pour `all`.
- `households` : lecture par les membres, modification par un parent.
- Fonctions `security definer` avec `search_path = public` ; `notifications_secret_ok` retirée
  des rôles `anon`, `authenticated`, `public`.
- Aucune clé `service_role` dans le code ni dans Vercel.
- Entrées de `/api/tak` filtrées et tronquées (`parseHistory`, `parseRituals`).
- `.env.local` ignoré par git ; secrets saisis à la main, jamais par un agent.

## 5. Performance et disponibilité

- Cible tablette : écran allumé en continu, rafraîchissement météo au réveil (`visibilitychange`).
- Aucun rendu dépendant du JS pour les métadonnées ; image de partage et icônes statiques.
- Service worker non mis en cache (`no-store`) pour propager les mises à jour.
- Timeouts externes : Wikipedia 5 s, Commons 6 s.
- Tolérance aux pannes : météo, IA, voix, photos de recettes échouent sans bloquer l'app.

## 6. Tests

Existants (Vitest) : `dates`, `events`, `gamification`, `rewards`, `shopping`, `notifications`,
`outfit`, `weather`, `ingredients`, `takVoice`. Absents : composants, routes API, RLS,
parcours bout en bout.

## 7. Dette technique connue

1. `README.md` obsolète (section « Ce qui reste à construire »).
2. Tables SQL orphelines : `events`, `reminders`, `shopping_items`, `meals`.
3. URL de production codée dans `05-notifications.sql`.
4. Types Supabase écrits à la main dans `database.types.ts` (pas de génération automatisée).
5. Pas d'intégration continue (lint, tests, build) hors Vercel.
6. Pas de limitation de débit sur `/api/tak`, `/api/recettes` (protégées uniquement par le quota IA).
7. Branche de travail distincte de `main` à clarifier.
