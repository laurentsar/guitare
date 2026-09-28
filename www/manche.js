/* Manche virtuel : le manche vu de face, corde 1 (aiguë) en haut comme dans
 * la tablature, sillet à gauche.
 *
 * Sert à deux choses : suivre le morceau en cours (la note jouée s'allume à
 * l'endroit exact où poser le doigt) et afficher une gamme sur tout le manche.
 * Un seul dessin pour les deux, pour que la gamme et le morceau se lisent
 * pareil.
 */
(function (global) {
  'use strict';

  var REPERES = [3, 5, 7, 9, 15, 17];      // points de repère simples
  var DOUBLES = [12];                      // l'octave : double point

  /* opts.cases : nombre de cases dessinées (12 par défaut).
   * opts.points : [{ corde, frette, classe, texte }] — une pastille par case.
   * Case 0 = corde à vide : pastille dessinée à gauche du sillet. */
  function svg(opts) {
    opts = opts || {};
    var cases = opts.cases || 12;
    var margeG = 30, margeD = 10, margeH = 16, margeB = 22;
    var inter = 16;                        // écart entre cordes
    var larg = opts.largeurCase || 46;
    var L = margeG + cases * larg + margeD;
    var H = margeH + inter * 5 + margeB;
    var yMilieu = margeH + inter * 2.5;
    var p = ['<svg viewBox="0 0 ' + L + ' ' + H + '" class="manche" preserveAspectRatio="xMinYMid meet">'];
    p.push('<rect x="' + margeG + '" y="' + (margeH - 6) + '" width="' + (cases * larg) + '" height="' + (inter * 5 + 12) + '" class="manche-bois"/>');

    for (var f = 1; f <= cases; f++) {
      var xc = margeG + (f - 0.5) * larg;
      if (REPERES.indexOf(f) !== -1) p.push('<circle cx="' + xc + '" cy="' + yMilieu + '" r="4" class="manche-repere"/>');
      if (DOUBLES.indexOf(f) !== -1) {
        p.push('<circle cx="' + xc + '" cy="' + (yMilieu - inter) + '" r="4" class="manche-repere"/>');
        p.push('<circle cx="' + xc + '" cy="' + (yMilieu + inter) + '" r="4" class="manche-repere"/>');
      }
      var xf = margeG + f * larg;
      p.push('<line x1="' + xf + '" y1="' + (margeH - 6) + '" x2="' + xf + '" y2="' + (margeH + inter * 5 + 6) + '" class="manche-frette"/>');
      p.push('<text x="' + xc + '" y="' + (H - 5) + '" class="manche-num" text-anchor="middle">' + f + '</text>');
    }
    p.push('<line x1="' + margeG + '" y1="' + (margeH - 6) + '" x2="' + margeG + '" y2="' + (margeH + inter * 5 + 6) + '" class="manche-sillet"/>');

    for (var c = 1; c <= 6; c++) {
      var y = margeH + (c - 1) * inter;
      // Les cordes graves sont plus épaisses : ça aide à s'orienter.
      p.push('<line x1="' + margeG + '" y1="' + y + '" x2="' + (L - margeD) + '" y2="' + y + '" class="manche-corde" stroke-width="' + (0.8 + c * 0.25).toFixed(2) + '"/>');
      p.push('<text x="4" y="' + (y + 4) + '" class="manche-nom">' + Theorie.CORDES[c].court + '</text>');
    }

    (opts.points || []).forEach(function (pt) {
      if (pt.frette > cases) return;
      var x = pt.frette === 0 ? margeG - 9 : margeG + (pt.frette - 0.5) * larg;
      var yy = margeH + (pt.corde - 1) * inter;
      p.push('<g class="manche-point ' + (pt.classe || '') + '" data-corde="' + pt.corde + '" data-frette="' + pt.frette + '">');
      p.push('<circle cx="' + x + '" cy="' + yy + '" r="7.5"/>');
      if (pt.texte) p.push('<text x="' + x + '" y="' + (yy + 3.5) + '" text-anchor="middle">' + pt.texte + '</text>');
      p.push('</g>');
    });
    p.push('</svg>');
    return p.join('');
  }

  global.Manche = { svg: svg };
})(typeof window !== 'undefined' ? window : globalThis);
