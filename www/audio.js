/* Son : cordes pincées et métronome, entièrement synthétisés.
 *
 * Pourquoi pas des échantillons : six cordes × dix-neuf frettes, ce sont des
 * dizaines de mégaoctets d'audio à embarquer, à télécharger et dont il faut
 * connaître la licence. Karplus-Strong donne une corde pincée convaincante en
 * quelques lignes — et permet de jouer N'IMPORTE quelle note du manche.
 *
 * Principe : une salve de bruit dans une ligne à retard dont la longueur fixe
 * la hauteur (retard = fréquence d'échantillonnage / fréquence), rebouclée sur
 * elle-même à travers un filtre passe-bas. Le filtre mange les aigus un peu
 * plus vite que les graves, exactement comme une vraie corde. Le nylon se
 * distingue de l'acier par une attaque plus douce et un amortissement plus
 * rapide des harmoniques : c'est le réglage par défaut ici.
 */
(function (global) {
  'use strict';

  var ctx = null;
  var maitre = null;
  var cache = {};       // buffers déjà calculés, indexés par note + timbre
  var suspendu = false;
  // Tout ce qui est programmé mais pas encore terminé. Un morceau est
  // programmé EN ENTIER d'avance sur l'horloge audio (c'est ce qui le garde
  // juste) : sans ce registre, le bouton « Arrêter » ne pouvait qu'arrêter le
  // surlignage, et la musique continuait toute seule jusqu'au bout.
  var enCours = [];

  // Un AudioContext créé hors d'un geste de l'utilisateur démarre « suspended »
  // sur mobile et reste muet : on le crée au premier son demandé.
  function contexte() {
    if (!ctx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      maitre = ctx.createGain();
      maitre.gain.value = 0.9;

      /* La caisse de résonance.
       *
       * Une corde pincée seule sonne « électrique » : maigre, brillante, sans
       * corps. Sur une guitare classique, l'essentiel du son vient de la table
       * et du volume d'air, qui remontent quelques bandes précises :
       * la résonance de Helmholtz (l'air de la caisse par la rosace, ~100 Hz),
       * le premier mode de la table (~200 Hz), un mode du fond (~400 Hz), plus
       * une zone médium qui donne le « bois » (~1 kHz).
       *
       * Trois cloches et un passe-bas suffisent à en donner l'impression — une
       * vraie convolution demanderait un fichier de réponse impulsionnelle,
       * c'est-à-dire exactement ce que cette app évite.
       */
      var corps = ctx.createBiquadFilter();
      corps.type = 'peaking'; corps.frequency.value = 100; corps.Q.value = 3.5; corps.gain.value = 7;
      var table = ctx.createBiquadFilter();
      table.type = 'peaking'; table.frequency.value = 205; table.Q.value = 3; table.gain.value = 5;
      var bois = ctx.createBiquadFilter();
      bois.type = 'peaking'; bois.frequency.value = 420; bois.Q.value = 2.2; bois.gain.value = 3.5;
      // Les nylons n'ont presque rien au-dessus de 5 kHz : ce qui reste est
      // précisément ce qui fait « électrique » à l'oreille.
      var doux = ctx.createBiquadFilter();
      doux.type = 'lowpass'; doux.frequency.value = 4800; doux.Q.value = 0.7;

      maitre.connect(corps); corps.connect(table); table.connect(bois);
      bois.connect(doux); doux.connect(ctx.destination);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function pret() { return !!contexte(); }

  function volume(v) { if (maitre) maitre.gain.value = Math.max(0, Math.min(1, v)); }

  // --- Corde pincée ---------------------------------------------------------
  function bufferCorde(freq, duree, timbre) {
    var c = contexte();
    if (!c) return null;
    var cle = freq.toFixed(2) + '|' + duree + '|' + timbre;
    if (cache[cle]) return cache[cle];

    var sr = c.sampleRate;
    var n = Math.max(1, Math.floor(sr * duree));
    var buf = c.createBuffer(1, n, sr);
    var out = buf.getChannelData(0);

    var L = Math.max(2, Math.round(sr / freq));
    var ligne = new Float32Array(L);

    /* Excitation.
     *
     * Trois choses distinguent une nylon d'une corde d'acier, et elles se
     * jouent toutes ici :
     *
     * 1. Le doigt est LARGE et MOU. Il n'excite pas les harmoniques aiguës :
     *    on lisse fortement le bruit de départ (fenêtre proportionnelle à la
     *    longueur de la corde, pas un nombre fixe d'échantillons, sinon les
     *    notes graves restent brillantes et les aiguës deviennent sourdes).
     * 2. On pince à un ENDROIT précis, autour du cinquième de la corde : les
     *    harmoniques dont un nœud tombe là sont absentes. C'est le peigne
     *    ci-dessous, et c'est lui qui donne le timbre « creux » reconnaissable.
     * 3. L'attaque n'est pas un clic : une rampe de quelques millisecondes.
     */
    var acier = timbre === 'acier';
    var lissage = Math.max(1, Math.round(L * (acier ? 0.02 : 0.08)));
    var brut = new Float32Array(L);
    for (var i = 0; i < L; i++) brut[i] = Math.random() * 2 - 1;
    var lisse = new Float32Array(L);
    for (i = 0; i < L; i++) {
      var somme = 0;
      for (var k = 0; k < lissage; k++) somme += brut[(i + k) % L];
      lisse[i] = somme / lissage;
    }
    var pincement = Math.max(1, Math.round(L * (acier ? 0.12 : 0.2)));
    for (i = 0; i < L; i++) ligne[i] = lisse[i] - lisse[(i + pincement) % L];
    // La différence de deux bruits peut, par malchance, dépasser 1 et saturer :
    // on ramène la crête de l'excitation à 0,9, quel que soit le tirage.
    var crete = 0;
    for (i = 0; i < L; i++) crete = Math.max(crete, Math.abs(ligne[i]));
    if (crete > 0.9) for (i = 0; i < L; i++) ligne[i] *= 0.9 / crete;

    /* Boucle.
     *
     * Le nylon perd ses aigus beaucoup plus vite que l'acier, et les notes
     * hautes s'éteignent plus vite que les basses — d'où un amortissement qui
     * dépend de la fréquence. Sans cette dépendance, les aiguës « tiennent »
     * comme une corde d'acier neuve, ce qui s'entend tout de suite.
     */
    var amorti = acier ? 0.9975 : (0.9965 - Math.min(0.004, freq / 180000));
    var brillance = acier ? 0.62 : 0.42;   // part du courant dans le filtre
    var idx = 0;
    var precedent = 0;
    for (i = 0; i < n; i++) {
      var courant = ligne[idx];
      var filtre = (brillance * courant + (1 - brillance) * precedent) * amorti;
      precedent = courant;
      ligne[idx] = filtre;
      out[i] = courant;
      idx = (idx + 1) % L;
    }

    // Attaque : 4 ms de rampe. Un départ net produit un clic qui s'entend
    // comme une attaque au médiator — l'inverse du geste recherché.
    var attaque = Math.min(n, Math.floor(sr * 0.004));
    for (i = 0; i < attaque; i++) out[i] *= i / attaque;

    // Fondu de fin : couper net une corde encore vibrante fait un « clic ».
    var fondu = Math.min(n, Math.floor(sr * 0.05));
    for (i = 0; i < fondu; i++) out[n - 1 - i] *= i / fondu;

    cache[cle] = buf;
    return buf;
  }

  function jouerFreq(freq, opts) {
    opts = opts || {};
    var c = contexte();
    if (!c || suspendu) return;
    var duree = opts.duree || 2.2;
    var buf = bufferCorde(freq, duree, opts.timbre || 'nylon');
    if (!buf) return;
    var src = c.createBufferSource();
    src.buffer = buf;
    var g = c.createGain();
    g.gain.value = opts.volume == null ? 0.55 : opts.volume;
    src.connect(g).connect(maitre);
    var quand = c.currentTime + (opts.retard || 0);
    src.start(quand);
    var entree = { src: src, gain: g, fin: quand + duree };
    enCours.push(entree);
    src.onended = function () {
      var i = enCours.indexOf(entree);
      if (i !== -1) enCours.splice(i, 1);
    };
    // Note « étouffée » explicitement (changement d'accord) : on coupe en 80 ms.
    if (opts.couperApres) {
      g.gain.setValueAtTime(g.gain.value, quand + opts.couperApres);
      g.gain.linearRampToValueAtTime(0.0001, quand + opts.couperApres + 0.08);
      src.stop(quand + opts.couperApres + 0.1);
    }
    return src;
  }

  function jouerNote(midi, opts) { return jouerFreq(Theorie.freqDeMidi(midi), opts); }

  function jouerCase(corde, frette, opts) {
    return jouerFreq(Theorie.freqDeCase(corde, frette), opts);
  }

  // --- Accord gratté --------------------------------------------------------
  // Un accord n'est pas six notes simultanées : le médiator ou le pouce
  // traverse les cordes en 20 à 60 ms, et c'est ce décalage qu'on entend comme
  // « un accord » plutôt que comme un cluster.
  function jouerAccord(frettes, opts) {
    opts = opts || {};
    var notes = Theorie.notesDeGrille(frettes);
    var sens = opts.sens === 'haut' ? -1 : 1;   // 'bas' = du grave vers l'aigu
    notes.sort(function (a, b) { return sens * (b.corde - a.corde); });
    var ecart = opts.ecart == null ? 0.035 : opts.ecart;
    notes.forEach(function (n, i) {
      jouerFreq(Theorie.freqDeMidi(n.midi), {
        retard: (opts.retard || 0) + i * ecart,
        duree: opts.duree || 2.6,
        volume: opts.volume == null ? 0.42 : opts.volume,
        timbre: opts.timbre
      });
    });
    return notes.length;
  }

  // --- Métronome ------------------------------------------------------------
  // Les minuteurs JavaScript dérivent de plusieurs dizaines de millisecondes :
  // inutilisable pour un métronome. On programme donc les clics À L'AVANCE sur
  // l'horloge audio (précise à l'échantillon), et le minuteur ne sert qu'à
  // réveiller le programmateur assez souvent.
  var metro = {
    actif: false, tempo: 80, parMesure: 4, battement: 0,
    prochain: 0, timer: null, surBattement: null, subdivision: 1
  };
  var AVANCE = 0.12;     // horizon de programmation, en secondes
  var REVEIL = 25;       // période du minuteur, en millisecondes

  function clic(quand, accentue, faible) {
    var c = contexte();
    var osc = c.createOscillator();
    var g = c.createGain();
    // Enregistré comme une note : les clics du décompte et du métronome de
    // lecture sont programmés d'avance, « Arrêter » doit les couper aussi.
    var entree = { src: osc, gain: null, fin: quand + 0.12 };
    enCours.push(entree);
    osc.onended = function () {
      var i = enCours.indexOf(entree);
      if (i !== -1) enCours.splice(i, 1);
    };
    osc.frequency.value = accentue ? 1600 : (faible ? 900 : 1200);
    osc.type = 'square';
    g.gain.setValueAtTime(0.0001, quand);
    g.gain.exponentialRampToValueAtTime(accentue ? 0.5 : (faible ? 0.12 : 0.28), quand + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, quand + (accentue ? 0.09 : 0.05));
    osc.connect(g).connect(maitre);
    osc.start(quand);
    osc.stop(quand + 0.12);
  }

  function programmer() {
    var c = contexte();
    if (!c) return;
    var pas = 60 / metro.tempo / metro.subdivision;
    while (metro.prochain < c.currentTime + AVANCE) {
      var sousPas = metro.battement % metro.subdivision;
      var temps = Math.floor(metro.battement / metro.subdivision) % metro.parMesure;
      clic(metro.prochain, sousPas === 0 && temps === 0, sousPas !== 0);
      if (metro.surBattement) {
        // Callback visuel : on passe l'instant audio, l'affichage se cale
        // dessus plutôt que sur l'instant où le minuteur s'est réveillé.
        metro.surBattement(temps, sousPas, metro.prochain);
      }
      metro.prochain += pas;
      metro.battement++;
    }
  }

  function demarrerMetronome(opts) {
    opts = opts || {};
    var c = contexte();
    if (!c) return false;
    arreterMetronome();
    metro.tempo = opts.tempo || metro.tempo;
    metro.parMesure = opts.parMesure || metro.parMesure;
    metro.subdivision = opts.subdivision || 1;
    metro.surBattement = opts.surBattement || null;
    metro.battement = 0;
    metro.prochain = c.currentTime + 0.08;
    metro.actif = true;
    metro.timer = setInterval(programmer, REVEIL);
    programmer();
    return true;
  }

  function arreterMetronome() {
    if (metro.timer) clearInterval(metro.timer);
    metro.timer = null;
    metro.actif = false;
  }

  function tempoMetronome(bpm) {
    metro.tempo = Math.max(30, Math.min(260, bpm));
    return metro.tempo;
  }

  function metronomeActif() { return metro.actif; }

  /* Coupe tout ce qui sonne ou attend son tour.
   *
   * Fondu de 60 ms plutôt qu'un stop() sec : couper une corde en pleine
   * vibration produit un clic très audible. Les sources dont le départ est
   * encore dans le futur sont simplement arrêtées — rien à fondre. */
  function couperTout() {
    var c = ctx;
    if (!c) return 0;
    var n = enCours.length;
    enCours.slice().forEach(function (e) {
      try {
        if (e.gain) {
          var maintenant = c.currentTime;
          e.gain.gain.cancelScheduledValues(maintenant);
          e.gain.gain.setValueAtTime(e.gain.gain.value, maintenant);
          e.gain.gain.linearRampToValueAtTime(0.0001, maintenant + 0.06);
        }
        e.src.stop(c.currentTime + 0.07);
      } catch (err) { /* source déjà terminée : rien à faire */ }
    });
    enCours = [];
    return n;
  }

  function silence(v) { suspendu = !!v; }

  // Clic isolé, programmé `retard` secondes plus tard : décompte et métronome
  // pendant la lecture d'un morceau (qui, lui aussi, est programmé d'avance).
  function jouerClic(retard, accentue) {
    var c = contexte();
    if (!c || suspendu) return;
    clic(c.currentTime + (retard || 0), !!accentue, false);
  }

  global.Audio5 = {
    pret: pret, volume: volume, silence: silence,
    contexte: contexte,
    jouerFreq: jouerFreq, jouerNote: jouerNote, jouerCase: jouerCase, jouerAccord: jouerAccord,
    couperTout: couperTout, jouerClic: jouerClic,
    demarrerMetronome: demarrerMetronome, arreterMetronome: arreterMetronome,
    tempoMetronome: tempoMetronome, metronomeActif: metronomeActif
  };
})(typeof window !== 'undefined' ? window : globalThis);
