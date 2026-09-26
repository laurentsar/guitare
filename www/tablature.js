/* Tablature : modèle, rendu et lecture.
 *
 * Une pièce est une liste de notes { corde, frette, temps, duree } où `temps`
 * et `duree` sont comptés EN NOIRES depuis le début (1 = une noire, 0.5 = une
 * croche, 2 = une blanche). Rien n'est exprimé en secondes : le tempo est
 * choisi au moment de jouer, et l'élève travaille lentement avant d'accélérer.
 *
 * `doigt` (main gauche) et `main` (p/i/m/a, main droite) sont facultatifs :
 * en guitare classique ils font partie de ce qu'on apprend, donc quand ils
 * sont donnés, ils s'affichent.
 */
(function (global) {
  'use strict';

  function duree_totale(piece) {
    return piece.notes.reduce(function (m, n) { return Math.max(m, n.temps + (n.duree || 1)); }, 0);
  }

  // Découpe en systèmes (lignes) d'un nombre entier de mesures : une
  // tablature qui déborde en largeur est illisible sur un téléphone, et
  // couper au milieu d'une mesure désoriente autant qu'une phrase coupée.
  function systemes(piece, mesuresParLigne) {
    var parMesure = piece.signature ? piece.signature[0] : 4;
    var total = duree_totale(piece);
    var nbMesures = Math.ceil(total / parMesure);
    var lignes = [];
    for (var m = 0; m < nbMesures; m += mesuresParLigne) {
      var debut = m * parMesure;
      var fin = Math.min(nbMesures, m + mesuresParLigne) * parMesure;
      lignes.push({
        debut: debut, fin: fin,
        notes: piece.notes.filter(function (n) { return n.temps >= debut && n.temps < fin; })
      });
    }
    return lignes;
  }

  /* Rendu SVG d'un système. La corde 1 (aiguë) est EN HAUT : convention
   * universelle des tablatures, à l'inverse du diagramme d'accord. */
  function svgSysteme(ligne, opts) {
    opts = opts || {};
    var parMesure = opts.parMesure || 4;
    var pxParTemps = opts.pxParTemps || 46;
    var margeG = 26, margeD = 10, margeH = 16;
    var interligne = opts.interligne || 15;
    var L = margeG + (ligne.fin - ligne.debut) * pxParTemps + margeD;
    var H = margeH * 2 + interligne * 5;
    var p = ['<svg viewBox="0 0 ' + L + ' ' + H + '" class="tab" preserveAspectRatio="xMinYMid meet">'];

    for (var c = 0; c < 6; c++) {
      var y = margeH + c * interligne;
      p.push('<line x1="' + margeG + '" y1="' + y + '" x2="' + (L - margeD) + '" y2="' + y + '" class="tab-corde"/>');
    }
    p.push('<text x="4" y="' + (margeH + 2.5 * interligne + 4) + '" class="tab-clef">TAB</text>');

    // Barres de mesure.
    for (var t = ligne.debut; t <= ligne.fin; t += parMesure) {
      var x = margeG + (t - ligne.debut) * pxParTemps;
      p.push('<line x1="' + x + '" y1="' + margeH + '" x2="' + x + '" y2="' + (margeH + 5 * interligne) + '" class="tab-mesure"/>');
    }

    ligne.notes.forEach(function (n, i) {
      var x = margeG + (n.temps - ligne.debut) * pxParTemps + 6;
      var y = margeH + (n.corde - 1) * interligne;
      p.push('<g class="tab-note" data-temps="' + n.temps + '">');
      p.push('<rect x="' + (x - 7) + '" y="' + (y - 7) + '" width="15" height="14" class="tab-fond"/>');
      p.push('<text x="' + x + '" y="' + (y + 4) + '" class="tab-chiffre" text-anchor="middle">' + n.frette + '</text>');
      if (n.main) p.push('<text x="' + x + '" y="' + (margeH + 5 * interligne + 12) + '" class="tab-main" text-anchor="middle">' + n.main + '</text>');
      p.push('</g>');
    });
    p.push('</svg>');
    return p.join('');
  }

  function svg(piece, opts) {
    opts = opts || {};
    var parMesure = piece.signature ? piece.signature[0] : 4;
    var lignes = systemes(piece, opts.mesuresParLigne || 2);
    return lignes.map(function (l) {
      return '<div class="tab-ligne">' + svgSysteme(l, {
        parMesure: parMesure,
        pxParTemps: opts.pxParTemps,
        interligne: opts.interligne
      }) + '</div>';
    }).join('');
  }

  /* Lecture.
   *
   * On programme TOUT le morceau d'avance sur l'horloge audio (les notes sont
   * des sources déjà calculées, le coût est négligeable) et on garde un
   * minuteur séparé, uniquement pour surligner la note en cours : si
   * l'affichage prend du retard, le son, lui, reste juste.
   */
  var lecture = { actif: false, timers: [], surNote: null, surFin: null };

  function jouer(piece, opts) {
    opts = opts || {};
    arreter();
    var tempo = opts.tempo || piece.tempo || 70;
    var sec = 60 / tempo;
    var t0 = Date.now();
    lecture.actif = true;
    lecture.surNote = opts.surNote || null;
    lecture.surFin = opts.surFin || null;

    piece.notes.forEach(function (n, i) {
      var retard = n.temps * sec;
      Audio5.jouerCase(n.corde, n.frette, {
        retard: retard,
        duree: Math.max(0.8, (n.duree || 1) * sec + 1.2),
        volume: 0.5
      });
      if (lecture.surNote) {
        lecture.timers.push(setTimeout(function () {
          if (lecture.actif) lecture.surNote(n, i);
        }, retard * 1000));
      }
    });

    var fin = duree_totale(piece) * sec;
    lecture.timers.push(setTimeout(function () {
      lecture.actif = false;
      if (lecture.surFin) lecture.surFin();
    }, fin * 1000 + 300));
    return { duree: fin, depart: t0 };
  }

  function arreter() {
    lecture.timers.forEach(clearTimeout);
    lecture.timers = [];
    if (lecture.actif) {
      lecture.actif = false;
      // Le son déjà programmé continue : couper l'AudioContext ferait un clic
      // et casserait le métronome s'il tourne. Les notes s'éteignent seules.
    }
  }

  function enLecture() { return lecture.actif; }

  global.Tablature = {
    svg: svg, svgSysteme: svgSysteme, systemes: systemes,
    duree_totale: duree_totale, jouer: jouer, arreter: arreter, enLecture: enLecture
  };
})(typeof window !== 'undefined' ? window : globalThis);
