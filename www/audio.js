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

  // Un AudioContext créé hors d'un geste de l'utilisateur démarre « suspended »
  // sur mobile et reste muet : on le crée au premier son demandé.
  function contexte() {
    if (!ctx) {
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      maitre = ctx.createGain();
      maitre.gain.value = 0.9;
      maitre.connect(ctx.destination);
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

    // Excitation. Le nylon attaque moins « claquant » que l'acier : on adoucit
    // la salve de bruit par une moyenne glissante, ce qui retire les aigus les
    // plus durs avant même la boucle.
    var doux = timbre === 'acier' ? 1 : 3;
    var brut = new Float32Array(L);
    for (var i = 0; i < L; i++) brut[i] = Math.random() * 2 - 1;
    for (i = 0; i < L; i++) {
      var s = 0;
      for (var k = 0; k < doux; k++) s += brut[(i + k) % L];
      ligne[i] = s / doux;
    }

    // Amortissement : < 1, d'autant plus bas que la corde doit mourir vite.
    var amorti = timbre === 'acier' ? 0.998 : 0.994;
    var idx = 0;
    var precedent = 0;
    for (i = 0; i < n; i++) {
      var courant = ligne[idx];
      // Passe-bas d'ordre 1 dans la boucle = la brillance décroît avec le temps.
      var filtre = (courant + precedent) * 0.5 * amorti;
      precedent = courant;
      ligne[idx] = filtre;
      out[i] = courant;
      idx = (idx + 1) % L;
    }

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

  function silence(v) { suspendu = !!v; }

  global.Audio5 = {
    pret: pret, volume: volume, silence: silence,
    contexte: contexte,
    jouerFreq: jouerFreq, jouerNote: jouerNote, jouerCase: jouerCase, jouerAccord: jouerAccord,
    demarrerMetronome: demarrerMetronome, arreterMetronome: arreterMetronome,
    tempoMetronome: tempoMetronome, metronomeActif: metronomeActif
  };
})(typeof window !== 'undefined' ? window : globalThis);
