# LesTakam — Historique du projet

Source : `git log` (44 commits). Activité : 22 commits le 11/09, 2 le 12/09, 2 le 13/09,
puis une pause de quatre semaines, puis 5 le 11/10, 6 le 12/10 et 7 le 13/10.

## Vue d'ensemble

| Phase | Dates | Thème |
| --- | --- | --- |
| 1. Fondation | 11/09 | Tableau de bord, calendrier, base partagée, courses, récompenses |
| 2. Tak | 11/09 | Assistant vocal par modèle de langage, sorties structurées |
| 3. Itérations produit | 11/09 | Vues du calendrier, recettes, portraits, connexion par code |
| 4. Partage et mobile | 11/09 au 13/09 | Étoiles partagées, menu « Plus », correctifs Supabase, rituels par jour |
| 5. Pause | 14/09 au 10/10 | Aucun commit |
| 6. Refonte et gamification | 11/10 au 12/10 | Design façon Jow, niveaux, séries, tours de récompenses, challenges |
| 7. Partage complet et notifications | 12/10 au 13/10 | `shared_items`, notifications push, voix de Tak, recettes vers courses |

## Phase 1 — Fondation (11/09)

- `0fac379` Création du tableau de bord : date et heure vivantes, météo Open-Meteo du
  Blanc-Mesnil, semaine glissante sur 7 jours, photos filtrantes, rappels, tenues du jour
  selon le ressenti thermique, rituels de Khloé en matin / après-midi / soir.
- `6e76b85` Calendrier complet : ajout, modification, suppression, répétition hebdomadaire,
  filtre par personne.
- `087476a` Préparation de la base Supabase (`01-structure.sql`, RLS par foyer) et connexion
  des parents. Principe fondateur : **mode local par défaut**, mode partagé dès que les
  variables d'environnement sont présentes.
- `cc7d472` Repas, liste de courses, récompenses, réglages.

## Phase 2 — Tak, l'assistant vocal (11/09)

- `3170f57` Reconnaissance vocale du navigateur (Web Speech) + modèle de langage via
  Vercel AI Gateway (AI SDK, `generateObject`). Tak ne fait que des ajouts et demande
  toujours confirmation.
- Quatre commits de correction enchaînés (`d0c0b16`, `caf767d`, `f89f86c`, `5a70b0e`) :
  le palier gratuit d'AI Gateway n'autorise qu'un modèle, et la sortie structurée stricte
  d'OpenAI refuse les unions. Décision : **schéma plat à champs nullable**, converti ensuite
  en union typée par `toTakAction`.

## Phase 3 — Itérations produit (11/09)

- `b72fdcb` **Code à saisir plutôt que lien magique** : les messageries et antivirus ouvrent
  les liens à usage unique pour les vérifier et les grillent.
- `4666b10`, `abc8922`, `86713ea` Calendrier en grille horaire, vues Jour / Semaine / Mois,
  Tak en widget flottant, rappels modifiables, tenues corrigées.
- `d53a5c7`, `f0de505` Recettes illustrées : recherche de photo Wikimedia, puis liste de
  courses intelligente depuis un repas.
- `8f27c83`, `f23ce9b`, `c098ef0`, `1b4c2d4` Portraits de la famille, fonds colorés des
  avatars (Khloé « sun », pas lilas).
- `c200069`, `f6f68de` Objectif « Repas au restaurant » (20 étoiles), bouton de fermeture de Tak.

## Phase 4 — Partage et mobile (11/09 au 13/09)

- `bc8bb9b` Objectifs et étoiles de Khloé partagés entre les deux parents via Supabase.
- `8947edb` Correction de canaux Realtime en collision entre Tak et les pages.
- `42b3310` Menu « Plus » sur mobile (Recettes, Listes, Réglages).
- `724ec60` Correction d'un bug majeur : les écritures Supabase ne partaient jamais sur le réseau.
- `c8aa2a8` Rituels propres au jour (colonne `days`) : pas de cartable le week-end.

## Phase 5 — Pause (14/09 au 10/10)

Quatre semaines sans commit. Reprise le 11/10 avec une refonte de l'identité visuelle.

## Phase 6 — Refonte et gamification (11/10 au 12/10)

- `62d2b36` Rituels validés au tap, fête des récompenses, tenues réalistes, Tak assistant.
- `096470b` Tak revient au modèle `gpt-5.4-nano`, seul autorisé au palier gratuit.
- `939a0ea` Événements hebdomadaires « hors vacances scolaires » (zone C).
- `d24200b` Idées de plats, sélecteur d'heure, confirmations, liens Maps ; **retrait de la
  page Repas** (la table `meals` reste dans le schéma mais n'est plus utilisée).
- `2a54b2c` **Refonte « façon Jow »** validée par Ernestine : l'ancienne identité (pastels,
  cartes à liseré, capitales espacées, emojis partout, dégradés) était jugée « AI slop ».
  Gamification de Khloé introduite.
- `e6ca5b1` Récompenses par tours (retour à 0 après 60 étoiles), badges de niveau et de série.
- `12e7b58`, `670522d` Challenges : réveil sans écran (semaine), 15 min de lecture (semaine),
  3 heures sans écran (week-end seulement). Script `03-challenges-octobre-2026.sql`.
- `081c6b4` Gestion des rituels dans les Réglages, suppression des rappels par glissement.
- `5665516` Événements sur plusieurs jours (voyage, vacances).

## Phase 7 — Partage complet et notifications (12/10 au 13/10)

- `9380db3` **Table `shared_items`** (JSON par élément) : calendrier, rappels et courses
  partagés en temps réel. Évite une migration par évolution du modèle d'événement.
  Import unique, par appareil, des données locales vers la base.
- `fef9354` Notifications push : veille à 19h, une heure avant un événement, « À ne pas
  oublier » à 8h. Planificateur `pg_cron` toutes les 5 minutes appelant `/api/notifications/envoyer`.
- `fa3492a` Icône et image de partage : l'illustration de la famille (PWA installable).
- `3b61626` Mobile : fin du débordement horizontal, en-tête compact.
- `f89ab6e`, `535e699`, `f3c3432` Tak répond à voix haute : synthèse du navigateur d'abord,
  puis voix ElevenLabs (route `/api/tak/voix`), repli sur la voix du téléphone, deux voix testées.
- `c7da86e` Recettes : choix des ingrédients à acheter, placard décoché, articles nettoyés.

## Décisions structurantes

1. **Local d'abord, partagé ensuite** : l'app marche sans base ; le branchement Supabase ne
   change pas l'interface des écrans.
2. **Pas de clé `service_role`** : les tâches serveur passent par des fonctions SQL
   `security definer` protégées par un secret partagé (`app_secrets`).
3. **Code de connexion plutôt que lien magique**, pour résister aux scanners de liens.
4. **JSON dans `shared_items`** pour tout ce qui évolue vite (événements, rappels, courses).
5. **Tak demande toujours confirmation** et n'écrit que des ajouts.
6. **Corriger, ne jamais rebrander** : la direction Jow est validée (voir `.impeccable.md`).

## État au 2026-10-21

Dernier commit : 13/10 (`f3c3432`). Sources de vérité : voir [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md).
Le `README.md` du dépôt est en retard sur le code (il décrit encore « Ce qui reste à construire »
alors que le partage et les notifications sont livrés).
