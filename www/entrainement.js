/* Entraînement : les exercices donnés en cours, à refaire chaque jour.
 *
 * Contenu dicté par le cours, pas par l'app : les consignes reprennent mot
 * pour mot ce que le professeur a demandé. Chaque exercice peut avoir :
 *  - etat : 'continuer' (déjà vu, à poursuivre), 'nouveau' (donné cette
 *    semaine), 'pasvu' (donné à faire, mais pas encore montré en cours) ;
 *  - variantes : les façons de le faire (en regardant, yeux fermés…), cochées
 *    séparément chaque jour ;
 *  - morceau : la tablature correspondante (www/morceaux.js, catégorie
 *    « entrainement ») ;
 *  - quiz : questions-réponses à réviser (noms des accords).
 * Pour la semaine suivante, on modifie ce fichier.
 */
(function (global) {
  'use strict';

  var REGARD = ['en regardant la main droite', 'sans regarder : yeux fermés'];

  var GROUPES = [
    {
      titre: 'Repères',
      exercices: [
        { id: 'noms-cordes', titre: 'Le nom des 6 cordes', etat: 'continuer', morceau: 'ent-noms-cordes',
          consignes: ['De la plus grosse à la plus fine : Mi (6e), La (5e), Ré (4e), Sol (3e), Si (2e), Mi (1re).',
                      'Dis le nom de chaque corde à voix haute en la jouant.'],
          quiz: [['6e corde', 'Mi (grave)'], ['5e corde', 'La'], ['4e corde', 'Ré'], ['3e corde', 'Sol'], ['2e corde', 'Si'], ['1re corde', 'Mi (aigu)']] }
      ]
    },
    {
      titre: 'Balayages',
      intro: 'Guitare posée sur la jambe droite.',
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
      titre: 'Main droite : travail des doigts',
      exercices: [
        { id: 'saute-mouton', titre: 'Exercice « saute-mouton » avec le pouce', etat: 'continuer', variantes: REGARD,
          consignes: ['L’index, le majeur et l’annulaire (i, m, a) restent posés sur la 1re corde, la plus aiguë.',
                      'Passe avec le pouce de la 6e corde à la 2e, puis reviens jusqu’à la 6e, sans jouer : le pouce « saute » d’une corde à l’autre.',
                      'Le pouce suit la trajectoire des barrettes du manche.'] },
        { id: 'pouce-bute-1', titre: 'Pouce buté : 1 fois sur chaque corde', etat: 'continuer', morceau: 'ent-pouce-bute-1',
          consignes: ['Bien soulever le pouce à chaque attaque.'] },
        { id: 'pouce-bute-4', titre: 'Pouce buté : 4 fois sur chaque corde', etat: 'nouveau', morceau: 'ent-pouce-bute-4', variantes: REGARD,
          consignes: ['Quatre attaques par corde, de la 6e à la 2e et retour.', 'Bien soulever le pouce à chaque attaque.'] },
        { id: 'main-droite-position', titre: 'Position de la main droite', etat: 'continuer',
          consignes: ['Corrige la position de la main droite quand tu joues, comme vu en cours.'] }
      ]
    },
    {
      titre: 'Main gauche',
      exercices: [
        { id: 'pince', titre: 'Partir de la pince', etat: 'continuer',
          consignes: ['Pars toujours de la pince.',
                      'Le pouce se place au milieu du manche, sans serrer et sans se plier, derrière la 6e case et derrière le 2e doigt.'] },
        { id: 'v-0303', titre: 'Ve position : 0 3 0 3, pouce buté', etat: 'continuer', morceau: 'ent-v-0303',
          consignes: ['Le 3e doigt joue à la VIIe case.',
                      'Joue de la 6e corde à la 2e, et retour à la 6e.',
                      'Le doigt enfonce la corde au bout de l’os, se pose droit le long de la barrette en tirant légèrement vers la droite.',
                      'Joue le plus près possible de la barrette.'] },
        { id: 'v-0101', titre: 'Ve position : 0 1 0 1, pouce buté', etat: 'nouveau', morceau: 'ent-v-0101',
          consignes: ['Le 3e doigt reste au-dessus de sa case.',
                      'Le 1er doigt s’écarte et se pose légèrement sur le côté gauche.'] }
      ]
    }
  ];

  function tous() {
    var l = [];
    GROUPES.forEach(function (g) { g.exercices.forEach(function (e) { l.push(e); }); });
    return l;
  }
  // Nombre de cases à cocher d'un exercice : une par variante, sinon une.
  function cases(e) { return e.variantes ? e.variantes.length : 1; }

  global.Entrainement = { groupes: function () { return GROUPES; }, tous: tous, cases: cases };
})(typeof window !== 'undefined' ? window : globalThis);
