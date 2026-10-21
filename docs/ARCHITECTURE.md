# LesTakam — Architecture

## 1. Vue d'ensemble

```
Tablette cuisine / Téléphones (PWA)
        |  HTTPS
        v
Next.js 16 sur Vercel (App Router, React 19)
   |-- Pages client (tableau de bord, calendrier, rituels, ...)
   |-- /api/meteo ------------> Open-Meteo (public, sans clé)
   |-- /api/tak --------------> Vercel AI Gateway -> openai/gpt-5.4-nano
   |-- /api/recettes ---------> AI Gateway + Wikipedia / Commons (photos)
   |-- /api/tak/voix ---------> ElevenLabs (text-to-speech)
   |-- /api/notifications/* --> web-push (VAPID) vers les appareils
        |
        v
Supabase : Auth (code e-mail), Postgres + RLS, Realtime, pg_cron + pg_net
        ^
        |  toutes les 5 min : POST /api/notifications/envoyer (Bearer secret)
```

## 2. Principes

1. **Local d'abord** : `localStore` (localStorage) est l'implémentation par défaut ;
   Supabase la remplace sans changer l'interface des hooks.
2. **Navigateur sans secret** : seule la clé `anon` est publique. Aucune clé `service_role`.
3. **Serveur pour tout ce qui appelle l'extérieur** : météo, IA, voix, push.
4. **Dégradation douce** : chaque dépendance externe a un repli visible et calme.
5. **Confirmation avant écriture** pour tout ce qui vient de l'IA.

## 3. Couches du code

| Couche | Emplacement | Rôle |
| --- | --- | --- |
| Pages | `src/app/*/page.tsx` | Routes : `/`, `/calendrier`, `/rituels`, `/recompenses`, `/recettes`, `/listes`, `/reglages`, `/tak`, `/connexion/retour` |
| API | `src/app/api/**/route.ts` | Météo, Tak, voix, recettes, notifications |
| Composants | `src/components` | Dashboard, CalendarView, RitualsBoard, RewardsBoard, TakWidget, formulaires... |
| Domaine | `src/lib` | Dates, événements (`expandEvents`), récompenses, gamification, tenues, notifications, Tak |
| Données | `src/lib/use*.ts` | Hooks : `useEvents`, `useRituals`, `useRitualStatus`, `useStars`, `useRewardGoals`, `useShoppingList`, `useReminders` |
| Supabase | `src/lib/supabase` | Client, session, foyer, types générés |
| Base | `supabase/*.sql` | Structure, données de départ, évolutions numérotées |

## 4. Flux de données

### 4.1 Lecture/écriture partagée
- Hooks branchés `shared_items` : `useSharedList(kind, storageKey, demo)` charge les lignes
  du foyer, s'abonne à Realtime, n'envoie que les **différences** (upsert / delete).
- Hooks branchés tables relationnelles : rituels (`rituals`), statuts (`ritual_status`),
  objectifs (`reward_goals`).
- Les **étoiles ne sont pas stockées** : le journal est déduit des `ritual_status` validés
  joints à `rituals.stars`.

### 4.2 Tak
1. Navigateur : Web Speech API produit le texte.
2. `POST /api/tak` avec texte, date, heure, contexte (<= 12 000 car.), rituels du jour, 10 derniers échanges.
3. `generateObject` avec un schéma plat nullable, converti par `toTakAction` en action typée.
4. Actions incomplètes écartées ; recette construite côté serveur et renvoyée directement.
5. Le navigateur affiche un résumé à confirmer, puis exécute via les hooks.
6. Réponse lue par `/api/tak/voix` (ElevenLabs) ou voix du téléphone en repli.

### 4.3 Notifications
1. `pg_cron` toutes les 5 min appelle `/api/notifications/envoyer` avec `Bearer` secret.
2. La route lit via la fonction SQL `notifications_a_preparer(secret)` (événements, rappels,
   abonnements, clés déjà envoyées sur 3 jours).
3. `planNotifications` décide quoi envoyer selon l'heure de Paris.
4. `sendPush` envoie ; `notification_envoyee` journalise la clé ; `abonnement_perime` nettoie.

## 5. Sécurité

- RLS sur toutes les tables, fonctions `current_household_id()` et `current_member_is_parent()`.
- Secrets d'infrastructure : `NOTIFICATIONS_SECRET`, `ELEVENLABS_API_KEY`, clés VAPID, uniquement
  dans Vercel ; `app_secrets` dans Supabase, illisible depuis le navigateur.
- Comparaison à temps constant du secret (`timingSafeEqual`).
- `/api/tak/voix` exige une session valide quand Supabase est configuré.
- Règle du dépôt : les secrets ne passent jamais par un agent.

## 6. Déploiement

- GitHub `Erma404/lestakam` (branche de travail `claude/gracious-clarke-lgd7nc`, HEAD distant).
- Vercel : déploiement continu, URL `lestakam.vercel.app` (aussi codée en dur dans le cron SQL).
- Authentification AI Gateway par OIDC du projet, carte bancaire à ajouter côté Vercel.
- `sw.js` servi en `no-store` pour rester à jour (voir `next.config.ts`).

## 7. Points d'attention

- L'URL de production est écrite dans `05-notifications.sql` : à modifier si le domaine change.
- `shared_items` privilégie la souplesse (JSON) à l'intégrité relationnelle : pas de clé
  étrangère vers `members` pour les `memberIds`.
- Les tables `events`, `reminders`, `shopping_items`, `meals` de `01-structure.sql` ne sont
  plus utilisées par l'app (remplacées par `shared_items`, ou page retirée).
