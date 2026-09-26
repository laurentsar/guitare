/* Schémas explicatifs, dessinés en SVG par le code.
 *
 * Pourquoi pas des photos : il en faudrait une douzaine, libres de droits,
 * cohérentes entre elles, lisibles en sombre comme en clair et pesant moins
 * qu'une APK entière. Un schéma géométrique est plus clair qu'une photo pour
 * montrer OÙ se place un doigt, et il reste net sur un téléviseur 4K comme sur
 * un téléphone.
 *
 * Toutes les couleurs viennent des variables CSS du thème : les schémas
 * suivent l'app, ils ne la contredisent jamais.
 */
(function (global) {
  'use strict';

  function svg(vb, corps, titre) {
    return '<svg viewBox="' + vb + '" class="schema" role="img" aria-label="' + titre + '">' +
           '<title>' + titre + '</title>' + corps + '</svg>';
  }
  function txt(x, y, s, classe, ancre) {
    return '<text x="' + x + '" y="' + y + '" class="' + (classe || 'sch-txt') + '"' +
           ' text-anchor="' + (ancre || 'middle') + '">' + s + '</text>';
  }
  function fleche(x1, y1, x2, y2) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" class="sch-fleche" marker-end="url(#pointe)"/>';
  }
  var DEFS = '<defs><marker id="pointe" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">' +
             '<path d="M0,0 L10,5 L0,10 z" class="sch-pointe"/></marker></defs>';

  var S = {};

  /* Anatomie : nommer les parties, une fois, pour que le reste du parcours
   * puisse dire « le sillet » sans être obscur. */
  S.anatomie = function () {
    var c = DEFS;
    // caisse
    c += '<ellipse cx="150" cy="250" rx="78" ry="62" class="sch-bois"/>';
    c += '<ellipse cx="150" cy="180" rx="60" ry="52" class="sch-bois"/>';
    c += '<circle cx="150" cy="212" r="24" class="sch-trou"/>';
    c += '<circle cx="150" cy="212" r="27" class="sch-rosace"/>';
    // chevalet
    c += '<rect x="112" y="268" width="76" height="12" rx="3" class="sch-piece"/>';
    // manche + tête
    c += '<rect x="136" y="40" width="28" height="100" class="sch-manche"/>';
    c += '<rect x="130" y="14" width="40" height="30" rx="5" class="sch-piece"/>';
    // frettes
    for (var i = 1; i <= 5; i++) {
      c += '<line x1="136" y1="' + (40 + i * 17) + '" x2="164" y2="' + (40 + i * 17) + '" class="sch-frette"/>';
    }
    // cordes
    for (i = 0; i < 6; i++) {
      var x = 138 + i * 4.8;
      c += '<line x1="' + x + '" y1="40" x2="' + x + '" y2="274" class="sch-corde"/>';
    }
    c += '<line x1="136" y1="42" x2="164" y2="42" class="sch-sillet"/>';
    // étiquettes
    c += fleche(210, 26, 174, 26) + txt(216, 30, 'Tête et mécaniques', 'sch-txt', 'start');
    c += fleche(210, 48, 168, 46) + txt(216, 52, 'Sillet', 'sch-txt', 'start');
    c += fleche(96, 96, 132, 96) + txt(90, 100, 'Manche', 'sch-txt', 'end');
    c += fleche(96, 126, 132, 126) + txt(90, 130, 'Frettes', 'sch-txt', 'end');
    c += fleche(232, 212, 180, 212) + txt(238, 216, 'Rosace', 'sch-txt', 'start');
    c += fleche(232, 274, 192, 274) + txt(238, 278, 'Chevalet', 'sch-txt', 'start');
    c += fleche(64, 250, 78, 250) + txt(58, 254, 'Caisse', 'sch-txt', 'end');
    return svg('0 0 340 320', c, 'Les parties de la guitare classique');
  };

  /* Position assise. Le point à retenir tient en trois repères : cuisse
   * GAUCHE, pied surélevé, manche à 45°. */
  S.posture = function () {
    var c = DEFS;
    // chaise
    c += '<rect x="150" y="150" width="90" height="10" class="sch-piece"/>';
    c += '<rect x="228" y="60" width="10" height="100" class="sch-piece"/>';
    c += '<rect x="158" y="160" width="8" height="80" class="sch-piece"/>';
    c += '<rect x="224" y="160" width="8" height="80" class="sch-piece"/>';
    // silhouette assise de profil
    c += '<circle cx="196" cy="52" r="18" class="sch-corps"/>';
    c += '<path d="M196 70 q-18 26 -14 78 l40 0 q6 -52 -8 -78 z" class="sch-corps"/>';
    c += '<path d="M150 148 l60 0 l0 16 l-60 0 z" class="sch-corps"/>';     // cuisses
    c += '<path d="M150 150 l-18 62 l16 4 l22 -60 z" class="sch-corps"/>';  // jambe gauche avancée
    // repose-pied
    c += '<rect x="112" y="212" width="44" height="12" rx="3" class="sch-accent"/>';
    c += txt(134, 244, 'repose-pied', 'sch-petit');
    // guitare posée sur la cuisse gauche, manche à 45°
    c += '<g transform="rotate(-42 130 150)">';
    c += '<ellipse cx="130" cy="166" rx="34" ry="26" class="sch-bois"/>';
    c += '<ellipse cx="130" cy="136" rx="27" ry="22" class="sch-bois"/>';
    c += '<circle cx="130" cy="150" r="10" class="sch-trou"/>';
    c += '<rect x="122" y="62" width="16" height="52" class="sch-manche"/>';
    c += '<rect x="118" y="44" width="24" height="20" rx="4" class="sch-piece"/>';
    c += '</g>';
    c += '<line x1="130" y1="150" x2="196" y2="150" class="sch-repere"/>';
    c += '<path d="M150 150 a 28 28 0 0 0 -14 -24" class="sch-repere"/>';
    c += txt(168, 132, '45°', 'sch-petit');
    c += fleche(58, 120, 96, 138) + txt(54, 118, 'cuisse gauche', 'sch-txt', 'end');
    c += fleche(300, 92, 250, 92) + txt(306, 96, 'dos droit,', 'sch-txt', 'start') + txt(306, 112, 'épaules basses', 'sch-txt', 'start');
    return svg('0 0 420 260', c, 'Position assise du guitariste classique');
  };

  /* Main droite : quel doigt sur quelle corde, et dans quel sens. */
  S.mainDroite = function () {
    var c = DEFS;
    var noms = ['p', 'p', 'p', 'i', 'm', 'a'];   // cordes 6,5,4 au pouce
    for (var i = 0; i < 6; i++) {
      var y = 40 + i * 30;
      var corde = 6 - i;
      c += '<line x1="60" y1="' + y + '" x2="330" y2="' + y + '" class="sch-corde"/>';
      c += txt(48, y + 5, String(corde), 'sch-petit', 'end');
    }
    // pouce : vers le bas, sur les trois graves
    c += '<rect x="150" y="26" width="46" height="88" rx="20" class="sch-doigt"/>';
    c += txt(173, 78, 'p', 'sch-doigt-nom');
    c += fleche(173, 118, 173, 146);
    c += txt(173, 164, 'vers le bas', 'sch-petit');
    // i m a : vers la paume
    [['i', 130], ['m', 160], ['a', 190]].forEach(function (d, k) {
      var x = 240 + k * 34;
      c += '<rect x="' + (x - 15) + '" y="' + (d[1] - 16) + '" width="30" height="44" rx="14" class="sch-doigt"/>';
      c += txt(x, d[1] + 10, d[0], 'sch-doigt-nom');
      c += fleche(x, d[1] - 22, x, d[1] - 48);
    });
    c += txt(274, 66, 'vers la paume', 'sch-petit');
    c += txt(196, 212, 'p = pouce · i = index · m = majeur · a = annulaire', 'sch-petit');
    return svg('0 0 400 230', c, 'Main droite : pouce sur les graves, i m a sur les aiguës');
  };

  /* Main gauche, vue en coupe : le pouce DERRIÈRE, jamais par-dessus. */
  S.mainGauche = function () {
    var c = DEFS;
    // coupe du manche
    c += '<rect x="120" y="60" width="90" height="46" rx="8" class="sch-manche"/>';
    for (var i = 0; i < 6; i++) {
      c += '<circle cx="' + (132 + i * 13) + '" cy="60" r="2.6" class="sch-corde-pt"/>';
    }
    // pouce derrière, au milieu
    c += '<rect x="150" y="112" width="34" height="42" rx="16" class="sch-doigt"/>';
    c += txt(167, 140, 'pouce', 'sch-petit');
    c += fleche(96, 134, 144, 130) + txt(90, 138, 'derrière, en face du majeur', 'sch-txt', 'end');
    // doigt qui appuie, arrondi
    c += '<path d="M250 44 q-26 8 -34 26 q-4 10 6 12" class="sch-trait-doigt"/>';
    c += '<circle cx="222" cy="82" r="7" class="sch-doigt"/>';
    c += fleche(300, 40, 262, 44) + txt(306, 44, 'dernière phalange', 'sch-txt', 'start') + txt(306, 60, 'à la verticale', 'sch-txt', 'start');
    // barré-croix : ce qu'il ne faut pas faire
    c += '<g transform="translate(0,170)">';
    c += '<rect x="120" y="60" width="90" height="46" rx="8" class="sch-manche"/>';
    c += '<path d="M120 58 q30 -26 62 -6" class="sch-trait-doigt sch-faux"/>';
    c += '<text x="196" y="52" class="sch-croix">✕</text>';
    c += txt(300, 84, 'pouce par-dessus :', 'sch-txt', 'start') + txt(300, 100, 'barrés impossibles', 'sch-txt', 'start');
    c += '</g>';
    return svg('0 0 460 300', c, 'Main gauche : pouce derrière le manche, doigts arrondis');
  };

  /* Où appuyer dans la case : juste derrière la barrette. */
  S.placement = function () {
    var c = DEFS;
    function manche(y, xDoigt, bon, legende) {
      var s = '<rect x="40" y="' + y + '" width="300" height="52" class="sch-manche"/>';
      [40, 140, 240, 340].forEach(function (x) {
        s += '<line x1="' + x + '" y1="' + y + '" x2="' + x + '" y2="' + (y + 52) + '" class="sch-barrette"/>';
      });
      s += '<line x1="40" y1="' + (y + 26) + '" x2="340" y2="' + (y + 26) + '" class="sch-corde"/>';
      s += '<circle cx="' + xDoigt + '" cy="' + (y + 26) + '" r="15" class="sch-doigt' + (bon ? '' : ' sch-faux') + '"/>';
      s += '<text x="356" y="' + (y + 20) + '" class="' + (bon ? 'sch-ok' : 'sch-croix') + '">' + (bon ? '✓' : '✕') + '</text>';
      s += txt(356, y + 44, legende, 'sch-petit', 'start');
      return s;
    }
    c += manche(20, 128, true, 'juste derrière');
    c += manche(110, 90, false, 'trop loin : ça frise');
    c += manche(200, 141, false, 'sur la barrette : étouffé');
    return svg('0 0 520 270', c, 'Où poser le doigt dans la case');
  };

  /* Tête : quelle mécanique pour quelle corde, et dans quel sens tourner. */
  S.tete = function () {
    var c = DEFS;
    c += '<rect x="120" y="20" width="110" height="200" rx="14" class="sch-piece"/>';
    c += '<rect x="148" y="220" width="54" height="40" class="sch-manche"/>';
    c += '<line x1="148" y1="222" x2="202" y2="222" class="sch-sillet"/>';
    var noms = ['Mi', 'La', 'Ré', 'Sol', 'Si', 'Mi'];   // cordes 6→1
    for (var i = 0; i < 6; i++) {
      var cote = i < 3 ? -1 : 1;
      var rang = i < 3 ? i : 5 - i;
      var y = 56 + rang * 56;
      var x = cote < 0 ? 112 : 238;
      c += '<circle cx="' + x + '" cy="' + y + '" r="13" class="sch-accent"/>';
      c += '<line x1="' + (x + cote * 13) + '" y1="' + y + '" x2="' + (x + cote * 30) + '" y2="' + y + '" class="sch-piece-trait"/>';
      c += txt(x + cote * 48, y + 5, (i + 1) + ' ' + noms[i], 'sch-petit');
      // corde jusqu'au sillet
      var xs = 152 + (i < 3 ? i : 5 - i + 3) * 8;
      c += '<line x1="' + x + '" y1="' + y + '" x2="' + xs + '" y2="224" class="sch-corde"/>';
    }
    // Sens de rotation. Sur une classique, la mécanique tend la corde quand
    // l'axe l'enroule vers l'intérieur de la tête : côté gauche (cordes 6-5-4)
    // on tourne vers le bas, côté droit (3-2-1) vers le haut. Les deux flèches
    // le disent sans texte.
    c += '<path d="M96 40 a 26 26 0 0 0 0 40" class="sch-rotation" marker-end="url(#pointe)"/>';
    c += txt(74, 96, 'tendre', 'sch-petit');
    c += '<path d="M254 80 a 26 26 0 0 0 0 -40" class="sch-rotation" marker-end="url(#pointe)"/>';
    c += txt(276, 96, 'tendre', 'sch-petit');
    c += txt(175, 292, 'Tourne toujours en MONTANT vers la note :', 'sch-petit');
    c += txt(175, 310, 'détends puis retends, l’accord tient mieux.', 'sch-petit');
    return svg('0 0 350 330', c, 'Tête de guitare : les six mécaniques et le sens pour tendre');
  };

  /* Lire une tablature : la légende que tout débutant cherche. */
  S.tablature = function () {
    var c = DEFS;
    for (var i = 0; i < 6; i++) {
      var y = 40 + i * 22;
      c += '<line x1="70" y1="' + y + '" x2="330" y2="' + y + '" class="sch-corde"/>';
    }
    c += txt(60, 46, '1', 'sch-petit', 'end');
    c += txt(60, 156, '6', 'sch-petit', 'end');
    c += '<rect x="96" y="30" width="20" height="20" class="sch-case"/>' + txt(106, 46, '0', 'sch-chiffre');
    c += '<rect x="156" y="52" width="20" height="20" class="sch-case"/>' + txt(166, 68, '1', 'sch-chiffre');
    c += '<rect x="216" y="52" width="20" height="20" class="sch-case"/>' + txt(226, 68, '3', 'sch-chiffre');
    c += fleche(30, 20, 56, 38) + txt(26, 18, 'corde la plus AIGUË en haut', 'sch-txt', 'end');
    c += fleche(30, 178, 56, 160) + txt(26, 186, 'corde la plus GRAVE en bas', 'sch-txt', 'end');
    c += fleche(106, 206, 106, 58) + txt(106, 224, '0 = corde à vide', 'sch-petit');
    c += fleche(226, 206, 226, 80) + txt(226, 224, 'chiffre = numéro de case', 'sch-petit');
    return svg('0 0 400 240', c, 'Comment lire une tablature');
  };

  /* Barré : l'index sur la tranche, pas à plat. */
  S.barre = function () {
    var c = DEFS;
    // à plat : la pulpe laisse passer les cordes
    c += '<g transform="translate(0,0)">';
    c += '<rect x="40" y="40" width="160" height="40" rx="6" class="sch-manche"/>';
    c += '<ellipse cx="120" cy="36" rx="86" ry="14" class="sch-doigt sch-faux"/>';
    c += '<text x="216" y="44" class="sch-croix">✕</text>';
    c += txt(216, 66, 'à plat : la pulpe', 'sch-txt', 'start') + txt(216, 82, 'laisse passer les cordes', 'sch-txt', 'start');
    c += '</g>';
    // sur la tranche : la partie dure
    c += '<g transform="translate(0,120)">';
    c += '<rect x="40" y="40" width="160" height="40" rx="6" class="sch-manche"/>';
    c += '<ellipse cx="120" cy="34" rx="86" ry="9" class="sch-doigt"/>';
    c += '<text x="216" y="44" class="sch-ok">✓</text>';
    c += txt(216, 66, 'sur le côté de l’index :', 'sch-txt', 'start') + txt(216, 82, 'c’est la partie dure', 'sch-txt', 'start');
    c += '</g>';
    return svg('0 0 470 220', c, 'Barré : poser l’index sur la tranche');
  };

  /* Accorder sans micro : méthode de la 5e case.
   *
   * Chaque corde pressée à la 5e case donne la corde suivante à vide — sauf
   * entre la 3e et la 2e, où c'est la 4e case. Cette exception est LA source
   * d'erreur de la méthode, d'où sa mise en évidence. */
  S.accordage = function () {
    var c = DEFS;
    var noms = ['Mi', 'Si', 'Sol', 'Ré', 'La', 'Mi'];      // cordes 1→6
    var cases = [null, 5, 4, 5, 5, 5];                      // case à presser sur la corde du dessous
    for (var i = 0; i < 6; i++) {
      var corde = i + 1;
      var y = 36 + (6 - corde) * 34;
      c += '<line x1="90" y1="' + y + '" x2="400" y2="' + y + '" class="sch-corde"/>';
      c += txt(80, y + 5, corde + ' ' + noms[i], 'sch-petit', 'end');
    }
    // barrettes, pour situer la 4e et la 5e case
    [150, 205, 260, 315, 370].forEach(function (x, k) {
      c += '<line x1="' + x + '" y1="30" x2="' + x + '" y2="206" class="sch-barrette"/>';
      c += txt(x - 27, 224, String(k + 1), 'sch-petit');
    });
    // Pour chaque paire : un doigt sur la corde grave, la corde aiguë à vide.
    for (i = 6; i >= 2; i--) {
      var caseP = cases[i - 1];
      var yGrave = 36 + (6 - i) * 34;
      var yAigu = yGrave + 34;
      var x = caseP === 5 ? 342 : 287;
      c += '<circle cx="' + x + '" cy="' + yGrave + '" r="12" class="sch-doigt' + (caseP === 4 ? ' sch-exception' : '') + '"/>';
      c += '<text x="' + x + '" y="' + (yGrave + 5) + '" class="sch-doigt-nom" text-anchor="middle">' + caseP + '</text>';
      c += '<circle cx="118" cy="' + yAigu + '" r="9" class="sch-vide"/>';
      c += fleche(x - 14, yGrave + 6, 132, yAigu - 6);
    }
    c += txt(245, 254, 'La case jouée doit sonner comme la corde du dessus à vide (○).', 'sch-petit');
    c += txt(245, 274, 'Exception : de la 3e vers la 2e corde, c’est la 4e case.', 'sch-exception-txt');
    return svg('0 0 490 290', c, 'Accorder à l’oreille : méthode de la cinquième case');
  };

  function rendre(id) {
    var f = S[id];
    return f ? f() : '';
  }
  function liste() { return Object.keys(S); }

  global.Illustrations = { rendre: rendre, liste: liste };
})(typeof window !== 'undefined' ? window : globalThis);
