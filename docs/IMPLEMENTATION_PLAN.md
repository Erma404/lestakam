# LesTakam — Plan d'implémentation

Cinq jalons sont livrés (voir HISTORIQUE). Ce plan liste d'abord ce qui est fait, puis
l'ordre proposé pour la suite. Les priorités sont des propositions, à valider.

## 1. Jalons livrés

| Jalon | Contenu | Statut |
| --- | --- | --- |
| J1 Fondation | Tableau de bord, météo, calendrier, rituels, base Supabase, connexion par code | Livré 11/09 |
| J2 Tak | Assistant vocal, sortie structurée, confirmation, recettes | Livré 11/09 |
| J3 Partage | Étoiles, objectifs, rituels via Supabase ; menu mobile | Livré 11 au 13/09 |
| J4 Refonte et gamification | Design Jow, niveaux, séries, tours, challenges, gestion des rituels | Livré 11 au 12/10 |
| J5 Partage complet et notifications | `shared_items`, push, PWA, voix ElevenLabs, recettes vers courses | Livré 12 au 13/10 |

## 2. Reste à faire

### Étape A — Remise à plat (court, faible risque)
1. Mettre à jour `README.md` (le partage et les notifications sont livrés).
2. Fixer la branche de référence : fusionner `claude/gracious-clarke-lgd7nc` dans `main`
   (action de publication, à valider avant).
3. Décider du sort des tables héritées `events`, `reminders`, `shopping_items`, `meals`
   (supprimer via un script `06-nettoyage.sql`, ou conserver pour un futur planning de repas).
4. Documenter dans le dépôt la procédure d'installation PWA sur iPhone et iPad.

### Étape B — Fiabilité
1. Intégration continue : lint, tests, build à chaque push.
2. Tests de bout en bout (Playwright, déjà en dépendance) : connexion, rituel validé, ajout d'événement.
3. Tests des routes API (`/api/tak`, `/api/notifications/envoyer`) avec modèle et base simulés.
4. Générer `database.types.ts` avec la CLI Supabase plutôt que de l'écrire à la main.
5. Rendre l'URL du cron configurable au lieu de la coder en dur dans `05-notifications.sql`.

### Étape C — Sécurité et droits
1. Distinguer parent et enfant dans les politiques RLS (aujourd'hui seule `households` le fait).
2. Limiter le débit de `/api/tak` et `/api/recettes`.
3. Journaliser les validations de rituel (`approved_by`, `approved_at` déjà présents, à exploiter dans l'UI).

### Étape D — Produit (priorités à confirmer)
| Idée | Valeur | Effort |
| --- | --- | --- |
| Photos de profil importables | Personnalisation du foyer | Moyen (Supabase Storage) |
| Planning de repas | Cohérence avec recettes et courses | Moyen (réactiver `meals` ou nouveau `kind`) |
| Tak : modifier et supprimer, pas seulement ajouter | Confort vocal | Moyen, à cadrer côté sécurité |
| Récapitulatif hebdomadaire pour les parents | Suivi des rituels et étoiles | Faible |
| Notifications de validation en attente | Réactivité des parents | Faible |
| Historique des récompenses obtenues par tour | Mémoire de Khloé | Faible |
| Localisation et fuseau configurables par foyer | Généralisation | Faible (colonnes déjà en base) |

## 3. Ordre recommandé

A (1 à 2 jours) puis B.1 et B.2 (tests et CI), puis C.1, puis choisir 1 ou 2 éléments de D
selon l'usage réel de la famille.

## 4. Définition de terminé

- Lint, tests et build passent en CI.
- La documentation de `docs/` reflète le code.
- Vérification sur tablette et sur téléphone après tout changement visible, et accord
  d'Ernestine avant de pousser une nouveauté visible.

## 5. Risques et dépendances

| Dépendance | Impact si indisponible |
| --- | --- |
| Vercel AI Gateway (carte bancaire à ajouter) | Tak et recettes indisponibles |
| Quota ElevenLabs | Voix du téléphone en repli |
| Supabase pg_cron | Plus de notifications automatiques |
| Open-Meteo | Carte météo remplacée par un message |
