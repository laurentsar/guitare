/* Travail récurrent : les exercices donnés en cours, à refaire chaque jour.
 *
 * Contenu dicté par le cours, pas par l'app : les consignes reprennent mot
 * pour mot ce que le professeur a demandé. Chaque exercice peut avoir :
 *  - etat : 'continuer' (déjà vu, à poursuivre), 'nouveau' (donné cette
 *    semaine), 'pasvu' (donné à faire, mais pas encore montré en cours),
 *    'idee' (imaginé par l'app, pas donné en cours : groupe `idees`, hors du
 *    compte du jour), 'semaine' (révision de la semaine dernière : groupe
 *    `facultatif`, hors du compte du jour) ;
 *  - variantes : les façons de le faire (en regardant, yeux fermés…), cochées
 *    séparément chaque jour ;
 *  - morceau : la tablature correspondante (www/morceaux.js, catégorie
 *    « entrainement ») ;
 *  - quiz : questions-réponses à réviser (noms des accords) ;
 *  - tempos : les tempos du métronome donnés en cours (boutons qui le lancent
 *    sur place) ; rythme : { style: 'rock', tempos } pour la boîte à rythmes.
 * Pour la semaine suivante, on modifie ce fichier. Version actuelle : le mail
 * de suivi de Françoise après le cours (pouce buté, Ve position, riffs en La).
 */
(function (global) {
  'use strict';

  var REGARD = ['en regardant la main droite', 'sans regarder : yeux fermés'];

  var GROUPES = [
    {
      titre: 'Main droite : travail des doigts',
      intro: 'À travailler en priorité. Travaille devant une glace, pour éviter de forcer sur les cervicales !',
      exercices: [
        { id: 'pouce-bute-4', titre: 'Pouce buté : 4 fois sur chaque corde', etat: 'continuer', morceau: 'ent-pouce-bute-4', variantes: REGARD,
          tempos: [40, 45, 50, 55, 60],
          consignes: ['1 : j’appuie contre la corde voisine, « et » : je lève.',
                      'Bien t’arrêter contre la corde voisine avant de soulever le pouce !',
                      'Avec le métronome à 50, puis 55, puis 60 (si 50 est trop rapide, repars de 40 ou 45, comme les semaines précédentes).',
                      'Bien soulever le pouce à chaque attaque.'] }
      ]
    },
    {
      titre: 'Main gauche',
      intro: 'Pars toujours de la pince. Ton pouce gauche se place derrière la 6e case et derrière le 2e doigt, au milieu du manche, sans serrer et sans se plier.',
      exercices: [
        { id: 'pince', titre: 'Partir de la pince', etat: 'continuer',
          consignes: ['Pars toujours de la pince.',
                      'Le pouce se pose au milieu du manche, sans serrer et sans se plier, derrière la 6e case et derrière le 2e doigt.'] },
        { id: 'v-0303', titre: 'Ve position : 0 3 0 3, pouce buté', etat: 'continuer', morceau: 'ent-v-0303',
          consignes: ['Le 3e doigt joue à la VIIe case.',
                      'Joue de la 6e corde à la 2e, et retour à la 6e.',
                      'Le doigt enfonce la corde au bout de l’os, se pose droit le long de la barrette en tirant légèrement vers la droite.',
                      'Joue le plus près possible de la barrette.'] },
        { id: 'v-0101', titre: 'Ve position : 0 1 0 1, pouce buté', etat: 'continuer', morceau: 'ent-v-0101',
          consignes: ['Le 3e doigt reste au-dessus de sa case.',
                      'Le 1er doigt s’écarte et se pose légèrement sur le côté gauche, à la 5e case (Ve position).'] },
        { id: 'v-1313', titre: 'Ve position : 1 3 1 3', etat: 'continuer', morceau: 'ent-v-1313',
          consignes: ['La main gauche d’abord, seule.',
                      'Un doigt chasse l’autre : ne lâche pas un doigt tant que le suivant n’est pas posé. Les doigts « marchent ».',
                      'Pars toujours du 3e doigt, et écarte le 1er.',
                      'Tire la main vers la droite, comme vu en cours.'] },
        { id: 'riff-la-1', titre: 'Riff en La n° 1', etat: 'continuer', morceau: 'ent-riff-la-1', tempos: [55], rythme: { style: 'rock', tempos: [55] },
          variantes: ['sans métronome ni boîte à rythme', 'avec métronome ou boîte à rythme : rock groove à 55'],
          consignes: ['Pars 4 fois de la 6e corde (schéma de 4 notes), 2 fois de la 5e, 2 fois de la 6e.',
                      'Finis par la note la plus grave, et coupe le son en reposant le pouce sur la corde.',
                      'Ne lâche pas un doigt tant que le suivant n’est pas posé.',
                      'Tire la main gauche davantage vers la droite.',
                      'Si le chemin entier accroche : reprends d’abord la première étape, celle d’il y a 15 jours (4 fois depuis la 6e corde).',
                      'Voir l’audio déjà envoyé par Françoise.'] },
        { id: 'v-0404', titre: 'Ve position : 0 4 0 4, pouce buté', etat: 'nouveau', morceau: 'ent-v-0404',
          consignes: ['Le 4e doigt joue à la VIIIe case, sur chaque corde.',
                      'Bien fléchir le 4e doigt avant de le poser sur la corde.'] },
        { id: 'v-1414', titre: 'Ve position : 1 4 1 4, pouce buté', etat: 'nouveau', morceau: 'ent-v-1414',
          consignes: ['1er doigt à la Ve case, 4e doigt à la VIIIe, sur chaque corde.',
                      'Ne lâche pas le 1er doigt tant que le 4e n’est pas posé.'] },
        { id: 'riff-la-2', titre: 'Riff en La n° 2 (avec 1 et 4)', etat: 'nouveau', morceau: 'ent-riff-la-2', tempos: [60],
          consignes: ['Le même chemin que le riff n° 1, avec le 4e doigt (case VIII) au lieu du 3e, et le pouce buté.',
                      'Départ en Ve position. Voir l’audio envoyé par Françoise.'] }
      ]
    },
    {
      titre: 'Balayages',
      intro: 'Guitare posée sur la jambe droite. Toujours pas vu pendant le cours.',
      exercices: [
        { id: 'balaye-aller', titre: 'L’aller du pouce', etat: 'continuer', morceau: 'ent-zombie-balaye',
          consignes: ['Passe d’un coup sec sur les cordes et fais bien tourner l’avant-bras.',
                      'Mouvement ample : fais un « O » à l’envers.',
                      'Ne fais pas tourner le poignet, juste l’avant-bras.',
                      'Joue devant, pas sur le côté !'] },
        { id: 'balaye-retour', titre: 'Le retour du pouce', etat: 'pasvu',
          consignes: ['Coup sec en arrière.', 'Grand écart de la main.', 'Fais bien tourner l’avant-bras devant.'] },
        { id: 'balaye-aller-retour', titre: 'L’aller-retour du pouce', etat: 'pasvu',
          consignes: ['Mouvement de balancier : l’aller, puis le retour, sans s’arrêter entre les deux.'] }
      ]
    },
    {
      titre: 'Les 4 accords de Zombie',
      intro: 'Commence par l’application sur ton téléphone (fichier Guitar Pro déjà envoyé).',
      exercices: [
        { id: 'zombie-noms', titre: 'Les noms par cœur', etat: 'continuer', morceau: 'zombie',
          consignes: ['Apprends le nom de chaque accord par cœur : nom français ET nom anglais.'],
          quiz: [['Em', 'Mi mineur'], ['Cmaj7', 'Do majeur 7'], ['G', 'Sol majeur'], ['D', 'Ré majeur']] },
        { id: 'zombie-pompes', titre: 'Chaque accord « en pompes »', etat: 'continuer', morceau: 'zombie',
          consignes: ['Pose l’accord, lève la main, pose, lève…',
                      'Le but : poser TOUS les doigts en même temps, d’un seul geste.',
                      'La position de chaque doigt est dans « Position des mains » du morceau Zombie.'] }
      ]
    },
    {
      titre: '💡 Pour aller plus loin (imaginé par l’app)',
      idees: true,
      intro: 'Pas donné en cours : des idées de l’app pour prolonger le travail de la semaine, quand le reste est bien en place. Montre-les à Françoise avant d’en faire une habitude. Elles ne comptent pas dans le travail du jour.',
      exercices: [
        { id: 'idee-accomp-riff-2', titre: 'Accompagner le riff n° 2 : 4 allers du pouce par mesure', etat: 'idee', morceau: 'ent-accomp-riff-2', rythme: { style: 'rock', tempos: [55, 60] },
          consignes: ['C’est ce que le fichier du riff n° 2 indique pour l’accompagnement : quatre allers du pouce par mesure, un par temps.',
                      'Les deux accords partent de la 5e corde. La 5 : La à vide, case 2 sur la 4e et la 3e, quand le riff part de la 6e corde.',
                      'Ré 5 : en Ve position, case 5 sur la 5e corde (Ré), case 7 sur la 4e et la 3e, quand le riff part de la 5e.',
                      'L’aller du pouce comme en cours : avant-bras qui tourne, devant la guitare.',
                      'Ensuite, joue l’accompagnement pendant que l’app joue le riff (ou l’inverse, guitare muette).'] },
        { id: 'idee-v-1343', titre: 'Ve position : 1 3 4 3 sur chaque corde', etat: 'idee', morceau: 'ent-v-1343',
          consignes: ['Les trois doigts de la semaine ensemble : 1er à la Ve case, 3e à la VIIe, 4e à la VIIIe, puis retour au 3e.',
                      'Pars du 1er doigt posé, et ne lâche pas un doigt tant que le suivant n’est pas posé.',
                      'Bien fléchir le 4e doigt ; le pouce gauche reste derrière la 6e case.'] },
        { id: 'idee-riff-la-3', titre: 'Riff en La n° 3 (avec 1, 3 et 4)', etat: 'idee', morceau: 'ent-riff-la-3', tempos: [50], rythme: { style: 'rock', tempos: [55] },
          consignes: ['Le chemin des riffs n° 1 et 2 (4 fois depuis la 6e corde, 2 fois depuis la 5e, 2 fois depuis la 6e, La grave pour finir), avec un schéma qui monte : case V, VII, VIII, puis V sur la corde suivante.',
                      'Ça donne La – Si – Do – Ré, puis Ré – Mi – Fa – Sol : les notes de la gamme de La mineur.',
                      'Pouce buté, d’abord lentement (50), puis au rock groove à 55.'] }
      ]
    },
    {
      titre: '📅 Révision : les semaines précédentes',
      facultatif: true,
      intro: 'Ce que les mails des deux semaines précédentes demandaient en plus, pour réviser quand le travail du jour est fait. Facultatif : ça ne compte pas dans le travail du jour.',
      exercices: [
        { id: 'sd-pouce-bute-1', titre: 'Pouce buté : 1 fois sur chaque corde', etat: 'semaine', morceau: 'ent-pouce-bute-1', tempos: [40, 45, 50, 55, 60],
          variantes: ['♩ = 40', '♩ = 45', '♩ = 50', '♩ = 55', '♩ = 60'],
          consignes: ['1 : j’appuie contre la corde voisine, « et » : je lève.',
                      'Bien t’arrêter contre la corde voisine avant de soulever le pouce !',
                      'Avec le métronome à 40, 45, 50, 55 et 60 : monte d’un cran seulement quand c’est propre.',
                      'Bien soulever le pouce à chaque attaque.',
                      'Pour le 4 fois sur chaque corde de cette semaine, si 50 est trop rapide : repars de 40 ou 45, comme les semaines précédentes.'] },
        { id: 'sd-main-droite', titre: 'Corriger la position de la main droite', etat: 'semaine',
          consignes: ['Corrige la position de la main droite quand tu joues, comme vu pendant le cours.',
                      'Vérifie-la devant la glace, pendant le pouce buté.'] },
        { id: 'noms-cordes', titre: 'Le nom des 6 cordes', etat: 'semaine', morceau: 'ent-noms-cordes',
          consignes: ['De la plus grosse à la plus fine : Mi (6e), La (5e), Ré (4e), Sol (3e), Si (2e), Mi (1re).',
                      'Dis le nom de chaque corde à voix haute en la jouant (voir le fichier Guitar Pro de Françoise).'],
          quiz: [['6e corde', 'Mi (grave)'], ['5e corde', 'La'], ['4e corde', 'Ré'], ['3e corde', 'Sol'], ['2e corde', 'Si'], ['1re corde', 'Mi (aigu)']] }
      ]
    }
  ];

  // Le travail du jour : le dernier mail, sans les idées de l'app (groupe
  // `idees`) ni la révision facultative de la semaine dernière (`facultatif`).
  function tous() {
    var l = [];
    GROUPES.forEach(function (g) { if (!g.idees && !g.facultatif) g.exercices.forEach(function (e) { l.push(e); }); });
    return l;
  }
  function facultatifs() {
    var l = [];
    GROUPES.forEach(function (g) { if (g.facultatif) g.exercices.forEach(function (e) { l.push(e); }); });
    return l;
  }
  function idees() {
    var l = [];
    GROUPES.forEach(function (g) { if (g.idees) g.exercices.forEach(function (e) { l.push(e); }); });
    return l;
  }
  // Nombre de cases à cocher d'un exercice : une par variante, sinon une.
  function cases(e) { return e.variantes ? e.variantes.length : 1; }

  global.Entrainement = { groupes: function () { return GROUPES; }, tous: tous, idees: idees, facultatifs: facultatifs, cases: cases };
})(typeof window !== 'undefined' ? window : globalThis);
