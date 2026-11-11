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
  // index-majeur sur les cordes aiguës, comme on l'apprend dès la première
  // mélodie ; les notes des cordes 4 à 6 vont au pouce.
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
      else if (opts.alterne) n.main = pos.corde >= 4 ? 'p' : ((k++ % 2) ? 'm' : 'i');   // basses au pouce
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
        var dernier = 0, tries = fr.slice().sort(function (a, b) { return a.frette - b.frette || b.corde - a.corde; });
        var libres = tries.filter(function (n) { return !n.doigt; });
        var deborde = false;
        tries.forEach(function (n) {
          var base = Math.min(4, n.frette - pos + 1);
          if (Math.max(base, dernier + 1) > 4) deborde = true;
          dernier = n.doigt || Math.max(base, dernier + 1);
        });
        dernier = 0;
        if (deborde && libres.length === tries.length && tries.length <= 4) {
          // Plus de doigt libre en suivant les cases : quatre notes (ou
          // moins), un doigt chacune, dans l'ordre des cases — sinon le même
          // doigt se retrouvait sur deux cases différentes.
          var decal = Math.max(0, Math.min(Math.min(4, tries[0].frette - pos + 1) - 1, 4 - tries.length));
          tries.forEach(function (n, k) { n.doigt = k + 1 + decal; });
        } else tries.forEach(function (n) {
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

  ajoute({
    id: 'lettre-elise',
    titre: 'Lettre à Élise (thème)',
    sous_titre: 'Beethoven · domaine public · mélodie seule, une octave plus bas',
    niveau: 3, tempo: 60, signature: [3, 8],
    description: 'Le thème le plus célèbre du piano, ramené en première position (une octave plus bas, sans l’accompagnement). À 3/8 : un temps par mesure, en doubles croches. Le Ré♯ se prend à l’auriculaire (2e corde, case 4) ; les arpèges La-Do-Mi et Mi-Sol♯-Si descendent sur les cordes graves.',
    notes: melodie([
      ['-', 1], ['mi4', 0.25], ['re#4', 0.25],
      ['mi4', 0.25], ['re#4', 0.25], ['mi4', 0.25], ['si3', 0.25], ['re4', 0.25], ['do4', 0.25],
      ['la3', 0.5], ['-', 0.25], ['do3', 0.25], ['mi3', 0.25], ['la3', 0.25],
      ['si3', 0.5], ['-', 0.25], ['mi3', 0.25], ['sol#3', 0.25], ['si3', 0.25],
      ['do4', 0.5], ['-', 0.25], ['mi3', 0.25], ['mi4', 0.25], ['re#4', 0.25],
      ['mi4', 0.25], ['re#4', 0.25], ['mi4', 0.25], ['si3', 0.25], ['re4', 0.25], ['do4', 0.25],
      ['la3', 0.5], ['-', 0.25], ['do3', 0.25], ['mi3', 0.25], ['la3', 0.25],
      ['si3', 0.5], ['-', 0.25], ['mi3', 0.25], ['do4', 0.25], ['si3', 0.25],
      ['la3', 1.5]
    ], { alterne: true })
  });

  ajoute({
    id: 'petite-musique-nuit',
    titre: 'Petite musique de nuit (thème)',
    sous_titre: 'Mozart · Eine kleine Nachtmusik · domaine public',
    niveau: 2, tempo: 84, signature: [4, 4],
    description: 'L’ouverture la plus connue de Mozart, une octave plus bas, en première position. Sol-Ré-Sol-Ré, puis l’arpège qui monte. Les silences comptent autant que les notes : coupe net.',
    notes: melodie([
      ['sol3', 1], ['-', 0.5], ['re3', 0.5], ['sol3', 1], ['-', 0.5], ['re3', 0.5],
      ['sol3', 0.5], ['re3', 0.5], ['sol3', 0.5], ['si3', 0.5], ['re4', 2],
      ['do4', 1], ['-', 0.5], ['la3', 0.5], ['do4', 1], ['-', 0.5], ['la3', 0.5],
      ['do4', 0.5], ['la3', 0.5], ['fa#3', 0.5], ['la3', 0.5], ['re3', 2],
      ['sol3', 1], ['-', 0.5], ['re3', 0.5], ['sol3', 1], ['-', 0.5], ['re3', 0.5],
      ['sol3', 0.5], ['re3', 0.5], ['sol3', 0.5], ['si3', 0.5], ['re4', 2],
      ['do4', 1], ['-', 0.5], ['la3', 0.5], ['do4', 1], ['-', 0.5], ['la3', 0.5],
      ['do4', 0.5], ['la3', 0.5], ['fa#3', 0.5], ['la3', 0.5], ['sol3', 2]
    ], { alterne: true })
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
  function accompagnement(accords, sections, parMesure) {
    // parMesure : noires par mesure (4 en 4/4, 3 en 3/4). « F|G » coupe la
    // mesure en deux : 2 + 2 temps, ou 2 + 1 à trois temps.
    parMesure = parMesure || 4;
    var milieu = Math.ceil(parMesure / 2);
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
          // 'F|G' : deux accords dans la mesure, 2 temps chacun ; le second
          // reprend la basse au 3e temps.
          var deux = String(id).split('|');
          var a1 = accords[deux[0]], a2 = accords[deux[1] || deux[0]];
          if (!a1 || !a2) throw new Error('accord inconnu : ' + id);
          s.motif.forEach(function (pas) {
            var a = pas.temps < milieu ? a1 : a2;
            // Deux accords dans la mesure : le second reprend la basse au
            // 3e temps — sauf un balayé, qui balaie aussi le second accord.
            var cordes = deux.length > 1 && pas.temps === milieu && pas.cordes.indexOf('tout') === -1 ? ['basse'] : pas.cordes;
            cordes.forEach(function (c) {
              // « tout » = toutes les cordes jouées de l'accord, balayées au
              // pouce de la grave vers l'aiguë.
              if (c === 'tout') {
                for (var k = 6; k >= 1; k--) if (a.frettes[k - 1] >= 0) note(a, k, t + pas.temps, pas.duree, 'p');
                return;
              }
              // « basse » = la basse de l'accord, « alt » = sa basse alternée.
              var corde = c === 'basse' ? a.basse : (c === 'alt' ? a.alt : c);
              var main = c === 'basse' || c === 'alt' ? 'p' : ({ 3: 'i', 2: 'm', 1: 'a' })[corde];
              note(a, corde, t + pas.temps, pas.duree, main);
            });
          });
          t += parMesure;
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
    titre: 'Zombie', artiste: 'The Cranberries',
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

  // --- Travailler les accords -----------------------------------------------
  /* Des tablatures faites pour une chose : poser les accords et passer de
   * l'un à l'autre en musique. Chaque exercice monte par paliers, sur la même
   * grille :
   *   1. balayé — le pouce balaie l'accord, deux fois par mesure : toute
   *      l'attention va à la main gauche ;
   *   2. basse et accord plaqué — pouce sur la basse, i-m-a ensemble ;
   *   3. arpège — p-i-m-a-m-i-m-i, l'accord égrené.
   * Les doigtés sont ceux de la bibliothèque d'accords (même diagramme, même
   * dessin de main), et chaque palier devient une étape du « pas à pas ». */
  var MOTIFS = {
    'balaye': { nom: 'balayé au pouce', motif: [
      { temps: 0, duree: 2, cordes: ['tout'] }, { temps: 2, duree: 2, cordes: ['tout'] }] },
    'balaye-noires': { nom: 'balayé, quatre temps', motif: [
      { temps: 0, duree: 1, cordes: ['tout'] }, { temps: 1, duree: 1, cordes: ['tout'] },
      { temps: 2, duree: 1, cordes: ['tout'] }, { temps: 3, duree: 1, cordes: ['tout'] }] },
    'basse-plaque': { nom: 'basse et accord plaqué', motif: [
      { temps: 0, duree: 1, cordes: ['basse'] }, { temps: 1, duree: 1, cordes: [3, 2, 1] },
      { temps: 2, duree: 1, cordes: ['alt'] },   { temps: 3, duree: 1, cordes: [3, 2, 1] }] },
    'arpege': { nom: 'arpège p-i-m-a-m-i-m-i', motif: [
      { temps: 0,   duree: 0.5, cordes: ['basse'] }, { temps: 0.5, duree: 0.5, cordes: [3] },
      { temps: 1,   duree: 0.5, cordes: [2] },       { temps: 1.5, duree: 0.5, cordes: [1] },
      { temps: 2,   duree: 0.5, cordes: [2] },       { temps: 2.5, duree: 0.5, cordes: [3] },
      { temps: 3,   duree: 0.5, cordes: [2] },       { temps: 3.5, duree: 0.5, cordes: [3] }] }
  };
  // Pouce seul (section « 👍 Pouce seul ») : la main droite n'a que le pouce.
  MOTIFS['basses-alternees'] = { nom: 'basses alternées au pouce', motif: [
    { temps: 0, duree: 1, cordes: ['basse'] }, { temps: 1, duree: 1, cordes: ['alt'] },
    { temps: 2, duree: 1, cordes: ['basse'] }, { temps: 3, duree: 1, cordes: ['alt'] }] };
  MOTIFS['basse-balaye'] = { nom: 'basse puis balayé (pom-tcha)', motif: [
    { temps: 0, duree: 1, cordes: ['basse'] }, { temps: 1, duree: 1, cordes: ['tout'] },
    { temps: 2, duree: 1, cordes: ['alt'] },   { temps: 3, duree: 1, cordes: ['tout'] }] };
  var CONSIGNES_MOTIFS = {
    'basses-alternees': 'Le pouce seul, une note par temps : la basse de l’accord, puis la basse alternée (une corde plus aiguë), et ainsi de suite. Les autres doigts de la main droite se reposent sur la 1re corde.',
    'basse-balaye': 'Pom-tcha : le pouce joue la basse au 1er temps, balaie l’accord au 2e, joue la basse alternée au 3e, balaie au 4e. Le balayé est léger, la basse bien appuyée.',
    'balaye': 'Le pouce balaie toutes les cordes de l’accord, de la plus grosse à la plus fine, deux fois par mesure. Toute l’attention va à la main gauche : change d’accord pendant le 4e temps, pas après.',
    'balaye-noires': 'Un coup de pouce par temps. Les accords changent plus souvent : prépare le suivant dès le 3e temps.',
    'basse-plaque': 'Pouce sur la basse au 1er temps, index-majeur-annulaire pincés ensemble au 2e (cordes 3, 2, 1), pouce sur la 4e corde au 3e, i-m-a au 4e.',
    'arpege': 'Pouce sur la basse, puis i (3e corde), m (2e), a (1re), m, i, m, i — une note par croche. Chaque doigt reste au-dessus de SA corde.'
  };

  function defAccord(id) {
    var a = Accords.get(id);
    var basse = 6;
    while (basse > 1 && a.frettes[basse - 1] < 0) basse--;
    return { id: a.id, fr: a.fr, frettes: a.frettes, doigts: a.doigts, barre: a.barre,
             basse: basse, alt: basse >= 5 ? 4 : basse, consigne: consigneAccord(a) };
  }

  function exerciceAccords(def) {
    var ids = [];
    // 'F|G' : deux accords dans la mesure (voir accompagnement()).
    def.paliers.forEach(function (pl) { pl.grille.forEach(function (g) {
      String(g).split('|').forEach(function (id) { if (ids.indexOf(id) === -1) ids.push(id); });
    }); });
    var accords = {};
    ids.forEach(function (id) { accords[id] = (def.accords && def.accords[id]) || defAccord(id); });
    var mesure = 1, sections = [];
    def.paliers.forEach(function (pl) {
      sections.push({ titre: 'Palier ' + (sections.length + 1) + ' : ' + MOTIFS[pl.motif].nom,
                      de: mesure, a: mesure + pl.grille.length - 1,
                      texte: CONSIGNES_MOTIFS[pl.motif] + (pl.tours > 1 ? ' La grille revient ' + pl.tours + ' fois de suite.' : '') });
      mesure += pl.grille.length * (pl.tours || 1);
    });
    var motifsUtiles = [];
    def.paliers.forEach(function (pl) { if (motifsUtiles.indexOf(pl.motif) === -1) motifsUtiles.push(pl.motif); });
    return ajoute({
      id: def.id, titre: def.titre, sous_titre: def.sous_titre || 'Accords · ' + ids.join(' – '),
      niveau: def.niveau, tempo: def.tempo, signature: [4, 4], categorie: def.categorie || 'accords',
      description: def.description,
      sections: sections,
      mains: { gauche: ids.map(function (id) { return accords[id]; }),
               droite: motifsUtiles.map(function (m) { return cap(MOTIFS[m].nom) + ' : ' + CONSIGNES_MOTIFS[m]; }) },
      notes: accompagnement(accords, def.paliers.map(function (pl) {
        return { tours: pl.tours || 1, grille: pl.grille, motif: MOTIFS[pl.motif].motif };
      }))
    });
  }

  exerciceAccords({
    id: 'acc-em-am', titre: 'Mi mineur ↔ La mineur', niveau: 1, tempo: 60,
    description: 'Le premier changement d’accord. Em (deux doigts) et Am (trois doigts) : le majeur et l’annulaire glissent ensemble d’une corde vers le bas, l’index se pose sur la 2e corde.',
    paliers: [
      { motif: 'balaye', grille: ['Em', 'Em', 'Am', 'Am'], tours: 2 },
      { motif: 'balaye', grille: ['Em', 'Am', 'Em', 'Am'], tours: 2 },
      { motif: 'basse-plaque', grille: ['Em', 'Am', 'Em', 'Am'] }
    ]
  });

  exerciceAccords({
    id: 'acc-am-e', titre: 'La mineur ↔ Mi majeur', niveau: 1, tempo: 60,
    description: 'Le même dessin de doigts, décalé d’une corde : Am sur les cordes 4-3-2, E sur les cordes 5-4-3. Ne recompose pas l’accord : déplace la forme entière d’un bloc.',
    paliers: [
      { motif: 'balaye', grille: ['Am', 'Am', 'E', 'E'], tours: 2 },
      { motif: 'balaye', grille: ['Am', 'E', 'Am', 'E'], tours: 2 },
      { motif: 'arpege', grille: ['Am', 'E', 'Am', 'E'] }
    ]
  });

  exerciceAccords({
    id: 'acc-d-a', titre: 'Ré ↔ La', niveau: 2, tempo: 60,
    description: 'Deux accords en triangle. Ré se joue sur 4 cordes seulement (basse : 4e à vide), La sur 5 (basse : 5e à vide) : le pouce doit changer de corde en même temps que la main gauche change d’accord.',
    paliers: [
      { motif: 'balaye', grille: ['D', 'D', 'A', 'A'], tours: 2 },
      { motif: 'balaye', grille: ['D', 'A', 'D', 'A'], tours: 2 },
      { motif: 'basse-plaque', grille: ['D', 'A', 'D', 'A'] }
    ]
  });

  exerciceAccords({
    id: 'acc-g-c-d', titre: 'Sol, Do, Ré', niveau: 2, tempo: 66,
    description: 'Les trois accords de la tonalité de Sol (I, IV, V) : on les retrouve dans des centaines de chansons. Passage le plus dur : Do → Ré, toute la main change.',
    paliers: [
      { motif: 'balaye', grille: ['G', 'C', 'G', 'D'], tours: 2 },
      { motif: 'basse-plaque', grille: ['G', 'C', 'G', 'D'], tours: 2 },
      { motif: 'arpege', grille: ['G', 'C', 'D', 'G'] }
    ]
  });

  exerciceAccords({
    id: 'acc-am-dm-e7', titre: 'La mineur, Ré mineur, Mi 7', niveau: 2, tempo: 66,
    description: 'La grille mineure par excellence (I, IV, V7 en La mineur). E7, c’est Mi majeur sans l’annulaire : un doigt de moins.',
    paliers: [
      { motif: 'balaye', grille: ['Am', 'Dm', 'E7', 'Am'], tours: 2 },
      { motif: 'basse-plaque', grille: ['Am', 'Dm', 'E7', 'Am'], tours: 2 },
      { motif: 'arpege', grille: ['Am', 'Dm', 'E7', 'Am'], tours: 2 }
    ]
  });

  exerciceAccords({
    id: 'acc-c-am-f-g', titre: 'Do, La mineur, Fa, Sol', niveau: 2, tempo: 66,
    description: 'La grille des ballades des années 50 (I, VI, IV, V). Le Fa est la version sans barré (Fa maj7) : quatre cordes, trois doigts en escalier.',
    paliers: [
      { motif: 'balaye', grille: ['C', 'Am', 'Fmaj7', 'G'], tours: 2 },
      { motif: 'basse-plaque', grille: ['C', 'Am', 'Fmaj7', 'G'] },
      { motif: 'arpege', grille: ['C', 'Am', 'Fmaj7', 'G'], tours: 2 }
    ]
  });

  exerciceAccords({
    id: 'acc-g-em-c-d', titre: 'Sol, Mi mineur, Do, Ré', niveau: 2, tempo: 66,
    description: 'La même grille en Sol. G → Em : le majeur et l’annulaire restent, l’index et l’auriculaire se lèvent — c’est le passage le plus économique de la guitare.',
    paliers: [
      { motif: 'balaye', grille: ['G', 'Em', 'C', 'D'], tours: 2 },
      { motif: 'basse-plaque', grille: ['G', 'Em', 'C', 'D'] },
      { motif: 'arpege', grille: ['G', 'Em', 'C', 'D'], tours: 2 }
    ]
  });

  exerciceAccords({
    id: 'acc-blues-la', titre: 'Blues en La', sous_titre: 'Accords · grille de blues en 12 mesures', niveau: 3, tempo: 72,
    description: 'La grille de blues : 12 mesures, trois accords de septième (A7, D7, E7). Compte les mesures à voix haute, c’est la forme qu’on apprend ici autant que les accords.',
    paliers: [
      { motif: 'balaye-noires', grille: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'] },
      { motif: 'basse-plaque', grille: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'A7'] }
    ]
  });

  exerciceAccords({
    id: 'acc-septiemes', titre: 'Les septièmes qui résolvent', niveau: 3, tempo: 66,
    description: 'Un accord de septième « appelle » l’accord suivant : G7 → C, D7 → G, E7 → Am, B7 → Em. Écoute la tension, puis la détente.',
    paliers: [
      { motif: 'balaye', grille: ['G7', 'C', 'D7', 'G', 'E7', 'Am', 'B7', 'Em'] },
      { motif: 'basse-plaque', grille: ['G7', 'C', 'D7', 'G', 'E7', 'Am', 'B7', 'Em'] }
    ]
  });

  exerciceAccords({
    id: 'acc-barre', titre: 'Premiers barrés : Fa et Si mineur', niveau: 4, tempo: 60,
    description: 'L’index à plat sur toutes les cordes. Commence par Fa, entre Do et Sol qui te reposent la main ; puis Si mineur, entre Sol et Ré. Si une corde frise, roule l’index très légèrement sur sa tranche.',
    paliers: [
      { motif: 'balaye', grille: ['C', 'F', 'C', 'G'], tours: 2 },
      { motif: 'balaye', grille: ['G', 'Bm', 'C', 'D'], tours: 2 },
      { motif: 'basse-plaque', grille: ['Am', 'F', 'C', 'G'] }
    ]
  });

  exerciceAccords({
    id: 'ent-zombie-balaye', titre: 'Balayages sur les accords de Zombie', categorie: 'entrainement',
    sous_titre: 'Entraînement · Em – Cmaj7 – G – D', niveau: 1, tempo: 56, accords: ZOMBIE,
    description: 'Guitare posée sur la jambe droite. Le pouce passe d’un coup sec sur les cordes en faisant tourner l’avant-bras — pas le poignet — dans un mouvement ample, un « O » à l’envers, devant la guitare et pas sur le côté.',
    paliers: [
      { motif: 'balaye', grille: ['Em', 'Em', 'Cmaj7', 'Cmaj7', 'G', 'G', 'D', 'D'] },
      { motif: 'balaye', grille: ['Em', 'Cmaj7', 'G', 'D'], tours: 2 },
      { motif: 'balaye-noires', grille: ['Em', 'Cmaj7', 'G', 'D'], tours: 2 }
    ]
  });

  exerciceAccords({
    id: 'acc-canon-pachelbel', titre: 'Canon de Pachelbel', sous_titre: 'Accords · la grille du Canon (domaine public)', niveau: 4, tempo: 60,
    description: 'Huit accords qui tournent, la grille la plus reprise de la musique : D A Bm F♯m G D G A. Deux barrés (Si mineur, Fa♯ mineur) au milieu de six accords ouverts.',
    paliers: [
      { motif: 'balaye', grille: ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A'] },
      { motif: 'arpege', grille: ['D', 'A', 'Bm', 'F#m', 'G', 'D', 'G', 'A'], tours: 2 }
    ]
  });

  exerciceAccords({
    id: 'acc-rising-sun', titre: 'House of the Rising Sun', sous_titre: 'Accords · chanson traditionnelle américaine', niveau: 2, tempo: 72,
    description: 'La grille de la chanson traditionnelle (Am C D F, Am C E). Le Fa est remplacé par Fa maj7, sans barré. Sur le disque des Animals, l’arpège est à 6/8 ; ici à 4 temps.',
    paliers: [
      { motif: 'balaye', grille: ['Am', 'C', 'D', 'Fmaj7', 'Am', 'C', 'E', 'E'] },
      { motif: 'arpege', grille: ['Am', 'C', 'D', 'Fmaj7', 'Am', 'C', 'E', 'E', 'Am', 'C', 'D', 'Fmaj7', 'Am', 'E', 'Am', 'E'] }
    ]
  });

  exerciceAccords({
    id: 'acc-la-bamba', titre: 'La Bamba', sous_titre: 'Accords · chanson traditionnelle mexicaine', niveau: 1, tempo: 80,
    description: 'Trois accords, deux par mesure : Do, puis Fa maj7 et Sol. Le changement Fa maj7 → Sol arrive vite : prépare-le pendant le Fa.',
    paliers: [
      { motif: 'balaye', grille: ['C', 'Fmaj7|G', 'C', 'Fmaj7|G'], tours: 2 },
      { motif: 'basse-plaque', grille: ['C', 'Fmaj7|G', 'C', 'Fmaj7|G'], tours: 2 }
    ]
  });

  exerciceAccords({
    id: 'acc-revue', titre: 'Revue des accords', sous_titre: 'Accords · les 23 de la bibliothèque, un par mesure', niveau: 3, tempo: 50,
    description: 'Tous les accords de l’app, dans l’ordre où on les apprend, un par mesure, balayés deux fois. Pour faire le point : ceux qui frisent ou qui arrivent en retard sont ceux à retravailler.',
    paliers: [
      { motif: 'balaye', grille: Accords.tous().slice().sort(function (a, b) { return a.rang - b.rang; }).map(function (a) { return a.id; }) }
    ]
  });

  // --- Entraînement : les exercices du cours ---------------------------------
  /* Tablatures des devoirs donnés en cours (écran « Entraînement »,
   * www/entrainement.js). Elles ne figurent pas dans la liste des morceaux :
   * on y arrive depuis l'exercice qui les décrit. */
  var ALLER_RETOUR = [6, 5, 4, 3, 2, 3, 4, 5];   // de la 6e à la 2e, et retour

  function cordesAVide(sequence, fois) {
    var n = [], t = 0;
    sequence.forEach(function (c) {
      for (var k = 0; k < fois; k++) {
        n.push({ corde: c, frette: 0, temps: t, duree: 1, main: 'p', midi: Theorie.midiDeCase(c, 0) });
        t += 1;
      }
    });
    return n;
  }

  // Ve position : l'index à la case 5, un doigt par case jusqu'à la 8.
  function cinquiemePosition(motif) {
    var n = [], t = 0;
    ALLER_RETOUR.concat([6]).forEach(function (c) {
      motif.forEach(function (doigt) {
        var f = doigt ? 4 + doigt : 0;
        var note = { corde: c, frette: f, temps: t, duree: 1, main: 'p', midi: Theorie.midiDeCase(c, f) };
        if (doigt) note.doigt = doigt;
        n.push(note);
        t += 1;
      });
    });
    return n;
  }

  ajoute({
    id: 'ent-noms-cordes', titre: 'Le nom des 6 cordes', sous_titre: 'Entraînement · cordes à vide',
    niveau: 1, tempo: 60, signature: [4, 4], categorie: 'entrainement',
    description: 'Mi, La, Ré, Sol, Si, Mi : de la plus grosse (6e) à la plus fine (1re), puis retour. Dis le nom de chaque corde à voix haute en la jouant.',
    notes: cordesAVide([6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6], 2).map(function (n, i) { n.temps = i * 2; n.duree = 2; return n; })
  });

  ajoute({
    id: 'ent-pouce-bute-1', titre: 'Pouce buté : 1 fois sur chaque corde', sous_titre: 'Entraînement · main droite',
    niveau: 1, tempo: 60, signature: [4, 4], categorie: 'entrainement',
    description: 'Le pouce joue chaque corde une fois, de la 6e à la 2e puis retour, et vient se poser (buter) sur la corde suivante. i, m, a restent posés sur la 1re corde. Bien soulever le pouce à chaque attaque.',
    notes: cordesAVide(ALLER_RETOUR.concat(ALLER_RETOUR), 1).concat(
      [{ corde: 6, frette: 0, temps: 16, duree: 4, main: 'p', midi: Theorie.midiDeCase(6, 0) }])
  });

  ajoute({
    id: 'ent-pouce-bute-4', titre: 'Pouce buté : 4 fois sur chaque corde', sous_titre: 'Entraînement · main droite',
    niveau: 1, tempo: 60, signature: [4, 4], categorie: 'entrainement',
    description: 'Quatre fois la même corde, puis la suivante : de la 6e à la 2e, et retour à la 6e. D’abord en regardant la main droite, puis les yeux fermés.',
    notes: cordesAVide(ALLER_RETOUR.concat([6]), 4)
  });

  ajoute({
    id: 'ent-v-0303', titre: 'Ve position : 0 3 0 3', sous_titre: 'Entraînement · main gauche · pouce buté',
    niveau: 2, tempo: 60, signature: [4, 4], categorie: 'entrainement', position: 5,
    description: 'En Ve position (index à la case V), le 3e doigt joue à la case VII : corde à vide, case VII, à vide, case VII, sur chaque corde de la 6e à la 2e puis retour. Le doigt enfonce la corde du bout de l’os, se pose droit le long de la barrette en tirant légèrement vers la droite, le plus près possible de la barrette.',
    notes: cinquiemePosition([0, 3, 0, 3])
  });

  ajoute({
    id: 'ent-v-0101', titre: 'Ve position : 0 1 0 1', sous_titre: 'Entraînement · main gauche · pouce buté',
    niveau: 2, tempo: 60, signature: [4, 4], categorie: 'entrainement', position: 5,
    description: 'Même chemin, avec le 1er doigt à la case V. Le 3e doigt reste au-dessus de sa case (VII) ; le 1er doigt s’écarte et se pose légèrement sur le côté gauche.',
    notes: cinquiemePosition([0, 1, 0, 1])
  });

  ajoute({
    id: 'ent-v-1313', titre: 'Ve position : 1 3 1 3', sous_titre: 'Entraînement · main gauche · les doigts « marchent »',
    niveau: 2, tempo: 50, signature: [4, 4], categorie: 'entrainement', position: 5,
    description: '1er doigt à la case V, 3e doigt à la case VII, sur chaque corde de la 6e à la 2e puis retour. La main gauche d’abord, seule. Un doigt chasse l’autre : ne lâche pas un doigt tant que le suivant n’est pas posé. Pars toujours du 3e doigt et écarte le 1er ; tire la main vers la droite.',
    notes: cinquiemePosition([1, 3, 1, 3])
  });

  ajoute({
    id: 'ent-v-0404', titre: 'Ve position : 0 4 0 4', sous_titre: 'Entraînement · main gauche · pouce buté',
    niveau: 2, tempo: 50, signature: [4, 4], categorie: 'entrainement', position: 5,
    description: 'Corde à vide, puis le 4e doigt à la case VIII, sur chaque corde de la 6e à la 2e puis retour. Bien fléchir le 4e doigt avant de le poser sur la corde.',
    notes: cinquiemePosition([0, 4, 0, 4])
  });

  ajoute({
    id: 'ent-v-1414', titre: 'Ve position : 1 4 1 4', sous_titre: 'Entraînement · main gauche · pouce buté',
    niveau: 2, tempo: 50, signature: [4, 4], categorie: 'entrainement', position: 5,
    description: '1er doigt à la case V, 4e doigt à la case VIII, sur chaque corde de la 6e à la 2e puis retour. Ne lâche pas le 1er doigt tant que le 4e n’est pas posé.',
    notes: cinquiemePosition([1, 4, 1, 4])
  });

  /* Riffs en La du cours, en Ve position, au pouce buté. Schéma de 4 notes
   * à partir d'une corde : case V, case V, case VII (3e doigt, riff n° 1) ou
   * VIII (4e doigt, riff n° 2), puis case V sur la corde au-dessus. 4 fois
   * depuis la 6e corde, 2 fois depuis la 5e, 2 fois depuis la 6e, et le La
   * grave pour finir. Le riff n° 2 est relevé sur l'audio Guitar Pro du
   * cours (♩ = 60 : La La Do Ré, Ré Ré Fa Sol) ; le n° 1 suit le même
   * chemin avec le 3e doigt. */
  function riffLa(doigt) {
    var n = [], t = 0, haut = 4 + doigt;
    [6, 6, 6, 6, 5, 5, 6, 6].forEach(function (c) {
      [[c, 5, 1], [c, 5, 1], [c, haut, doigt], [c - 1, 5, 1]].forEach(function (x) {
        n.push({ corde: x[0], frette: x[1], temps: t, duree: 1, main: 'p', doigt: x[2], midi: Theorie.midiDeCase(x[0], x[1]) });
        t += 1;
      });
    });
    n.push({ corde: 6, frette: 5, temps: t, duree: 4, main: 'p', doigt: 1, midi: Theorie.midiDeCase(6, 5) });
    return n;
  }
  var SECTIONS_RIFF = [{ titre: '4 fois depuis la 6e corde', de: 1, a: 4 }, { titre: '2 fois depuis la 5e', de: 5, a: 6 },
                       { titre: '2 fois depuis la 6e, et le La grave', de: 7, a: 9 }];
  ajoute({
    id: 'ent-riff-la-1', titre: 'Riff en La n° 1', sous_titre: 'Entraînement · Ve position · 1er et 3e doigts · pouce buté',
    niveau: 2, tempo: 55, signature: [4, 4], categorie: 'entrainement', position: 5, sections: SECTIONS_RIFF,
    description: 'Schéma de 4 notes : case V, case V, case VII (3e doigt), puis case V sur la corde suivante. Pars 4 fois de la 6e corde, 2 fois de la 5e, 2 fois de la 6e, et finis par la note la plus grave : coupe le son en reposant le pouce sur la corde. D’abord sans métronome, puis avec un rock groove à 55. Ne lâche pas un doigt tant que le suivant n’est pas posé ; tire la main gauche vers la droite. (Écrit d’après les consignes du cours et le riff n° 2 : compare avec l’audio de Françoise.)',
    notes: riffLa(3)
  });
  ajoute({
    id: 'ent-riff-la-2', titre: 'Riff en La n° 2', sous_titre: 'Entraînement · Ve position · 1er et 4e doigts · pouce buté',
    niveau: 2, tempo: 60, signature: [4, 4], categorie: 'entrainement', position: 5, sections: SECTIONS_RIFF,
    description: 'Le chemin du riff n° 1, avec le 4e doigt à la case VIII : La La Do Ré depuis la 6e corde, Ré Ré Fa Sol depuis la 5e. Départ en Ve position, pouce buté. Relevé de l’audio du cours (♩ = 60). Pour l’accompagnement, Françoise joue quatre allers du pouce par mesure.',
    notes: riffLa(4)
  });

  // --- Chansons françaises (grilles d'accords, voir chansons.js) ------------
  /* Dictionnaire : la bibliothèque d'accords (accords.js) + quatre accords
   * barrés que certaines grilles demandent. `basse` = corde de la basse (la
   * plus grave jouée), `alt` = basse alternée (4e corde, ou la basse même). */
  var ACCORDS_SUP = [
    { id: 'Bb',    fr: 'Si♭ majeur (barré)',      frettes: [1, 3, 3, 3, 1, -1], doigts: [1, 3, 3, 3, 1, 0], barre: { frette: 1, de: 1, a: 5 } },
    { id: 'Fm',    fr: 'Fa mineur (barré)',       frettes: [1, 1, 1, 3, 3, 1],  doigts: [1, 1, 1, 4, 3, 1], barre: { frette: 1, de: 1, a: 6 } },
    { id: 'Gm',    fr: 'Sol mineur (barré)',      frettes: [3, 3, 3, 5, 5, 3],  doigts: [1, 1, 1, 4, 3, 1], barre: { frette: 3, de: 1, a: 6 } },
    { id: 'Bm7b5', fr: 'Si mineur 7 quinte diminuée', frettes: [1, 0, 2, 0, 2, -1], doigts: [1, 0, 3, 0, 2, 0] },
    { id: 'C#m',   fr: 'Do♯ mineur (barré)',      frettes: [4, 5, 6, 6, 4, -1], doigts: [1, 2, 4, 3, 1, 0], barre: { frette: 4, de: 1, a: 5 } },
    /* Power chords (rock) : fondamentale + quinte (+ octave), sur 3 cordes
     * graves ; ni majeur ni mineur. L'index sur la fondamentale, annulaire et
     * auriculaire deux cases plus haut. Les autres cordes ne sonnent pas. */
    { id: 'E5',  fr: 'Mi 5 (power chord)',  frettes: [-1, -1, -1, 2, 2, 0], doigts: [0, 0, 0, 2, 1, 0] },
    { id: 'A5',  fr: 'La 5 (power chord)',  frettes: [-1, -1, 2, 2, 0, -1], doigts: [0, 0, 2, 1, 0, 0] },
    { id: 'D5',  fr: 'Ré 5 (power chord)',  frettes: [-1, 3, 2, 0, -1, -1], doigts: [0, 3, 1, 0, 0, 0] },
    { id: 'F5',  fr: 'Fa 5 (power chord)',  frettes: [-1, -1, -1, 3, 3, 1], doigts: [0, 0, 0, 4, 3, 1] },
    { id: 'F#5', fr: 'Fa♯ 5 (power chord)', frettes: [-1, -1, -1, 4, 4, 2], doigts: [0, 0, 0, 4, 3, 1] },
    { id: 'G5',  fr: 'Sol 5 (power chord)', frettes: [-1, -1, -1, 5, 5, 3], doigts: [0, 0, 0, 4, 3, 1] },
    { id: 'Ab5', fr: 'La♭ 5 (power chord)', frettes: [-1, -1, -1, 6, 6, 4], doigts: [0, 0, 0, 4, 3, 1] },
    { id: 'G#5', fr: 'Sol♯ 5 (power chord)', frettes: [-1, -1, -1, 6, 6, 4], doigts: [0, 0, 0, 4, 3, 1] },
    { id: 'Bb5', fr: 'Si♭ 5 (power chord)', frettes: [-1, -1, 3, 3, 1, -1], doigts: [0, 0, 4, 3, 1, 0] },
    { id: 'B5',  fr: 'Si 5 (power chord)',  frettes: [-1, -1, 4, 4, 2, -1], doigts: [0, 0, 4, 3, 1, 0] },
    { id: 'C5',  fr: 'Do 5 (power chord)',  frettes: [-1, -1, 5, 5, 3, -1], doigts: [0, 0, 4, 3, 1, 0] },
    { id: 'C#5', fr: 'Do♯ 5 (power chord)', frettes: [-1, -1, 6, 6, 4, -1], doigts: [0, 0, 4, 3, 1, 0] },
    { id: 'Db5', fr: 'Ré♭ 5 (power chord)', frettes: [-1, -1, 6, 6, 4, -1], doigts: [0, 0, 4, 3, 1, 0] }
  ];
  function accordChanson(id) {
    var src = (global.Accords && Accords.get(id)) || ACCORDS_SUP.filter(function (a) { return a.id === id; })[0];
    if (!src) throw new Error('accord absent de la bibliothèque : ' + id);
    var basse = 6;
    while (basse > 1 && src.frettes[basse - 1] < 0) basse--;
    var poses = [];
    src.frettes.forEach(function (f, i) {
      if (f > 0 && src.doigts[i] && !(src.barre && f === src.barre.frette && src.doigts[i] === 1))
        poses.push(NOMS_DOIGTS[src.doigts[i]] + ' case ' + f + ' sur la ' + (i + 1) + (i ? 'e' : 're') + ' corde');
    });
    var consigne = (src.barre ? 'Barré de l’index case ' + src.barre.frette + '. ' : '') +
      (poses.length ? poses.join(', ') + '. ' : 'Toutes les cordes à vide. ') +
      'Le pouce droit joue la ' + basse + 'e corde.';
    return { id: src.id, fr: src.fr, frettes: src.frettes, doigts: src.doigts, barre: src.barre,
             basse: basse, alt: basse >= 5 ? 4 : basse, consigne: consigne };
  }
  // Motifs des chansons (distincts de ceux des exercices d'accords, plus haut).
  var MOTIFS_CHANSON = {
    arpege: { texte: 'Arpège en croches p-i-m-a-m-i-m-i : le pouce (p) prend la basse, index (i) 3e corde, majeur (m) 2e, annulaire (a) 1re.',
      pas: [{ temps: 0, duree: 0.5, cordes: ['basse'] }, { temps: 0.5, duree: 0.5, cordes: [3] },
            { temps: 1, duree: 0.5, cordes: [2] }, { temps: 1.5, duree: 0.5, cordes: [1] },
            { temps: 2, duree: 0.5, cordes: [2] }, { temps: 2.5, duree: 0.5, cordes: [3] },
            { temps: 3, duree: 0.5, cordes: [2] }, { temps: 3.5, duree: 0.5, cordes: [3] }] },
    balade: { texte: 'Balade en croches p-i-m-i, puis la basse alternée au 3e temps : p-i-m-i-p-i-m-i.',
      pas: [{ temps: 0, duree: 0.5, cordes: ['basse'] }, { temps: 0.5, duree: 0.5, cordes: [3] },
            { temps: 1, duree: 0.5, cordes: [2] }, { temps: 1.5, duree: 0.5, cordes: [3] },
            { temps: 2, duree: 0.5, cordes: ['alt'] }, { temps: 2.5, duree: 0.5, cordes: [3] },
            { temps: 3, duree: 0.5, cordes: [2] }, { temps: 3.5, duree: 0.5, cordes: [3] }] },
    plaque: { texte: 'Basse et accord plaqué : pouce sur la basse au 1er temps, i-m-a pincés ensemble au 2e, basse alternée au 3e, i-m-a au 4e.',
      pas: [{ temps: 0, duree: 1, cordes: ['basse'] }, { temps: 1, duree: 1, cordes: [3, 2, 1] },
            { temps: 2, duree: 1, cordes: ['alt'] }, { temps: 3, duree: 1, cordes: [3, 2, 1] }] },
    // Rock : le pouce balaie l'accord (power chord : ses seules cordes) en
    // croches, toujours vers le bas — « l'aller du pouce ».
    // Mesures à trois temps (valse, 3/4).
    valse: { texte: 'Valse à trois temps : la basse au pouce sur le 1er temps, l’accord pincé (i-m-a) sur le 2e et le 3e — « boum, tcha, tcha ».',
      pas: [{ temps: 0, duree: 1, cordes: ['basse'] }, { temps: 1, duree: 1, cordes: [3, 2, 1] }, { temps: 2, duree: 1, cordes: [3, 2, 1] }] },
    'arpege-3': { texte: 'Arpège à trois temps, en croches p-i-m-a-m-i : le pouce prend la basse, puis index, majeur, annulaire et retour.',
      pas: [{ temps: 0, duree: 0.5, cordes: ['basse'] }, { temps: 0.5, duree: 0.5, cordes: [3] }, { temps: 1, duree: 0.5, cordes: [2] },
            { temps: 1.5, duree: 0.5, cordes: [1] }, { temps: 2, duree: 0.5, cordes: [2] }, { temps: 2.5, duree: 0.5, cordes: [3] }] },
    rock: { texte: 'Rock : le pouce balaie l’accord en croches, huit coups par mesure, toujours vers le bas, d’un geste sec de l’avant-bras.',
      pas: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map(function (t) { return { temps: t, duree: 0.5, cordes: ['tout'] }; }) }
  };
  function creerChanson(c, parties, extra) {
    var dico = {}, ordre = [];
    parties.forEach(function (s) {
      s.grille.forEach(function (g) {
        String(g).split('|').forEach(function (id) {
          if (!dico[id]) { dico[id] = accordChanson(id); ordre.push(id); }
        });
      });
    });
    var mesure = 1, sections = [], motifsVus = [];
    parties.forEach(function (s) {
      var n = s.grille.length * (s.tours || 1);
      sections.push({ titre: s.titre, de: mesure, a: mesure + n - 1,
        texte: s.grille.join(' · ').replace(/\|/g, ' / ') + ((s.tours || 1) > 1 ? ' (×' + s.tours + ')' : '') + ' — ' + MOTIFS_CHANSON[s.motif].texte });
      mesure += n;
      if (motifsVus.indexOf(s.motif) === -1) motifsVus.push(s.motif);
    });
    var capoTxt = c.capo ? ' · capo case ' + c.capo : '';
    var def = {
      id: c.id, titre: c.titre, artiste: c.artiste,
      sous_titre: c.artiste + (c.annee ? ' (' + c.annee + ')' : '') + ' · grille d’accords' + capoTxt,
      niveau: { hit: 7, international: 8, rock: 9, tiktok: 10, top20: 11 }[c.groupe] || 6, tempo: c.tempo, signature: c.signature || [4, 4], capo: c.capo || 0,
      categorie: c.groupe === 'tiktok' ? 'tiktok' : c.groupe === 'top20' ? 'top20' : undefined, top: c.top,
      chanson: true,
      description: 'Grille d’accords de la chanson, accompagnement écrit pour cette app (ni mélodie ni paroles : elles sont sous droits). ' +
        (c.capo ? 'Capodastre case ' + c.capo + ' pour retrouver la tonalité du disque : les accords se jouent comme écrits, le capo fait le reste. ' : '') +
        (c.note ? c.note + ' ' : '') + 'Accords : ' + ordre.join(', ') + '.',
      sections: sections,
      mains: {
        gauche: ordre.map(function (id) { return dico[id]; }),
        droite: motifsVus.map(function (m) { return MOTIFS_CHANSON[m].texte; }).concat(
          [(c.signature && c.signature[0] === 3 ? 'Une case de la grille = une mesure à 3 temps ; « F / G » = deux accords dans la mesure, 2 temps puis 1.'
            : 'Une case de la grille = une mesure à 4 temps ; « F / G » = deux accords dans la mesure, 2 temps chacun.')])
      },
      notes: accompagnement(dico, parties.map(function (s) {
        return { tours: s.tours || 1, grille: s.grille, motif: MOTIFS_CHANSON[s.motif].pas };
      }), c.signature ? c.signature[0] * 4 / c.signature[1] : 4)
    };
    Object.keys(extra || {}).forEach(function (k) { def[k] = extra[k]; });
    return ajoute(def);
  }

  /* Version longue : la chanson entière, partie par partie, dans l'ordre
   * donné par `structure` — « Partie », « Partie:Titre » ou
   * « Partie:Titre:tours ». Proposée sur la fiche de la version courte. */
  function partiesLongues(c) {
    var vus = {};
    return c.structure.map(function (x) {
      var morceaux = x.split(':');
      var src = c.sections.filter(function (s) { return s.titre === morceaux[0]; })[0];
      if (!src) throw new Error(c.id + ' : partie inconnue dans la structure : ' + morceaux[0]);
      var titre = morceaux[1] || src.titre;
      vus[titre] = (vus[titre] || 0) + 1;
      return { titre: titre, motif: src.motif, grille: src.grille, tours: morceaux[2] ? +morceaux[2] : (src.tours || 1) };
    }).map(function (p, k, tout) {
      // « Couplet », « Couplet » → « Couplet 1 », « Couplet 2 ».
      var memes = tout.filter(function (q) { return q.titre === p.titre; });
      if (memes.length > 1 && !/\d$/.test(p.titre)) p = { titre: p.titre + ' ' + (memes.indexOf(p) + 1), motif: p.motif, grille: p.grille, tours: p.tours };
      return p;
    });
  }

  (global.CHANSONS || []).forEach(function (c) {
    if (!c.structure) { creerChanson(c, c.sections); return; }
    var longues = partiesLongues(c);
    creerChanson(c, c.sections, { longue: c.id + '-longue' });
    var l = creerChanson({ id: c.id + '-longue', titre: c.titre + ' — version longue', artiste: c.artiste, annee: c.annee,
                           capo: c.capo, tempo: c.tempo, groupe: c.groupe, top: c.top, note: c.note, signature: c.signature }, longues, { versionDe: c.id });
    l.description += ' Version longue : la chanson entière, partie par partie, dans l’ordre habituel du morceau (simplifié) : ' +
      longues.map(function (p) { return p.titre; }).join(' · ') + '.';
  });

  // --- Pouce seul -------------------------------------------------------------
  /* Tout se joue avec le pouce de la main droite : c'est le premier doigt
   * qu'on maîtrise, celui des basses, et il suffit pour accompagner. La section
   * monte par étapes : le rythme sur une corde, les six cordes, une gamme dans
   * les basses, les basses alternées sur des accords, le pom-tcha, des
   * mélodies jouées au pouce (une octave plus bas), puis des chansons. */
  function auPouce(notes) { notes.forEach(function (n) { n.main = 'p'; }); return notes; }

  // Rondes, blanches, noires, croches sur une même corde à vide.
  function valeursPouce(cordes) {
    var notes = [], t = 0;
    cordes.forEach(function (c) {
      [4, 2, 1, 0.5].forEach(function (d) {
        for (var k = 0; k < 4 / d; k++) {
          notes.push({ corde: c, frette: 0, temps: t, duree: d, main: 'p', midi: Theorie.midiDeCase(c, 0) });
          t += d;
        }
      });
    });
    notes.push({ corde: cordes[0], frette: 0, temps: t, duree: 4, main: 'p', midi: Theorie.midiDeCase(cordes[0], 0) });
    return notes;
  }

  ajoute({
    id: 'pouce-rythme', titre: 'Le pouce en rythme', sous_titre: 'Pouce seul · cordes à vide · rondes, blanches, noires, croches',
    niveau: 1, tempo: 60, signature: [4, 4], categorie: 'pouce',
    description: 'Une corde à vide, quatre façons de compter : une ronde (4 temps), deux blanches, quatre noires, huit croches. Sur le Mi grave, puis le La, puis le Ré. Le pouce reste détendu, le geste part de la base du pouce, pas du poignet.',
    sections: [{ titre: 'Mi grave (6e)', de: 1, a: 4 }, { titre: 'La (5e)', de: 5, a: 8 }, { titre: 'Ré (4e)', de: 9, a: 13 }],
    notes: valeursPouce([6, 5, 4])
  });

  ajoute({
    id: 'pouce-six-cordes', titre: 'Le pouce sur les six cordes', sous_titre: 'Pouce seul · cordes à vide · de la 6e à la 1re',
    niveau: 1, tempo: 66, signature: [4, 4], categorie: 'pouce',
    description: 'Le pouce descend de la 6e corde à la 1re, puis remonte : deux noires par corde, puis une croche par corde. Sur les cordes aiguës, il garde le même geste vers le bas, en butée sur la corde suivante.',
    notes: (function () {
      var n = [], t = 0;
      [6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6].forEach(function (c) {
        for (var k = 0; k < 2; k++) { n.push({ corde: c, frette: 0, temps: t, duree: 1, main: 'p', midi: Theorie.midiDeCase(c, 0) }); t += 1; }
      });
      for (var r = 0; r < 2; r++) [6, 5, 4, 3, 2, 1, 2, 3].forEach(function (c) {
        n.push({ corde: c, frette: 0, temps: t, duree: 0.5, main: 'p', midi: Theorie.midiDeCase(c, 0) }); t += 0.5;
      });
      n.push({ corde: 6, frette: 0, temps: t, duree: 4, main: 'p', midi: Theorie.midiDeCase(6, 0) });
      return n;
    })()
  });

  /* Pouce seul, cordes à vide : la main gauche ne touche rien, toute
   * l'attention va au pouce droit — le son, le rythme, le changement de corde.
   * `aVide` lit une suite de [corde(s), durée] ; « - » est un silence, une
   * liste de cordes est jouée ensemble (balayé du pouce, du grave à l'aigu). */
  function aVide(suite) {
    var notes = [], t = 0;
    suite.forEach(function (pas) {
      if (pas[0] !== '-') [].concat(pas[0]).forEach(function (c) {
        notes.push({ corde: c, frette: 0, temps: t, duree: pas[1], main: 'p', midi: Theorie.midiDeCase(c, 0) });
      });
      t += pas[1];
    });
    return notes;
  }
  function fois(n, suite) { var r = []; for (var k = 0; k < n; k++) r = r.concat(suite); return r; }
  var TOUT = [6, 5, 4, 3, 2, 1], AIGUES = [3, 2, 1];

  [
    { id: 'pouce-vide-graves', titre: 'Les trois basses : Mi, La, Ré', niveau: 1, tempo: 66,
      sous: 'cordes 6, 5, 4',
      description: 'Les trois cordes graves, le domaine du pouce : Mi (6e), La (5e), Ré (4e). Le pouce part de la base, pas du poignet, et vient buter sur la corde suivante. D’abord en noires, puis en croches.',
      suite: fois(2, [[6, 1], [5, 1], [4, 1], [5, 1]]).concat(fois(2, [[6, 1], [4, 1], [5, 1], [4, 1]]))
        .concat(fois(2, [[6, 0.5], [5, 0.5], [4, 0.5], [5, 0.5], [6, 0.5], [5, 0.5], [4, 0.5], [5, 0.5]])).concat([[6, 4]]) },
    { id: 'pouce-vide-alternees', titre: 'Basses alternées à vide', niveau: 1, tempo: 66,
      sous: 'deux cordes qui se répondent',
      description: 'Le geste des accompagnements : le pouce alterne entre deux cordes, une par temps. Mi–Ré (6e–4e), La–Ré (5e–4e), Ré–Sol (4e–3e), puis Mi–Ré–La–Ré. La main droite ne bouge pas : seul le pouce change de corde.',
      suite: fois(2, [[6, 1], [4, 1], [6, 1], [4, 1]]).concat(fois(2, [[5, 1], [4, 1], [5, 1], [4, 1]]))
        .concat(fois(2, [[4, 1], [3, 1], [4, 1], [3, 1]])).concat(fois(2, [[6, 1], [4, 1], [5, 1], [4, 1]])).concat([[6, 4]]) },
    { id: 'pouce-vide-sauts', titre: 'Sauts de cordes', niveau: 1, tempo: 60,
      sous: 'sauter une corde sans la toucher',
      description: 'Le pouce saute une corde : 6e–4e, 5e–3e, 4e–2e, 3e–1re, puis retour. Il passe au-dessus de la corde du milieu sans la frôler. Regarde le pouce au début, puis joue les yeux fermés.',
      suite: fois(2, [[6, 1], [4, 1], [5, 1], [3, 1], [4, 1], [2, 1], [3, 1], [1, 1], [2, 1], [4, 1], [3, 1], [5, 1], [4, 1], [6, 1], [5, 1], [6, 1]]).concat([[6, 4]]) },
    { id: 'pouce-vide-marche', titre: 'La marche des six cordes', niveau: 1, tempo: 72,
      sous: 'arpège du grave à l’aigu',
      description: 'Les six cordes à la suite, de la 6e à la 1re puis retour : un arpège tout entier au pouce. En noires d’abord, puis en croches, régulières comme une marche. Le pouce garde le même geste vers le bas sur toutes les cordes.',
      suite: fois(2, [[6, 1], [5, 1], [4, 1], [3, 1], [2, 1], [1, 1], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], ['-', 1]])
        .concat(fois(4, [[6, 0.5], [5, 0.5], [4, 0.5], [3, 0.5], [2, 0.5], [1, 0.5], [2, 0.5], [3, 0.5]])).concat([[6, 4]]) },
    { id: 'pouce-vide-cloches', titre: 'Les cloches', niveau: 1, tempo: 60,
      sous: 'le grave et l’aigu',
      description: 'Une corde grave, puis une aiguë, et on les laisse sonner : 6e et 1re (les deux Mi, à deux octaves), 5e et 2e, 4e et 3e, puis les deux Mi ensemble. Le pouce traverse tout le manche : précision avant vitesse.',
      suite: fois(2, [[6, 2], [1, 2]]).concat(fois(2, [[5, 2], [2, 2]])).concat(fois(2, [[4, 2], [3, 2]]))
        .concat([[6, 1], [1, 1], [5, 1], [2, 1], [4, 1], [3, 1], [4, 1], [3, 1], [[6, 1], 4]]) },
    { id: 'pouce-vide-pointe', titre: 'Le galop', niveau: 2, tempo: 60,
      sous: 'rythme pointé : long-court',
      description: 'Noire pointée puis croche : « taaa-ta », comme un cheval au galop. Sur le Mi grave, puis le La, puis le Ré, et enfin d’une corde à l’autre. La croche est courte et légère, elle lance la note suivante.',
      suite: fois(2, [[6, 1.5], [6, 0.5], [6, 1.5], [6, 0.5]]).concat(fois(2, [[5, 1.5], [5, 0.5], [5, 1.5], [5, 0.5]]))
        .concat(fois(2, [[4, 1.5], [4, 0.5], [4, 1.5], [4, 0.5]])).concat(fois(2, [[6, 1.5], [5, 0.5], [4, 1.5], [5, 0.5]])).concat([[6, 4]]) },
    { id: 'pouce-vide-syncope', titre: 'La syncope', niveau: 2, tempo: 60,
      sous: 'croche – noire – croche',
      description: 'Croche, noire, croche : la note longue tombe entre deux temps. Compte « 1 et 2 et » à voix haute : le pouce joue sur « 1 », « et », puis « et ». C’est le rythme de beaucoup de chansons.',
      suite: fois(4, [[6, 0.5], [6, 1], [6, 0.5], [4, 1], [4, 1]]).concat(fois(4, [[5, 0.5], [5, 1], [5, 0.5], [4, 1], [4, 1]])).concat([[6, 4]]) },
    { id: 'pouce-vide-balaye', titre: 'Balayer les six cordes', niveau: 1, tempo: 60,
      sous: 'le pouce balaie, du grave à l’aigu',
      description: 'Le pouce glisse sur les six cordes à vide d’un seul geste, de la 6e à la 1re : un accord tout fait, sans main gauche. Une fois par mesure, puis deux, puis quatre. Le geste vient de l’avant-bras, le pouce reste ferme.',
      suite: fois(2, [[TOUT, 4]]).concat(fois(4, [[TOUT, 2]])).concat(fois(8, [[TOUT, 1]])).concat(fois(8, [[TOUT, 0.5]])).concat([[TOUT, 4]]) },
    { id: 'pouce-vide-pomtcha', titre: 'Pom-tcha à vide', niveau: 1, tempo: 66,
      sous: 'basse puis cordes aiguës',
      description: 'Pom : le pouce joue une basse. Tcha : il balaie les trois cordes aiguës (3e, 2e, 1re). Mi grave puis balayé, Ré puis balayé… Le « pom » est appuyé, le « tcha » léger : c’est tout l’accompagnement des chansons, sans un doigt à gauche.',
      suite: fois(4, [[6, 1], [AIGUES, 1], [4, 1], [AIGUES, 1]]).concat(fois(4, [[5, 1], [AIGUES, 1], [4, 1], [AIGUES, 1]]))
        .concat(fois(2, [[6, 1], [AIGUES, 1], [5, 1], [AIGUES, 1], [4, 1], [AIGUES, 1], [5, 1], [AIGUES, 1]])).concat([[TOUT, 4]]) },
    { id: 'pouce-vide-reggae', titre: 'Le contretemps (reggae)', niveau: 2, tempo: 72,
      sous: 'balayé entre les temps',
      description: 'La basse sur le 1er temps, puis le pouce balaie les cordes aiguës ENTRE les temps (« et ») : c’est le contretemps du reggae, comme chez Bob Marley. Compte « 1 et 2 et 3 et 4 et » : le balayé tombe sur chaque « et ».',
      suite: fois(8, [[6, 0.5], [AIGUES, 0.5], ['-', 0.5], [AIGUES, 0.5], [4, 0.5], [AIGUES, 0.5], ['-', 0.5], [AIGUES, 0.5]]).concat([[TOUT, 4]]) },
    { id: 'pouce-vide-rock', titre: 'Le rock à vide', niveau: 2, tempo: 90,
      sous: 'croches régulières sur les graves',
      description: 'Le pouce martèle la 6e corde en croches, huit par mesure, puis les deux graves ensemble (6e et 5e), puis les trois (6e, 5e, 4e). Sec, régulier, toujours vers le bas : la base des Offspring et de Nirvana.',
      suite: fois(4, fois(8, [[6, 0.5]])).concat(fois(4, fois(8, [[[6, 5], 0.5]]))).concat(fois(4, fois(8, [[[6, 5, 4], 0.5]]))).concat([[[6, 5, 4], 4]]) },
    { id: 'pouce-vide-morceau', titre: 'Petit morceau à vide', niveau: 2, tempo: 72,
      sous: 'tout ce qu’on a appris, en musique',
      description: 'Un vrai petit morceau, sans main gauche : les basses qui marchent, les cloches, le pom-tcha, le galop, et un grand balayé pour finir. Joue-le lentement d’abord, puis au tempo.',
      suite: fois(2, [[6, 1], [5, 1], [4, 1], [5, 1]]).concat([[6, 2], [1, 2], [5, 2], [2, 2]])
        .concat(fois(2, [[6, 1], [AIGUES, 1], [4, 1], [AIGUES, 1]])).concat(fois(2, [[6, 1.5], [5, 0.5], [4, 1.5], [5, 0.5]]))
        .concat(fois(2, [[6, 1], [5, 1], [4, 1], [5, 1]])).concat([[TOUT, 2], [TOUT, 2], [TOUT, 4]]) }
  ].forEach(function (d) {
    ajoute({
      id: d.id, titre: d.titre, sous_titre: 'Pouce seul · cordes à vide · ' + d.sous,
      niveau: d.niveau, tempo: d.tempo, signature: [4, 4], categorie: 'pouce', description: d.description,
      notes: aVide(d.suite)
    });
  });

  /* TikTok : morceaux relevés dans des vidéos courtes. Celui-ci vient d'une
   * vidéo de @maesstttro : les numéros de cordes s'affichent à l'écran au fur
   * et à mesure (5 = La, 4 = Ré), joués au pouce sur les cordes à vide, à
   * intervalles réguliers (~0,46 s, soit ♩ ≈ 130). 17 notes : quatre mesures
   * de noires et une ronde pour finir. */
  ajoute({
    id: 'tiktok-la-re', titre: 'Le riff La – Ré (I – IV en La)', sous_titre: 'TikTok · @maesstttro · pouce seul, cordes 5 et 4 à vide · titre non indiqué',
    niveau: 1, tempo: 130, signature: [4, 4], categorie: 'tiktok',
    description: 'Relevé d’une vidéo TikTok (@maesstttro) : seulement deux cordes à vide, La (5e) et Ré (4e), toutes au pouce. La – Ré quatre fois, Ré quatre fois, puis La La Ré La… et La qu’on laisse sonner. Une note par temps, bien régulier : à la vidéo, ♩ ≈ 130 — commence plus lentement (−10) et remonte. Ce qu’on entend : La, la tonique, et Ré, sa quarte (degrés I et IV en La) — les deux basses de presque tous les blues et rocks en La. La vidéo ne donne pas le titre de la chanson.',
    sections: [{ titre: 'La – Ré (×4)', de: 1, a: 2 }, { titre: 'Ré (×4)', de: 3, a: 3 }, { titre: 'Fin : La La Ré La… La', de: 4, a: 5 }],
    notes: aVide([[5, 1], [4, 1], [5, 1], [4, 1], [5, 1], [4, 1], [5, 1], [4, 1],
                  [4, 1], [4, 1], [4, 1], [4, 1],
                  [5, 1], [5, 1], [4, 1], [5, 1], [5, 4]])
  });

  /* Bella Ciao (chant traditionnel italien, domaine public), relevé d'une
   * vidéo de @wiragustiii : toute la mélodie sur la 1re corde (Mi aigu),
   * cases 0 à 13, avec un glissé 8 → 12. Hauteurs vérifiées sur le son (corde
   * à vide = Mi4, 330 Hz), rythme mesuré : ♩ ≈ 120, croche = 0,25 s.
   * [case, durée en noires] ; 9 mesures, la dernière note tenue. */
  var BELLA_CIAO = [
    [0, .5], [5, .5], [7, .5], [8, .5], [5, 2],
    [0, .5], [5, .5], [7, .5], [8, .5], [5, 2],
    [0, .5], [5, .5], [7, .5], [8, 1], [7, .5], [5, .5], [8, 1], [7, .5], [5, .5], [8, .5], [12, .5],
    [12, 1], [12, .5], [12, .5], [10, .5], [12, .5], [13, .5], [13, 2],
    [13, .5], [12, .5], [10, .5], [13, .5], [12, 2],
    [12, .5], [10, .5], [8, .5], [7, 1], [12, 1], [8, 1], [7, .5], [5, 1], [0, 1.5], [5, 4.5]
  ];
  var GLISSE = 19;    // le Do (case 8) qui glisse jusqu'au Mi (case 12)
  var SECTIONS_BELLA = [{ titre: 'Una mattina (×2)', de: 1, a: 2 }, { titre: 'O bella ciao', de: 3, a: 4 },
                        { titre: 'Mi son alzato', de: 5, a: 6 }, { titre: 'L’invasor, et fin', de: 7, a: 9 }];
  ajoute({
    id: 'tiktok-bella-ciao', titre: 'Bella Ciao sur une corde', sous_titre: 'TikTok · @wiragustiii · chant traditionnel italien · 1re corde',
    niveau: 3, tempo: 120, signature: [4, 4], categorie: 'tiktok', sections: SECTIONS_BELLA,
    description: 'Relevé d’une vidéo TikTok (@wiragustiii) : toute la mélodie de Bella Ciao (chant traditionnel, domaine public) sur la seule 1re corde, le Mi aigu. La main gauche monte le long du manche : en Ve position (case 5 = index, 7 = annulaire, 8 = auriculaire), puis en Xe (case 10 = index, 12 = annulaire, 13 = auriculaire). « 8/12 » : l’annulaire glisse de la case 8 à la 12 sans quitter la corde. Main droite : index et majeur en alternance.',
    notes: (function () {
      var t = 0, k = 0;
      return BELLA_CIAO.map(function (x, i) {
        var f = x[0];
        var n = { corde: 1, frette: f, temps: t, duree: x[1], midi: 64 + f, main: (k++ % 2) ? 'm' : 'i' };
        if (f) n.doigt = i === GLISSE ? 3 : { 5: 1, 7: 3, 8: 4, 10: 1, 12: 3, 13: 4 }[f];
        if (i === GLISSE) n.glisse = 12;
        t += x[1];
        return n;
      });
    })()
  });
  // La même, une octave plus bas : tout tient en première position.
  ajoute({
    id: 'tiktok-bella-ciao-facile', titre: 'Bella Ciao — version facile', sous_titre: 'TikTok · même mélodie en première position',
    niveau: 2, tempo: 100, signature: [4, 4], categorie: 'tiktok', sections: SECTIONS_BELLA,
    description: 'La mélodie de la vidéo, une octave plus bas : elle tient en première position, sans déplacer la main (cordes 4 à 1, cases 0 à 3, un doigt par case). Une fois sûre, passe à la version sur une corde.',
    notes: melodie(BELLA_CIAO.map(function (x) {
      return [{ 0: 'mi3', 5: 'la3', 7: 'si3', 8: 'do4', 10: 're4', 12: 'mi4', 13: 'fa4' }[x[0]], x[1]];
    }), { alterne: true })
  });

  /* @aka_11.03 (« String 1 ») : une mélodie en Ré mineur sur la
   * 1re corde, cases 5 à 13, affichées à l'écran par groupes (13 13 13 13 ·
   * 13 13 12 · 10 12 12 12 12 · 12 12 12 10 · 8 10 10 10 10 · 10 12 10 9 5 ·
   * 7 9 9 10 12 13). Le premier groupe passe deux fois (dix Fa). Hauteurs
   * vérifiées sur le son (La4 à Fa5), rythme mesuré : croche ≈ 0,23 s, soit
   * ♩ ≈ 130. [case, durée en noires, doigt] ; 8 mesures. */
  var UNE_CORDE_RE = [
    [13, .5, 4], [13, .5, 4], [13, .5, 4], [13, .5, 4], [13, .5, 4], [13, .5, 4], [13, 1, 4], [13, .5, 4], [13, .5, 4], [13, 1, 4], [12, 3, 3],
    [10, .5, 1], [12, .5, 3], [12, .5, 3], [12, .5, 3], [12, .5, 3], [12, 1, 3], [12, .5, 3], [12, 1, 3], [10, 3, 1],
    [8, .5, 1], [10, .5, 3], [10, .5, 3], [10, .5, 3], [10, .5, 3], [10, .5, 3], [12, .5, 4], [10, 1.5, 3], [9, 2, 2], [5, 2, 1],
    [7, .5, 1], [9, .5, 3], [9, .5, 3], [10, 1, 4], [12, 1.5, 3], [13, 2, 4]
  ];
  var SECTIONS_UNE_CORDE_RE = [{ titre: 'Fa répété, puis Mi', de: 1, a: 2 }, { titre: 'Mi répété, puis Ré', de: 3, a: 4 },
                               { titre: 'Ré, Do♯, La', de: 5, a: 6 }, { titre: 'On remonte jusqu’au Fa', de: 7, a: 8 }];
  ajoute({
    id: 'tiktok-une-corde-re', titre: 'Mélodie en Ré mineur sur une corde', sous_titre: 'TikTok · @aka_11.03 · 1re corde, cases 5 à 13 · titre non indiqué',
    niveau: 3, tempo: 130, signature: [4, 4], categorie: 'tiktok', sections: SECTIONS_UNE_CORDE_RE,
    description: 'Relevé d’une vidéo TikTok (@aka_11.03, « String 1 ») : toute la mélodie sur la seule 1re corde, le Mi aigu, haut sur le manche, avec les cases affichées à l’écran : 13 13 13 13 · 13 13 12 · 10 12 12 12 12 · 12 12 12 10 · 8 10 10 10 10 · 10 12 10 9 5 · 7 9 9 10 12 13 (le premier groupe deux fois). Chaque phrase répète une note en croches puis descend d’un degré : Fa, Mi, Ré, jusqu’au Do♯ et au La ; la dernière remonte au Fa. Notes de Ré mineur (Ré, Mi, Fa, La, Si, Do et Do♯). Main gauche : en Xe position, case 10 = index, 12 = annulaire, 13 = auriculaire ; la 3e phrase descend en VIIIe (8 = index, 9 = majeur, 10 = annulaire), puis l’index va chercher la case 5 et la 7, et la main remonte. Main droite : index et majeur en alternance, surtout sur les notes répétées. La vidéo ne donne pas le titre.',
    notes: (function () {
      var t = 0, k = 0;
      return UNE_CORDE_RE.map(function (x) {
        var n = { corde: 1, frette: x[0], temps: t, duree: x[1], midi: 64 + x[0], doigt: x[2], main: (k++ % 2) ? 'm' : 'i' };
        t += x[1];
        return n;
      });
    })()
  });
  ajoute({
    id: 'tiktok-une-corde-re-facile', titre: 'Mélodie en Ré mineur — version facile', sous_titre: 'TikTok · même mélodie en première position',
    niveau: 2, tempo: 110, signature: [4, 4], categorie: 'tiktok', sections: SECTIONS_UNE_CORDE_RE,
    description: 'La mélodie de la vidéo, une octave plus bas : elle tient en première position, sur les cordes 3 à 1, sans déplacer la main. Une fois sûre, passe à la version sur une corde.',
    notes: melodie(UNE_CORDE_RE.map(function (x) {
      return [{ 5: 'la3', 7: 'si3', 8: 'do4', 9: 'do#4', 10: 're4', 12: 'mi4', 13: 'fa4' }[x[0]], x[1]];
    }), { alterne: true })
  });

  /* Bella Ciao, version longue : la chanson a plusieurs strophes sur la
   * même mélodie ; trois strophes à la suite, la dernière note tenue
   * seulement à la fin. */
  ['tiktok-bella-ciao', 'tiktok-bella-ciao-facile'].forEach(function (id) {
    var c = PIECES.filter(function (p) { return p.id === id; })[0];
    var tour = Tablature.duree_totale(c), notes = [], sections = [];
    for (var k = 0; k < 3; k++) {
      c.notes.forEach(function (n) { var x = {}; Object.keys(n).forEach(function (cle) { x[cle] = n[cle]; }); x.temps += k * tour; notes.push(x); });
      sections.push({ titre: 'Strophe ' + (k + 1), de: k * 9 + 1, a: k * 9 + 9 });
    }
    c.longue = id + '-longue';
    ajoute({
      id: id + '-longue', titre: c.titre + ' — version longue', sous_titre: c.sous_titre + ' · trois strophes',
      niveau: c.niveau, tempo: c.tempo, signature: c.signature, categorie: 'tiktok', versionDe: id, sections: sections,
      description: c.description + ' Version longue : trois strophes à la suite, comme dans la chanson (même mélodie à chaque strophe).',
      notes: notes
    });
  });

  /* Arpèges vus sur TikTok : des accords égrenés, pas une mélodie.
   * `arpegeTT` lit, par mesure, l'accord et sa suite de [corde, case, doigt
   * gauche, doigt droit, durée]. */
  function arpegeTT(mesures) {
    var notes = [], t = 0;
    mesures.forEach(function (m) {
      m.notes.forEach(function (x) {
        var n = { corde: x[0], frette: x[1], temps: t, duree: x[4], main: x[3], accord: m.accord, midi: Theorie.midiDeCase(x[0], x[1]) };
        if (x[1]) n.doigt = x[2];
        notes.push(n);
        t += x[4];
      });
    });
    return notes;
  }
  function fois2(n, l) { var r = []; for (var k = 0; k < n; k++) r = r.concat(l); return r; }

  /* @aka_11.03 : La – Do♯m – Fa♯m – Ré (I – iii – vi – IV) sur les trois
   * cordes aiguës, avec les formes courtes montrées dans la vidéo ; deux
   * mesures par accord, croches i-m-a-m. */
  var FORMES_LA = {
    'A':   [[3, 2, 2], [2, 2, 3], [1, 0, 0]],
    'C#m': [[3, 1, 1], [2, 2, 2], [1, 0, 0]],
    'F#m': [[3, 2, 1], [2, 2, 1], [1, 2, 1]],
    'D':   [[3, 2, 1], [2, 3, 3], [1, 2, 2]]
  };
  function mesureLa(acc) {
    var f = FORMES_LA[acc], c = function (k, main) { return [f[k][0], f[k][1], f[k][2], main, .5]; };
    var debut = acc === 'D' ? [4, 0, 0, 'p', .5] : c(0, 'i');
    return { accord: acc, notes: [debut, c(1, 'm'), c(2, 'a'), c(1, 'm'), c(0, 'i'), c(1, 'm'), c(2, 'a'), c(1, 'm')] };
  }
  ajoute({
    id: 'tiktok-arpege-la', titre: 'Arpège La – Do♯m – Fa♯m – Ré (I – iii – vi – IV)', sous_titre: 'TikTok · @aka_11.03 · La majeur, trois cordes aiguës · titre non indiqué',
    niveau: 2, tempo: 120, signature: [4, 4], categorie: 'tiktok',
    sections: [{ titre: 'La', de: 1, a: 2 }, { titre: 'Do♯m', de: 3, a: 4 }, { titre: 'Fa♯m', de: 5, a: 6 }, { titre: 'Ré', de: 7, a: 8 }],
    description: 'D’après une vidéo TikTok (@aka_11.03) : quatre accords égrenés sur les trois cordes aiguës, avec des formes de trois doigts au plus. La : cases 2 sur les cordes 3 et 2, Mi aigu à vide. Do♯m : case 1 sur la 3e, case 2 sur la 2e, Mi à vide. Fa♯m : petit barré de l’index case 2 sur les trois cordes. Ré : la forme habituelle, le pouce sur le Ré à vide. Deux mesures par accord, en croches index – majeur – annulaire – majeur. Les accords : en La majeur, I (La) – iii (Do♯m) – vi (Fa♯m) – IV (Ré). Le Mi aigu à vide sonne dans les trois premiers accords, et c’est lui qui donne cette couleur rêveuse. La vidéo ne donne pas le titre de la chanson. Le motif d’arpège est écrit pour l’app : le son de la vidéo ne permet pas de retrouver l’ordre exact des notes.',
    notes: arpegeTT(fois2(2, ['A', 'A', 'C#m', 'C#m', 'F#m', 'F#m', 'D', 'D'].map(mesureLa)))
  });

  /* @maesstttro et @wiragustiii : La m7 – Fa, quatre notes égrenées puis on
   * laisse sonner. La m7 (x 0 2 0 1 x) ; Fa joué 1 3 0 2 sur les cordes 6 à 3
   * (Fa, Do, Ré, La). Rythme mesuré sur le son : croches, ♩ ≈ 86. */
  var AM7 = { accord: 'Am7', notes: [[5, 0, 0, 'p', .5], [4, 2, 2, 'p', .5], [3, 0, 0, 'i', .5], [2, 1, 1, 'm', 2.5]] };
  var F6 = { accord: 'F6', notes: [[6, 1, 1, 'p', .5], [5, 3, 3, 'p', .5], [4, 0, 0, 'p', .5], [3, 2, 2, 'i', 2.5]] };
  ajoute({
    id: 'tiktok-arpege-am-f', titre: 'Arpège La m7 – Fa (i – VI en La mineur)', sous_titre: 'TikTok · @maesstttro, @wiragustiii · quatre notes par accord · titre non indiqué',
    niveau: 2, tempo: 86, signature: [4, 4], categorie: 'tiktok',
    description: 'Vu dans deux vidéos TikTok (@maesstttro, @wiragustiii) : deux accords égrenés, quatre notes chacun, puis on laisse sonner. La m7 : La à vide (5e corde), case 2 sur la 4e (majeur), Sol à vide, case 1 sur la 2e (index). Fa : case 1 sur la 6e (index), case 3 sur la 5e (annulaire), Ré à vide, case 2 sur la 3e (majeur). Le pouce prend les cordes graves, l’index et le majeur les aiguës. Les accords : en La mineur, i (La m7 : La, Mi, Sol, Do) puis VI (Fa avec une sixte : Fa, Do, Ré, La). Les deux accords ont en commun le Do et le La : c’est ce qui fait ce balancement doux, sans tension. Le même motif revient dans plusieurs vidéos, sans titre de chanson.',
    notes: arpegeTT(fois2(4, [AM7, F6]))
  });

  /* @maesstttro : quatre accords égrenés en Si mineur, cases affichées à
   * l'écran (2 4 0 · 0 4 0 · 3 4 0 · 0 4, puis 3 4 0). Basse au pouce sur
   * la 5e ou la 6e corde, case 4 de la 4e (Fa♯) et Si à vide (2e corde) ;
   * notes vérifiées sur le son, croches à ♩ ≈ 104, une mesure par accord. */
  function mesureSi(acc, basse) {
    var fa = [4, 4, 3, 'i', .5], si = [2, 0, 0, 'm', .5];
    return { accord: acc, notes: [basse, fa, si, fa, [basse[0], basse[1], basse[2], 'p', .5], fa, si, fa] };
  }
  var SI_M = [mesureSi('Bm', [5, 2, 1, 'p', .5]), mesureSi('Bm/A', [5, 0, 0, 'p', .5]),
              mesureSi('Gmaj7', [6, 3, 2, 'p', .5]), mesureSi('Em9', [6, 0, 0, 'p', .5])];
  ajoute({
    id: 'tiktok-arpege-si-m', titre: 'Arpège Si m – Sol maj7 – Mi m (basse qui descend)', sous_titre: 'TikTok · @maesstttro · l’annulaire ne bouge pas · titre non indiqué',
    niveau: 2, tempo: 104, signature: [4, 4], categorie: 'tiktok',
    sections: [{ titre: 'Si m – Si m/La', de: 1, a: 2 }, { titre: 'Sol maj7 – Mi m9', de: 3, a: 4 }, { titre: 'Deuxième tour et fin', de: 5, a: 9 }],
    description: 'D’après une vidéo TikTok (@maesstttro) : quatre accords égrenés, avec les cases affichées à l’écran (2 4 0 · 0 4 0 · 3 4 0 · 0 4). L’annulaire reste posé tout le long case 4 sur la 4e corde (Fa♯), et la 2e corde sonne à vide (Si) : seule la basse change, au pouce. Si (5e corde, case 2, index), La (5e à vide), Sol (6e corde, case 3, majeur), Mi (6e à vide) : la basse descend, les notes du dessus restent. Une mesure par accord, en croches pouce – index – majeur – index. Les accords : en Si mineur, Si m, Si m avec La à la basse, Sol maj7 et Mi m9. La vidéo ne donne pas le titre.',
    notes: (function () {
      var n = arpegeTT(fois2(2, SI_M).concat([{ accord: 'Gmaj7', notes: [[6, 3, 2, 'p', 0], [4, 4, 3, 'i', 0], [2, 0, 0, 'm', 4]] }]));
      // Le dernier accord est plaqué : les trois notes ensemble, tenues.
      var fin = n.slice(-3), t = fin[0].temps;
      fin.forEach(function (x) { x.temps = t; x.duree = 4; });
      return n;
    })()
  });

  /* Grilles vues sur TikTok, titre non indiqué : les accords seuls, pas la
   * mélodie de la vidéo (on ne sait pas si elle est sous droits). */
  exerciceAccords({
    id: 'tiktok-grille-em-c-am-d', titre: 'Grille Mi m – Do – La m – Ré (i – VI – iv – VII)', categorie: 'tiktok',
    sous_titre: 'TikTok · @wiragustiii · grille d’accords · titre non indiqué', niveau: 2, tempo: 90,
    description: 'Les quatre accords affichés dans une vidéo TikTok (@wiragustiii), une mesure chacun. La vidéo joue une mélodie sur la 1re corde par-dessus ; titre non indiqué, donc ici la grille seule, ni mélodie ni paroles. Balayé, puis arpège.',
    paliers: [
      { motif: 'balaye', grille: ['Em', 'C', 'Am', 'D'], tours: 2 },
      { motif: 'arpege', grille: ['Em', 'C', 'Am', 'D'], tours: 2 }
    ]
  });

  exerciceAccords({
    id: 'tiktok-grille-c-g-am-f', titre: 'Grille Do – Sol – La m – Fa (I – V – vi – IV)', categorie: 'tiktok',
    sous_titre: 'TikTok · @dr_guitarap, @wiragustiii · grille d’accords · titre non indiqué', niveau: 3, tempo: 80,
    description: 'La grille de deux vidéos TikTok (@dr_guitarap, @wiragustiii), deux mesures par accord, et Sol pour finir. Les vidéos jouent une mélodie en fingerstyle par-dessus ; titre non indiqué, donc ici la grille seule, ni mélodie ni paroles. Fa est barré.',
    paliers: [
      { motif: 'balaye', grille: ['C', 'C', 'G', 'G', 'Am', 'Am', 'F', 'F'] },
      { motif: 'arpege', grille: ['C', 'C', 'G', 'G', 'Am', 'Am', 'F', 'F'] },
      { motif: 'arpege', grille: ['C', 'C', 'G', 'G', 'Am', 'Am', 'F', 'G'] }
    ]
  });

  /* Le pouce avec la main gauche : l'étape suivante, une fois le pouce sûr
   * de lui sur les cordes à vide (rubrique à part dans la liste). */
  ajoute({
    id: 'pouce-gamme-sol', titre: 'Gamme de Sol dans les basses', sous_titre: 'Pouce + main gauche · cordes 6, 5, 4 et 3',
    niveau: 2, tempo: 60, signature: [4, 4], categorie: 'pouce-main',
    description: 'Sol, La, Si, Do, Ré, Mi, Fa♯, Sol : la gamme de Sol majeur en première position, au pouce. Main gauche : un doigt par case (case 2 = majeur, case 3 = annulaire, case 4 = auriculaire). Montée et descente en noires, puis en croches.',
    notes: (function () {
      var g = ['sol2', 'la2', 'si2', 'do3', 're3', 'mi3', 'fa#3', 'sol3'];
      var d = g.slice(0, -1).reverse();
      var suite = g.concat(d).map(function (x) { return [x, 1]; }).concat([['-', 1]])
        .concat(g.concat(d).map(function (x) { return [x, 0.5]; })).concat([['-', 0.5], ['sol2', 4]]);
      return melodie(suite, { main: 'p' });
    })()
  });

  [
    { id: 'pouce-em-am', titre: 'Basses au pouce : Mi mineur et La mineur', niveau: 1, tempo: 66, grille: ['Em', 'Am', 'Em', 'Am'],
      description: 'Em : basse sur la 6e corde, basse alternée sur la 4e. Am : basse sur la 5e, alternée sur la 4e. Le pouce change de corde, la main gauche glisse d’une corde.' },
    { id: 'pouce-g-c-d', titre: 'Basses au pouce : Sol, Do, Ré', niveau: 2, tempo: 66, grille: ['G', 'C', 'D', 'D'],
      description: 'Sol : basse 6e corde. Do : 5e corde. Ré : 4e corde. Le pouce suit la basse de chaque accord : c’est elle qui fait entendre le changement.' },
    { id: 'pouce-a-d-e', titre: 'Basses au pouce : La, Ré, Mi', niveau: 2, tempo: 72, grille: ['A', 'D', 'E', 'E'],
      description: 'Les trois accords du rock et du reggae (Three Little Birds, Stir It Up…). La : basse 5e corde. Ré : 4e. Mi : 6e.' },
    { id: 'pouce-blues', titre: 'Blues en La au pouce', niveau: 2, tempo: 80,
      grille: ['A7', 'A7', 'A7', 'A7', 'D7', 'D7', 'A7', 'A7', 'E7', 'D7', 'A7', 'E7'],
      description: 'La grille de blues en 12 mesures, avec les septièmes. Le pom-tcha du pouce suffit à faire tourner le blues.' }
  ].forEach(function (d) {
    exerciceAccords({
      id: d.id, titre: d.titre, niveau: d.niveau, tempo: d.tempo, categorie: 'pouce-main',
      sous_titre: 'Pouce + main gauche · ' + d.grille.filter(function (x, i, t) { return t.indexOf(x) === i; }).join(' – '),
      description: d.description,
      paliers: [{ motif: 'basses-alternees', grille: d.grille, tours: d.grille.length > 4 ? 1 : 2 },
                { motif: 'basse-balaye', grille: d.grille, tours: d.grille.length > 4 ? 1 : 2 },
                { motif: 'balaye-noires', grille: d.grille }]
    });
  });

  // Mélodies déjà connues, une octave plus bas : elles tombent sur les cordes
  // graves, le terrain du pouce.
  ['hot-cross-buns', 'au-clair', 'mary-agneau', 'ode-joie', 'frere-jacques', 'saints', 'joyeux-anniversaire'].forEach(function (id) {
    var src = PIECES.filter(function (p) { return p.id === id; })[0];
    if (!src) return;
    ajoute({
      id: 'pouce-' + id, titre: src.titre + ' au pouce', sous_titre: 'Pouce + main gauche · mélodie une octave plus bas',
      niveau: src.niveau, tempo: src.tempo, signature: src.signature, categorie: 'pouce-main',
      description: 'La mélodie de « ' + src.titre + ' », une octave plus bas, entièrement au pouce. Elle passe sur les cordes graves : la main gauche garde un doigt par case, le pouce droit butte sur la corde voisine à chaque note.',
      notes: src.notes.map(function (n) {
        var pos = caseEnPremierePosition(n.midi - 12);
        var x = { corde: pos.corde, frette: pos.frette, temps: n.temps, duree: n.duree, midi: n.midi - 12, main: 'p' };
        if (pos.frette > 0) x.doigt = Math.min(4, pos.frette);
        return x;
      })
    });
  });

  // Chansons au pouce : même grille, accompagnement pom-tcha, rien d'autre
  // que le pouce. (Le motif « rock » des chansons rock est déjà tout au pouce.)
  var POUCE_CHANSON = { texte: 'Pom-tcha au pouce : la basse au 1er temps, l’accord balayé au 2e, la basse alternée au 3e, balayé au 4e.',
    pas: MOTIFS['basse-balaye'].motif };
  ['ch-santiano', 'ch-three-little-birds', 'ch-riptide', 'ch-knockin', 'ch-linger', 'ch-sweet-home-alabama'].forEach(function (cid) {
    var c = (global.CHANSONS || []).filter(function (x) { return x.id === cid; })[0];
    if (!c) return;
    var dico = {}, ordre = [];
    c.sections.forEach(function (s) { s.grille.forEach(function (g) { String(g).split('|').forEach(function (id) {
      if (!dico[id]) { dico[id] = accordChanson(id); ordre.push(id); }
    }); }); });
    var mesure = 1, sections = [];
    c.sections.forEach(function (s) {
      var n = s.grille.length * (s.tours || 1);
      sections.push({ titre: s.titre, de: mesure, a: mesure + n - 1, texte: s.grille.join(' · ').replace(/\|/g, ' / ') + ' — ' + POUCE_CHANSON.texte });
      mesure += n;
    });
    ajoute({
      id: 'pouce-' + cid, titre: c.titre + ' au pouce', chanson: true, categorie: 'pouce-main', artiste: c.artiste,
      sous_titre: c.artiste + ' · pouce + main gauche' + (c.capo ? ' · capo case ' + c.capo : ''),
      niveau: 2, tempo: Math.min(c.tempo, 90), signature: [4, 4], capo: c.capo || 0,
      description: 'La grille de « ' + c.titre + ' » accompagnée au pouce seul (pom-tcha). Accompagnement écrit pour cette app : ni mélodie ni paroles, elles sont sous droits. ' +
        (c.capo ? 'Capodastre case ' + c.capo + '. ' : '') + 'Accords : ' + ordre.join(', ') + '.',
      sections: sections,
      mains: { gauche: ordre.map(function (id) { return dico[id]; }), droite: [POUCE_CHANSON.texte] },
      notes: accompagnement(dico, c.sections.map(function (s) { return { tours: s.tours || 1, grille: s.grille, motif: POUCE_CHANSON.pas }; }))
    });
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
             texte: 'Une guitare fausse rend tout plus dur à entendre. Écoute les six cordes de référence et accorde les tiennes à l’oreille, une par une, jusqu’à ce qu’elles sonnent pareil.',
             bouton: '🎵 Cordes de référence', action: { type: 'reference' } });
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

  /* Versions simplifiées, calculées à partir de la tablature d'origine.
   * L'harmonie reste celle du morceau :
   *  - la mélodie : la note la plus haute de chaque attaque ; dans un temps
   *    très chargé (arpège en doubles croches), seulement la plus haute du
   *    temps, posée sur le temps ;
   *  - la basse : la plus grave au premier temps de chaque mesure (et au
   *    3e temps d'une mesure à 4 temps si l'accord change), ramenée sur les
   *    cordes 6 à 4, cases 0 à 4 ;
   *  - tout en première position : une note trop haute descend d'une octave
   *    (même nom de note, donc même accord). Les voix intérieures tombent.
   * Proposée sur la fiche de l'original et dans « Versions simplifiées ». */
  var VIDE = { 1: 64, 2: 59, 3: 55, 4: 50, 5: 45, 6: 40 };
  function placerMelodie(m, interdites) {
    for (var c = 1; c <= 6; c++) {
      if (interdites.indexOf(c) !== -1) continue;
      var f = m - VIDE[c];
      if (f >= 0 && f <= 4) return { corde: c, frette: f };
    }
    return null;
  }
  function placerBasse(m) {
    while (m > 52) m -= 12;
    while (m < 40) m += 12;
    var mieux = null;
    [6, 5, 4].forEach(function (c) {
      var f = m - VIDE[c];
      if (f >= 0 && f <= 4 && (!mieux || f < mieux.frette)) mieux = { corde: c, frette: f, midi: m };
    });
    return mieux;
  }
  function simplifier(p) {
    var sig = p.signature || [4, 4], parMesure = sig[0] * 4 / sig[1];
    var fin = p.notes.reduce(function (t, n) { return Math.max(t, n.temps + n.duree); }, 0);
    var attaques = {};
    p.notes.forEach(function (n) { (attaques[n.temps] = attaques[n.temps] || []).push(n); });
    var temps = Object.keys(attaques).map(Number).sort(function (a, b) { return a - b; });
    // Mélodie : la plus haute de chaque attaque, puis allègement temps par temps.
    var haut = temps.map(function (t) {
      return { temps: t, midi: Math.max.apply(null, attaques[t].map(function (n) { return n.midi; })) };
    });
    var unite = parMesure % 1 ? 0.5 : 1, mel = [];
    for (var b = 0; b < fin; b += unite) {
      var dans = haut.filter(function (x) { return x.temps >= b - 1e-9 && x.temps < b + unite - 1e-9; });
      if (dans.length <= 2) mel = mel.concat(dans);
      else mel.push({ temps: b, midi: Math.max.apply(null, dans.map(function (x) { return x.midi; })) });
    }
    // Notes de passage rapides (double croche hors du temps et du demi-temps) :
    // elles tombent, la note d'avant dure jusqu'à la suivante.
    mel = mel.filter(function (x, i) {
      var suiv = i + 1 < mel.length ? mel[i + 1].temps : fin;
      return suiv - x.temps >= 0.5 - 1e-9 || Math.abs(x.temps * 2 - Math.round(x.temps * 2)) < 1e-9;
    });
    // Une seule octave pour tout le morceau quand c'est possible.
    var hors = function (k) { return mel.filter(function (x) { return x.midi + k > 68 || x.midi + k < 40; }).length; };
    // (on garde l'octave d'origine tant que peu de notes en sortent).
    var decal = hors(0) <= mel.length * 0.2 ? 0 : [0, -12, 12].sort(function (a, b) { return hors(a) - hors(b); })[0];
    // Basse : premier temps (et milieu de mesure à 4 temps si elle change).
    var basses = [];
    for (var t = 0; t < fin; t += parMesure) {
      [0].concat(parMesure === 4 ? [2] : []).forEach(function (d) {
        var g = p.notes.filter(function (n) { return n.temps >= t + d - 1e-9 && n.temps < t + d + 0.5 - 1e-9; });
        if (!g.length) return;
        var bas = g.reduce(function (a, n) { return n.midi < a.midi ? n : a; });
        if (d && basses.length && basses[basses.length - 1].orig % 12 === bas.midi % 12) return;
        var pl = placerBasse(bas.midi);
        if (pl) basses.push({ temps: t + d, corde: pl.corde, frette: pl.frette, midi: pl.midi, orig: bas.midi });
      });
    }
    basses.forEach(function (x, i) {
      var suiv = i + 1 < basses.length ? basses[i + 1].temps : fin;
      x.duree = Math.min(suiv, x.temps + parMesure) - x.temps;
    });
    // 1. Hauteur de chaque note de mélodie (octave), et la basse qui sonne dessous.
    var etapes = [];
    mel.forEach(function (x, i) {
      var m = x.midi + decal;
      while (m > 68) m -= 12;
      while (m < 40) m += 12;
      var sonne = basses.filter(function (bb) { return bb.temps <= x.temps + 1e-9 && x.temps < bb.temps + bb.duree - 1e-9; })[0];
      // Passage à une voix : la note grave EST la basse, on ne la double pas.
      if (sonne && sonne.temps === x.temps && x.midi === sonne.orig) return;
      var interdites = sonne ? [sonne.corde] : [];
      if (!placerMelodie(m, interdites) && m + 12 <= 68) m += 12;
      if (sonne && sonne.midi >= m && m + 12 <= 68 && placerMelodie(m + 12, interdites)) m += 12;   // au-dessus de la basse
      var cands = [];
      [m, m - 12, m + 12].forEach(function (h, o) {
        if (h > 68 || h < 40 || (o && sonne && h <= sonne.midi)) return;
        for (var c = 1; c <= 6; c++) {
          var f = h - VIDE[c];
          if (f >= 0 && f <= 4 && interdites.indexOf(c) === -1) cands.push({ corde: c, frette: f, midi: h, octave: o ? 1 : 0 });
        }
      });
      if (!cands.length) return;
      if (sonne && sonne.midi >= m) sonne.sacrifiee = sonne.temps === x.temps || sonne.sacrifiee;
      var suiv = i + 1 < mel.length ? mel[i + 1].temps : fin;
      etapes.push({ temps: x.temps, midi: m, duree: Math.max(0.25, suiv - x.temps), cands: cands, sonne: sonne });
    });
    /* 2. Le placement le plus économe en mouvements, sur tout le morceau
     * (programmation dynamique) : corde à vide plutôt qu'un doigt, pas
     * d'auriculaire (case 4) si on peut l'éviter, rester sur la même corde
     * ou la voisine, peu de cases d'écart d'une note à l'autre, et jamais
     * d'écart de plus de 3 cases avec la basse tenue. */
    function coutCase(e, k) {
      var c = e.cands[k], v = 0;
      if (c.frette === 4) v += 1.5;
      if (c.octave) v += 2.5;            // changer d'octave : seulement si ça évite vraiment des mouvements
      var b = e.sonne && !e.sonne.sacrifiee ? e.sonne : null;
      if (b && b.frette && c.frette && Math.abs(b.frette - c.frette) > 3) v += 4;
      return v;
    }
    function coutPassage(a, b) {
      var v = Math.max(0, Math.abs(a.corde - b.corde) - 1) * 1.2 + Math.min(1, Math.abs(a.corde - b.corde)) * 0.3;
      if (b.frette && !(a.corde === b.corde && a.frette === b.frette)) v += 1;   // un doigt de plus à poser
      if (a.frette && b.frette && a.frette !== b.frette) v += Math.abs(a.frette - b.frette) * 0.8;
      return v;
    }
    var meilleur = [], depuis = [];
    etapes.forEach(function (e, i) {
      meilleur[i] = []; depuis[i] = [];
      e.cands.forEach(function (c, k) {
        var base = coutCase(e, k);
        if (!i) { meilleur[i][k] = base; return; }
        var best = Infinity, arg = 0;
        etapes[i - 1].cands.forEach(function (c0, k0) {
          var v = meilleur[i - 1][k0] + coutPassage(c0, c);
          if (v < best) { best = v; arg = k0; }
        });
        meilleur[i][k] = best + base; depuis[i][k] = arg;
      });
    });
    var notes = [];
    if (etapes.length) {
      var dern = etapes.length - 1, kk = 0;
      meilleur[dern].forEach(function (v, k) { if (v < meilleur[dern][kk]) kk = k; });
      for (var ie = dern; ie >= 0; ie--) {
        var e = etapes[ie], c = e.cands[kk];
        notes.unshift({ temps: e.temps, corde: c.corde, frette: c.frette, midi: c.midi, duree: e.duree });
        // Basse tenue trop loin de la main : elle tombe, la mélodie passe avant.
        if (e.sonne && e.sonne.frette && c.frette && Math.abs(e.sonne.frette - c.frette) > 3 && e.sonne.temps === e.temps) e.sonne.sacrifiee = true;
        if (ie) kk = depuis[ie][kk];
      }
    }
    basses.forEach(function (x) {
      if (x.sacrifiee) return;
      if (notes.some(function (n) { return n.temps === x.temps && n.midi === x.midi; })) return;
      notes.push({ temps: x.temps, corde: x.corde, frette: x.frette, midi: x.midi, duree: x.duree });
    });
    notes.sort(function (a, b) { return a.temps - b.temps || b.corde - a.corde; });
    // Une corde ne sonne qu'une note : la précédente s'arrête quand la suivante attaque.
    notes.forEach(function (n, i) {
      for (var k = i + 1; k < notes.length; k++) {
        if (notes[k].corde === n.corde && notes[k].temps > n.temps) { n.duree = Math.min(n.duree, notes[k].temps - n.temps); break; }
      }
    });
    return notes;
  }
  /* Mouvements des doigts : à gauche, chaque doigt qui se pose sur une case
   * qu'il ne tenait pas déjà, chaque déplacement de la main le long du manche
   * (elle couvre quatre cases) et chaque note à l'auriculaire ; à droite,
   * chaque saut de corde de la mélodie (au-delà de la corde voisine). */
  function mouvements(p) {
    var parT = {}, temps = [];
    p.notes.forEach(function (n) { if (!parT[n.temps]) { parT[n.temps] = []; temps.push(n.temps); } parT[n.temps].push(n); });
    temps.sort(function (a, b) { return a - b; });
    var poses = 0, deplacements = 0, auriculaire = 0, sauts = 0, tenus = {}, pos = 1, hautPrec = null;
    temps.forEach(function (t) {
      var encore = {};
      p.notes.forEach(function (n) { if (n.frette && n.temps < t && t < n.temps + n.duree - 1e-9) encore[n.corde + ':' + n.frette] = 1; });
      parT[t].forEach(function (n) {
        if (!n.frette) return;
        var cle = n.corde + ':' + n.frette;
        if (!tenus[cle] || !encore[cle]) poses++;
        encore[cle] = 1;
        if (n.frette < pos || n.frette > pos + 3) { deplacements++; pos = n.frette > 4 ? n.frette - 3 : 1; }
      });
      tenus = encore;
      // Main droite : saut de corde de la voix du dessus (au-delà de la voisine).
      var h = Math.min.apply(null, parT[t].map(function (n) { return n.corde; }));
      if (hautPrec !== null && Math.abs(h - hautPrec) > 1) sauts++;
      hautPrec = h;
      auriculaire += parT[t].filter(function (n) { return n.doigt === 4; }).length;
    });
    return { poses: poses, deplacements: deplacements, auriculaire: auriculaire, sauts: sauts,
             total: poses + 2 * deplacements + auriculaire + sauts };
  }

  var SIMPLIFIABLES = PIECES.filter(function (p) {
    if (p.chanson || p.artiste || p.categorie || p.versionDe || !p.notes.length) return false;
    var parT = {};
    p.notes.forEach(function (n) { parT[n.temps] = (parT[n.temps] || 0) + 1; });
    var poly = Object.keys(parT).some(function (t) { return parT[t] >= 2; });
    return p.source ? true : poly && p.niveau >= 3;
  });
  SIMPLIFIABLES.forEach(function (p) {
    var notes = completerDoigtes(simplifier(p));
    var mvS = mouvements({ notes: notes }), mvO = mouvements(p);
    if (mvS.total > mvO.total * 0.85 || mvS.sauts > mvO.sauts * 1.5 + 3) return;   // pas assez de mouvements en moins
    var hautOrig = Math.max.apply(null, p.notes.map(function (n) { return n.frette; }));
    if (notes.length >= p.notes.length * 0.85 && hautOrig <= 5) return;   // rien à gagner
    var id = p.id + '-simple';
    p.simple = id;
    ajoute({
      id: id, titre: p.titre + ' — version simplifiée',
      sous_titre: p.sous_titre + ' · simplifiée, première position',
      niveau: Math.max(1, p.niveau - 1), tempo: p.tempo, tempoOriginal: p.tempoOriginal, signature: p.signature,
      categorie: 'simplifiee', simplifieDe: p.id, source: p.source,
      description: 'Version simplifiée de « ' + p.titre + ' », calculée par l’app à partir de la tablature d’origine : la mélodie (la note la plus haute) et la basse au premier temps, qui gardent l’harmonie du morceau ; les voix intérieures tombent et tout se joue en première position (une note trop haute descend d’une octave : même nom de note, donc même accord). ' +
        p.notes.length + ' notes dans l’original, ' + notes.length + ' ici. Les cases sont choisies pour bouger le moins possible : cordes à vide d’abord, même corde ou corde voisine, pas d’auriculaire quand on peut l’éviter.',
      notes: notes
    });
  });

  function tous() { return PIECES.slice(); }
  function get(id) { for (var i = 0; i < PIECES.length; i++) if (PIECES[i].id === id) return PIECES[i]; return null; }

  global.Morceaux = {
    tous: tous, get: get, simplifier: simplifier, mouvements: mouvements, melodie: melodie, arpeges: arpeges, etapes: etapes, completerDoigtes: completerDoigtes,
    caseEnPremierePosition: caseEnPremierePosition, midiDeNom: midiDeNom
  };
})(typeof window !== 'undefined' ? window : globalThis);
