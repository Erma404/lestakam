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

## Ce qui reste à construire

Calendrier complet, assistant Tak (chat et voix), repas, listes de courses,
page des récompenses, réglages, base de données partagée et connexion des comptes.

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
