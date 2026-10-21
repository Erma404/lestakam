# LesTakam — App Flow

## 1. Plan de navigation

Navigation principale (barre latérale sur tablette, barre basse sur mobile) :
Accueil `/`, Calendrier `/calendrier`, Rituels `/rituels`, Récompenses `/recompenses`.
Secondaires (menu « Plus » sur mobile) : Recettes `/recettes`, Listes `/listes`, Réglages `/reglages`.
Transverses : widget Tak (toutes pages, page dédiée `/tak`), connexion `/connexion/retour`.

```
Ouverture
  |-- Supabase non configuré ----> Mode local (bandeau)
  |-- Supabase configuré
        |-- pas de session -----> Écran de connexion (e-mail -> code)
        |-- session valide -----> Accueil
```

## 2. Parcours

### 2.1 Connexion d'un parent
1. Saisir son e-mail.
2. Recevoir un code par e-mail (pas de lien, voir HISTORIQUE).
3. Saisir le code, session ouverte, arrivée sur l'accueil.
4. Premier lancement : `02-donnees-de-depart.sql` doit avoir créé le foyer et les membres.

### 2.2 Coup d'œil en cuisine (tablette)
Accueil : date et heure, météo, semaine sur 7 jours, rappels, tenues, rituels de Khloé.
Un appui sur une photo filtre le programme sur cette personne ; un appui sur un jour
affiche son programme. Minuit : bascule automatique.

### 2.3 Khloé valide un rituel
1. Rituels (ou carte sur l'accueil) : liste par matin / après-midi / soir, filtrée par jour.
2. Tap sur le rituel : état `coche`.
3. Sans validation parentale requise : étoiles immédiates. Sinon, un parent confirme : `valide`.
4. Étoiles, niveau, série et progression vers l'objectif se mettent à jour.
5. Objectif atteint : fête de récompense (`RewardCelebration`), objectif marqué débloqué.
6. Objectif le plus haut atteint : nouveau tour, compteur à 0, objectifs remis en jeu.

### 2.4 Ajouter un événement
1. Calendrier, bouton « + » corail, formulaire : titre, date (et fin), heure (sélecteur), lieu,
   catégorie, personnes, répétition (jours, hors vacances scolaires), notes.
2. Enregistrement, confirmation (`SaveConfirmation`).
3. Visible aussitôt sur l'accueil et sur les autres appareils.

Vues : Jour (grille horaire), Semaine, Mois. Modifier ou supprimer depuis le détail.

### 2.5 Courses et rappels
Listes : ajout rapide, regroupement par rayon, cocher, purger les cochés. Rappels :
ajout, modification, suppression par glissement.

### 2.6 Recettes vers courses
1. Recettes : idées par envie, ou nom de plat.
2. Fiche : photo, portions, nutrition, ingrédients, étapes, lien vidéo.
3. Sélecteur d'ingrédients (placard décoché) puis ajout à la liste de courses.

### 2.7 Parler à Tak
1. Ouvrir le widget, appuyer sur le micro, parler.
2. Tak répond en texte et à voix haute, propose des actions résumées.
3. Parent confirme ou annule. Recherche de recette : affichée directement.
4. Bouton pour couper la voix ; fermeture du panneau par la croix.

Échecs : « Je n'ai rien entendu », « Peux-tu la reformuler ? », « Tak est indisponible ».

### 2.8 Activer les notifications
Réglages > Notifications : accepter l'autorisation du navigateur. Sur iPhone et iPad,
installer d'abord l'app sur l'écran d'accueil. L'abonnement est enregistré dans
`push_subscriptions`. Tir au toucher : ouvre `/calendrier`.

### 2.9 Réglages
État de connexion, déconnexion, trombinoscope du foyer, gestion des rituels de Khloé
(`RitualsSettings`), objectifs de récompense, notifications, remise à zéro des rubriques locales.

## 3. États transverses

| Situation | Comportement |
| --- | --- |
| Hors ligne ou base absente | Mode local, bandeau d'information |
| Météo indisponible | Carte calme avec message, reste de l'écran intact |
| IA indisponible | Tak le dit, le reste fonctionne |
| Voix ElevenLabs en échec | Voix du téléphone |
| Première connexion d'un appareil | Import unique du local vers la base |

## 4. Notifications (calendrier d'envoi)

| Déclencheur | Moment | Clé anti-doublon |
| --- | --- | --- |
| Récapitulatif du lendemain | À partir de 19h00 | `veille:<date>` |
| Avant un événement à heure fixe | 60 min avant | `avant:<id>:<date>` |
| « À ne pas oublier » | 08h00 à 21h00 | clé par rappel et jour |
| École | Jamais | catégorie silencieuse |
