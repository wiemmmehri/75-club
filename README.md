# 🎀 The 75 Club

Private club. Public glow-up. L'app du challenge 75 jours de Hajer, Wiem, Roua & Amani.
Next.js 14 (front + API dans le même projet), PWA mobile, 3D (Three.js), sons synthétisés en direct.

## Lancer en local

```bash
npm install
npm run dev
```
Ouvre http://localhost:3000 (vue mobile du navigateur, ou ton téléphone sur le même Wi-Fi via http://IP-de-ton-pc:3000).
La base (`data/club75.db`) et les 5 comptes sont créés automatiquement au premier lancement.

## Comptes par défaut — à modifier dans `config/accounts.ts` AVANT le premier lancement

| Qui | Email | Mot de passe |
|---|---|---|
| Admin (fondatrice) | admin@75club.app | Boss75! |
| Hajer | hajer@75club.app | Hajer-75 |
| Wiem | wiem@75club.app | Wiem-75 |
| Roua | roua@75club.app | Roua-75 |
| Amani | amani@75club.app | Amani-75 |

Ensuite : chacune change son mot de passe dans son profil, et l'admin peut modifier email / mot de passe de chacune.
**Le jour 1 du challenge se règle dans Admin → Réglages** (même date pour tout le club). Le bloc « Redémarrer le challenge » change le jour 1 et peut effacer les données de test d'avant (coches, humeurs, roues, preuves) sans toucher aux comptes, objectifs, posts et photos.

## Mettre en ligne sur Vercel (gratuit)

Vercel ne garde pas de fichier SQLite, donc en prod on utilise **Turso** (SQLite hébergé gratuit, même code).

1. Crée un compte sur turso.tech → crée une base → copie l'URL `libsql://…` et crée un token.
2. Mets ce dossier sur GitHub, puis importe-le dans Vercel.
3. Vercel → Settings → Environment Variables :
   - `TURSO_DATABASE_URL` = l'URL libsql
   - `TURSO_AUTH_TOKEN` = le token
   - `AUTH_SECRET` = une longue phrase secrète au hasard
4. Deploy. Les tables et les comptes se créent à la première visite.

## Installer sur le téléphone
- iPhone (Safari) : Partager → « Sur l'écran d'accueil »
- Android (Chrome) : menu ⋮ → « Installer l'application »

## Les espaces

- **Club** : jour X/75 + épisode de la semaine, les 4 Polaroids, SOS (la bannière disparaît dès que tu cliques « Y aller », ou si tu as déjà réagi), mot du club, derniers posts
- **My era** : carrousel 3D avec un cœur par objectif (verre → bonbon quand c'est coché), 📸 photos-preuves par objectif (visibles par le club), mood, eau, journal privé
- **Roue des punitions** : pour chaque jour manqué, un pop-up plein écran impossible à fermer s'ouvre dès qu'on ouvre l'app, jusqu'à ce que la roue ait tourné (Free Pass / 5 DT de sadaqa / +30 min de marche / s'insulter 20 s en vocal, chacune 2×). La punition arrive dans le Tea « en attente » jusqu'à ce qu'elle soit prouvée (photos, vocal ou message)
- **Body journal** (`/body`, privé, même pour l'admin) : poids, mensurations, 3 photos (face / profil / dos), courbe, analyse (rythme, projection jour 75, régularité), comparateur glissière / fantôme / côte à côte, timelapse
- **Objectifs** : de 1 à 6 par fille. Les 4 classiques (Sport, Alimentation, Coran, Self-care) sont optionnels, on peut ajouter des objectifs perso avec leur emoji, et tout se gère plus tard dans le profil. Un objectif supprimé est archivé : l'historique des jours passés ne change pas.
- **Tea** : posts texte/photo, réactions, commentaires texte ou vocaux 🎙️, SOS, posts automatiques (journée validée avec ses photos-preuves, punitions avec statut + preuves), filtre « Punitions / En attente »
- **Awards** : 7 titres hebdo, 12 badges, Hall of Fame
- **Archive** : calendrier des 75 cœurs, épisodes, stats, Glow-Up Museum (avant/après privé)
- **Carte de membre** holographique (Pearl → Silver → Gold → Holo Icon)
- **Admin** : vue du groupe, fiches, photos, Tea, réglages — les journaux restent privés

Le son se coupe avec le bouton 🔈 en haut. Les photos sont compressées sur le téléphone avant l'envoi.

## Structure
```
app/(app)/*        écrans des girls (club, era, tea, awards, archive, girls/[id], me)
app/admin/*        espace admin
app/onboarding     première connexion
app/api/*          tout le backend
components/three/* scènes 3D (cœurs, splash)
lib/sound.ts       sons synthétisés (Web Audio)
lib/db.ts          base de données, tables, comptes
config/accounts.ts comptes par défaut
```
