# Ma Guitare — version produit

> Branche `produit` : le cœur de l'app, prêt à être vendu. Retirés par rapport à
> `main` : chansons sous droits (grilles d'accords, Top 20), section TikTok,
> exercices et notes du cours, Chromecast, casque VR, sauvegarde Home Assistant,
> mise à jour par GitHub (sur le Play Store, c'est le magasin qui met à jour).

Apprendre la **guitare classique** en partant de zéro. APK Android + PWA, hors
ligne, sans compte et sans publicité. Même application sur le téléphone et sur
le téléviseur.

## Ce qu'il y a dedans

| | |
|---|---|
| **Parcours** | 18 leçons en 6 chapitres, de la tenue de l'instrument au barré. Une idée neuve par leçon, un exercice mesurable, une case à cocher. |
| **Accordeur** | Détection de hauteur au micro (autocorrélation), affichage en centièmes, six cordes suivies une par une. |
| **Métronome** | Tempo, mesure, subdivisions, battement du tempo à la main, accent sur le premier temps. |
| **Programme** | Un parcours progressif dans les tablatures : 6 paliers, les six niveaux de difficulté d'exécution (premiers sons, débutant, premiers accords, intermédiaire, avancé, expert — voir « Par difficulté »), chacun s'ouvrant quand quelques morceaux du précédent sont acquis ; dans un palier, la technique d'abord, puis du plus simple au plus exigeant. **Adapté au ressenti** : deux « dur » de suite au palier le plus haut, et la séance consolide un palier en dessous (nouveautés plus simples, pas de défi) ; trois « ça va » ou « facile » de suite, et elle remonte ; un ressenti mitigé ne change rien. Séance du jour : un échauffement, les révisions dues et une ou deux nouveautés, chaque morceau joué en plusieurs passages du lent au tempo normal (60 → 80 → 100 %). Après chaque morceau, on note « dur / ça va / facile » : répétition espacée (1, 2, 4, 8, 16 jours). Les morceaux aimés (♥ sous le titre) passent en premier, et un favori du palier suivant est proposé en défi lent. Logique dans `www/programme.js`. |
| **Travailler les accords** | 11 tablatures par paliers (balayé au pouce, basse et accord plaqué, arpège) : Em ↔ Am, Am ↔ E, D ↔ A, G-C-D, Am-Dm-E7, C-Am-F-G, G-Em-C-D, blues en La, septièmes qui résolvent, premiers barrés, revue des 23 accords, et les grilles du Canon de Pachelbel, de House of the Rising Sun et de La Bamba. Doigtés de la bibliothèque, un palier = une étape du pas à pas ; chaque fiche d'accord renvoie aux exercices qui l'utilisent. |
| **Accords** | 23 positions avec diagramme, doigté, notes produites, barrés signalés, écoute grattée / arpégée / corde par corde. |
| **Morceaux** | Plus de 100 pièces en tablature et portée, jouées par l'app avec la note en cours surlignée. **Pour grand débutant** (niveaux 1-2, trois cordes aiguës, case 3 au plus) : trois cordes à vide, les basses au pouce, mes premières notes, Hot Cross Buns, Mary avait un petit agneau, Old MacDonald, London Bridge, When the Saints, Au clair de la lune, Joyeux anniversaire, Jingle Bells, Yankee Doodle, Row Row Row Your Boat, Michael Row the Boat Ashore… ; les thèmes de la Lettre à Élise et de la Petite musique de nuit ; deux études d'arpèges ; et **46 pièces du répertoire** (Carulli, Sor, Giuliani, Mertz, Carcassi, Coste, Bach/Petzold, Brahms, Sanz, Horetzky…) issues du Mutopia Project, dont 17 au niveau 3 en première position. **Chaque note de chaque morceau** porte son doigt de main gauche et de main droite : notés pour les morceaux écrits pour l'app, calculés pour le répertoire (la main couvre quatre cases, un doigt par case ; pouce sur les basses, i-m-a au-dessus). |
| **Par artiste** | La liste des morceaux se range au choix par rubrique ou par artiste (bouton en haut, mémorisé) : un menu dépliant par artiste ou compositeur, dans l'ordre alphabétique, avec ses pièces ; les exercices écrits pour l'app n'y figurent pas. |
| **Par difficulté** | Troisième rangement de la liste : six niveaux (premiers sons, débutant, premiers accords, intermédiaire, avancé, expert) calculés sur la difficulté des notes elles-mêmes, pas sur la vitesse (le tempo se règle) : hauteur sur le manche, changements de position, écart de la main, barrés, accords à connaître, notes pincées ensemble, doigts de la main droite, densité du rythme en temps. Le niveau et ses raisons s'affichent sur chaque fiche. Calcul dans `www/programme.js`. |
| **Versions simplifiées** | Pour 29 pièces du répertoire, l'app calcule une version allégée à partir de la tablature d'origine, d'abord pour **simplifier le mouvement des doigts** : la mélodie (la note la plus haute de chaque attaque ; dans un arpège très chargé, la plus haute du temps ; les doubles croches de passage tombent) et la basse au premier temps (au 3e temps aussi d'une mesure à 4 temps quand l'accord change), qui gardent l'harmonie ; les voix intérieures tombent, tout se joue en première position (une note trop haute descend d'une octave : même nom, donc même accord). Le placement est cherché sur tout le morceau (programmation dynamique) pour poser le moins de doigts possible : cordes à vide d'abord, même corde ou corde voisine, pas d'auriculaire si on peut l'éviter, une note peut changer d'octave si ça évite un saut. Une version n'est gardée que si elle demande au moins 15 % de mouvements en moins (doigts posés, déplacements de la main, auriculaire, sauts de corde) ; la fiche affiche le compte. Rubrique « 🪶 Versions simplifiées » (niveau avant → après) et bouton sur la fiche de l'original ; elles n'apparaissent que là (ni dans le programme, ni dans les rangements par artiste ou par difficulté, ni dans la révision du jour). Les tests vérifient que chaque note existe dans l'original au même endroit et que chaque basse de premier temps est celle de l'original. |
| **Pouce seul — cordes à vide** | 17 morceaux sans main gauche, joués uniquement au pouce sur les cordes à vide : le nom des cordes, le pouce buté, le rythme (rondes → croches), les six cordes, les trois basses, les basses alternées, les sauts de cordes, la marche des six cordes, les cloches, le galop (pointé), la syncope, le balayé, le pom-tcha, le contretemps reggae, le rock, et un petit morceau qui reprend tout. Ensuite, **Pouce + main gauche** (14) : la Ve position (0 3 0 3, 0 1 0 1), gamme de Sol dans les basses, basses alternées et pom-tcha sur des accords, sept mélodies une octave plus bas. |
| **Apprendre pas à pas** | Sur chaque morceau, le chemin d'un professeur, étape par étape et à cocher : accorder, écouter, apprendre les positions sans rythme (note par note, ou les accords et leurs passages), puis chaque phrase de 4 mesures — ou le couplet et le refrain — lentement en boucle, tout recoller, monter en vitesse, jouer seul. Chaque étape a son bouton qui règle le lecteur (section, tempo, boucle, guitare muette) ; la progression est mémorisée. |
| **Page d'un morceau** | La tablature d'abord, à la largeur de l'écran (portée entrelacée en option), avec la légende des doigts de main droite (p pouce, i index, m majeur, a annulaire ; « pm » = deux doigts ensemble) un **zoom** (🔍− / Ajusté / 🔍+, touches média de la télécommande, ou pincement à deux doigts ; de 60 % à 400 %, mise en page à l'échelle choisie, mémorisé) et un bouton ⛶ plein écran qui suit la note jouée. Aides débutant (position des mains, pas à pas, « Que font mes mains ? ») derrière un réglage. |
| **Lecteur** | **« Que font mes mains ? »** : pour chaque note, la guitare entière dessinée avec les deux mains — main gauche sur la vraie case (paume, pouce derrière, doigt numéroté et coloré, doigts de l'accord tenus), main droite entre rosace et chevalet avec le doigt qui pince, corde jouée surlignée — puis chaque note dite en phrases (« Pose l’annulaire (doigt 3) sur la 2e corde (Si), case 3 » · « Le majeur (m) pince la 2e corde »), note par note avec Précédente / Suivante ou en suivant la lecture ; légende chiffres/lettres, pastilles du manche colorées par doigt. Inspiré de Guitar Pro 8 : boucle sur une section (mesures A → B), entraîneur de vitesse (60 % → 100 %, +5 % par tour), décompte, clic, capodastre, guitare muette (on joue seul, l'app tient le temps), manche virtuel qui suit la lecture, portée + tablature, export en tablature texte. |
| **Éditeur** | Écrire ses propres tablatures (corde, case, durée, accords), ou coller une tab texte trouvée sur internet ; elles se jouent dans le même lecteur. |
| **Gammes** | 7 gammes (majeure, mineures, pentatoniques, blues, chromatique) sur les 12 tonalités, affichées sur tout le manche et jouées. |
| **Oreille** | Trois jeux d'écoute, dix questions, notés. |
| **Bouton retour** | Le bouton retour d'Android (et de la télécommande TV, Échap au clavier, geste retour du navigateur) ferme le plein écran, puis revient à l'écran précédent, jusqu'à l'accueil ; là, un premier appui prévient, le second quitte l'app (plugin `@capacitor/app`). |
| **Écran allumé** | L'écran ne se met pas en veille pendant qu'on joue (les deux mains sont sur la guitare) : drapeau Android FLAG_KEEP_SCREEN_ON dans l'APK (plugin `KeepAwake`, `ci/patch_keepawake.py`), Screen Wake Lock dans le navigateur. Seulement tant que l'app est au premier plan ; réglage pour revenir à la veille normale. |
| **Suivi** | Minutes du jour, série de jours consécutifs, records de changements d'accords. Tout reste sur l'appareil. |

## Sur la télévision

**Installer l'APK sur la télé** (tout boîtier Android TV ou Google TV). Le mode
télévision s'active tout seul : tout grossit, la navigation se fait aux flèches
de la télécommande, la barre d'onglets passe sur le côté. Rien à configurer.

## Répertoire Mutopia

Les niveaux 3 à 5 viennent du [Mutopia Project](https://www.mutopiaproject.org),
partitions libres. Seules les licences **domaine public** et **CC-BY** sont
retenues (le ShareAlike imposerait sa licence à l'app) ; la fiche de chaque
morceau crédite l'éditeur de la partition, la licence et renvoie à la source.

`tools/mutopia_import.py` lit le MIDI de chaque pièce (hauteurs, durées),
corrige l'octave des partitions écrites sans le « 8 » de la clé de guitare,
recale les anacrouses, puis **choisit la corde et la case de chaque note** par
programmation dynamique : main qui couvre quatre cases sans bouger, écart ≤ 4,
positions basses et cordes à vide préférées, basses tenues lâchées quand la
mélodie a besoin de leur corde. Les tests revérifient chaque hauteur contre la
partition, l'absence de deux notes sur une même corde et l'écart de la main.

Pour ajouter une pièce : télécharger son `.mid` et son `.ly` (liste et liens
dans `tools/mutopia_selection.json`), l'ajouter à `PIECES` dans le script, puis
`python3 tools/mutopia_import.py <dossier> > www/repertoire.js`.

## Rien n'est téléchargé, rien n'est envoyé

Tous les sons sont **synthétisés** (Karplus-Strong pour la corde pincée,
oscillateur pour le métronome) : pas un octet d'échantillon audio, donc pas de
licence à traîner et une APK légère. L'accordeur analyse le micro **sur
l'appareil** ; aucun flux ne sort. Les morceaux sont du domaine public
(traditionnel, Beethoven, Mozart), écrits pour cette app, ou issus du Mutopia
Project (domaine public / CC-BY, crédités). Aucun compte, aucune publicité,
aucune donnée collectée : la carte « Confidentialité » des réglages le dit.

## Développement

```bash
npm install
npm test        # contrôles musicaux puis contrôles d'interface
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
