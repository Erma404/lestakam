# LesTakam — Product Requirements Document

Statut : produit en usage réel par un foyer. Version du document : 2026-10-21.

## 1. Problème

Une famille de trois (deux parents actifs, une enfant de 5 ans) jongle entre planning,
courses, routines de l'enfant et météo, dispersés entre messages, notes et mémoire.
Besoin : **un seul endroit, lisible d'un coup d'œil en cuisine et modifiable depuis le téléphone**.

## 2. Utilisateurs

| Persona | Surface | Besoin principal |
| --- | --- | --- |
| Stéphane, Ernestine (parents) | Téléphone, tablette | Consulter et ajuster le planning, valider les rituels, gérer courses et récompenses |
| Khloé (5 ans) | Tablette de la cuisine | Cocher ses rituels, voir ses étoiles et sa progression, sans lire beaucoup |
| Le foyer | Tablette allumée en permanence | Voir la journée, la météo et les tenues sans rien toucher |

## 3. Objectifs

1. Réduire la charge mentale d'organisation (planning, courses, rappels).
2. Donner à Khloé une routine motivante et autonome (étoiles, niveaux, récompenses).
3. Permettre de tout faire à la voix (Tak) quand les mains sont occupées.
4. Rester fiable : fonctionner hors ligne ou sans base, ne jamais perdre de données.

Hors objectifs : multi-foyers commercial, application native, gestion budgétaire, partage avec des tiers.

## 4. Fonctionnalités

Priorité : P0 indispensable, P1 important, P2 confort. Statut : Livré / Partiel / À faire.

### 4.1 Tableau de bord (P0, Livré)
Date et heure vivantes, bascule à minuit, météo (Open-Meteo, rafraîchie toutes les 15 min
et au réveil), semaine glissante 7 jours, filtre par personne, rappels, tenues du jour
(frileux / normal / chaud).

### 4.2 Calendrier (P0, Livré)
Vues Jour / Semaine / Mois, événements avec heure, lieu, catégorie, personnes, notes.
Répétition hebdomadaire avec jours choisis, option « hors vacances scolaires » (zone C) et
jours fériés, événements sur plusieurs jours. Partagé en temps réel.

### 4.3 Rituels de Khloé (P0, Livré)
Rituels par moment (matin, après-midi, soir), propres à certains jours, étoiles par rituel,
validation parentale optionnelle (états `coche` puis `valide`). Gestion dans Réglages.

### 4.4 Récompenses et gamification (P0, Livré)
Étoiles cumulées (semaine, mois, total), objectifs personnalisables, déblocage automatique,
fête de récompense, **tours** (retour à 0 après l'objectif le plus élevé), 7 niveaux
(Petite graine à Galaxie), série de jours consécutifs, badges.

### 4.5 Listes et courses (P0, Livré)
Ajout rapide, regroupement par rayon, purge des articles cochés, rappels de la semaine
(suppression par glissement). Partagé en temps réel.

### 4.6 Recettes (P1, Livré)
Idées de plats par envie, recette complète générée (ingrédients, étapes, nutrition estimée,
photo, lien vidéo), choix des ingrédients à envoyer vers les courses (placard décoché).

### 4.7 Tak, assistant vocal (P1, Livré)
Dictée navigateur, interprétation par modèle de langage, quatre actions : ajouter un
événement, ajouter un article, valider un rituel, chercher une recette. **Confirmation
obligatoire** sauf recherche de recette. Réponse parlée (ElevenLabs, repli voix du téléphone).

### 4.8 Notifications (P1, Livré)
Push web : récapitulatif de la veille à 19h, une heure avant un événement à heure fixe,
« À ne pas oublier » à 8h (jusqu'à 21h). Pas de bruit pour l'école. Jamais d'envoi en double.

### 4.9 Connexion et foyer (P0, Livré)
Code reçu par e-mail, sans mot de passe. Données isolées par foyer (RLS). Mode local si
la base n'est pas configurée, avec bandeau explicite.

### 4.10 Installation PWA (P1, Livré)
Manifest, icônes, service worker : requis pour les notifications sur iPhone et iPad.

### 4.11 Écarts et manques connus
- Repas planifiés : page retirée, table `meals` inutilisée (P2, abandonné ou à relancer).
- Rituels, étoiles et objectifs : branchés Supabase ; reste du local pour certains réglages.
- Pas de photo importable par l'utilisateur (avatars fournis dans `public/avatars`).
- Thème sombre : volontairement absent.

## 5. Critères de succès

| Critère | Cible |
| --- | --- |
| Lisibilité tablette | Journée comprise en moins de 5 secondes, sans interaction |
| Autonomie de Khloé | Elle coche ses rituels seule, cibles tactiles >= 44 px |
| Fiabilité du partage | Un ajout apparaît sur l'autre appareil en quelques secondes |
| Notifications | Zéro doublon, zéro envoi hors plage horaire |
| Disponibilité | L'app reste utilisable si météo, IA ou base sont indisponibles |
| Coût | Palier gratuit (Vercel AI Gateway, Open-Meteo, Supabase) ; ElevenLabs sur quota famille |

## 6. Contraintes

- Langue et contenu en français, fuseau Europe/Paris, localisation Le Blanc-Mesnil.
- Respect de la vie privée : données d'une enfant mineure, pas de tiers, pas de clé `service_role`.
- Un seul modèle autorisé au palier gratuit d'AI Gateway (`openai/gpt-5.4-nano`).

## 7. Risques

| Risque | Mitigation |
| --- | --- |
| Quota IA ou voix épuisé | Tak affiche « indisponible », voix de repli du téléphone |
| Divergence local / base | Import unique par appareil, sans écraser l'existant |
| Notifications iOS non reçues | Installation PWA requise, documenter la procédure |
| Dérive du design | `.impeccable.md` fait foi, « corriger, ne jamais rebrander » |
