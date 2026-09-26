# Ma Guitare

Apprendre la **guitare classique** en partant de zéro. APK Android + PWA, hors
ligne, sans compte et sans publicité. Même application sur le téléphone et sur
le téléviseur.

## Ce qu'il y a dedans

| | |
|---|---|
| **Parcours** | 18 leçons en 6 chapitres, de la tenue de l'instrument au barré. Une idée neuve par leçon, un exercice mesurable, une case à cocher. |
| **Accordeur** | Détection de hauteur au micro (autocorrélation), affichage en centièmes, six cordes suivies une par une. |
| **Métronome** | Tempo, mesure, subdivisions, battement du tempo à la main, accent sur le premier temps. |
| **Accords** | 23 positions avec diagramme, doigté, notes produites, barrés signalés, écoute grattée / arpégée / corde par corde. |
| **Morceaux** | 8 pièces en tablature, jouées par l'app avec la note en cours surlignée : deux exercices, quatre mélodies du domaine public, deux études d'arpèges. |
| **Oreille** | Trois jeux d'écoute, dix questions, notés. |
| **Suivi** | Minutes du jour, série de jours consécutifs, records de changements d'accords, sauvegarde vers Home Assistant. |

## Sur la télévision

Deux chemins, indépendants :

1. **Installer l'APK sur la télé** (TCL, Freebox Player POP, tout boîtier Android
   TV). Le mode télévision s'active tout seul : tout grossit, la navigation se
   fait aux flèches de la télécommande, la barre d'onglets passe sur le côté.
   Rien à configurer.
2. **Diffuser depuis le téléphone (Chromecast)**, qui reste la télécommande.
   Google n'autorise pas une page quelconque comme récepteur : il faut créer un
   **récepteur personnalisé** sur `cast.google.com/publish` (compte Google, 5 $
   une fois) en pointant `www/recepteur.html` publié sur GitHub Pages, puis
   coller l'identifiant obtenu dans les réglages de l'app. Sans identifiant, le
   bouton de diffusion reste caché.

## Rien n'est téléchargé, rien n'est envoyé

Tous les sons sont **synthétisés** (Karplus-Strong pour la corde pincée,
oscillateur pour le métronome) : pas un octet d'échantillon audio, donc pas de
licence à traîner et une APK légère. L'accordeur analyse le micro **sur
l'appareil** ; aucun flux ne sort. Les morceaux sont soit du domaine public
(traditionnel, Beethoven), soit écrits pour cette app.

## Développement

```bash
npm install
npm test        # 64 contrôles musicaux + 37 contrôles d'interface
python3 tools_gen_icon.py   # régénère les icônes PWA (sans Pillow)
```

`npm test` vérifie la **musique** avant l'interface : fréquences des cordes au
centième de Hz, notes réellement contenues dans chaque accord, doigtés jouables
(≤ 4 doigts, écart ≤ 3 cases), tablatures cohérentes avec les hauteurs
annoncées, détection de hauteur sur signaux de synthèse. Une app qui enseigne
un mauvais doigté est pire qu'une app qui ne démarre pas.

L'APK est construite par GitHub Actions (workflow partagé `laurentsar/app-kit`),
signée avec la clé de `~/app-kit/keys/guitare.p12` restaurée depuis les secrets
du dépôt. `android/` n'est pas versionné : il est régénéré à chaque build, puis
corrigé par les scripts `ci/` (micro, veille, visibilité sur Google TV, icônes,
version).
