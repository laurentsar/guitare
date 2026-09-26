/* Accordeur : détection de hauteur au micro.
 *
 * Méthode : autocorrélation sur le signal temporel, pas de FFT. Une FFT de
 * 2048 points à 44,1 kHz a des cases de 21 Hz : entre Mi2 (82,41) et Fa2
 * (87,31) il y a moins de 5 Hz — la FFT ne sait pas les distinguer, alors que
 * l'autocorrélation trouve la PÉRIODE au dixième d'échantillon près.
 *
 * Trois précautions apprises sur le terrain :
 *  - couper les traitements du navigateur (echoCancellation, noiseSuppression,
 *    autoGainControl) : ils sont faits pour la voix et massacrent une corde
 *    grave qui décline ;
 *  - un seuil de volume, sinon le bruit de fond donne des hauteurs aléatoires ;
 *  - un lissage sur plusieurs mesures, sinon l'aiguille tremble en permanence.
 */
(function (global) {
  'use strict';

  var flux = null, analyseur = null, tampon = null, boucle = null;
  var historique = [];
  var actif = false;

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

  function demarrer(surMesure, surErreur) {
    if (actif) return Promise.resolve(true);
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      if (surErreur) surErreur('Ce téléphone ne donne pas accès au micro.');
      return Promise.resolve(false);
    }
    return navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }
    }).then(function (f) {
      var ctx = Audio5.contexte();
      flux = f;
      var src = ctx.createMediaStreamSource(f);
      analyseur = ctx.createAnalyser();
      analyseur.fftSize = 4096;      // ~93 ms : deux périodes de la corde grave
      src.connect(analyseur);
      tampon = new Float32Array(analyseur.fftSize);
      actif = true;
      historique = [];

      boucle = setInterval(function () {
        analyseur.getFloatTimeDomainData(tampon);
        var r = detecter(tampon, ctx.sampleRate);
        if (!r) { surMesure(null); return; }
        // Médiane glissante : une mesure isolée aberrante (harmonique captée au
        // vol) ne doit pas faire sauter l'aiguille.
        historique.push(r.freq);
        if (historique.length > 5) historique.shift();
        var tri = historique.slice().sort(function (a, b) { return a - b; });
        var freq = tri[Math.floor(tri.length / 2)];
        var cible = Theorie.cordeLaPlusProche(freq);
        surMesure({ freq: freq, force: r.force, cible: cible });
      }, 90);
      return true;
    }).catch(function (e) {
      if (surErreur) {
        surErreur(e && e.name === 'NotAllowedError'
          ? 'Micro refusé. Autorise-le dans les réglages Android de l’app.'
          : 'Micro indisponible : ' + (e && e.message ? e.message : e));
      }
      return false;
    });
  }

  function arreter() {
    if (boucle) clearInterval(boucle);
    boucle = null;
    if (flux) flux.getTracks().forEach(function (t) { t.stop(); });
    flux = null; analyseur = null; actif = false; historique = [];
  }

  function enMarche() { return actif; }

  global.Accordeur = { demarrer: demarrer, arreter: arreter, enMarche: enMarche, detecter: detecter };
})(typeof window !== 'undefined' ? window : globalThis);
