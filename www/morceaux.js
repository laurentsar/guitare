/* Morceaux et exercices.
 *
 * Deux sources, et rien d'autre : des mélodies du DOMAINE PUBLIC (traditionnel,
 * Beethoven) et des études écrites pour cette app. Aucune chanson sous droits,
 * aucune tablature recopiée d'un site : tout est produit ici à partir des
 * hauteurs réelles, ce qui permet aussi de les vérifier par test.
 *
 * Les mélodies sont écrites en NOTES (do4, sol4…), jamais en « corde/frette » :
 * une hauteur est vérifiable, un doigté tapé à la main ne l'est pas. Le
 * placement en première position est calculé par `caseEnPremierePosition`.
 */
(function (global) {
  'use strict';

  // Position de base du guitariste classique débutant : index à la case 1,
  // auriculaire à la 4, plus les cordes à vide. Une note peut se jouer à
  // plusieurs endroits ; ce tableau fixe celui qu'enseignent les méthodes.
  var PREMIERE_POSITION = [
    { corde: 6, deMidi: 40, aMidi: 43 },   // Mi2 → Sol2
    { corde: 5, deMidi: 45, aMidi: 48 },   // La2 → Do3
    { corde: 4, deMidi: 50, aMidi: 54 },   // Ré3 → Fa♯3
    { corde: 3, deMidi: 55, aMidi: 58 },   // Sol3 → La♯3
    { corde: 2, deMidi: 59, aMidi: 63 },   // Si3 → Ré♯4
    { corde: 1, deMidi: 64, aMidi: 69 }    // Mi4 → La4 (5e case)
  ];

  function caseEnPremierePosition(midi) {
    // Parcours de l'aigu vers le grave : une note jouable sur deux cordes se
    // prend sur la plus aiguë, main plus près des autres notes de la mélodie.
    for (var i = PREMIERE_POSITION.length - 1; i >= 0; i--) {
      var z = PREMIERE_POSITION[i];
      if (midi >= z.deMidi && midi <= z.aMidi) {
        return { corde: z.corde, frette: midi - z.deMidi + (z.corde === 6 || z.corde === 5 || z.corde === 4 || z.corde === 3 || z.corde === 2 || z.corde === 1 ? 0 : 0) };
      }
    }
    return null;
  }

  var NOMS = { do: 0, 'do#': 1, re: 2, 're#': 3, mi: 4, fa: 5, 'fa#': 6, sol: 7, 'sol#': 8, la: 9, 'la#': 10, si: 11 };

  function midiDeNom(txt) {
    var m = /^([a-z#]+)(\d)$/.exec(txt.toLowerCase().replace('é', 'e'));
    if (!m || !(m[1] in NOMS)) return null;
    return (parseInt(m[2], 10) + 1) * 12 + NOMS[m[1]];
  }

  // Mélodie : suite de [nom, durée en noires]. Les durées s'enchaînent.
  function melodie(suite) {
    var t = 0, notes = [];
    suite.forEach(function (pas) {
      var midi = midiDeNom(pas[0]);
      var pos = caseEnPremierePosition(midi);
      if (!pos) throw new Error('note hors première position : ' + pas[0]);
      notes.push({ corde: pos.corde, frette: pos.frette, temps: t, duree: pas[1], midi: midi });
      t += pas[1];
    });
    return notes;
  }

  // Étude d'arpèges : un accord par mesure, joué pouce-index-majeur-annulaire.
  // Le pouce prend la basse de l'accord, les trois doigts les cordes 3, 2, 1.
  function arpeges(suite, opts) {
    opts = opts || {};
    var motif = opts.motif || ['p', 'i', 'm', 'a'];
    var pas = opts.pas || 0.5;                 // croches
    var t = 0, notes = [];
    suite.forEach(function (bloc) {
      var accord = Accords.get(bloc.accord);
      var frettes = accord.frettes;            // index 0 = corde 1
      var repetitions = bloc.mesures || 1;
      for (var r = 0; r < repetitions; r++) {
        for (var k = 0; k < motif.length; k++) {
          var doigt = motif[k];
          var corde = doigt === 'p' ? bloc.basse : (doigt === 'i' ? 3 : (doigt === 'm' ? 2 : 1));
          var frette = frettes[corde - 1];
          if (frette === -1) frette = 0;
          notes.push({ corde: corde, frette: frette, temps: t, duree: pas, main: doigt,
                       midi: Theorie.midiDeCase(corde, frette) });
          t += pas;
        }
      }
    });
    return notes;
  }

  function piece(def) { return def; }

  var PIECES = [];

  function ajoute(def) { PIECES.push(def); return def; }

  // --- Exercices de mise en route ------------------------------------------
  ajoute({
    id: 'chromatique',
    titre: 'Exercice chromatique 1-2-3-4',
    sous_titre: 'Délier les quatre doigts',
    niveau: 1, tempo: 60, signature: [4, 4],
    description: 'Un doigt par case, sans jamais lever les précédents. C’est l’exercice qui construit la main gauche : joué lentement et régulièrement, il vaut dix minutes de gammes.',
    notes: (function () {
      var n = [], t = 0;
      for (var corde = 6; corde >= 1; corde--) {
        for (var f = 1; f <= 4; f++) {
          n.push({ corde: corde, frette: f, temps: t, duree: 1, doigt: f, midi: Theorie.midiDeCase(corde, f) });
          t += 1;
        }
      }
      return n;
    })()
  });

  ajoute({
    id: 'pima-vide',
    titre: 'Arpège p-i-m-a à vide',
    sous_titre: 'La main droite, sans se soucier de la gauche',
    niveau: 1, tempo: 60, signature: [4, 4],
    description: 'Pouce sur la 6e corde, index sur la 3e, majeur sur la 2e, annulaire sur la 1re. Main gauche au repos : on ne travaille qu’une chose à la fois.',
    notes: (function () {
      var n = [], t = 0, cordes = [6, 3, 2, 1], mains = ['p', 'i', 'm', 'a'];
      for (var m = 0; m < 4; m++) {
        for (var k = 0; k < 4; k++) {
          n.push({ corde: cordes[k], frette: 0, temps: t, duree: 1, main: mains[k],
                   midi: Theorie.midiDeCase(cordes[k], 0) });
          t += 1;
        }
      }
      return n;
    })()
  });

  // --- Mélodies du domaine public -------------------------------------------
  ajoute({
    id: 'au-clair',
    titre: 'Au clair de la lune',
    sous_titre: 'Traditionnel · domaine public',
    niveau: 1, tempo: 80, signature: [4, 4],
    description: 'Cinq notes seulement, toutes sur les deux premières cordes. La première mélodie jouable après une semaine.',
    notes: melodie([
      ['do4', 1], ['do4', 1], ['do4', 1], ['re4', 1],
      ['mi4', 2], ['re4', 2],
      ['do4', 1], ['mi4', 1], ['re4', 1], ['re4', 1],
      ['do4', 4]
    ])
  });

  ajoute({
    id: 'dirai-je',
    titre: 'Ah ! vous dirai-je, maman',
    sous_titre: 'Traditionnel · domaine public',
    niveau: 2, tempo: 84, signature: [4, 4],
    description: 'La mélodie que Mozart a variée. Elle monte jusqu’au La de la 5e case : l’occasion de sortir l’auriculaire.',
    notes: melodie([
      ['do4', 1], ['do4', 1], ['sol4', 1], ['sol4', 1],
      ['la4', 1], ['la4', 1], ['sol4', 2],
      ['fa4', 1], ['fa4', 1], ['mi4', 1], ['mi4', 1],
      ['re4', 1], ['re4', 1], ['do4', 2]
    ])
  });

  ajoute({
    id: 'ode-joie',
    titre: 'Ode à la joie',
    sous_titre: 'Beethoven · domaine public',
    niveau: 2, tempo: 88, signature: [4, 4],
    description: 'Le thème de la 9e symphonie. Deux cordes, aucun saut : idéal pour travailler la régularité du son.',
    notes: melodie([
      ['mi4', 1], ['mi4', 1], ['fa4', 1], ['sol4', 1],
      ['sol4', 1], ['fa4', 1], ['mi4', 1], ['re4', 1],
      ['do4', 1], ['do4', 1], ['re4', 1], ['mi4', 1],
      ['mi4', 1.5], ['re4', 0.5], ['re4', 2]
    ])
  });

  ajoute({
    id: 'frere-jacques',
    titre: 'Frère Jacques',
    sous_titre: 'Traditionnel · domaine public',
    niveau: 2, tempo: 92, signature: [4, 4],
    description: 'Quatre phrases répétées deux fois chacune. Se joue aussi en canon à deux guitares, quand tu auras quelqu’un en face.',
    notes: melodie([
      ['do4', 1], ['re4', 1], ['mi4', 1], ['do4', 1],
      ['do4', 1], ['re4', 1], ['mi4', 1], ['do4', 1],
      ['mi4', 1], ['fa4', 1], ['sol4', 2],
      ['mi4', 1], ['fa4', 1], ['sol4', 2],
      ['sol4', 0.5], ['la4', 0.5], ['sol4', 0.5], ['fa4', 0.5], ['mi4', 1], ['do4', 1],
      ['sol4', 0.5], ['la4', 0.5], ['sol4', 0.5], ['fa4', 0.5], ['mi4', 1], ['do4', 1],
      ['do4', 1], ['sol3', 1], ['do4', 2],
      ['do4', 1], ['sol3', 1], ['do4', 2]
    ])
  });

  // --- Études écrites pour l'app --------------------------------------------
  ajoute({
    id: 'etude-mim',
    titre: 'Étude en Mi mineur',
    sous_titre: 'Arpèges · écrite pour cette app',
    niveau: 3, tempo: 66, signature: [4, 4],
    description: 'Quatre accords, un arpège p-i-m-a, deux mesures chacun. La main gauche ne bouge qu’une fois toutes les huit notes : c’est là qu’on apprend à anticiper le changement.',
    notes: arpeges([
      { accord: 'Em', basse: 6, mesures: 2 },
      { accord: 'Am', basse: 5, mesures: 2 },
      { accord: 'B7', basse: 5, mesures: 2 },
      { accord: 'Em', basse: 6, mesures: 2 }
    ])
  });

  ajoute({
    id: 'etude-lam',
    titre: 'Étude en La mineur',
    sous_titre: 'Arpèges · écrite pour cette app',
    niveau: 3, tempo: 72, signature: [4, 4],
    description: 'Même travail que l’étude en Mi mineur, avec un accord de Ré mineur qui oblige les doigts à se replacer complètement.',
    notes: arpeges([
      { accord: 'Am', basse: 5, mesures: 2 },
      { accord: 'Dm', basse: 4, mesures: 2 },
      { accord: 'E7', basse: 6, mesures: 2 },
      { accord: 'Am', basse: 5, mesures: 2 }
    ])
  });

  function tous() { return PIECES.slice(); }
  function get(id) { for (var i = 0; i < PIECES.length; i++) if (PIECES[i].id === id) return PIECES[i]; return null; }

  global.Morceaux = {
    tous: tous, get: get, melodie: melodie, arpeges: arpeges,
    caseEnPremierePosition: caseEnPremierePosition, midiDeNom: midiDeNom
  };
})(typeof window !== 'undefined' ? window : globalThis);
