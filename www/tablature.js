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

  /* Options de lecture (celles d'un lecteur de tablatures « pro ») :
   *   tempo      noires par minute ;
   *   de, a      section à jouer, en noires depuis le début (boucle A-B) ;
   *   decompte   nombre de clics avant la première note ;
   *   metronome  un clic par temps pendant la lecture ;
   *   capo       case du capodastre : tout sonne N demi-tons plus haut, la
   *              tablature, elle, reste écrite comme si le capo était le sillet ;
   *   muet       guitare coupée — le surlignage et les clics continuent : on
   *              joue soi-même, l'app ne fait que tenir le temps.
   */
  function jouer(piece, opts) {
    opts = opts || {};
    arreter();
    var tempo = opts.tempo || piece.tempo || 70;
    var sec = 60 / tempo;
    var parMesure = piece.signature ? piece.signature[0] : 4;
    var de = opts.de || 0;
    var a = opts.a == null ? duree_totale(piece) : opts.a;
    var capo = opts.capo || 0;
    var decompte = opts.decompte || 0;
    var avance = decompte * sec;                  // décalage dû au décompte
    var t0 = Date.now();
    lecture.actif = true;
    lecture.surNote = opts.surNote || null;
    lecture.surFin = opts.surFin || null;

    for (var k = 0; k < decompte; k++) {
      Audio5.jouerClic(k * sec, k % parMesure === 0);
    }
    if (opts.metronome) {
      for (var t = Math.ceil(de); t < a; t++) {
        Audio5.jouerClic(avance + (t - de) * sec, t % parMesure === 0);
      }
    }

    piece.notes.forEach(function (n, i) {
      if (n.temps < de || n.temps >= a) return;
      var retard = avance + (n.temps - de) * sec;
      if (!opts.muet) {
        Audio5.jouerNote(Theorie.midiDeCase(n.corde, n.frette) + capo, {
          retard: retard,
          duree: Math.max(0.8, (n.duree || 1) * sec + 1.2),
          volume: 0.5,
          timbre: opts.timbre
        });
      }
      if (lecture.surNote) {
        lecture.timers.push(setTimeout(function () {
          if (lecture.actif) lecture.surNote(n, i);
        }, retard * 1000));
      }
    });

    var fin = avance + (a - de) * sec;
    lecture.timers.push(setTimeout(function () {
      lecture.actif = false;
      if (lecture.surFin) lecture.surFin();
    }, fin * 1000 + 300));
    return { duree: fin, depart: t0 };
  }

  function arreter() {
    lecture.timers.forEach(clearTimeout);
    lecture.timers = [];
    lecture.actif = false;
    // Le morceau entier est programmé d'avance sur l'horloge audio : il faut
    // donc couper les sources, sinon « Arrêter » n'arrêtait que le surlignage
    // et la musique continuait jusqu'au bout. Le métronome n'est pas touché :
    // il vit sur son propre programmateur.
    Audio5.couperTout();
  }

  function enLecture() { return lecture.actif; }

  /* Tablature texte (« ASCII »), le format de toutes les tabs du web :
   *
   *   e|---0---2---|
   *   B|-1-------3-|
   *   ...
   *
   * Export : une colonne par demi-temps (par quart si le morceau a des
   * doubles croches), une barre à chaque mesure.
   * Import : le texte ne dit rien du rythme — chaque colonne portant au moins
   * un chiffre devient un temps d'une croche. On récupère les bonnes notes au
   * bon endroit du manche ; le rythme, c'est l'oreille qui le remet.
   */
  var LETTRES = ['e', 'B', 'G', 'D', 'A', 'E'];

  function versTexte(piece, mesuresParLigne) {
    var parMesure = piece.signature ? piece.signature[0] : 4;
    var pas = piece.notes.some(function (n) { return (n.temps * 2) % 1 !== 0; }) ? 0.25 : 0.5;
    var parCol = Math.round(1 / pas);
    return systemes(piece, mesuresParLigne || 4).map(function (l) {
      var lignes = LETTRES.map(function (x) { return x + '|'; });
      for (var t = l.debut; t < l.fin - 1e-9; t += pas) {
        var col = l.notes.filter(function (n) { return Math.abs(n.temps - t) < 1e-6; });
        var larg = col.reduce(function (m, n) { return Math.max(m, String(n.frette).length); }, 1);
        for (var c = 0; c < 6; c++) {
          var n = col.filter(function (x) { return x.corde === c + 1; })[0];
          var txt = n ? String(n.frette) : '';
          lignes[c] += '-' + txt + new Array(larg - txt.length + 1).join('-');
        }
        var fin = Math.round((t + pas - l.debut) * parCol);
        if (fin % (parMesure * parCol) === 0) for (c = 0; c < 6; c++) lignes[c] += '-|';
      }
      return lignes.join('\n');
    }).join('\n\n');
  }

  function depuisTexte(texte) {
    var lignes = String(texte || '').split(/\r?\n/);
    var re = /^\s*([eBGDAEbgda])\s*[|:]/;
    var notes = [], t = 0;
    for (var i = 0; i + 5 < lignes.length; i++) {
      var bloc = lignes.slice(i, i + 6);
      if (!bloc.every(function (l) { return re.test(l); })) continue;
      var corps = bloc.map(function (l) { return l.slice(l.search(/[|:]/) + 1); });
      var max = corps.reduce(function (m, l) { return Math.max(m, l.length); }, 0);
      for (var col = 0; col < max; col++) {
        var trouve = false, saut = 0;
        for (var c = 0; c < 6; c++) {
          var ch = corps[c].charAt(col);
          if (!/\d/.test(ch)) continue;
          // Un nombre à deux chiffres qui ne commence pas à cette colonne a
          // déjà été lu à la précédente.
          if (/\d/.test(corps[c].charAt(col - 1))) continue;
          var num = ch;
          if (/\d/.test(corps[c].charAt(col + 1))) { num += corps[c].charAt(col + 1); saut = 1; }
          var frette = parseInt(num, 10);
          if (frette > 24) continue;
          notes.push({ corde: c + 1, frette: frette, temps: t, duree: 0.5, midi: Theorie.midiDeCase(c + 1, frette) });
          trouve = true;
        }
        if (trouve) t += 0.5;
        col += saut;
      }
      i += 5;
    }
    return notes;
  }

  global.Tablature = {
    svg: svg, svgSysteme: svgSysteme, systemes: systemes, versTexte: versTexte, depuisTexte: depuisTexte,
    duree_totale: duree_totale, jouer: jouer, arreter: arreter, enLecture: enLecture
  };
})(typeof window !== 'undefined' ? window : globalThis);
