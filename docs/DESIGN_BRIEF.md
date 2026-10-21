# LesTakam — Design Brief

Source de vérité : `.impeccable.md`. Règle d'or : **corriger, ne jamais rebrander**.

## 1. Contexte d'usage

- **Tablette en cuisine**, allumée en continu, lue à distance, mains souvent occupées,
  manipulée aussi par Khloé (5 ans).
- **Téléphones des parents**, en déplacement, usage rapide à une main.

## 2. Personnalité de marque

Chaleureux, net, appétissant. Une app du quotidien soignée, au niveau d'une app grand public :
rassurante pour les parents, simple pour une enfant.

## 3. Direction artistique (refonte d'octobre 2026)

Rupture assumée avec la première identité (pastels doux, cartes blanches à liseré, surtitres
en capitales espacées, emoji devant chaque titre, dégradés et ronds flous), jugée « AI slop ».
**Référence explicite : l'application Jow.**

| Élément | Décision |
| --- | --- |
| Fond | Pêche clair (`#fdf3ec` en thème PWA) |
| Cartes | Blanches, sans bordure ni ombre, coins très arrondis |
| Action | Corail : boutons pilule pleins, « + » ronds, liens « Voir tout → » |
| Marque | Vert forêt : navigation, en-têtes, état « fait / validé » |
| Typographie | Lexend uniquement, graisses 400 à 600, jamais d'extra-gras ; titres en casse normale |
| Icônes | Au trait (corail ou vert) pour navigation et actions |
| Emojis | Seulement s'ils informent : rituels, tenues, météo, idées de plats, objectifs |
| Thème | Clair uniquement |

### Couleurs des membres (aplats doux)
Stéphane bleu (`sky`), Ernestine rose (`rose`), Khloé soleil (`sun`). Disponibles aussi :
`sage`, `terracotta`, `lilac`. Khloé n'est pas lilas.

## 4. Principes

1. **Calme et aéré** : peu de cadres, beaucoup d'espace, une action principale corail par écran.
2. **Contexte temporel explicite** : jour, mois et année toujours visibles.
3. **Lisible de loin, utilisable du bout du doigt** : cibles de 44 px minimum.
4. **Hiérarchie par la taille et la position**, pas par les cadres : pas de cartes dans des cartes.
5. **Interdits** : dégradés, texte en dégradé, bordures latérales colorées, glassmorphism,
   ombres floues génériques, gris sur fond coloré, extra-gras généralisé, surtitres en capitales espacées.

## 5. Composants clés

| Composant | Rôle et exigence |
| --- | --- |
| `AppShell` | Barre latérale (tablette), barre basse + menu « Plus » (mobile), 44 px min. |
| `Card` | Surface blanche sans bordure, coins généreux |
| `Avatar` | Photo réelle sur fond coloré du membre |
| `RitualsBoard` | Gros éléments tactiles pour Khloé, emoji informatif, état coché / validé |
| `KhloeScore`, `Badges` | Étoiles, niveau (7 paliers), série, tour de récompense |
| `RewardCelebration` | Fête à l'atteinte d'un objectif |
| `CalendarView`, `MonthGrid`, `TimePicker` | Grille horaire, vues Jour / Semaine / Mois, sélecteur d'heure |
| `SwipeToDelete` | Suppression de rappel par glissement |
| `TakWidget` | Micro, réponse, résumé d'action à confirmer, bouton voix, fermeture |
| `SaveConfirmation` | Retour d'enregistrement discret |
| `Icon` | Jeu d'icônes au trait |

## 6. Responsive

Mobile : aucun débordement horizontal, en-tête compact, pages secondaires dans « Plus ».
Tablette : navigation latérale, lecture à distance, bascule de journée automatique.

## 7. Contenu et ton

Français, tutoiement bienveillant dans Tak (« Peux-tu la reformuler ? »), messages d'erreur
calmes et utiles, jamais alarmistes. Niveaux de Khloé : Petite graine, Jeune pousse, Étoile
filante, Super étoile, Comète, Constellation, Galaxie.

## 8. Accessibilité

Cibles tactiles >= 44 px, `aria-label` sur les navigations, contraste vérifié sur fond pêche,
information jamais portée par la couleur seule (icône ou texte avec l'état).
