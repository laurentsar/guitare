/* Écoute au micro : l'app écoute les notes jouées, À LA DEMANDE (bouton
 * interrupteur « 🎤 Micro » d'un morceau), et dit si elles sont justes. Le micro n'est ouvert que
 * tant que l'interrupteur est allumé, et refermé dès qu'on l'éteint ou qu'on quitte la page.
 *
 * Trois couches, les deux dernières sans micro (testables en Node) :
 *  1. detecter(tampon) : la hauteur d'une fenêtre de son, par autocorrélation
 *     (l'ancien accordeur, rodé sur une vraie guitare) ;
 *  2. Segmenteur : repère chaque NOUVELLE note — une attaque, c'est le volume
 *     qui remonte d'un coup (même note rejouée, comme au pouce buté) ou une
 *     hauteur qui change et se stabilise (note liée) ;
 *  3. Suivi : compare chaque note entendue à la note attendue de la
 *     tablature, dans l'ordre. Une note juste fait avancer ; une fausse est
 *     signalée, et on attend la bonne.
 *
 * Détection de hauteur — méthode : autocorrélation sur le signal temporel,
 * pas de FFT. Une FFT de 2048 points à 44,1 kHz a des cases de 21 Hz : entre
 * Mi2 (82,41) et Fa2 (87,31) il y a moins de 5 Hz — la FFT ne sait pas les
 * distinguer, alors que l'autocorrélation trouve la PÉRIODE au dixième
 * d'échantillon près. Précautions : couper les traitements du navigateur
 * (echoCancellation, noiseSuppression, autoGainControl), faits pour la voix,
 * qui massacrent une corde grave qui décline ; un seuil de volume, sinon le
 * bruit de fond donne des hauteurs aléatoires.
 */
(function (global) {
  'use strict';

  function detecter(buf, sr) {
    var n = buf.length;
    // Volume efficace : en dessous, il n'y a rien à analyser.
    var somme = 0;
    for (var i = 0; i < n; i++) somme += buf[i] * buf[i];
    var rms = Math.sqrt(somme / n);
    if (rms < 0.008) return null;

    // Fenêtre de travail : deux périodes de la corde la plus grave suffisent
    // (82 Hz → 1076 échantillons). Prendre tout le tampon doublerait le coût
    // du calcul sans rien apporter — et ce calcul tourne dix fois par seconde,
    // y compris sur un boîtier TV.
    var N = Math.min(n, 2048);

    // On ne cherche que dans la plage utile : de Mi2 (82 Hz) à La5 (880 Hz).
    var tauMin = Math.max(2, Math.floor(sr / 900));
    var tauMax = Math.min(N - 2, Math.floor(sr / 70));
    if (tauMax <= tauMin) return null;

    // Corrélation NORMALISÉE : sans la normalisation, les petits décalages
    // gagnent toujours et l'accordeur affiche une octave trop haut.
    var corr = new Float32Array(tauMax + 1);
    var max = 0;
    for (var tau = tauMin; tau <= tauMax; tau++) {
      var c = 0, a = 0, b = 0;
      for (var j = 0; j + tau < N; j++) {
        c += buf[j] * buf[j + tau];
        a += buf[j] * buf[j];
        b += buf[j + tau] * buf[j + tau];
      }
      corr[tau] = c / (Math.sqrt(a * b) || 1);
      if (corr[tau] > max) max = corr[tau];
    }
    if (max < 0.9) return null;

    /* Choix du pic : le PREMIER pic assez haut, pas le plus haut.
     *
     * C'est LE piège de l'autocorrélation : un signal périodique se
     * ressemble aussi à deux périodes d'écart, et avec des harmoniques fortes
     * (une corde de guitare en a beaucoup) la corrélation à 2T dépasse souvent
     * celle à T. Prendre le maximum global donnait donc une octave EN DESSOUS
     * — mesuré ici : 329,63 Hz détecté à 82,41 Hz, soit deux octaves. */
    var seuil = max * 0.93;
    var meilleur = -1;
    for (tau = tauMin + 1; tau < tauMax; tau++) {
      if (corr[tau] >= seuil && corr[tau] >= corr[tau - 1] && corr[tau] >= corr[tau + 1]) { meilleur = tau; break; }
    }
    if (meilleur < 0) return null;

    // Interpolation parabolique : le pic tombe rarement pile sur un
    // échantillon, et sans elle l'affichage saute de dix centièmes.
    var tauF = meilleur;
    var y0 = corr[meilleur - 1], y1 = corr[meilleur], y2 = corr[meilleur + 1];
    var d = (y2 - y0) / (2 * (2 * y1 - y2 - y0) || 1);
    if (isFinite(d) && Math.abs(d) < 1) tauF = meilleur + d;

    return { freq: sr / tauF, force: corr[meilleur], rms: rms };
  }


  /* --- 2. Segmenteur : une note par attaque --------------------------------
   * On lui donne une mesure toutes les ~60 ms : { rms, midi } (midi arrondi
   * au demi-ton, ou null si pas de hauteur nette). Il rend une note quand :
   *  - une attaque a eu lieu, puis la hauteur se stabilise sur deux mesures.
   *    Attaque = les aigus qui bondissent (×1,6 d'une mesure à l'autre : un
   *    coup de doigt apporte des harmoniques fraîches, qui s'éteignent vite
   *    ensuite), ou le volume qui remonte nettement (×1,6 au-dessus du creux).
   *    Les aigus sont indispensables pour une même note rejouée sur une corde
   *    qui sonne encore : son volume ne remonte que de 25 à 30 % ;
   *  - ou la hauteur change et reste stable trois mesures (note liée, sans
   *    nouvelle attaque de la main droite).
   * Une même note qui sonne encore ne redonne rien. */
  function Segmenteur() {
    this.creux = Infinity;      // volume le plus bas depuis la dernière note
    this.arme = true;           // une attaque a eu lieu, pas encore de note rendue
    this.candidat = null; this.nb = 0;
    this.derniere = null;       // midi de la dernière note rendue
    this.precedentRms = 0; this.aigusAvant = [0, 0];   // aigus des deux mesures précédentes
  }
  Segmenteur.prototype.mesure = function (m) {
    var rms = m.rms || 0;
    var aigus = m.aigus || 0;
    if (rms < 0.008) { this.creux = Math.min(this.creux, rms); this.candidat = null; this.nb = 0; this.arme = true; this.precedentRms = rms; this.aigusAvant = [this.aigusAvant[1], aigus]; return null; }
    // Plus bas des deux mesures précédentes : une attaque à cheval sur deux
    // mesures fait monter les aigus en deux fois, sans franchir ×1,6 d'un coup.
    var attaqueAigus = aigus > Math.min(this.aigusAvant[0], this.aigusAvant[1]) * 1.6 && aigus > 0.002;
    var attaqueVolume = rms > Math.max(0.012, this.creux * 1.6) && rms > this.precedentRms * 1.25;
    if ((attaqueAigus || attaqueVolume) && !this.arme) { this.arme = true; this.candidat = null; this.nb = 0; }
    this.precedentRms = rms; this.aigusAvant = [this.aigusAvant[1], aigus];
    this.creux = Math.min(this.creux, rms);
    if (m.midi == null) return null;
    if (this.candidat === m.midi) this.nb++; else { this.candidat = m.midi; this.nb = 1; }
    var lie = !this.arme && this.derniere != null && m.midi !== this.derniere && this.nb >= 3;
    if ((this.arme && this.nb >= 2) || lie) {
      this.arme = false; this.derniere = m.midi; this.creux = rms; this.nb = 0;
      return m.midi;
    }
    return null;
  };

  /* --- 3. Suivi : la note attendue, puis la suivante ------------------------
   * `notes` : celles de la tablature. Les notes pincées ensemble (même temps)
   * forment une étape : le micro n'entend bien qu'une hauteur à la fois, donc
   * n'importe laquelle des notes de l'étape compte comme juste. */
  function Suivi(notes) {
    var parT = {}, temps = [];
    notes.forEach(function (n) {
      if (!parT[n.temps]) { parT[n.temps] = []; temps.push(n.temps); }
      parT[n.temps].push(n);
    });
    temps.sort(function (a, b) { return a - b; });
    this.etapes = temps.map(function (t) { return parT[t]; });
    this.i = 0; this.justes = 0; this.fautes = 0; this.fauteIci = false; this.erreurs = [];
  }
  Suivi.prototype.attendue = function () { return this.etapes[this.i] || null; };
  Suivi.prototype.fini = function () { return this.i >= this.etapes.length; };
  Suivi.prototype.entendu = function (midi) {
    var e = this.attendue();
    if (!e) return { resultat: 'fini' };
    var ok = e.some(function (n) { return n.midi === midi; });
    if (ok) {
      if (!this.fauteIci) this.justes++;
      this.fauteIci = false; this.i++;
      return { resultat: 'juste', attendu: e, entendu: midi, fini: this.fini() };
    }
    if (!this.fauteIci) { this.fautes++; this.erreurs.push({ etape: this.i, attendu: e[0].midi, entendu: midi }); }
    this.fauteIci = true;
    return { resultat: 'faux', attendu: e, entendu: midi };
  };
  // Passer une note (sans la compter juste).
  Suivi.prototype.passer = function () { if (!this.fini()) { if (!this.fauteIci) this.fautes++; this.fauteIci = false; this.i++; } };
  Suivi.prototype.bilan = function () {
    var total = this.etapes.length;
    return { total: total, justes: this.justes, pct: total ? Math.round(this.justes / total * 100) : 0, erreurs: this.erreurs };
  };

  /* --- Micro ----------------------------------------------------------------- */
  var flux = null, analyseur = null, tampon = null, boucle = null, actif = false;

  // Une mesure du micro → { rms, aigus, midi, freq } (midi arrondi, ou null).
  // `aigus` : énergie de la différence d'un échantillon au suivant, qui
  // grossit les harmoniques aiguës — elle bondit à chaque attaque.
  function analyser(buf, sr) {
    var somme = 0, diff = 0;
    for (var i = 0; i < buf.length; i++) {
      somme += buf[i] * buf[i];
      if (i) diff += (buf[i] - buf[i - 1]) * (buf[i] - buf[i - 1]);
    }
    var rms = Math.sqrt(somme / buf.length), aigus = Math.sqrt(diff / buf.length);
    var r = rms >= 0.008 ? detecter(buf, sr) : null;
    var midi = r ? Theorie.midiDeFreq(r.freq) : null;
    return { rms: rms, aigus: aigus, freq: r ? r.freq : null, midi: midi == null ? null : Math.round(midi), ecart: midi == null ? 0 : Math.round((midi - Math.round(midi)) * 100) };
  }

  /* Ouvre le micro et appelle `surNote(midi)` à chaque note jouée, et
   * `surMesure(m)` à chaque mesure (affichage en direct). */
  function demarrer(surNote, surMesure, surErreur) {
    if (actif) return Promise.resolve(true);
    if (!global.navigator || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (surErreur) surErreur('Cet appareil ne donne pas accès au micro.');
      return Promise.resolve(false);
    }
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    }).then(function (f) {
      var ctx = Audio5.contexte();
      flux = f;
      var src = ctx.createMediaStreamSource(f);
      analyseur = ctx.createAnalyser();
      analyseur.fftSize = 2048;      // ~46 ms : deux périodes de la corde la plus grave
      src.connect(analyseur);
      tampon = new Float32Array(analyseur.fftSize);
      actif = true;
      var seg = new Segmenteur();
      boucle = setInterval(function () {
        analyseur.getFloatTimeDomainData(tampon);
        var m = analyser(tampon, ctx.sampleRate);
        if (surMesure) surMesure(m);
        var note = seg.mesure(m);
        if (note != null) surNote(note);
      }, 60);
      return true;
    }).catch(function (e) {
      if (surErreur) {
        surErreur(e && e.name === 'NotAllowedError'
          ? 'Micro refusé. Autorise-le pour Ma Guitare dans les réglages d’Android (Applications → Ma Guitare → Autorisations).'
          : 'Micro indisponible : ' + (e && e.message ? e.message : e));
      }
      return false;
    });
  }

  function arreter() {
    if (boucle) clearInterval(boucle);
    boucle = null;
    if (flux) flux.getTracks().forEach(function (t) { t.stop(); });
    flux = null; analyseur = null; actif = false;
  }

  function enMarche() { return actif; }

  global.Ecoute = {
    detecter: detecter, analyser: analyser, Segmenteur: Segmenteur, Suivi: Suivi,
    demarrer: demarrer, arreter: arreter, enMarche: enMarche
  };
})(typeof window !== 'undefined' ? window : globalThis);
