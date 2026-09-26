/* Accords : positions et diagrammes.
 *
 * Une position se note par SIX frettes, dans l'ordre corde 1 (aiguë) → corde 6
 * (grave), comme Theorie.notesDeGrille les attend :
 *   0   corde jouée à vide
 *   n   corde pressée à la frette n
 *  -1   corde non jouée (le pouce l'étouffe)
 *
 * `doigts` suit le même ordre : 1 index, 2 majeur, 3 annulaire, 4 auriculaire,
 * 0 rien. `barre` décrit un barré : { frette, de, a } en numéros de corde.
 *
 * Les positions sont celles de la guitare classique en première position ;
 * l'ordre de la liste est celui dans lequel un débutant les apprend, pas
 * l'ordre alphabétique.
 */
(function (global) {
  'use strict';

  var ACCORDS = [
    { id: 'Em',     fr: 'Mi mineur',      frettes: [0, 0, 0, 2, 2, 0],  doigts: [0, 0, 0, 3, 2, 0], famille: 'mineur', rang: 1 },
    { id: 'Am',     fr: 'La mineur',      frettes: [0, 1, 2, 2, 0, -1], doigts: [0, 1, 3, 2, 0, 0], famille: 'mineur', rang: 1 },
    { id: 'E',      fr: 'Mi majeur',      frettes: [0, 0, 1, 2, 2, 0],  doigts: [0, 0, 1, 3, 2, 0], famille: 'majeur', rang: 1 },
    { id: 'D',      fr: 'Ré majeur',      frettes: [2, 3, 2, 0, -1, -1], doigts: [2, 3, 1, 0, 0, 0], famille: 'majeur', rang: 2 },
    { id: 'A',      fr: 'La majeur',      frettes: [0, 2, 2, 2, 0, -1], doigts: [0, 3, 2, 1, 0, 0], famille: 'majeur', rang: 2 },
    { id: 'Dm',     fr: 'Ré mineur',      frettes: [1, 3, 2, 0, -1, -1], doigts: [1, 3, 2, 0, 0, 0], famille: 'mineur', rang: 2 },
    { id: 'C',      fr: 'Do majeur',      frettes: [0, 1, 0, 2, 3, -1], doigts: [0, 1, 0, 2, 3, 0], famille: 'majeur', rang: 3 },
    { id: 'G',      fr: 'Sol majeur',     frettes: [3, 0, 0, 0, 2, 3],  doigts: [4, 0, 0, 0, 1, 2], famille: 'majeur', rang: 3 },
    { id: 'E7',     fr: 'Mi septième',    frettes: [0, 0, 1, 0, 2, 0],  doigts: [0, 0, 1, 0, 2, 0], famille: 'septième', rang: 3 },
    { id: 'A7',     fr: 'La septième',    frettes: [0, 2, 0, 2, 0, -1], doigts: [0, 3, 0, 2, 0, 0], famille: 'septième', rang: 3 },
    { id: 'D7',     fr: 'Ré septième',    frettes: [2, 1, 2, 0, -1, -1], doigts: [3, 1, 2, 0, 0, 0], famille: 'septième', rang: 4 },
    { id: 'B7',     fr: 'Si septième',    frettes: [2, 0, 2, 1, 2, -1], doigts: [4, 0, 3, 1, 2, 0], famille: 'septième', rang: 4 },
    { id: 'G7',     fr: 'Sol septième',   frettes: [1, 0, 0, 0, 2, 3],  doigts: [1, 0, 0, 0, 2, 3], famille: 'septième', rang: 4 },
    { id: 'C7',     fr: 'Do septième',    frettes: [0, 1, 3, 2, 3, -1], doigts: [0, 1, 4, 2, 3, 0], famille: 'septième', rang: 5 },
    { id: 'Am7',    fr: 'La mineur 7',    frettes: [0, 1, 0, 2, 0, -1], doigts: [0, 1, 0, 2, 0, 0], famille: 'mineur', rang: 5 },
    { id: 'Em7',    fr: 'Mi mineur 7',    frettes: [0, 0, 0, 0, 2, 0],  doigts: [0, 0, 0, 0, 2, 0], famille: 'mineur', rang: 5 },
    { id: 'Cmaj7',  fr: 'Do majeur 7',    frettes: [0, 0, 0, 2, 3, -1], doigts: [0, 0, 0, 2, 3, 0], famille: 'majeur', rang: 5 },
    { id: 'Gmaj7',  fr: 'Sol majeur 7',   frettes: [2, 0, 0, 0, 2, 3],  doigts: [3, 0, 0, 0, 1, 2], famille: 'majeur', rang: 6 },
    { id: 'Dmaj7',  fr: 'Ré majeur 7',    frettes: [2, 2, 2, 0, -1, -1], doigts: [3, 2, 1, 0, 0, 0], famille: 'majeur', rang: 6 },
    { id: 'Fmaj7',  fr: 'Fa majeur 7 (sans barré)', frettes: [0, 1, 2, 3, -1, -1], doigts: [0, 1, 2, 3, 0, 0], famille: 'majeur', rang: 6 },
    { id: 'F',      fr: 'Fa majeur (barré)', frettes: [1, 1, 2, 3, 3, 1], doigts: [1, 1, 2, 4, 3, 1], barre: { frette: 1, de: 1, a: 6 }, famille: 'barré', rang: 7 },
    { id: 'Bm',     fr: 'Si mineur (barré)', frettes: [2, 3, 4, 4, 2, -1], doigts: [1, 2, 4, 3, 1, 0], barre: { frette: 2, de: 1, a: 5 }, famille: 'barré', rang: 7 },
    { id: 'F#m',    fr: 'Fa♯ mineur (barré)', frettes: [2, 2, 2, 4, 4, 2], doigts: [1, 1, 1, 3, 4, 1], barre: { frette: 2, de: 1, a: 6 }, famille: 'barré', rang: 7 }
  ];

  var PAR_ID = {};
  ACCORDS.forEach(function (a) { PAR_ID[a.id] = a; });

  function get(id) { return PAR_ID[id] || null; }
  function tous() { return ACCORDS.slice(); }

  // Frette la plus haute de la position : sert au diagramme (combien de cases
  // dessiner) et à trier « accords faciles » / « accords hauts ».
  function frette_max(accord) {
    return accord.frettes.reduce(function (m, f) { return f > m ? f : m; }, 0);
  }

  /* Diagramme SVG.
   *
   * Vue classique du manche vu de face, cordes verticales : corde 6 (grave) à
   * GAUCHE, corde 1 (aiguë) à droite — c'est ce que voit l'élève quand il
   * regarde sa guitare posée contre lui, et l'inverse du tableau `frettes`,
   * d'où l'inversion explicite plus bas. Ne pas la retirer : le diagramme
   * serait en miroir, et l'élève apprendrait le doigté à l'envers.
   */
  function svg(accord, opts) {
    opts = opts || {};
    var L = opts.largeur || 150;
    var cases = Math.max(4, Math.min(5, frette_max(accord)));
    var depart = 1;
    // Position haute sur le manche : on décale le diagramme et on l'annote,
    // plutôt que de dessiner quinze cases vides.
    if (frette_max(accord) > 5) {
      depart = Math.min.apply(null, accord.frettes.filter(function (f) { return f > 0; }));
      cases = 4;
    }
    var marge = L * 0.16;
    var largeurManche = L - 2 * marge;
    var pasCorde = largeurManche / 5;
    var hauteurCase = pasCorde * 1.05;
    var H = marge * 1.35 + cases * hauteurCase + marge * 0.5;
    var y0 = marge * 1.35;

    var p = [];
    p.push('<svg viewBox="0 0 ' + L.toFixed(1) + ' ' + H.toFixed(1) + '" class="diagramme" role="img" aria-label="Diagramme de l\'accord ' + accord.id + '">');

    // Sillet : trait épais si l'accord est en première position, sinon une
    // simple frette avec le numéro à côté.
    if (depart === 1) {
      p.push('<rect x="' + marge + '" y="' + (y0 - 4) + '" width="' + largeurManche + '" height="4" class="sillet"/>');
    } else {
      p.push('<text x="' + (marge - 6) + '" y="' + (y0 + hauteurCase * 0.6) + '" class="diag-frette" text-anchor="end">' + depart + '</text>');
    }

    for (var f = 0; f <= cases; f++) {
      var y = y0 + f * hauteurCase;
      p.push('<line x1="' + marge + '" y1="' + y + '" x2="' + (marge + largeurManche) + '" y2="' + y + '" class="frette"/>');
    }
    for (var c = 0; c < 6; c++) {
      var x = marge + c * pasCorde;
      p.push('<line x1="' + x + '" y1="' + y0 + '" x2="' + x + '" y2="' + (y0 + cases * hauteurCase) + '" class="corde"/>');
    }

    // Barré : un seul rectangle arrondi couvrant les cordes concernées.
    if (accord.barre && accord.barre.frette >= depart) {
      var xa = marge + (6 - accord.barre.a) * pasCorde;
      var xb = marge + (6 - accord.barre.de) * pasCorde;
      var yb = y0 + (accord.barre.frette - depart + 0.5) * hauteurCase;
      p.push('<rect x="' + (xa - pasCorde * 0.3) + '" y="' + (yb - pasCorde * 0.3) + '" width="' + (xb - xa + pasCorde * 0.6) + '" height="' + (pasCorde * 0.6) + '" rx="' + (pasCorde * 0.3) + '" class="barre"/>');
    }

    for (c = 0; c < 6; c++) {
      var corde = c + 1;                    // 1 = aiguë
      var frette = accord.frettes[c];
      var doigt = accord.doigts ? accord.doigts[c] : 0;
      var xc = marge + (6 - corde) * pasCorde;   // inversion : grave à gauche
      if (frette === -1) {
        p.push('<text x="' + xc + '" y="' + (y0 - 7) + '" class="diag-mute" text-anchor="middle">✕</text>');
      } else if (frette === 0) {
        p.push('<circle cx="' + xc + '" cy="' + (y0 - 11) + '" r="4" class="vide"/>');
      } else {
        var yc = y0 + (frette - depart + 0.5) * hauteurCase;
        var dansBarre = accord.barre && frette === accord.barre.frette &&
                        corde >= accord.barre.de && corde <= accord.barre.a;
        if (!dansBarre) {
          p.push('<circle cx="' + xc + '" cy="' + yc + '" r="' + (pasCorde * 0.32) + '" class="doigt"/>');
        }
        if (doigt > 0) {
          p.push('<text x="' + xc + '" y="' + (yc + 4) + '" class="diag-doigt" text-anchor="middle">' + doigt + '</text>');
        }
      }
    }
    p.push('</svg>');
    return p.join('');
  }

  // Notes réellement produites, pour l'affichage pédagogique (« cet accord,
  // c'est La-Do-Mi ») et pour les tests.
  function notes(accord) {
    return Theorie.notesDeGrille(accord.frettes).map(function (n) {
      return Theorie.nomSansOctave(n.midi);
    });
  }

  global.Accords = { tous: tous, get: get, svg: svg, notes: notes, frette_max: frette_max };
})(typeof window !== 'undefined' ? window : globalThis);
