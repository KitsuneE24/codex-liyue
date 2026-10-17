# 璃月图鉴 · Codex Liyue

Explorateur 3D des vingt personnages de Liyue, la région d'inspiration chinoise de *Genshin Impact*.
Chaque personnage est une étoile posée sur le blason de Liyue. En tournant autour du blason, la même constellation se réordonne selon deux axes : l'année de sortie du personnage et le nombre de traits de son nom chinois.

Projet réalisé avec React, Three.js et deux API publiques.

## Fonctionnalités

- **Constellation anamorphique** : de face, les étoiles dessinent le blason. Elles sont pourtant à des profondeurs différentes, ce qu'on découvre en tournant.
- **Trois vues** : le blason de face, la chronologie à gauche et le nombre de traits à droite. Chaque vue de profil a son axe gradué.
- **Survol et clic** : survoler une étoile affiche le portrait et le nom du personnage. Cliquer dessus centre la caméra et ouvre sa fiche.
- **Fiche à deux faces** : en cliquant sur le sceau 3D, la fiche se retourne :
  - face jeu : vision, arme, rareté, date de sortie, affiliation, description ;
  - face culture : chaque caractère du nom avec sa lecture, son sens, son nombre de traits, sa clé Kangxi et ses composants.
- **Filtres** : recherche par nom, hanzi ou pinyin (sans tenir compte des accents), vision, arme et rareté. Les étoiles filtrées s'estompent dans la scène et disparaissent de l'index.
- **Responsive** :
  - sur desktop, un panneau latéral replié en rail ;
  - sur mobile, un panneau qui s'ouvre par-dessus la scène et une fiche qui monte depuis le bas.
- **Ambiance** : un fond animé teinté par l'élément du personnage sélectionné, avec des feuilles de ginkgo qui tombent.

## Données et API

| Données | Source | Appel |
| --- | --- | --- |
| Nom, titre, vision, arme, rareté, sortie, affiliation, constellation, description | [genshin.dev](https://github.com/genshindev/api), instance [genshin.jmp.blue](https://genshin.jmp.blue) | en direct, `GET /characters/{id}` |
| Nombre de traits de chaque caractère | [hanzi-writer-data](https://github.com/chanind/hanzi-writer-data), via jsDelivr | en direct, un JSON par caractère |
| Sens, clé, décomposition | [Make Me a Hanzi](https://github.com/skishore/makemeahanzi) | copie locale |
| Nom chinois et pinyin officiels | saisie manuelle (`scripts/culture.json`) | copie locale |
| Position des étoiles sur le blason | relevé manuel (`scripts/layout.json`) | copie locale |

Au chargement, l'application lit d'abord la copie locale `public/data/liyue.json`. Elle interroge ensuite les deux API en parallèle, avec un délai maximum de 5 secondes. Les réponses reçues remplacent les valeurs locales, et chaque appel qui échoue garde la valeur locale correspondante. Une mention en bas à droite de l'écran indique d'où viennent les données affichées : en direct, en partie en direct, ou copie locale.

Cette copie locale existe parce que les API de la communauté Genshin sont instables : l'adresse d'origine `api.genshin.dev` répond aujourd'hui en erreur 502. Make Me a Hanzi reste en copie locale, car c'est un fichier unique de 2,5 Mo que l'on ne peut pas interroger caractère par caractère.

### Régénérer la copie locale

```bash
npm run corpus            # télécharge les données et les images manquantes
npm run corpus -- --force # retélécharge aussi les images
```

Le script `scripts/build-corpus.mjs` :
- garde les personnages dont la nation est Liyue ;
- les croise avec `culture.json` et `layout.json` ;
- calcule les traits et la clé Kangxi de chaque caractère ;
- écrit `public/data/liyue.json` et les portraits dans `public/img/`.

Il s'arrête avec un message explicite si un personnage n'a pas de nom chinois ou de position sur le blason.

## Lancer le projet

Il faut Node.js 20.19 ou plus récent dans la branche 20, ou 22.12 ou plus récent.

```bash
npm install
npm run dev      # serveur de développement
npm run build    # version de production dans dist/
npm run preview  # sert dist/ en local
npm run lint
```

## Structure

```
src/
  App.jsx                 état global : sélection, filtres, panneau
  components/
    Constellation.jsx     montage de la scène 3D, titre de vue, indication de rotation
    Sheet.jsx             fiche à deux faces
    Seal.jsx              sceau 3D qui retourne la fiche
    Filters.jsx           recherche et filtres
    CharacterIndex.jsx    liste des personnages
  three/
    ConstellationScene.js scène principale : étoiles, blason, axes, caméra, fond, feuilles
    SealScene.js          scène du sceau
  data/                   chargement des données, libellés, filtres, vues
  hooks/                  useCorpus, useMediaQuery
scripts/                  construction de la copie locale des données
public/data/liyue.json    copie locale des données
```

## Déploiement

Le site est déployé sur Netlify. `netlify.toml` lance `npm run build` et publie `dist/`.

## Technologies

React 19, Vite 8, Three.js 0.186 avec OrbitControls, et ESLint.

## Crédits

- Données de jeu : genshin.dev.
- Données des caractères : Make Me a Hanzi et hanzi-writer-data.
- Icône de main : « touch_app » de Material Icons (Apache 2.0).
- *Genshin Impact*, ses personnages, ses illustrations et le blason de Liyue appartiennent à HoYoverse. Projet scolaire, sans but commercial.
