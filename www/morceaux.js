/* Morceaux et exercices.
 *
 * Deux sources, et rien d'autre : des mélodies du DOMAINE PUBLIC (traditionnel,
 * Beethoven) et des études écrites pour cette app. Aucune mélodie ni parole sous droits
 * (une chanson récente n'y entre que par sa grille d'accords, non protégée),
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

  // Mélodie : suite de [nom, durée en noires]. Les durées s'enchaînent ;
  // « - » est un silence (sert aussi à placer une levée en fin de mesure).
  //
  // En première position, un doigt par case : la case dit le doigt (1 index
  // … 4 auriculaire ; la 5e case du La aigu se prend aussi à l'auriculaire,
  // la main glisse d'une case). Avec `alterne`, la main droite alterne
  // index-majeur, comme on l'apprend dès la première mélodie.
  function melodie(suite, opts) {
    opts = opts || {};
    var t = 0, notes = [], k = 0;
    suite.forEach(function (pas) {
      if (pas[0] === '-') { t += pas[1]; return; }
      var midi = midiDeNom(pas[0]);
      var pos = caseEnPremierePosition(midi);
      if (!pos) throw new Error('note hors première position : ' + pas[0]);
      var n = { corde: pos.corde, frette: pos.frette, temps: t, duree: pas[1], midi: midi };
      if (pos.frette > 0) n.doigt = Math.min(4, pos.frette);
      if (opts.main) n.main = opts.main;
      else if (opts.alterne) n.main = (k++ % 2) ? 'm' : 'i';
      notes.push(n);
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
          var n = { corde: corde, frette: frette, temps: t, duree: pas, main: doigt, accord: accord.id,
                    midi: Theorie.midiDeCase(corde, frette) };
          if (frette > 0 && accord.doigts && accord.doigts[corde - 1]) n.doigt = accord.doigts[corde - 1];
          notes.push(n);
          t += pas;
        }
      }
    });
    return notes;
  }

  /* « Position des mains » d'une pièce faite d'accords de la bibliothèque :
   * la consigne de chaque accord est écrite à partir de son doigté. */
  var NOMS_DOIGTS = { 1: 'index', 2: 'majeur', 3: 'annulaire', 4: 'auriculaire' };
  function consigneAccord(a) {
    var poses = [], vides = [], muettes = [];
    a.frettes.forEach(function (f, k) {
      var c = k + 1, o = c === 1 ? '1re' : c + 'e';
      if (f > 0) poses.push(NOMS_DOIGTS[a.doigts[k]] + ' case ' + f + ' sur la ' + o);
      else if (f === 0) vides.push(o);
      else muettes.push(o);
    });
    var t = a.barre ? 'Barré : l’index couche toutes les cordes de la ' + a.barre.a + 'e à la ' + (a.barre.de === 1 ? '1re' : a.barre.de + 'e') + ' case ' + a.barre.frette + '. ' : '';
    t += poses.length ? cap(poses.join(', ')) + '.' : '';
    if (vides.length) t += ' À vide : ' + vides.join(', ') + '.';
    if (muettes.length) t += ' Ne pas jouer : ' + muettes.join(', ') + '.';
    return t + ' Pouce derrière le manche, en face du majeur.';
  }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function mainsAccords(ids, droite) {
    return {
      gauche: ids.map(function (id) {
        var a = Accords.get(id);
        return { id: a.id, fr: a.fr, frettes: a.frettes, doigts: a.doigts, barre: a.barre, consigne: consigneAccord(a) };
      }),
      droite: droite
    };
  }

  /* Doigts manquants, calculés pour TOUS les morceaux (le répertoire importé
   * n'en note aucun) :
   *  - main gauche : la main couvre quatre cases, un doigt par case. Elle ne
   *    bouge que si une note sort de sa fenêtre, et revient en première
   *    position dès que possible. Dans un accord, deux notes à la même case
   *    prennent deux doigts voisins (on ne pose pas un doigt sur deux cordes).
   *  - main droite : le pouce prend la basse (corde 4 à 6, ou la note la plus
   *    grave d'un accord) ; au-dessus, i m a selon la corde ; une mélodie à
   *    une voix alterne i-m. */
  function completerDoigtes(notes) {
    var parTemps = {}, temps = [];
    notes.forEach(function (n) {
      if (!parTemps[n.temps]) { parTemps[n.temps] = []; temps.push(n.temps); }
      parTemps[n.temps].push(n);
    });
    temps.sort(function (a, b) { return a - b; });
    var pos = 1, alt = 0;
    temps.forEach(function (t) {
      var g = parTemps[t];
      // Main gauche
      var fr = g.filter(function (n) { return n.frette > 0; });
      if (fr.length) {
        var lo = Math.min.apply(null, fr.map(function (n) { return n.frette; }));
        var hi = Math.max.apply(null, fr.map(function (n) { return n.frette; }));
        if (hi <= 4) pos = 1;
        else if (lo < pos) pos = lo;
        else if (hi > pos + 3) pos = Math.max(lo, hi - 3);
        if (lo < pos) pos = lo;
        var dernier = 0;
        fr.slice().sort(function (a, b) { return a.frette - b.frette || b.corde - a.corde; }).forEach(function (n) {
          var base = Math.min(4, n.frette - pos + 1);
          var d = Math.max(base, dernier + 1);
          if (d > 4) d = base;                    // plus de doigt libre : petit barré
          if (!n.doigt) n.doigt = d;
          dernier = n.doigt;
        });
      }
      // Main droite
      var g2 = g.slice().sort(function (a, b) { return b.corde - a.corde; });   // grave → aigu
      var libres = g2.filter(function (n) { return !n.main; });
      if (!libres.length) return;
      if (g2.length === 1) {
        var n0 = g2[0];
        if (n0.corde >= 4) n0.main = 'p';
        else { n0.main = alt % 2 ? 'm' : 'i'; alt++; }
        return;
      }
      var hauts = g2;
      if (g2[0].corde >= 4 || g2.length > 3) {
        if (!g2[0].main) g2[0].main = 'p';
        hauts = g2.slice(1);
      }
      var doigts = hauts.length === 1 ? [{ 3: 'i', 2: 'm', 1: 'a' }[hauts[0].corde] || 'i']
                 : hauts.length === 2 ? (hauts[1].corde === 1 ? ['m', 'a'] : ['i', 'm'])
                 : ['i', 'm', 'a'];
      hauts.forEach(function (n, k) {
        if (!n.main) n.main = k < doigts.length ? doigts[k] : 'p';
      });
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
          n.push({ corde: corde, frette: f, temps: t, duree: 1, doigt: f, main: n.length % 2 ? 'm' : 'i', midi: Theorie.midiDeCase(corde, f) });
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

  ajoute({
    id: 'basses-pouce',
    titre: 'Les basses au pouce',
    sous_titre: 'Exercice · écrit pour cette app',
    niveau: 1, tempo: 60, signature: [4, 4],
    description: 'Les trois cordes graves à vide — Mi (6e, la plus grosse), La (5e), Ré (4e) — toutes au pouce. Le pouce pousse la corde vers le bas et vient se poser sur la suivante : c’est le geste des basses de tout le répertoire.',
    notes: melodie([
      ['mi2', 2], ['mi2', 2], ['la2', 2], ['la2', 2],
      ['re3', 2], ['re3', 2], ['la2', 2], ['la2', 2],
      ['mi2', 1], ['la2', 1], ['re3', 1], ['la2', 1],
      ['mi2', 1], ['la2', 1], ['re3', 2],
      ['re3', 1], ['la2', 1], ['mi2', 2],
      ['mi2', 4]
    ], { main: 'p' })
  });

  ajoute({
    id: 'premieres-notes',
    titre: 'Mes premières notes',
    sous_titre: 'Exercice · écrit pour cette app',
    niveau: 1, tempo: 60, signature: [4, 4],
    description: 'Les deux cordes aiguës, trois notes chacune : Si à vide, Do (index, case 1), Ré (annulaire, case 3) sur la 2e corde ; Mi à vide, Fa (index, case 1), Sol (annulaire, case 3) sur la 1re. Un doigt par case : la case dit le doigt.',
    notes: melodie([
      ['si3', 1], ['do4', 1], ['re4', 2],
      ['re4', 1], ['do4', 1], ['si3', 2],
      ['mi4', 1], ['fa4', 1], ['sol4', 2],
      ['sol4', 1], ['fa4', 1], ['mi4', 2],
      ['si3', 1], ['re4', 1], ['mi4', 1], ['sol4', 1],
      ['fa4', 1], ['re4', 1], ['do4', 2],
      ['re4', 1], ['mi4', 1], ['do4', 1], ['si3', 1],
      ['do4', 4]
    ], { alterne: true })
  });

  ajoute({
    id: 'old-macdonald',
    titre: 'Old MacDonald',
    sous_titre: 'Comptine américaine · traditionnel · domaine public',
    niveau: 1, tempo: 92, signature: [4, 4],
    description: 'Do, Ré, Mi sur les deux premières cordes, et pour la première fois la 3e corde : Sol à vide et La (case 2, majeur).',
    notes: melodie([
      ['do4', 1], ['do4', 1], ['do4', 1], ['sol3', 1],
      ['la3', 1], ['la3', 1], ['sol3', 2],
      ['mi4', 1], ['mi4', 1], ['re4', 1], ['re4', 1],
      ['do4', 3], ['sol3', 1],
      ['do4', 1], ['do4', 1], ['do4', 1], ['sol3', 1],
      ['la3', 1], ['la3', 1], ['sol3', 2],
      ['mi4', 1], ['mi4', 1], ['re4', 1], ['re4', 1],
      ['do4', 4]
    ], { alterne: true })
  });

  ajoute({
    id: 'london-bridge',
    titre: 'London Bridge',
    sous_titre: 'Comptine anglaise · traditionnel · domaine public',
    niveau: 1, tempo: 88, signature: [4, 4],
    description: 'En Sol, sur les trois cordes aiguës, case 3 au plus. Une seule croche pointée par phrase, au tout début : « Lon-don ».',
    notes: melodie([
      ['re4', 1.5], ['mi4', 0.5], ['re4', 1], ['do4', 1],
      ['si3', 1], ['do4', 1], ['re4', 2],
      ['la3', 1], ['si3', 1], ['do4', 2],
      ['si3', 1], ['do4', 1], ['re4', 2],
      ['re4', 1.5], ['mi4', 0.5], ['re4', 1], ['do4', 1],
      ['si3', 1], ['do4', 1], ['re4', 2],
      ['la3', 2], ['re4', 2],
      ['si3', 1], ['sol3', 3]
    ], { alterne: true })
  });

  ajoute({
    id: 'yankee-doodle',
    titre: 'Yankee Doodle',
    sous_titre: 'Air américain · traditionnel · domaine public',
    niveau: 2, tempo: 100, signature: [4, 4],
    description: 'Que des noires, mais sept notes différentes sur trois cordes : Sol, La, Si, Do, Ré, Mi, Fa. Un bon test de « la case dit le doigt ».',
    notes: melodie([
      ['do4', 1], ['do4', 1], ['re4', 1], ['mi4', 1],
      ['do4', 1], ['mi4', 1], ['re4', 1], ['sol3', 1],
      ['do4', 1], ['do4', 1], ['re4', 1], ['mi4', 1],
      ['do4', 2], ['si3', 2],
      ['do4', 1], ['do4', 1], ['re4', 1], ['mi4', 1],
      ['fa4', 1], ['mi4', 1], ['re4', 1], ['do4', 1],
      ['si3', 1], ['sol3', 1], ['la3', 1], ['si3', 1],
      ['do4', 2], ['do4', 2]
    ], { alterne: true })
  });

  ajoute({
    id: 'row-your-boat',
    titre: 'Row, Row, Row Your Boat',
    sous_titre: 'Canon anglais · traditionnel · domaine public',
    niveau: 2, tempo: 72, signature: [6, 8],
    description: 'À 6/8 : deux grands temps de trois croches par mesure. Monte de Sol (3e à vide) jusqu’au Sol aigu (1re, case 3), puis redescend en triolets.',
    notes: melodie([
      ['sol3', 1.5], ['sol3', 1.5],
      ['sol3', 1], ['la3', 0.5], ['si3', 1.5],
      ['si3', 1], ['la3', 0.5], ['si3', 1], ['do4', 0.5],
      ['re4', 3],
      ['sol4', 0.5], ['sol4', 0.5], ['sol4', 0.5], ['re4', 0.5], ['re4', 0.5], ['re4', 0.5],
      ['si3', 0.5], ['si3', 0.5], ['si3', 0.5], ['sol3', 0.5], ['sol3', 0.5], ['sol3', 0.5],
      ['re4', 1], ['do4', 0.5], ['si3', 1], ['la3', 0.5],
      ['sol3', 3]
    ], { alterne: true })
  });

  ajoute({
    id: 'michael-row',
    titre: 'Michael, Row the Boat Ashore',
    sous_titre: 'Negro spiritual · traditionnel · domaine public',
    niveau: 2, tempo: 84, signature: [4, 4],
    description: 'En Sol, case 3 au plus. Des notes longues en fin de phrase : laisse-les sonner jusqu’au bout avant d’attaquer la suivante.',
    notes: melodie([
      ['sol3', 1], ['si3', 1], ['re4', 1.5], ['si3', 0.5],
      ['re4', 1], ['mi4', 1], ['re4', 2],
      ['si3', 1], ['re4', 1], ['mi4', 2],
      ['re4', 4],
      ['si3', 1], ['re4', 1], ['re4', 1.5], ['si3', 0.5],
      ['do4', 1], ['si3', 1], ['la3', 2],
      ['sol3', 1], ['la3', 1], ['si3', 1.5], ['la3', 0.5],
      ['sol3', 4]
    ], { alterne: true })
  });

  // --- Mélodies du domaine public -------------------------------------------
  /* Grand débutant : les morceaux qui suivent tiennent sur les trois cordes
   * aiguës, en première position, avec des rythmes en noires et blanches. Ils
   * sont rangés du plus simple (cordes à vide seules) au plus long. */
  ajoute({
    id: 'trois-cordes',
    titre: 'Trois cordes à vide',
    sous_titre: 'Première mélodie · écrite pour cette app',
    niveau: 1, tempo: 60, signature: [4, 4],
    description: 'Aucun doigt à la main gauche : Mi (1re corde), Si (2e) et Sol (3e), à vide. On ne pense qu’à la main droite — index, majeur, index, majeur — et à laisser sonner chaque note jusqu’à la suivante.',
    notes: melodie([
      ['mi4', 1], ['mi4', 1], ['si3', 2],
      ['mi4', 1], ['mi4', 1], ['si3', 2],
      ['sol3', 1], ['si3', 1], ['mi4', 1], ['si3', 1],
      ['sol3', 4],
      ['si3', 1], ['si3', 1], ['mi4', 2],
      ['si3', 1], ['si3', 1], ['sol3', 2],
      ['sol3', 1], ['si3', 1], ['mi4', 1], ['si3', 1],
      ['mi4', 4]
    ], { alterne: true })
  });

  ajoute({
    id: 'hot-cross-buns',
    titre: 'Hot Cross Buns',
    sous_titre: 'Comptine anglaise · traditionnel · domaine public',
    niveau: 1, tempo: 72, signature: [4, 4],
    description: 'Trois notes : Mi (1re à vide), Ré (2e corde, case 3, annulaire), Do (2e corde, case 1, index). Le premier vrai doigt posé : appuie juste derrière la frette, le bout du doigt bien droit.',
    notes: melodie([
      ['mi4', 1], ['re4', 1], ['do4', 2],
      ['mi4', 1], ['re4', 1], ['do4', 2],
      ['do4', 0.5], ['do4', 0.5], ['do4', 0.5], ['do4', 0.5],
      ['re4', 0.5], ['re4', 0.5], ['re4', 0.5], ['re4', 0.5],
      ['mi4', 1], ['re4', 1], ['do4', 2]
    ], { alterne: true })
  });

  ajoute({
    id: 'mary-agneau',
    titre: 'Mary avait un petit agneau',
    sous_titre: 'Mary Had a Little Lamb · L. Mason · domaine public',
    niveau: 1, tempo: 80, signature: [4, 4],
    description: 'Les trois notes de Hot Cross Buns, plus le Sol (1re corde, case 3, annulaire). L’index reste posé sur le Do pendant qu’on joue le Ré : un doigt de moins à replacer.',
    notes: melodie([
      ['mi4', 1], ['re4', 1], ['do4', 1], ['re4', 1],
      ['mi4', 1], ['mi4', 1], ['mi4', 2],
      ['re4', 1], ['re4', 1], ['re4', 2],
      ['mi4', 1], ['sol4', 1], ['sol4', 2],
      ['mi4', 1], ['re4', 1], ['do4', 1], ['re4', 1],
      ['mi4', 1], ['mi4', 1], ['mi4', 1], ['mi4', 1],
      ['re4', 1], ['re4', 1], ['mi4', 1], ['re4', 1],
      ['do4', 4]
    ], { alterne: true })
  });

  ajoute({
    id: 'saints',
    titre: 'When the Saints Go Marching In',
    sous_titre: 'Negro spiritual · traditionnel · domaine public',
    niveau: 1, tempo: 100, signature: [4, 4],
    description: 'Cinq notes, Do Mi Fa Sol et Ré. Chaque phrase commence sur le 2e temps, après un silence : compte « un » dans ta tête, puis joue. Fa = 1re corde, case 1 (index).',
    notes: melodie([
      ['-', 1], ['do4', 1], ['mi4', 1], ['fa4', 1], ['sol4', 4],
      ['-', 1], ['do4', 1], ['mi4', 1], ['fa4', 1], ['sol4', 4],
      ['-', 1], ['do4', 1], ['mi4', 1], ['fa4', 1], ['sol4', 2], ['mi4', 2],
      ['do4', 2], ['mi4', 2], ['re4', 4],
      ['-', 1], ['mi4', 1], ['mi4', 1], ['re4', 1], ['do4', 3], ['do4', 1],
      ['mi4', 2], ['sol4', 2], ['sol4', 1], ['fa4', 3],
      ['-', 1], ['mi4', 1], ['fa4', 1], ['sol4', 1], ['mi4', 2], ['do4', 2],
      ['re4', 4], ['do4', 4]
    ], { alterne: true })
  });

  ajoute({
    id: 'joyeux-anniversaire',
    titre: 'Joyeux anniversaire',
    sous_titre: 'Happy Birthday · Hill · domaine public',
    niveau: 2, tempo: 90, signature: [3, 4],
    description: 'À trois temps. Descend jusqu’au Sol de la 3e corde à vide et au La (3e corde, case 2, majeur), monte jusqu’au Sol de la 1re. La levée « Joy-eux » est courte-longue : la première note à peine touchée.',
    notes: melodie([
      ['-', 2], ['sol3', 0.75], ['sol3', 0.25],
      ['la3', 1], ['sol3', 1], ['do4', 1], ['si3', 2], ['sol3', 0.75], ['sol3', 0.25],
      ['la3', 1], ['sol3', 1], ['re4', 1], ['do4', 2], ['sol3', 0.75], ['sol3', 0.25],
      ['sol4', 1], ['mi4', 1], ['do4', 1], ['si3', 1], ['la3', 1], ['fa4', 0.75], ['fa4', 0.25],
      ['mi4', 1], ['do4', 1], ['re4', 1], ['do4', 3]
    ], { alterne: true })
  });

  ajoute({
    id: 'jingle-bells',
    titre: 'Jingle Bells (refrain)',
    sous_titre: 'J. L. Pierpont, 1857 · domaine public',
    niveau: 2, tempo: 100, signature: [4, 4],
    description: 'Les répétitions de Mi à vide laissent le temps de préparer la main gauche. Une seule difficulté : la croche pointée « Do… ré » de la 3e mesure.',
    notes: melodie([
      ['mi4', 1], ['mi4', 1], ['mi4', 2],
      ['mi4', 1], ['mi4', 1], ['mi4', 2],
      ['mi4', 1], ['sol4', 1], ['do4', 1.5], ['re4', 0.5],
      ['mi4', 4],
      ['fa4', 1], ['fa4', 1], ['fa4', 1.5], ['fa4', 0.5],
      ['fa4', 1], ['mi4', 1], ['mi4', 1], ['mi4', 0.5], ['mi4', 0.5],
      ['mi4', 1], ['re4', 1], ['re4', 1], ['mi4', 1],
      ['re4', 2], ['sol4', 2]
    ], { alterne: true })
  });

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
    mains: mainsAccords(['Em', 'Am', 'B7'], [
      'Pouce (p) sur la basse de l’accord, puis index (i) 3e corde, majeur (m) 2e, annulaire (a) 1re : p-i-m-a, une note par croche.',
      'Chaque doigt reste au-dessus de SA corde ; poignet immobile au-dessus de la rosace.'
    ]),
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
    mains: mainsAccords(['Am', 'Dm', 'E7'], [
      'Pouce (p) sur la basse de l’accord, puis index (i) 3e corde, majeur (m) 2e, annulaire (a) 1re : p-i-m-a, une note par croche.',
      'Chaque doigt reste au-dessus de SA corde ; poignet immobile au-dessus de la rosace.'
    ]),
    notes: arpeges([
      { accord: 'Am', basse: 5, mesures: 2 },
      { accord: 'Dm', basse: 4, mesures: 2 },
      { accord: 'E7', basse: 6, mesures: 2 },
      { accord: 'Am', basse: 5, mesures: 2 }
    ])
  });

  // --- Accompagnements (grilles d'accords) ----------------------------------
  /* Une grille d'accords n'est pas protégée : seules la mélodie et les paroles
   * d'une chanson le sont, et elles ne figurent pas ici. Ce qu'on joue est un
   * accompagnement écrit pour l'app sur la grille de la chanson.
   *
   * Chaque accord porte SON doigté pour ce morceau (il peut différer de la
   * bibliothèque : on choisit les doigts qui bougent le moins d'un accord au
   * suivant). Chaque note reçoit donc le doigt de main gauche (`doigt`, affiché
   * sur le manche) et celui de main droite (`main`, sous la tablature). */
  function accompagnement(accords, sections) {
    var t = 0, notes = [];
    function note(a, corde, temps, duree, main) {
      var frette = a.frettes[corde - 1];
      if (frette < 0) throw new Error(a.id + ' : corde ' + corde + ' étouffée');
      notes.push({ corde: corde, frette: frette, temps: temps, duree: duree, main: main,
                   doigt: a.doigts[corde - 1] || undefined, accord: a.id,
                   midi: Theorie.midiDeCase(corde, frette) });
    }
    sections.forEach(function (s) {
      for (var tour = 0; tour < (s.tours || 1); tour++) {
        s.grille.forEach(function (id) {
          var a = accords[id];
          s.motif.forEach(function (pas) {
            pas.cordes.forEach(function (c) {
              // « basse » = la basse de l'accord, « alt » = sa basse alternée.
              var corde = c === 'basse' ? a.basse : (c === 'alt' ? a.alt : c);
              var main = c === 'basse' || c === 'alt' ? 'p' : ({ 3: 'i', 2: 'm', 1: 'a' })[corde];
              note(a, corde, t + pas.temps, pas.duree, main);
            });
          });
          t += 4;
        });
      }
    });
    return notes;
  }

  /* Zombie : Mi mineur → Do maj7 → Sol → Ré, une mesure chacun, en boucle.
   * Doigté choisi pour enchaîner sans lever toute la main :
   *   Em    index case 2 corde 5, majeur case 2 corde 4
   *   Cmaj7 le majeur RESTE (pivot), l'annulaire se pose case 3 corde 5
   *   G     annulaire et majeur glissent d'une corde vers le grave,
   *         l'auriculaire se pose case 3 corde 1
   *   D     seul vrai changement : index, majeur, annulaire en triangle */
  var ZOMBIE = {
    Em:    { id: 'Em',    fr: 'Mi mineur',   frettes: [0, 0, 0, 2, 2, 0],   doigts: [0, 0, 0, 2, 1, 0], basse: 6, alt: 4,
             consigne: 'Index case 2 sur la 5e corde, majeur case 2 sur la 4e, juste à côté. Pouce derrière le manche, en face du majeur. Le pouce droit joue la 6e corde à vide.' },
    Cmaj7: { id: 'Cmaj7', fr: 'Do majeur 7', frettes: [0, 0, 0, 2, 3, -1],  doigts: [0, 0, 0, 2, 3, 0], basse: 5, alt: 4,
             consigne: 'Le majeur ne bouge pas (case 2, 4e corde) : c’est le pivot. L’index se lève, l’annulaire se pose case 3 sur la 5e corde. 6e corde : on ne la joue pas.' },
    G:     { id: 'G',     fr: 'Sol majeur',  frettes: [3, 0, 0, 0, 2, 3],   doigts: [4, 0, 0, 0, 2, 3], basse: 6, alt: 4,
             consigne: 'Annulaire et majeur glissent ensemble d’une corde vers le grave, sans changer de case : annulaire case 3 sur la 6e, majeur case 2 sur la 5e. L’auriculaire se pose case 3 sur la 1re.' },
    D:     { id: 'D',     fr: 'Ré majeur',   frettes: [2, 3, 2, 0, -1, -1], doigts: [2, 3, 1, 0, 0, 0], basse: 4, alt: 4,
             consigne: 'Le seul vrai changement : index case 2 sur la 3e, annulaire case 3 sur la 2e, majeur case 2 sur la 1re — un petit triangle. Basse sur la 4e à vide ; 5e et 6e ne se jouent pas.' }
  };

  ajoute({
    id: 'zombie',
    titre: 'Zombie',
    sous_titre: 'The Cranberries · grille d’accords, accompagnement écrit pour cette app',
    niveau: 3, tempo: 76, signature: [4, 4],
    description: 'Quatre accords qui tournent du début à la fin : Mi mineur, Do maj7, Sol, Ré (♩ ≈ 84 sur le disque). Couplet en arpège pouce-index-majeur-annulaire, refrain en basse + accord plaqué, comme on l’accompagne à la guitare classique. Ni mélodie ni paroles : elles sont sous droits.',
    sections: [
      { titre: 'Couplet : l’arpège', de: 1, a: 4,
        texte: 'Un tour de grille en arpège p-i-m-a-m-i-m-i (mesures 1 à 4 ; les mesures 5 à 8 sont identiques). Le pouce joue la basse de chaque accord, i m a restent chacun sur leur corde.' },
      { titre: 'Refrain : basse et accord plaqué', de: 9, a: 12,
        texte: 'Pouce sur la basse au 1er temps, i-m-a pincés ensemble au 2e, pouce sur la 4e corde au 3e, i-m-a au 4e (mesures 9 à 12 ; 13 à 16 identiques).' }
    ],
    mains: {
      gauche: [ZOMBIE.Em, ZOMBIE.Cmaj7, ZOMBIE.G, ZOMBIE.D],
      droite: [
        'Couplet (8 mesures) : en croches, p-i-m-a-m-i-m-i. Le pouce (p) prend la basse de l’accord ; index (i) 3e corde, majeur (m) 2e, annulaire (a) 1re. Chaque doigt reste sur SA corde.',
        'Refrain (8 mesures) : pouce sur la basse au 1er temps, i-m-a pincés ensemble au 2e, pouce sur la 4e corde au 3e, i-m-a au 4e.',
        'Poignet droit au-dessus de la rosace, immobile : ce sont les doigts qui bougent, pas la main.'
      ]
    },
    notes: accompagnement(ZOMBIE, [
      { tours: 2, grille: ['Em', 'Cmaj7', 'G', 'D'], motif: [
        { temps: 0,   duree: 0.5, cordes: ['basse'] }, { temps: 0.5, duree: 0.5, cordes: [3] },
        { temps: 1,   duree: 0.5, cordes: [2] },       { temps: 1.5, duree: 0.5, cordes: [1] },
        { temps: 2,   duree: 0.5, cordes: [2] },       { temps: 2.5, duree: 0.5, cordes: [3] },
        { temps: 3,   duree: 0.5, cordes: [2] },       { temps: 3.5, duree: 0.5, cordes: [3] }
      ] },
      { tours: 2, grille: ['Em', 'Cmaj7', 'G', 'D'], motif: [
        { temps: 0, duree: 1, cordes: ['basse'] }, { temps: 1, duree: 1, cordes: [3, 2, 1] },
        { temps: 2, duree: 1, cordes: ['alt'] },   { temps: 3, duree: 1, cordes: [3, 2, 1] }
      ] }
    ])
  });

  // --- Répertoire du Mutopia Project ----------------------------------------
  /* Vraies pièces du répertoire (Sor, Giuliani, Carulli, Carcassi, Mertz…),
   * importées par tools/mutopia_import.py depuis les partitions libres du
   * Mutopia Project. Le placement sur le manche est calculé par l'outil ; les
   * hauteurs viennent de la partition et sont revérifiées par test. */
  (global.REPERTOIRE_MUTOPIA || []).forEach(function (r) {
    var notes = [];
    for (var i = 0; i < r.notes.length; i += 5) {
      notes.push({ temps: r.notes[i], corde: r.notes[i + 1], frette: r.notes[i + 2], duree: r.notes[i + 3], midi: r.notes[i + 4] });
    }
    ajoute({
      id: r.id, titre: r.titre,
      sous_titre: r.compositeur + (r.oeuvre ? ' · ' + r.oeuvre : ''),
      niveau: r.niveau, tempo: r.tempo, tempoOriginal: r.tempoOriginal,
      signature: r.signature, description: r.description,
      source: r.source, notes: notes
    });
  });

  /* Apprendre un morceau, étape par étape.
   *
   * La méthode est celle de tout professeur : accorder, connaître les
   * positions SANS le rythme, puis de petits morceaux lents en boucle, puis
   * les recoller, puis accélérer, puis jouer seul. Chaque étape porte une
   * action que le lecteur sait exécuter (mesures à boucler, tempo en %,
   * guitare muette…) : l'élève appuie, l'app règle tout.
   *
   * Découpage : les `sections` du morceau s'il en a (Zombie), sinon des
   * phrases de 4 mesures. */
  function etapes(p, nbMesures) {
    var e = [];
    e.push({ titre: 'Accorde ta guitare',
             texte: 'Une guitare fausse rend tout plus dur à entendre. Accorde les six cordes, une par une, jusqu’à ce que l’aiguille soit au centre.',
             bouton: '🎚 Ouvrir l’accordeur', action: { type: 'accordeur' } });
    e.push({ titre: 'Écoute le morceau en entier',
             texte: 'Une fois, sans jouer, en suivant la partition des yeux. Tu sauras où tu vas.',
             bouton: '▶ Écouter', action: { type: 'section', de: 1, a: nbMesures, pct: 100 } });
    if (p.mains) {
      e.push({ titre: 'Apprends les ' + p.mains.gauche.length + ' accords',
               texte: 'Un accord à la fois : pose les doigts comme sur le dessin, joue chaque corde une par une, corrige celle qui frise. Quand chacun sonne propre, passe à la suite.',
               bouton: '✋ Voir les accords', action: { type: 'accords' } });
      e.push({ titre: 'Passe d’un accord au suivant',
               texte: 'Sans main droite : ' + p.mains.gauche.map(function (a) { return a.id; }).join(' → ') + ' → ' + p.mains.gauche[0].id +
                      ', lentement, en suivant les consignes de passage (le doigt qui reste, ceux qui glissent). Dix tours sans regarder la main, c’est gagné.',
               bouton: '✋ Voir les passages', action: { type: 'accords' } });
    } else {
      e.push({ titre: 'Place chaque note, sans rythme',
               texte: 'Avec « Suivante », pose le doigt de la main gauche sur la case indiquée, pince avec le doigt de main droite indiqué, et dis le nom de la note. Aucune vitesse : seulement la bonne place.',
               bouton: '👣 Note par note', action: { type: 'guide' } });
    }
    var parties = p.sections || [];
    if (!parties.length) {
      var taille = nbMesures <= 4 ? nbMesures : 4;
      for (var de = 1; de <= nbMesures; de += taille) {
        parties.push({ titre: 'Mesures ' + de + ' à ' + Math.min(nbMesures, de + taille - 1), de: de, a: Math.min(nbMesures, de + taille - 1) });
      }
    }
    parties.forEach(function (s) {
      e.push({ titre: s.titre,
               texte: (s.texte ? s.texte + ' ' : '') + 'Écoute une fois, puis joue avec l’app, lentement (60 %) et en boucle. Passe à la suite quand tu le joues trois fois de suite sans arrêt.',
               bouton: '🔁 Mesures ' + s.de + ' à ' + s.a + ' · 60 %', action: { type: 'section', de: s.de, a: s.a, pct: 60, boucle: true } });
    });
    e.push({ titre: 'Tout le morceau, lentement',
             texte: 'On recolle les morceaux, toujours à 60 %. Si un passage accroche, reviens à son étape quelques minutes.',
             bouton: '🔁 Tout · 60 %', action: { type: 'section', de: 1, a: nbMesures, pct: 60, boucle: true } });
    e.push({ titre: 'Monte en vitesse',
             texte: 'L’entraîneur part de 60 % et ajoute 5 % à chaque tour. S’il va trop vite, arrête-toi au dernier tempo réussi et reprends demain.',
             bouton: '📈 Entraîneur de vitesse', action: { type: 'section', de: 1, a: nbMesures, entraineur: true, boucle: true } });
    e.push({ titre: 'Joue seul, au vrai tempo',
             texte: 'Guitare muette : l’app ne joue plus, elle bat la mesure et surligne la partition. C’est toi qui joues le morceau.',
             bouton: '🎸 Jouer seul', action: { type: 'section', de: 1, a: nbMesures, pct: 100, muet: true, clic: true } });
    return e;
  }

  PIECES.forEach(function (p) { completerDoigtes(p.notes); });

  function tous() { return PIECES.slice(); }
  function get(id) { for (var i = 0; i < PIECES.length; i++) if (PIECES[i].id === id) return PIECES[i]; return null; }

  global.Morceaux = {
    tous: tous, get: get, melodie: melodie, arpeges: arpeges, etapes: etapes, completerDoigtes: completerDoigtes,
    caseEnPremierePosition: caseEnPremierePosition, midiDeNom: midiDeNom
  };
})(typeof window !== 'undefined' ? window : globalThis);
