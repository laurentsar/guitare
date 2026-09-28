/* Casque VR / réalité mixte (Meta Quest et autres casques WebXR).
 *
 * Deux choses, selon ce que le casque sait faire :
 *
 * 1. Dans le navigateur du casque, l'app s'affiche sur un grand panneau 2D.
 *    On le détecte et on pose la classe .casque sur <html> : cibles plus
 *    grosses (le rayon du contrôleur ou le pincement de la main visent moins
 *    finement qu'un doigt), mais pas le mode télévision — ici il y a un
 *    pointeur, pas une télécommande à flèches.
 *
 * 2. « Partition flottante » : une session WebXR immersive. En réalité mixte
 *    (passthrough), on voit SA vraie guitare et ses mains, avec la tablature
 *    et le manche qui flottent devant soi et suivent la lecture. C'est tout
 *    l'intérêt du casque pour un guitariste : lire sans baisser les yeux vers
 *    un écran posé à côté. Sans passthrough, repli en VR classique.
 *
 * Aucune bibliothèque 3D : un seul quadrilatère texturé par un <canvas> 2D.
 * A-Frame ou three.js pèseraient dix fois l'app entière et casseraient le
 * fonctionnement hors ligne. Ce module ne s'active que si navigator.xr existe :
 * sur téléphone et télé, il ne fait rien.
 */
(function (global) {
  'use strict';

  function estCasque() {
    var ua = (global.navigator && navigator.userAgent) || '';
    return /OculusBrowser|Quest|Pico|Wolvic|VR\b/i.test(ua) || /[?&]casque=1/.test(global.location ? location.search : '');
  }

  function appliquer() {
    if (typeof document === 'undefined') return;
    document.documentElement.classList.toggle('casque', estCasque());
  }

  // Mode immersif disponible : 'immersive-ar' (passthrough) de préférence.
  var modeXR = null;
  function detecterXR() {
    var xr = global.navigator && navigator.xr;
    if (!xr || !xr.isSessionSupported) return Promise.resolve(null);
    return xr.isSessionSupported('immersive-ar').then(function (ok) {
      if (ok) return 'immersive-ar';
      return xr.isSessionSupported('immersive-vr').then(function (ok2) { return ok2 ? 'immersive-vr' : null; });
    }).catch(function () { return null; }).then(function (m) { modeXR = m; return m; });
  }

  // ---------------------------------------------------------------- état
  var etat = { piece: null, controles: null, note: null, joue: false, sale: true };
  var session = null;

  /* Appelé par l'écran morceau : ajoute le bouton si le casque sait faire de
   * l'immersif. `controles` = { jouer, arreter }. */
  function brancher(conteneur, piece, controles) {
    etat.piece = piece;
    etat.controles = controles;
    etat.note = null; etat.joue = false; etat.sale = true;
    var hote = document.createElement('div');
    conteneur.appendChild(hote);
    detecterXR().then(function (mode) {
      if (!mode) return;
      var b = document.createElement('button');
      b.className = 'btn primaire large';
      b.textContent = mode === 'immersive-ar' ? '🥽 Partition flottante (réalité mixte)' : '🥽 Partition flottante (VR)';
      b.onclick = function () { demarrer(mode); };
      hote.appendChild(b);
      var aide = document.createElement('p');
      aide.className = 'aide';
      aide.textContent = (mode === 'immersive-ar'
        ? 'Tu vois ta guitare à travers le casque, la tablature flotte devant toi. '
        : '') + 'Gâchette ou pincement : lecture / arrêt. Bouton de côté (ou poing fermé) : replacer le panneau devant toi.';
      hote.appendChild(aide);
    });
  }

  function note(n) {
    etat.note = n; etat.joue = true; etat.sale = true;
  }

  // Fin de lecture (arrêt ou dernier temps sans boucle).
  function fin() {
    etat.note = null; etat.joue = false; etat.sale = true;
  }

  // -------------------------------------------------------------- dessin 2D
  var LARG = 1024, HAUT = 512;
  var toile = null;

  function dessiner() {
    if (!toile) { toile = document.createElement('canvas'); toile.width = LARG; toile.height = HAUT; }
    var g = toile.getContext('2d');
    var p = etat.piece;
    g.fillStyle = 'rgba(14,18,27,0.92)';
    arrondi(g, 0, 0, LARG, HAUT, 36); g.fill();
    g.fillStyle = '#D6A86A';
    g.font = 'bold 40px system-ui, sans-serif';
    g.textBaseline = 'alphabetic';
    g.fillText(p ? p.titre : 'Ma Guitare', 40, 62);
    g.fillStyle = '#9AA7BD';
    g.font = '28px system-ui, sans-serif';
    g.textAlign = 'right';
    g.fillText(etat.joue ? '▶ lecture' : '■ gâchette pour jouer', LARG - 40, 60);
    g.textAlign = 'left';
    if (p) {
      dessinerTab(g, p, 40, 100, LARG - 80, 190);
      dessinerManche(g, p, 40, 330, LARG - 80, 150);
    }
  }

  function arrondi(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  // La ligne (deux mesures) qui contient la note en cours.
  function dessinerTab(g, p, x, y, w, h) {
    var lignes = Tablature.systemes(p, 2);
    var t = etat.note ? etat.note.temps : 0;
    var ligne = lignes.filter(function (l) { return t >= l.debut && t < l.fin; })[0] || lignes[0];
    if (!ligne) return;
    var parMesure = p.signature ? p.signature[0] : 4;
    var inter = h / 5.6, y0 = y + inter * 0.3;
    var gauche = x + 70, px = (w - 80) / (ligne.fin - ligne.debut);
    g.strokeStyle = '#6B7890'; g.lineWidth = 2;
    for (var c = 0; c < 6; c++) {
      g.beginPath(); g.moveTo(gauche, y0 + c * inter); g.lineTo(x + w, y0 + c * inter); g.stroke();
    }
    g.fillStyle = '#9AA7BD'; g.font = 'bold 26px system-ui, sans-serif';
    ['T', 'A', 'B'].forEach(function (l, i) { g.fillText(l, x + 10, y0 + inter * (1.3 + i * 1.2)); });
    g.lineWidth = 3;
    for (var m = ligne.debut; m <= ligne.fin; m += parMesure) {
      var xm = gauche + (m - ligne.debut) * px;
      g.beginPath(); g.moveTo(xm, y0); g.lineTo(xm, y0 + 5 * inter); g.stroke();
    }
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = 'bold 30px system-ui, sans-serif';
    ligne.notes.forEach(function (n) {
      var xn = gauche + (n.temps - ligne.debut) * px + 18, yn = y0 + (n.corde - 1) * inter;
      var actif = etat.note && n.temps === etat.note.temps;
      g.fillStyle = actif ? '#D6A86A' : 'rgba(14,18,27,1)';
      g.fillRect(xn - 20, yn - 17, 40, 34);
      g.fillStyle = actif ? '#22180C' : '#EEF2F8';
      g.fillText(String(n.frette), xn, yn + 1);
    });
    g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  }

  function dessinerManche(g, p, x, y, w, h) {
    var cases = Math.max(5, Math.min(12, p.notes.reduce(function (mx, n) { return Math.max(mx, n.frette); }, 0) + 1));
    var inter = h / 6, gauche = x + 50, lc = (w - 60) / cases;
    g.fillStyle = '#3A2A1A'; g.fillRect(gauche, y, cases * lc, inter * 5 + 10);
    g.strokeStyle = '#C9CED8';
    for (var f = 0; f <= cases; f++) {
      g.lineWidth = f === 0 ? 8 : 3;
      g.beginPath(); g.moveTo(gauche + f * lc, y); g.lineTo(gauche + f * lc, y + inter * 5 + 10); g.stroke();
    }
    for (var c = 1; c <= 6; c++) {
      var yc = y + 5 + (c - 1) * inter;
      g.lineWidth = 1 + c * 0.5; g.strokeStyle = '#E7ECF5';
      g.beginPath(); g.moveTo(gauche, yc); g.lineTo(gauche + cases * lc, yc); g.stroke();
    }
    if (!etat.note) return;
    p.notes.filter(function (n) { return n.temps === etat.note.temps; }).forEach(function (n) {
      var xn = n.frette === 0 ? gauche - 22 : gauche + (n.frette - 0.5) * lc;
      var yn = y + 5 + (n.corde - 1) * inter;
      g.fillStyle = '#D6A86A';
      g.beginPath(); g.arc(xn, yn, 16, 0, Math.PI * 2); g.fill();
    });
  }

  // ------------------------------------------------------------ WebGL
  var VS = 'attribute vec3 p; attribute vec2 uv; uniform mat4 proj, vue, modele; varying vec2 v;' +
           'void main(){ v = uv; gl_Position = proj * vue * modele * vec4(p, 1.0); }';
  var FS = 'precision mediump float; varying vec2 v; uniform sampler2D tex;' +
           'void main(){ gl_FragColor = texture2D(tex, v); }';

  function programme(gl) {
    function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return s; }
    var pr = gl.createProgram();
    gl.attachShader(pr, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(pr, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(pr);
    return pr;
  }

  // Matrice colonne-majeure : translation (x, y, z) puis rotation autour de Y.
  function modele(x, y, z, lacet) {
    var c = Math.cos(lacet), s = Math.sin(lacet);
    return new Float32Array([c, 0, -s, 0, 0, 1, 0, 0, s, 0, c, 0, x, y, z, 1]);
  }

  function demarrer(mode) {
    if (session) return;
    var init = mode === 'immersive-ar'
      ? { optionalFeatures: ['hand-tracking'] }
      : { optionalFeatures: ['hand-tracking'] };
    navigator.xr.requestSession(mode, init).then(function (s) {
      session = s;
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl', { xrCompatible: true, alpha: true });
      s.updateRenderState({ baseLayer: new XRWebGLLayer(s, gl) });

      var pr = programme(gl);
      gl.useProgram(pr);
      // Panneau d'un mètre sur cinquante centimètres : lisible à un mètre,
      // sans masquer le manche de la guitare qu'on regarde en dessous.
      var sommets = new Float32Array([
        -0.5, -0.25, 0, 0, 0,   0.5, -0.25, 0, 1, 0,   -0.5, 0.25, 0, 0, 1,   0.5, 0.25, 0, 1, 1
      ]);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, sommets, gl.STATIC_DRAW);
      var aP = gl.getAttribLocation(pr, 'p'), aUV = gl.getAttribLocation(pr, 'uv');
      gl.enableVertexAttribArray(aP); gl.vertexAttribPointer(aP, 3, gl.FLOAT, false, 20, 0);
      gl.enableVertexAttribArray(aUV); gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 20, 12);
      var uProj = gl.getUniformLocation(pr, 'proj'), uVue = gl.getUniformLocation(pr, 'vue'), uMod = gl.getUniformLocation(pr, 'modele');

      var tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      // Devant soi, un peu sous les yeux : le regard passe du panneau aux
      // mains sans bouger la tête.
      var mat = modele(0, -0.25, -1.0, 0);
      var recentrer = false;
      etat.sale = true;

      s.addEventListener('select', function () {
        if (!etat.controles) return;
        if (etat.joue) { etat.controles.arreter(); etat.joue = false; etat.note = null; }
        else { etat.controles.jouer(); etat.joue = true; }
        etat.sale = true;
      });
      s.addEventListener('squeeze', function () { recentrer = true; });
      s.addEventListener('end', function () {
        session = null;
        if (etat.controles) etat.controles.arreter();
        etat.joue = false;
      });

      s.requestReferenceSpace('local').then(function (espace) {
        function image(t, frame) {
          if (!session) return;
          s.requestAnimationFrame(image);
          var pose = frame.getViewerPose(espace);
          if (!pose) return;
          if (recentrer) {
            // Replace le panneau à un mètre dans la direction du regard,
            // à plat (on ignore l'inclinaison de la tête).
            var m = pose.transform.matrix;
            var fx = -m[8], fz = -m[10], n = Math.hypot(fx, fz) || 1;
            fx /= n; fz /= n;
            var pos = pose.transform.position;
            mat = modele(pos.x + fx, pos.y - 0.25, pos.z + fz, Math.atan2(-fx, -fz));
            recentrer = false;
          }
          if (etat.sale) {
            dessiner();
            gl.bindTexture(gl.TEXTURE_2D, tex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, toile);
            etat.sale = false;
          }
          var couche = s.renderState.baseLayer;
          gl.bindFramebuffer(gl.FRAMEBUFFER, couche.framebuffer);
          // Fond transparent : en réalité mixte, c'est la pièce qu'on voit.
          gl.clearColor(0, 0, 0, mode === 'immersive-ar' ? 0 : 1);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          pose.views.forEach(function (vue) {
            var vp = couche.getViewport(vue);
            gl.viewport(vp.x, vp.y, vp.width, vp.height);
            gl.uniformMatrix4fv(uProj, false, vue.projectionMatrix);
            gl.uniformMatrix4fv(uVue, false, vue.transform.inverse.matrix);
            gl.uniformMatrix4fv(uMod, false, mat);
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
          });
        }
        s.requestAnimationFrame(image);
      });
    }).catch(function (e) {
      global.alert && alert('Le casque a refusé la session immersive : ' + (e && e.message ? e.message : e));
    });
  }

  function quitter() { if (session) session.end(); }

  appliquer();

  global.CasqueVR = {
    estCasque: estCasque, appliquer: appliquer, detecterXR: detecterXR,
    brancher: brancher, note: note, fin: fin, quitter: quitter, dessiner: dessiner,
    _etat: etat
  };
})(typeof window !== 'undefined' ? window : globalThis);
