/* Le parcours : ce qu'on apprend, dans quel ordre, et comment on valide.
 *
 * Une leçon = une seule idée neuve + un exercice mesurable. L'ordre n'est pas
 * décoratif : chaque leçon ne suppose que ce qui précède. Les textes sont
 * courts volontairement — on est censé avoir la guitare dans les mains, pas
 * lire un manuel.
 *
 * `exercice.type` dit à l'app quoi afficher :
 *   accordeur    l'accordeur au micro
 *   metronome    le métronome, avec une consigne
 *   accord       un diagramme d'accord à tenir et faire sonner
 *   changements  chronomètre de changements entre deux accords
 *   morceau      une pièce de morceaux.js, tablature + lecture
 *   oreille      un jeu d'écoute
 * `validation` est ce que l'élève coche lui-même, sauf pour `changements` où
 * l'app compte.
 *
 * `images` liste des schémas d'illustrations.js, affichés AVANT le texte :
 * pour une position de main, un dessin dit en une seconde ce qu'un paragraphe
 * explique en trois phrases.
 */
(function (global) {
  'use strict';

  var LECONS = [
    // ---------------------------------------------------------------- Bases
    {
      id: 'tenue', chapitre: 'Prendre la guitare', titre: 'S’asseoir et tenir l’instrument', minutes: 10,
      images: ['posture', 'anatomie'],
      texte: 'Guitare classique : la caisse repose sur la cuisse GAUCHE, pied gauche surélevé (un gros livre suffit), manche incliné vers le haut à 45°. Le bras droit tombe sur la table d’harmonie, l’avant-bras touche l’arête. Le manche ne s’appuie jamais sur la main gauche : si tu lâches la main gauche, la guitare ne doit pas bouger.\n\nPourquoi c’est la première leçon : une mauvaise position rend les barrés impossibles trois mois plus tard, et c’est l’erreur la plus coûteuse à corriger.',
      exercice: { type: 'metronome', consigne: 'Tiens la position une minute, respiration calme, épaules basses. Le métronome à 60 sert juste à mesurer le temps.', tempo: 60 },
      validation: 'Je tiens la position sans crisper l’épaule droite.'
    },
    {
      id: 'accorder', chapitre: 'Prendre la guitare', titre: 'Accorder au micro', minutes: 10,
      images: ['tete', 'accordage'],
      texte: 'Une guitare fausse rend tout faux — y compris ton oreille, qui apprend ce qu’elle entend. Accorde AVANT chaque séance.\n\nDe la plus grave à la plus aiguë : Mi (6), La (5), Ré (4), Sol (3), Si (2), Mi (1). Tourne toujours en MONTANT vers la note : une corde détendue puis tendue tient mieux l’accord. Va doucement sur la 1re et la 3e, ce sont celles qui cassent.',
      exercice: { type: 'accordeur', consigne: 'Accorde les six cordes. Vise le vert : à moins de 5 centièmes, c’est juste.' },
      validation: 'Mes six cordes sont vertes.'
    },
    {
      id: 'main-droite', chapitre: 'Prendre la guitare', titre: 'La main droite : p i m a', minutes: 15,
      images: ['mainDroite'],
      texte: 'Les doigts de la main droite portent des noms espagnols : p (pulgar, pouce), i (índice), m (medio), a (anular). L’auriculaire ne joue pas.\n\nLe pouce joue les cordes graves (6, 5, 4) et va VERS LE BAS en s’éloignant de la paume. i, m, a jouent les cordes 3, 2, 1 et tirent vers la paume. Les ongles courts et limés donnent un son net ; sans ongles, on joue à la pulpe, c’est plus doux et parfaitement valable.',
      exercice: { type: 'morceau', ref: 'pima-vide', consigne: 'Cordes à vide, très lentement. Le but n’est pas la vitesse mais l’égalité : chaque note au même volume.' },
      validation: 'Mes quatre doigts sonnent au même volume.'
    },
    {
      id: 'main-gauche', chapitre: 'Prendre la guitare', titre: 'La main gauche : un doigt par case', minutes: 15,
      images: ['mainGauche', 'placement'],
      texte: 'Le pouce se place DERRIÈRE le manche, en face du majeur, jamais par-dessus. Les doigts appuient juste derrière la barrette (pas dessus, pas au milieu de la case) et restent arrondis : la dernière phalange tombe à la verticale.\n\nSi ça frise, c’est presque toujours l’une de ces trois choses : doigt trop loin de la barrette, doigt trop à plat qui touche la corde voisine, ou pression insuffisante.',
      exercice: { type: 'morceau', ref: 'chromatique', consigne: 'Un doigt par case, et surtout : ne lève pas les doigts déjà posés.' },
      validation: 'Aucune note ne frise sur les six cordes.'
    },

    // ------------------------------------------------------- Premiers accords
    {
      id: 'premier-accord', chapitre: 'Premiers accords', titre: 'Mi mineur, le premier accord', minutes: 10,
      texte: 'Deux doigts, six cordes qui sonnent : c’est l’accord le plus généreux de la guitare. Majeur/mineur, c’est une seule note d’écart — et c’est cette note qui donne à Mi mineur sa couleur mélancolique.\n\nFais sonner corde par corde, du grave à l’aigu, pour vérifier qu’aucune n’est étouffée.',
      exercice: { type: 'accord', ref: 'Em', consigne: 'Pose, joue les six cordes une par une, relâche complètement, recommence dix fois.' },
      validation: 'Les six cordes sonnent clair.'
    },
    {
      id: 'deuxieme-accord', chapitre: 'Premiers accords', titre: 'La mineur, et la corde qu’on ne joue pas', minutes: 10,
      texte: 'La mineur ajoute un troisième doigt. La corde 6 ne fait PAS partie de l’accord : le pouce de la main droite l’évite, ou le pouce gauche vient l’étouffer. Jouer la corde 6 sur un La mineur n’est pas une faute grave, mais l’accord perd sa netteté.',
      exercice: { type: 'accord', ref: 'Am', consigne: 'Pose l’accord, joue de la corde 5 à la 1. Vérifie que la corde 1 sonne : c’est celle que l’annulaire étouffe le plus souvent.' },
      validation: 'Cinq cordes claires, la 6e silencieuse.'
    },
    {
      id: 'changer', chapitre: 'Premiers accords', titre: 'Changer d’accord sans s’arrêter', minutes: 20,
      texte: 'C’est LE mur du débutant, et il se franchit par une seule méthode : le changement à vide. Pose Mi mineur, relâche, pose La mineur, relâche — sans jouer une seule note, juste les doigts.\n\nAstuce qui fait gagner des semaines : entre Mi mineur et La mineur, les deux doigts gardent la même forme et glissent d’une corde. Regarde-les faire le trajet ensemble, pas l’un après l’autre.',
      exercice: { type: 'changements', ref: ['Em', 'Am'], consigne: 'Une minute, compte tes changements propres. 20 par minute au début, 60 après une semaine.', objectif: 20 },
      validation: 'J’ai fait au moins 20 changements propres en une minute.'
    },
    {
      id: 'mi-majeur', chapitre: 'Premiers accords', titre: 'Mi majeur et La majeur', minutes: 15,
      texte: 'Mi majeur, c’est Mi mineur avec l’index posé sur la 3e corde. Cette seule note fait basculer la couleur du triste au lumineux : joue les deux à la suite pour l’entendre.\n\nLa majeur met trois doigts dans la même case — serre-les, ils ont juste la place.',
      exercice: { type: 'changements', ref: ['E', 'A'], consigne: 'Alterne les deux accords au métronome, un changement toutes les quatre pulsations.', objectif: 20 },
      validation: 'Je passe de Mi à La sans regarder mes doigts.'
    },

    // ------------------------------------------------------------- Arpèges
    {
      id: 'arpege-1', chapitre: 'Arpèges', titre: 'Arpéger un accord', minutes: 15,
      texte: 'Arpéger, c’est jouer les notes d’un accord l’une après l’autre au lieu de les gratter ensemble. C’est la manière normale de jouer en classique — et elle sonne bien plus riche qu’un accord plaqué.\n\nLa main gauche tient l’accord sans bouger pendant que la droite déroule p-i-m-a. Une chose à la fois, toujours.',
      exercice: { type: 'morceau', ref: 'etude-mim', consigne: 'Commence à 50 à la noire. Monte de 5 seulement quand deux passages de suite sont propres.' },
      validation: 'Je joue l’étude en entier sans arrêt à 60.'
    },
    {
      id: 'arpege-2', chapitre: 'Arpèges', titre: 'Anticiper le changement', minutes: 20,
      texte: 'Dans un arpège, la main gauche a tout le temps du monde : pendant que la droite joue les trois dernières notes, les doigts de gauche peuvent déjà partir vers l’accord suivant. C’est exactement ce qui sépare un débutant d’un élève de deuxième année.\n\nRègle : le dernier doigt quitte l’accord au dernier moment, le premier doigt du suivant part en avance.',
      exercice: { type: 'morceau', ref: 'etude-lam', consigne: 'Ralentis jusqu’à ne plus jamais t’arrêter entre deux mesures. La vitesse viendra seule.' },
      validation: 'Aucun blanc entre les mesures.'
    },

    // ------------------------------------------------------------- Mélodies
    {
      id: 'melodie-1', chapitre: 'Jouer des mélodies', titre: 'Lire une tablature', minutes: 10,
      images: ['tablature'],
      texte: 'Six lignes = six cordes, la ligne du HAUT est la corde la plus AIGUË (l’inverse du diagramme d’accord, oui). Le chiffre est la case, 0 = corde à vide.\n\nLa tablature ne dit pas le rythme : ici, l’app te le joue. Écoute d’abord, joue ensuite.',
      exercice: { type: 'morceau', ref: 'au-clair', consigne: 'Écoute une fois, puis joue avec le métronome à 70.' },
      validation: 'Je joue la mélodie de mémoire.'
    },
    {
      id: 'melodie-2', chapitre: 'Jouer des mélodies', titre: 'Alterner index et majeur', minutes: 15,
      texte: 'Une mélodie ne se joue pas avec un seul doigt : on alterne i et m, comme on marche avec deux jambes. Même corde deux fois de suite ? On alterne quand même.\n\nC’est pénible trois jours, puis c’est acquis pour la vie — et c’est la condition pour jouer vite un jour.',
      exercice: { type: 'morceau', ref: 'ode-joie', consigne: 'Note sur ta partition mentale : i, m, i, m… sans exception.' },
      validation: 'J’alterne sans y penser.'
    },
    {
      id: 'melodie-3', chapitre: 'Jouer des mélodies', titre: 'Monter à la cinquième case', minutes: 15,
      texte: 'L’auriculaire est le doigt faible : il faut le forcer un peu au début. La 5e case de la corde 1 donne le La, la note la plus aiguë de nos mélodies.\n\nGarde l’index posé sur la 1re case pendant que l’auriculaire joue : c’est le début du jeu « en position ».',
      exercice: { type: 'morceau', ref: 'dirai-je', consigne: 'Doigté : index case 1, majeur case 2, annulaire case 3, auriculaire case 5.' },
      validation: 'Mon auriculaire tient la note sans que l’index se lève.'
    },
    {
      id: 'melodie-4', chapitre: 'Jouer des mélodies', titre: 'Un morceau complet', minutes: 20,
      texte: 'Frère Jacques a deux difficultés cachées : les croches de la cinquième phrase, et le saut vers la corde 3 à la fin. Travaille ces deux endroits SÉPARÉMENT, en boucle, avant de jouer le morceau entier — c’est la méthode de travail des musiciens, pas seulement des débutants.',
      exercice: { type: 'morceau', ref: 'frere-jacques', consigne: 'Isole les deux passages difficiles, dix fois chacun, puis joue tout.' },
      validation: 'Je joue le morceau entier sans arrêt.'
    },

    // ---------------------------------------------------------------- Oreille
    {
      id: 'oreille-1', chapitre: 'Former l’oreille', titre: 'Reconnaître ses cordes', minutes: 10,
      texte: 'Savoir quelle corde sonne, sans regarder, sert tous les jours : pour s’accorder, pour retrouver une note, pour jouer avec d’autres. Ça s’apprend en quelques minutes par jour.',
      exercice: { type: 'oreille', ref: 'cordes', consigne: 'Dix cordes tirées au hasard. Vise 8 sur 10.' },
      validation: 'J’ai fait au moins 8 sur 10.'
    },
    {
      id: 'oreille-2', chapitre: 'Former l’oreille', titre: 'Majeur ou mineur', minutes: 10,
      texte: 'Une seule note change entre les deux, et pourtant tout le monde entend la différence : majeur = ouvert, mineur = sombre. Mettre un nom dessus, c’est commencer à comprendre l’harmonie.',
      exercice: { type: 'oreille', ref: 'couleur', consigne: 'Dix accords. Majeur ou mineur ?' },
      validation: 'J’ai fait au moins 8 sur 10.'
    },

    // ------------------------------------------------------------------ Barré
    {
      id: 'barre', chapitre: 'Le barré', titre: 'Fa majeur, enfin', minutes: 25,
      images: ['barre'],
      texte: 'Le barré n’est pas une question de force mais de placement : l’index se pose sur son CÔTÉ (celui du pouce), pas à plat — la tranche est dure, la pulpe est molle et laisse passer les cordes. Le pouce descend au milieu du manche, derrière l’index.\n\nCommence par un demi-barré sur les trois cordes aiguës, puis ajoute les autres. Si ça frise après dix minutes, arrête : c’est un muscle à construire, pas une technique à arracher.',
      exercice: { type: 'accord', ref: 'F', consigne: 'Pose, joue corde par corde, repère LA corde qui frise, corrige seulement celle-là.' },
      validation: 'Au moins quatre cordes sonnent clair.'
    },
    {
      id: 'barre-2', chapitre: 'Le barré', titre: 'Le barré mobile', minutes: 20,
      texte: 'La forme de Fa, décalée d’une case, donne Fa♯ ; encore une, Sol. La même forme donne les douze accords majeurs : c’est le grand avantage du barré, et la raison pour laquelle on s’acharne.\n\nSi mineur utilise la forme de La mineur barrée en 2e case.',
      exercice: { type: 'changements', ref: ['Am', 'Bm'], consigne: 'Alterne les deux : même forme, une barrée, l’autre non.', objectif: 12 },
      validation: 'Je fais 12 changements propres en une minute.'
    }
  ];

  function tous() { return LECONS.slice(); }
  function get(id) { for (var i = 0; i < LECONS.length; i++) if (LECONS[i].id === id) return LECONS[i]; return null; }
  function chapitres() {
    var vus = [], out = [];
    LECONS.forEach(function (l) {
      if (vus.indexOf(l.chapitre) === -1) { vus.push(l.chapitre); out.push({ nom: l.chapitre, lecons: [] }); }
      out[vus.indexOf(l.chapitre)].lecons.push(l);
    });
    return out;
  }
  function suivante(faites) {
    for (var i = 0; i < LECONS.length; i++) if (faites.indexOf(LECONS[i].id) === -1) return LECONS[i];
    return null;
  }

  global.Lecons = { tous: tous, get: get, chapitres: chapitres, suivante: suivante };
})(typeof window !== 'undefined' ? window : globalThis);
