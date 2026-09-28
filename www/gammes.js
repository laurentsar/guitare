/* Gammes : où sont les notes d'une gamme sur tout le manche.
 *
 * Une gamme n'est qu'une suite d'intervalles (en demi-tons depuis la
 * tonique) ; tout le reste — cases, noms, lecture — en découle. Les tests
 * vérifient les notes produites contre les gammes connues (Do majeur = pas
 * d'altération, La mineur pentatonique = La Do Ré Mi Sol…).
 */
(function (global) {
  'use strict';

  var TYPES = [
    { id: 'majeure',    nom: 'Majeure',               intervalles: [0, 2, 4, 5, 7, 9, 11] },
    { id: 'mineure',    nom: 'Mineure naturelle',     intervalles: [0, 2, 3, 5, 7, 8, 10] },
    { id: 'harmonique', nom: 'Mineure harmonique',    intervalles: [0, 2, 3, 5, 7, 8, 11] },
    { id: 'penta-maj',  nom: 'Pentatonique majeure',  intervalles: [0, 2, 4, 7, 9] },
    { id: 'penta-min',  nom: 'Pentatonique mineure',  intervalles: [0, 3, 5, 7, 10] },
    { id: 'blues',      nom: 'Blues',                 intervalles: [0, 3, 5, 6, 7, 10] },
    { id: 'chromatique', nom: 'Chromatique',          intervalles: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
  ];

  function type(id) {
    for (var i = 0; i < TYPES.length; i++) if (TYPES[i].id === id) return TYPES[i];
    return null;
  }

  // Classes de hauteur (0 = Do) de la gamme `idType` sur la tonique `tonique`.
  function classes(tonique, idType) {
    return type(idType).intervalles.map(function (i) { return (tonique + i) % 12; });
  }

  function noms(tonique, idType) {
    return classes(tonique, idType).map(function (pc) { return Theorie.NOMS_FR[pc]; });
  }

  /* Toutes les cases du manche (0 à `cases`) qui appartiennent à la gamme.
   * La tonique est marquée : c'est le repère autour duquel on construit les
   * positions, et la première chose à voir sur le schéma. */
  function positions(tonique, idType, cases) {
    var cl = classes(tonique, idType);
    var out = [];
    for (var c = 1; c <= 6; c++) {
      for (var f = 0; f <= (cases || 12); f++) {
        var pc = Theorie.midiDeCase(c, f) % 12;
        if (cl.indexOf(pc) !== -1) out.push({ corde: c, frette: f, tonique: pc === tonique % 12, nom: Theorie.NOMS_FR[pc] });
      }
    }
    return out;
  }

  /* Suite de notes MIDI à jouer : la gamme montante puis descendante sur
   * `octaves` octaves, depuis la tonique la plus grave de la guitare
   * (≥ Mi2, la corde 6 à vide). */
  function aJouer(tonique, idType, octaves) {
    var base = 40 + (((tonique - 40) % 12) + 12) % 12;
    var iv = type(idType).intervalles;
    var monte = [];
    for (var o = 0; o < (octaves || 2); o++) iv.forEach(function (i) { monte.push(base + o * 12 + i); });
    monte.push(base + (octaves || 2) * 12);
    return monte.concat(monte.slice(0, -1).reverse());
  }

  global.Gammes = { TYPES: TYPES, type: type, classes: classes, noms: noms, positions: positions, aJouer: aJouer };
})(typeof window !== 'undefined' ? window : globalThis);
