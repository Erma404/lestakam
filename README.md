# LesTakam

Le tableau de bord de la famille : calendrier, rituels, météo, repas et récompenses,
sur un seul écran.

Conçu pour deux usages :

- une **tablette posée dans la cuisine**, allumée en permanence, qui affiche la journée
  en cours d'un simple coup d'œil ;
- les **téléphones des parents**, pour consulter et modifier le planning en déplacement.

## Ce qui fonctionne aujourd'hui

- **Tableau de bord** : date du jour, heure qui avance toute seule, et bascule
  automatique de journée au passage de minuit.
- **Météo** de la localisation du foyer (Le Blanc-Mesnil) : température actuelle,
  ressenti, minimale, maximale et probabilité de pluie, rafraîchie toutes les
  15 minutes et au réveil de la tablette.
- **Semaine glissante sur 7 jours** avec la météo de chaque jour ; un appui sur une
  journée affiche son programme.
- **Photos de la famille** : un appui sur une photo filtre le programme sur cette personne.
- **Rappels** : les actions clés de la semaine.
- **Tenues du jour** : ce que chaque membre devrait porter, calculé à partir de la météo
  et de son ressenti thermique (frileux, normal, chaud).
- **Rituels de Khloé** répartis en matin, après-midi et soir, avec validation par un
  parent avant que les étoiles comptent, et progression vers la prochaine récompense.

- **Calendrier** : ajout, modification et suppression des événements, répétition
  chaque semaine, filtre par personne. Ce qui est ajouté apparaît aussitôt sur le
  tableau de bord.
- **Connexion des parents** par code reçu par e-mail, sans mot de passe. Un code plutôt
  qu'un lien cliquable : certaines messageries et antivirus ouvrent les liens tout
  seuls pour les vérifier, ce qui grille un lien à usage unique avant même que la
  personne ait cliqué dessus.
- **Repas** : planning à 7 jours (midi et soir), avec un envoi direct d'un repas vers
  la liste de courses.
- **Liste de courses** : ajout rapide, regroupement par rayon, purge des articles cochés.
- **Récompenses** : objectifs personnalisables par les parents, compteur d'étoiles
  cumulé (semaine, mois, depuis le début) qui ne repart plus de zéro chaque matin,
  déblocage automatique et historique des récompenses obtenues.
- **Réglages** : état de la connexion, déconnexion, trombinoscope du foyer, remise
  à zéro de chaque rubrique locale.
- **Tak**, l'assistant vocal : on parle, il exécute (ajouter un événement, un repas,
  un article, valider un rituel) ou cherche une recette. Voir [Activer Tak](#activer-tak).

## Ce qui reste à construire

Le branchement des rubriques ci-dessus (hors connexion et calendrier) sur la base
partagée : elles restent pour l'instant mémorisées sur chaque appareil.

## Mise en service

L'application fonctionne dans deux modes, sans manipulation particulière :

- **Mode local** (par défaut, tant que la base n'est pas configurée) : tout
  fonctionne, mais les données restent sur l'appareil et un bandeau le rappelle.
- **Mode partagé** : dès que les deux variables d'environnement sont renseignées,
  l'accès demande une connexion et les données sont partagées entre les appareils.

Pour passer en mode partagé :

1. Dans Supabase, ouvrir **SQL Editor** et exécuter `supabase/01-structure.sql`.
   Ce fichier crée les tables et les règles de sécurité qui limitent l'accès aux
   membres du foyer.
2. Dans Supabase, **Project Settings > API**, relever « Project URL » et la clé
   « anon public ». Les reporter dans Vercel, sous **Settings > Environment
   Variables**, aux noms indiqués dans `.env.example`. La clé `service_role` ne
   doit jamais être utilisée ici.
3. Demander un code de connexion depuis l'application, avec l'adresse e-mail de
   chaque parent, et le saisir, afin de créer les deux comptes.
4. Exécuter `supabase/02-donnees-de-depart.sql` après y avoir inscrit les deux
   adresses e-mail. Ce script crée le foyer, les trois membres, les rituels de
   Khloé et ses objectifs de récompense.

## Activer Tak

Tak comprend une phrase dite à l'oral (reconnaissance vocale du navigateur, gratuite,
aucune clé) et la transforme en action grâce à un modèle de langage appelé via
[Vercel AI Gateway](https://vercel.com/docs/ai-gateway). L'authentification se fait
automatiquement par le projet Vercel (OIDC) : aucune clé API à créer ou coller
dans le code.

Il reste une seule chose à faire, dans le tableau de bord Vercel de l'équipe (**AI
Gateway > Overview**) : ajouter une carte bancaire pour vérifier l'identité de
l'équipe et débloquer les 5 $ de crédit gratuits par mois. Cette étape est propre à
Vercel et ne peut pas être faite par un agent — il faut la faire soi-même depuis le
tableau de bord. Sans elle, Tak répond simplement qu'il est indisponible ; le reste
de l'application continue de fonctionner normalement.

Tak ne fait que des ajouts (calendrier, repas, liste de courses, rituel validé) et
demande toujours une confirmation avant d'agir, sauf pour une recherche de recette,
qui n'importe aucune donnée. Il ne répond jamais à l'oral.

## Développement

```bash
npm install
npm run dev      # développement, sur http://localhost:3000
npm run build    # version de production
npm run start    # démarre la version de production
npm test         # tests automatisés
npm run lint     # contrôle de qualité du code
```

## Techniquement

- [Next.js](https://nextjs.org/docs) (App Router) et React, en TypeScript.
- [Tailwind CSS](https://tailwindcss.com/docs) pour la mise en forme.
- Météo par [Open-Meteo](https://open-meteo.com/en/docs) : service public, gratuit,
  sans clé d'accès. Il est appelé depuis le serveur, jamais depuis la tablette.
- Tak par [AI SDK](https://ai-sdk.dev/) et Vercel AI Gateway, appelés depuis le
  serveur. Reconnaissance vocale par l'API Web Speech du navigateur.
- Tests avec [Vitest](https://vitest.dev/).

L'application reste utilisable si la météo est indisponible : la carte affiche un
message calme et le reste du tableau de bord continue de fonctionner.

### Organisation du code

| Dossier | Contenu |
| --- | --- |
| `src/app` | Les pages et l'adresse `/api/meteo` |
| `src/components` | Les éléments d'interface (tableau de bord, rituels, cartes) |
| `src/lib` | Les données du foyer, les calculs de dates, la météo et les tenues |

Les données de la famille sont pour l'instant décrites dans `src/lib/family.ts`, et les
rituels cochés sont mémorisés dans le navigateur de l'appareil. Les deux seront
remplacés par une base de données partagée entre les appareils.
