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
    return svg('0 0 390 320', c, 'Les parties de la guitare classique');
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
    c += fleche(76, 122, 104, 140) + txt(6, 126, 'cuisse gauche', 'sch-txt', 'start');
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
    c += fleche(84, 134, 144, 130);
    c += txt(6, 130, 'derrière le manche,', 'sch-txt', 'start');
    c += txt(6, 148, 'en face du majeur', 'sch-txt', 'start');
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
    // i = 0 est la corde 6 (la plus grave), côté gauche de la tête. Le NUMÉRO
    // se déduit donc de l'index (6 - i) : l'afficher comme « i + 1 » donnait
    // « 1 Mi » en face de la mécanique de la 6e corde, et un débutant aurait
    // tourné la mauvaise cheville.
    var noms = ['Mi', 'La', 'Ré', 'Sol', 'Si', 'Mi'];   // cordes 6→1
    for (var i = 0; i < 6; i++) {
      var numero = 6 - i;
      var cote = i < 3 ? -1 : 1;
      var rang = i < 3 ? i : 5 - i;
      var y = 56 + rang * 56;
      var x = cote < 0 ? 112 : 238;
      c += '<circle cx="' + x + '" cy="' + y + '" r="13" class="sch-accent"/>';
      c += '<line x1="' + (x + cote * 13) + '" y1="' + y + '" x2="' + (x + cote * 30) + '" y2="' + y + '" class="sch-piece-trait"/>';
      c += txt(x + cote * 48, y + 5, numero + ' ' + noms[i], 'sch-petit');
      // Position au sillet : la 6e à gauche, la 1re à droite, dans l'ordre.
      // Calculer autrement faisait se croiser les cordes sur le dessin.
      c += '<line x1="' + x + '" y1="' + y + '" x2="' + (152 + i * 8) + '" y2="224" class="sch-corde"/>';
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
    c += fleche(150, 16, 116, 34) + txt(156, 20, 'corde la plus AIGUË en haut', 'sch-txt', 'start');
    c += fleche(150, 190, 116, 162) + txt(156, 194, 'corde la plus GRAVE en bas', 'sch-txt', 'start');
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

  /* Vue « main gauche » d'un accord : le diagramme dit QUELLE case, ce dessin
   * dit COMMENT la main s'y pose. Les quatre doigts partent d'une même paume
   * et gardent chacun sa couleur et son numéro, du diagramme jusqu'ici.
   *
   * Orientation : manche vu de face, corde 6 (grave) à gauche — comme le
   * diagramme d'accord. La main arrive donc par la DROITE et par le bas :
   * c'est le trajet réel des doigts, qui passent sous le manche côté aigu.
   */
  function mainAccord(accord, opts) {
    opts = opts || {};
    var L = opts.largeur || 300;
    var marge = L * 0.15;
    var largeurManche = L * 0.52;
    var pasCorde = largeurManche / 5;
    var hauteurCase = pasCorde * 1.15;
    var cases = Math.max(4, Math.min(5, Accords.frette_max(accord)));
    var depart = 1;
    if (Accords.frette_max(accord) > 5) {
      depart = Math.min.apply(null, accord.frettes.filter(function (f) { return f > 0; }));
      cases = 4;
    }
    var y0 = 34;
    var H = y0 + cases * hauteurCase + 96;   // place pour la paume sous le manche
    var c = DEFS;

    // Manche
    c += '<rect x="' + marge + '" y="' + y0 + '" width="' + largeurManche + '" height="' + (cases * hauteurCase) + '" class="sch-manche"/>';
    if (depart === 1) {
      c += '<rect x="' + marge + '" y="' + (y0 - 5) + '" width="' + largeurManche + '" height="5" class="sch-sillet-plein"/>';
    } else {
      c += txt(marge - 8, y0 + hauteurCase * 0.6, String(depart), 'sch-petit', 'end');
    }
    for (var f = 0; f <= cases; f++) {
      var y = y0 + f * hauteurCase;
      c += '<line x1="' + marge + '" y1="' + y + '" x2="' + (marge + largeurManche) + '" y2="' + y + '" class="sch-barrette"/>';
    }
    for (var k = 0; k < 6; k++) {
      var x = marge + k * pasCorde;
      c += '<line x1="' + x + '" y1="' + y0 + '" x2="' + x + '" y2="' + (y0 + cases * hauteurCase) + '" class="sch-corde"/>';
      var corde = 6 - k;
      var etat = accord.frettes[corde - 1];
      if (etat === -1) c += '<text x="' + x + '" y="' + (y0 - 11) + '" class="sch-mute" text-anchor="middle">✕</text>';
      else if (etat === 0) c += '<circle cx="' + x + '" cy="' + (y0 - 14) + '" r="5" class="sch-vide"/>';
    }

    // Paume, sous le manche côté aigu : c'est de là que partent les doigts.
    var paumeX = marge + largeurManche + 26;
    var paumeY = y0 + cases * hauteurCase + 38;
    c += '<ellipse cx="' + paumeX + '" cy="' + paumeY + '" rx="34" ry="26" class="sch-paume"/>';

    // Pouce : derrière le manche, donc en pointillé — on ne le voit pas de face.
    c += '<path d="M' + (paumeX - 20) + ' ' + (paumeY - 14) + ' Q ' + (marge + largeurManche * 0.55) + ' ' + (paumeY - 30) +
         ' ' + (marge + largeurManche * 0.5) + ' ' + (y0 + cases * hauteurCase * 0.6) + '" class="sch-pouce"/>';
    c += txt(marge + largeurManche * 0.5, y0 + cases * hauteurCase * 0.6 - 8, 'pouce (derrière)', 'sch-petit');

    // Un doigt par case pressée. Les doigts hauts partent du bord de la paume
    // le plus proche du manche : sans cet étagement, les quatre tubes se
    // superposeraient en un seul trait illisible.
    var poses = [];
    for (k = 0; k < 6; k++) {
      var num = k + 1;                       // numéro de corde (1 = aiguë)
      var frette = accord.frettes[num - 1];
      var doigt = accord.doigts ? accord.doigts[num - 1] : 0;
      if (frette > 0 && doigt > 0) {
        poses.push({
          doigt: doigt,
          x: marge + (6 - num) * pasCorde,
          y: y0 + (frette - depart + 0.5) * hauteurCase
        });
      }
    }
    // Barré : un seul doigt couvre plusieurs cordes, on le dessine en barre.
    if (accord.barre) {
      var xa = marge + (6 - accord.barre.a) * pasCorde;
      var xb = marge + (6 - accord.barre.de) * pasCorde;
      var yb = y0 + (accord.barre.frette - depart + 0.5) * hauteurCase;
      c += '<rect x="' + (xa - 9) + '" y="' + (yb - 9) + '" width="' + (xb - xa + 18) + '" height="18" rx="9" class="sch-doigt-1"/>';
      poses = poses.filter(function (p) { return p.doigt !== 1; });
    }

    poses.sort(function (a, b) { return a.doigt - b.doigt; }).forEach(function (pose) {
      var depX = paumeX - 26 + (pose.doigt - 1) * 12;
      var depY = paumeY - 20 - (4 - pose.doigt) * 4;
      c += '<path d="M' + depX + ' ' + depY + ' Q ' + (depX - 10) + ' ' + ((depY + pose.y) / 2) +
           ' ' + pose.x + ' ' + pose.y + '" class="sch-doigt-tube sch-doigt-' + pose.doigt + '"/>';
      c += '<circle cx="' + pose.x + '" cy="' + pose.y + '" r="11" class="sch-doigt-bout sch-doigt-' + pose.doigt + '"/>';
      c += '<text x="' + pose.x + '" y="' + (pose.y + 5) + '" class="sch-doigt-nom" text-anchor="middle">' + pose.doigt + '</text>';
    });

    c += txt(L / 2, H - 8, '1 index · 2 majeur · 3 annulaire · 4 auriculaire', 'sch-petit');
    return svg('0 0 ' + L + ' ' + H, c, 'Position de la main gauche pour l’accord ' + accord.id);
  }

  /* Où se joue l'accord SUR la guitare.
   *
   * Un diagramme d'accord ne dit pas où il tombe sur l'instrument : un
   * débutant qui voit « case 2 » ne sait pas encore que c'est tout près de la
   * tête. Cette vue montre la guitare entière, manche compris, et encadre la
   * zone concernée.
   *
   * L'écartement des frettes suit la vraie règle : chaque case vaut
   * 2^(-n/12) de la longueur de corde, d'où des cases qui se resserrent en
   * montant. Un manche aux cases régulières donnerait une fausse idée des
   * distances à parcourir avec la main.
   */
  function positionSurGuitare(accord, opts) {
    opts = opts || {};
    var L = opts.largeur || 640, H = 210;
    var xSillet = 86, xDouze = 392, xChevalet = 556;
    var yHaut = 66, yBas = 140;
    var c = DEFS;

    function xFrette(n) {
      return xSillet + (xDouze - xSillet) * (1 - Math.pow(2, -n / 12)) / 0.5;
    }

    // Caisse
    c += '<ellipse cx="494" cy="103" rx="66" ry="62" class="sch-bois"/>';
    c += '<ellipse cx="420" cy="103" rx="46" ry="46" class="sch-bois"/>';
    c += '<circle cx="452" cy="103" r="20" class="sch-trou"/>';
    c += '<rect x="' + (xChevalet - 6) + '" y="80" width="12" height="46" rx="3" class="sch-piece"/>';
    // Manche et tête
    c += '<rect x="' + xSillet + '" y="' + yHaut + '" width="' + (440 - xSillet) + '" height="' + (yBas - yHaut) + '" class="sch-manche"/>';
    c += '<rect x="20" y="' + (yHaut - 8) + '" width="' + (xSillet - 22) + '" height="' + (yBas - yHaut + 16) + '" rx="8" class="sch-piece"/>';
    c += '<rect x="' + (xSillet - 4) + '" y="' + (yHaut - 3) + '" width="5" height="' + (yBas - yHaut + 6) + '" class="sch-sillet-plein"/>';

    // Frettes et repères de touche
    for (var n = 1; n <= 12; n++) {
      var x = xFrette(n);
      c += '<line x1="' + x + '" y1="' + yHaut + '" x2="' + x + '" y2="' + yBas + '" class="sch-barrette"/>';
      if ([3, 5, 7, 9].indexOf(n) !== -1) {
        c += '<circle cx="' + ((xFrette(n - 1) + x) / 2) + '" cy="' + ((yHaut + yBas) / 2) + '" r="4" class="sch-repere-touche"/>';
      }
      if (n === 12) {
        c += '<circle cx="' + ((xFrette(11) + x) / 2) + '" cy="' + (yHaut + 18) + '" r="4" class="sch-repere-touche"/>';
        c += '<circle cx="' + ((xFrette(11) + x) / 2) + '" cy="' + (yBas - 18) + '" r="4" class="sch-repere-touche"/>';
      }
    }
    // Cordes : la 6 (grave) en haut, comme sur une tablature.
    for (var k = 0; k < 6; k++) {
      var y = yHaut + 6 + k * ((yBas - yHaut - 12) / 5);
      c += '<line x1="' + (xSillet - 2) + '" y1="' + y + '" x2="' + xChevalet + '" y2="' + y + '" class="sch-corde"/>';
    }
    function yCorde(num) {   // num : 1 = aiguë
      return yHaut + 6 + (6 - num) * ((yBas - yHaut - 12) / 5);
    }

    // Zone de l'accord
    var pressees = accord.frettes.filter(function (f) { return f > 0; });
    var minF = pressees.length ? Math.min.apply(null, pressees) : 0;
    var maxF = pressees.length ? Math.max.apply(null, pressees) : 0;
    if (pressees.length) {
      var xa = xFrette(minF - 1), xb = xFrette(maxF);
      c += '<rect x="' + (xa - 3) + '" y="' + (yHaut - 10) + '" width="' + (xb - xa + 6) + '" height="' + (yBas - yHaut + 20) + '" rx="7" class="sch-zone"/>';
      c += fleche((xa + xb) / 2, 30, (xa + xb) / 2, yHaut - 14);
      c += txt((xa + xb) / 2, 24, minF === maxF ? ('case ' + minF) : ('cases ' + minF + ' à ' + maxF), 'sch-txt');
    }

    // Doigts, aux vraies positions du manche
    for (k = 0; k < 6; k++) {
      var num = k + 1;
      var frette = accord.frettes[num - 1];
      var doigt = accord.doigts ? accord.doigts[num - 1] : 0;
      var yc = yCorde(num);
      if (frette > 0) {
        var xc = (xFrette(frette - 1) + xFrette(frette)) / 2;
        c += '<circle cx="' + xc + '" cy="' + yc + '" r="8" class="sch-doigt-bout sch-doigt-' + (doigt || 1) + '"/>';
        if (doigt) c += '<text x="' + xc + '" y="' + (yc + 4) + '" class="sch-doigt-mini" text-anchor="middle">' + doigt + '</text>';
      } else if (frette === 0) {
        c += '<circle cx="' + (xSillet - 14) + '" cy="' + yc + '" r="5" class="sch-vide"/>';
      } else {
        c += '<text x="' + (xSillet - 14) + '" y="' + (yc + 4) + '" class="sch-mute" text-anchor="middle">✕</text>';
      }
    }

    c += txt(52, yBas + 34, 'tête', 'sch-petit');
    c += txt(xFrette(12), yBas + 34, '12e case', 'sch-petit');
    c += txt(470, yBas + 34, 'rosace', 'sch-petit');
    c += txt(L / 2, H - 6, 'Corde 6 (grave) en haut, comme sur une tablature. ○ corde à vide, ✕ corde non jouée.', 'sch-petit');
    return svg('0 0 ' + L + ' ' + H, c, 'Où se joue l’accord ' + accord.id + ' sur la guitare');
  }

  function rendre(id) {
    var f = S[id];
    return f ? f() : '';
  }
  function liste() { return Object.keys(S); }

  global.Illustrations = { rendre: rendre, liste: liste, mainAccord: mainAccord, positionSurGuitare: positionSurGuitare };
})(typeof window !== 'undefined' ? window : globalThis);
