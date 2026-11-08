# Ma Guitare

Apprendre la **guitare classique** en partant de zéro. APK Android + PWA, hors
ligne, sans compte et sans publicité. Même application sur le téléphone et sur
le téléviseur.

## Ce qu'il y a dedans

| | |
|---|---|
| **Parcours** | 18 leçons en 6 chapitres, de la tenue de l'instrument au barré. Une idée neuve par leçon, un exercice mesurable, une case à cocher. |
| **Métronome** | Tempo, mesure, subdivisions, battement du tempo à la main, accent sur le premier temps. |
| **Entraînement** | Les exercices donnés en cours, rangés par thème (repères, balayages, accords de Zombie, main droite, main gauche), avec leurs consignes, leur état (nouveau, à continuer, pas encore vu en cours), une case par variante (en regardant, yeux fermés) remise à zéro chaque jour, la tablature correspondante (pouce buté, Ve position 0 3 0 3 et 0 1 0 1, nom des cordes, balayages), un quiz « par cœur » et des notes de cours. Contenu dans `www/entrainement.js`. |
| **Programme** | Un parcours progressif dans les tablatures : 6 paliers, les six niveaux de difficulté d'exécution (premiers sons, débutant, premiers accords, intermédiaire, avancé, expert — voir « Par difficulté »), chacun s'ouvrant quand quelques morceaux du précédent sont acquis ; dans un palier, la technique d'abord, puis du plus simple au plus exigeant. **Adapté au ressenti** : deux « dur » de suite au palier le plus haut, et la séance consolide un palier en dessous (nouveautés plus simples, pas de défi) ; trois « ça va » ou « facile » de suite, et elle remonte ; un ressenti mitigé ne change rien. **Les morceaux déjà joués d'abord** : séance du jour = un échauffement, les révisions dues, puis les morceaux commencés et pas encore acquis (lancés ou notés, même s'ils ne sont pas dus ; ♥ puis les plus récents), avec l'étape suivante de leur « pas à pas » ; les nouveautés ne prennent que les places qui restent (aucune quand six morceaux sont en cours). La « Révision du jour » de l'écran Morceaux fait de même : les morceaux déjà joués (pas encore acquis d'abord), des nouveautés seulement s'il en manque. Dans la séance, chaque morceau joué en plusieurs passages du lent au tempo normal (60 → 80 → 100 %). Après chaque morceau, on note « dur / ça va / facile » : répétition espacée (1, 2, 4, 8, 16 jours). Les morceaux aimés (♥ sous le titre) passent en premier, et un favori du palier suivant est proposé en défi lent. Logique dans `www/programme.js`. |
| **Mise à jour** | Comme Recettes : l'app interroge la dernière release GitHub toutes les 6 h (repli sur le version.json de GitHub Pages si l’API refuse), affiche un bandeau avec les nouveautés, puis installe l'APK sans passer par le navigateur (plugin UpdatePlugin) ; dans la PWA, le bouton recharge la nouvelle version. Bouton « Vérifier les mises à jour » dans les réglages. Le service worker sert le réseau d'abord, le cache hors ligne. La CI écrit les points du message de fusion dans la release. |
| **Travailler les accords** | 11 tablatures par paliers (balayé au pouce, basse et accord plaqué, arpège) : Em ↔ Am, Am ↔ E, D ↔ A, G-C-D, Am-Dm-E7, C-Am-F-G, G-Em-C-D, blues en La, septièmes qui résolvent, premiers barrés, revue des 23 accords, et les grilles du Canon de Pachelbel, de House of the Rising Sun et de La Bamba. Doigtés de la bibliothèque, un palier = une étape du pas à pas ; chaque fiche d'accord renvoie aux exercices qui l'utilisent. |
| **Accords** | 23 positions avec diagramme, doigté, notes produites, barrés signalés, écoute grattée / arpégée / corde par corde. |
| **Morceaux** | Plus de 120 pièces en tablature et portée, jouées par l'app avec la note en cours surlignée. **Pour grand débutant** (niveaux 1-2, trois cordes aiguës, case 3 au plus) : trois cordes à vide, les basses au pouce, mes premières notes, Hot Cross Buns, Mary avait un petit agneau, Old MacDonald, London Bridge, When the Saints, Au clair de la lune, Joyeux anniversaire, Jingle Bells, Yankee Doodle, Row Row Row Your Boat, Michael Row the Boat Ashore… ; les thèmes de la Lettre à Élise et de la Petite musique de nuit ; deux études d'arpèges ; **Zombie** (The Cranberries) en accompagnement ; et **46 pièces du répertoire** (Carulli, Sor, Giuliani, Mertz, Carcassi, Coste, Bach/Petzold, Brahms, Sanz, Horetzky…) issues du Mutopia Project, dont 17 au niveau 3 en première position. **Chaque note de chaque morceau** porte son doigt de main gauche et de main droite : notés pour les morceaux écrits pour l'app, calculés pour le répertoire (la main couvre quatre cases, un doigt par case ; pouce sur les basses, i-m-a au-dessus). |
| **Top 20 acoustique** | Les classiques de la guitare acoustique en quatre niveaux (débutant, intermédiaire, confirmé, avancé) : Knockin' on Heaven's Door, Wonderwall, Le vent nous portera, Talkin' Bout a Revolution, A Horse with No Name, I'm Yours, Hotel California, Wish You Were Here, Fast Car, Losing My Religion, Hey Jude, La jument de Michao, Blackbird, Dust in the Wind, Tears in Heaven, House of the Rising Sun, More Than Words, Neon, Classical Gas, Angeles — grilles d'accords (capo vers des formes ouvertes), chacune avec sa version longue. |
| **Par artiste** | La liste des morceaux se range au choix par rubrique ou par artiste (bouton en haut, mémorisé) : un menu dépliant par artiste ou compositeur, dans l'ordre alphabétique (« The Police » à P), avec ses chansons et pièces ; les exercices écrits pour l'app n'y figurent pas. |
| **Par difficulté** | Troisième rangement de la liste : six niveaux (premiers sons, débutant, premiers accords, intermédiaire, avancé, expert) calculés sur la difficulté des notes elles-mêmes, pas sur la vitesse (le tempo se règle) : hauteur sur le manche, changements de position, écart de la main, barrés, accords à connaître, notes pincées ensemble, doigts de la main droite, densité du rythme en temps. Le niveau et ses raisons s'affichent sur chaque fiche. Calcul dans `www/programme.js`. |
| **Versions simplifiées** | Pour 29 pièces du répertoire, l'app calcule une version allégée à partir de la tablature d'origine, d'abord pour **simplifier le mouvement des doigts** : la mélodie (la note la plus haute de chaque attaque ; dans un arpège très chargé, la plus haute du temps ; les doubles croches de passage tombent) et la basse au premier temps (au 3e temps aussi d'une mesure à 4 temps quand l'accord change), qui gardent l'harmonie ; les voix intérieures tombent, tout se joue en première position (une note trop haute descend d'une octave : même nom, donc même accord). Le placement est cherché sur tout le morceau (programmation dynamique) pour poser le moins de doigts possible : cordes à vide d'abord, même corde ou corde voisine, pas d'auriculaire si on peut l'éviter, une note peut changer d'octave si ça évite un saut. Une version n'est gardée que si elle demande au moins 15 % de mouvements en moins (doigts posés, déplacements de la main, auriculaire, sauts de corde) ; la fiche affiche le compte. Rubrique « 🪶 Versions simplifiées » (niveau avant → après) et bouton sur la fiche de l'original ; elles n'apparaissent que là (ni dans le programme, ni dans les rangements par artiste ou par difficulté, ni dans la révision du jour). Les tests vérifient que chaque note existe dans l'original au même endroit et que chaque basse de premier temps est celle de l'original. |
| **Pouce seul — cordes à vide** | 14 morceaux sans main gauche, joués uniquement au pouce sur les cordes à vide : le rythme (rondes → croches), les six cordes, les trois basses, les basses alternées, les sauts de cordes, la marche des six cordes, les cloches, le galop (pointé), la syncope, le balayé, le pom-tcha, le contretemps reggae, le rock, et un petit morceau qui reprend tout. Ensuite, **Pouce + main gauche** (18) : gamme de Sol dans les basses, basses alternées et pom-tcha sur des accords, sept mélodies une octave plus bas, six chansons en pom-tcha. |
| **TikTok** | Morceaux relevés dans des vidéos TikTok, note par note (cordes et cases lues à l'écran, hauteurs et rythme vérifiés sur le son) : « Le riff La – Ré » (@maesstttro), 17 notes au pouce sur les cordes 5 et 4 à vide ; **Bella Ciao** (@wiragustiii, chant traditionnel) sur la seule 1re corde, cases 0 à 13 avec un glissé, plus une version facile en première position ; une **mélodie en Ré mineur sur une corde** (@aka_11.03, « String 1 » : notes répétées qui descendent de la case 13 à la 5, puis remontent), avec sa version facile ; deux arpèges d'accords (La – Do♯m – Fa♯m – Ré, @aka_11.03 ; La m7 – Fa, @maesstttro et @wiragustiii). Quand la vidéo montre le riff d'une chanson sous droits, seulement sa grille d'accords (Smoke on the Water, Feel Good Inc, Do I Wanna Know, Dance Monkey, Where Is My Mind, Hit the Road Jack, The Final Countdown, Californication, Can’t Help Falling in Love, Beat It) ; deux grilles vues sans titre (Mi m – Do – La m – Ré, Do – Sol – La m – Fa). Pour chaque chanson reconnue, une **version longue** (la chanson entière, partie par partie : intro, couplets, refrains, pont…) proposée sur la fiche de la version courte ; Bella Ciao en trois strophes. |
| **Chansons** | 66 grilles d'accords (sous droits : ni mélodie ni paroles, l'accompagnement est écrit pour l'app) : 15 grands classiques français, 6 hits récents, 12 chansons internationales (Dylan, Beatles, Ben E. King, Marley, Ed Sheeran, Adele, Coldplay, Vance Joy, John Denver, Leonard Cohen, Lynyrd Skynyrd, Lennon), 24 rock et reggae (Offspring, Nirvana, Cranberries, Police, Marley — power chords grattés au pouce), 10 vues sur TikTok (Smoke on the Water, Feel Good Inc, Do I Wanna Know, Dance Monkey, Where Is My Mind, Hit the Road Jack, The Final Countdown, Californication, Can’t Help Falling in Love, Beat It). Capo pour la tonalité du disque, noms d'accords sur la tablature, données dans `www/chansons.js`. |
| **Apprendre pas à pas** | Sur chaque morceau, le chemin d'un professeur, étape par étape et à cocher : accorder, écouter, apprendre les positions sans rythme (note par note, ou les accords et leurs passages), puis chaque phrase de 4 mesures — ou le couplet et le refrain — lentement en boucle, tout recoller, monter en vitesse, jouer seul. Chaque étape a son bouton qui règle le lecteur (section, tempo, boucle, guitare muette) ; la progression est mémorisée. |
| **Page d'un morceau** | La tablature d'abord, à la largeur de l'écran (portée entrelacée en option), avec la légende des doigts de main droite (p pouce, i index, m majeur, a annulaire ; « pm » = deux doigts ensemble) un **zoom** (🔍− / Ajusté / 🔍+, touches média de la télécommande, ou pincement à deux doigts ; de 60 % à 400 %, mise en page à l'échelle choisie, mémorisé) et un bouton ⛶ plein écran qui suit la note jouée. Aides débutant (position des mains, pas à pas, « Que font mes mains ? ») derrière un réglage. |
| **Lecteur** | **« Que font mes mains ? »** : pour chaque note, la guitare entière dessinée avec les deux mains — main gauche sur la vraie case (paume, pouce derrière, doigt numéroté et coloré, doigts de l'accord tenus), main droite entre rosace et chevalet avec le doigt qui pince, corde jouée surlignée — puis chaque note dite en phrases (« Pose l’annulaire (doigt 3) sur la 2e corde (Si), case 3 » · « Le majeur (m) pince la 2e corde »), note par note avec Précédente / Suivante ou en suivant la lecture ; légende chiffres/lettres, pastilles du manche colorées par doigt. Inspiré de Guitar Pro 8 : boucle sur une section (mesures A → B), entraîneur de vitesse (60 % → 100 %, +5 % par tour), décompte, clic, capodastre, guitare muette (on joue seul, l'app tient le temps), manche virtuel qui suit la lecture, portée + tablature, export en tablature texte. |
| **Éditeur** | Écrire ses propres tablatures (corde, case, durée, accords), ou coller une tab texte trouvée sur internet ; elles se jouent dans le même lecteur. |
| **Gammes** | 7 gammes (majeure, mineures, pentatoniques, blues, chromatique) sur les 12 tonalités, affichées sur tout le manche et jouées. |
| **Oreille** | Trois jeux d'écoute, dix questions, notés. |
| **Bouton retour** | Le bouton retour d'Android (et de la télécommande TV, Échap au clavier, geste retour du navigateur) ferme le plein écran, puis revient à l'écran précédent, jusqu'à l'accueil ; là, un premier appui prévient, le second quitte l'app (plugin `@capacitor/app`). |
| **Écran allumé** | L'écran ne se met pas en veille pendant qu'on joue (les deux mains sont sur la guitare) : drapeau Android FLAG_KEEP_SCREEN_ON dans l'APK (plugin `KeepAwake`, `ci/patch_keepawake.py`), Screen Wake Lock dans le navigateur. Seulement tant que l'app est au premier plan ; réglage pour revenir à la veille normale. |
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

## Au casque VR (Meta Quest)

**Dans l'APK (installée sur le Quest)** : le mode casque s'active tout seul
(réglable : automatique / toujours / jamais). Sur Horizon OS, une app Android
flotte dans la pièce en réalité mixte — on voit sa vraie guitare ET la
fenêtre, ouverte en grand format (1280 × 800 dp, posé par `ci/patch_manifest.py`).
Dans un morceau, **🥽 Mode casque (pupitre)** remplit la fenêtre avec la ligne
de tablature en cours en très gros, la suivante en dessous (les pages tournent
seules), le manche, et de gros boutons (lecture, tempo, boucle, entraîneur,
guitare muette, clic) visables au rayon ou au pincement.

**Partition immersive** (panneau posé dans l'espace, WebXR) : la WebView de
l'APK n'a pas WebXR, donc le bouton **🥽 Immersif (navigateur)** du pupitre
ouvre le même morceau dans le navigateur du casque (lien profond ; une
tablature perso voyage dans l'URL). La PWA ouverte directement dans le
navigateur du Quest y a accès sans détour. Gâchette ou pincement = lecture /
arrêt, bouton de côté = replacer le panneau.

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
licence à traîner et une APK légère. L'app n'utilise pas le micro
(pas d'accordeur : on accorde à l'oreille avec les cordes de référence). Les morceaux sont du domaine public
(traditionnel, Beethoven), écrits pour cette app (dont l'accompagnement de
« Zombie » : la grille d'accords seule, ni mélodie ni paroles), ou issus du Mutopia Project
(domaine public / CC-BY, crédités).

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
corrigé par les scripts `ci/` (pas de micro, veille, visibilité sur Google TV, icônes,
version).
