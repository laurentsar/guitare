/* Portée : notation musicale classique, dessinée à partir des mêmes notes que
 * la tablature.
 *
 * Pourquoi les deux : la tablature dit OÙ poser les doigts, la portée dit CE
 * QU'ON JOUE — hauteur, durée, silences. En guitare classique, l'élève finit
 * toujours par lire la portée ; la tablature n'est qu'une béquille de départ.
 * Les deux sont produites depuis le même modèle (corde + case + temps), donc
 * elles ne peuvent pas se contredire.
 *
 * Convention qui surprend tout le monde : la musique de guitare s'écrit UNE
 * OCTAVE AU-DESSUS de ce qui sonne (d'où le petit 8 sous la clé). Un Mi aigu à
 * vide, qui sonne Mi4, s'écrit donc à la place du Mi5. Sans cette
 * transposition, toute la partition serait à cheval sur des lignes
 * supplémentaires sous la portée.
 */
(function (global) {
  'use strict';

  var LETTRES = ['do', 're', 'mi', 'fa', 'sol', 'la', 'si'];
  // Demi-tons de chaque degré depuis le do : sert à savoir si une note a
  // besoin d'un dièse pour être écrite.
  var DEMI_TONS = [0, 2, 4, 5, 7, 9, 11];

  /* Degré diatonique absolu d'une note MIDI : do4 = 4*7+0. Une altération
   * (do♯) garde le degré du do — c'est justement ce qui permet de la placer
   * sur la même ligne avec un dièse devant. */
  function degre(midi) {
    var pc = ((midi % 12) + 12) % 12;
    var octave = Math.floor(midi / 12) - 1;
    var idx = 0, alt = 0;
    for (var i = 6; i >= 0; i--) {
      if (DEMI_TONS[i] <= pc) { idx = i; alt = pc - DEMI_TONS[i]; break; }
    }
    return { degre: octave * 7 + idx, alteration: alt, nom: LETTRES[idx] };
  }

  var LIGNE_BASSE = 30;      // mi4 écrit = ligne du bas de la portée en clé de sol
  var ECART = 5;             // un degré = un demi-interligne

  function yDeNote(midi, yBas) {
    // +12 : la guitare s'écrit une octave au-dessus de ce qui sonne.
    var d = degre(midi + 12);
    return { y: yBas - (d.degre - LIGNE_BASSE) * ECART, alteration: d.alteration, degre: d.degre };
  }

  /* Clé de sol, dessinée au trait. Le glyphe Unicode 𝄞 n'est pas garanti sur
   * un téléviseur (police système incomplète = carré tofu), et une police
   * musicale pèserait plus que toute l'app. */
  function cleDeSol(x, yBas) {
    var h = yBas;                       // ligne du bas
    var p = '<g class="portee-cle" transform="translate(' + x + ',' + (h - 40) + ') scale(0.95)">';
    p += '<path d="M8 52 C8 44 14 40 14 32 C14 24 8 20 8 12 C8 4 14 0 20 0 ' +
         'C26 0 30 5 30 12 C30 22 20 28 12 34 C4 40 0 46 0 54 ' +
         'C0 62 6 68 14 68 C22 68 28 62 28 54 C28 46 22 41 14 41 ' +
         'C10 41 6 43 4 46" class="portee-trait"/>';
    p += '<line x1="15" y1="0" x2="15" y2="62" class="portee-trait"/>';
    p += '</g>';
    // Le petit 8 : notation « une octave plus bas qu'écrit ».
    p += '<text x="' + (x + 14) + '" y="' + (yBas + 22) + '" class="portee-octave" text-anchor="middle">8</text>';
    return p;
  }

  function teteEtQueue(x, y, duree, versLeBas) {
    var s = '';
    var creuse = duree >= 2;
    s += '<ellipse cx="' + x + '" cy="' + y + '" rx="5.2" ry="3.9" transform="rotate(-20 ' + x + ' ' + y + ')" class="' +
         (creuse ? 'portee-tete-creuse' : 'portee-tete') + '"/>';
    if (duree < 4) {
      var xq = versLeBas ? x - 5 : x + 5;
      var yq = versLeBas ? y + 26 : y - 26;
      s += '<line x1="' + xq + '" y1="' + y + '" x2="' + xq + '" y2="' + yq + '" class="portee-trait"/>';
      // Crochet : une courbe, pas une ligature — les ligatures demanderaient
      // de regrouper les croches par temps, et une croche isolée reste juste
      // avec un crochet. Deux crochets pour une double croche.
      var pointee = [0.75, 1.5, 3].indexOf(duree) !== -1;
      var base = pointee ? duree / 1.5 : duree;
      if (base < 1) {
        var sens = versLeBas ? -1 : 1;
        s += '<path d="M' + xq + ' ' + yq + ' q 9 ' + (4 * sens) + ' 8 ' + (14 * sens) + '" class="portee-trait"/>';
        if (base <= 0.25 + 1e-6) {
          s += '<path d="M' + xq + ' ' + (yq + 7 * sens) + ' q 9 ' + (4 * sens) + ' 8 ' + (14 * sens) + '" class="portee-trait"/>';
        }
      }
    }
    if ([0.75, 1.5, 3].indexOf(duree) !== -1) {
      s += '<circle cx="' + (x + 9) + '" cy="' + (y - 2) + '" r="1.8" class="portee-tete"/>';
    }
    return s;
  }

  function lignesSupplementaires(x, y, yBas, yHaut) {
    var s = '';
    // Sous la portée.
    for (var yy = yBas + 10; yy <= y + 1; yy += 10) {
      s += '<line x1="' + (x - 9) + '" y1="' + yy + '" x2="' + (x + 9) + '" y2="' + yy + '" class="portee-ligne"/>';
    }
    // Au-dessus.
    for (yy = yHaut - 10; yy >= y - 1; yy -= 10) {
      s += '<line x1="' + (x - 9) + '" y1="' + yy + '" x2="' + (x + 9) + '" y2="' + yy + '" class="portee-ligne"/>';
    }
    return s;
  }

  function svgSysteme(ligne, opts) {
    var parMesure = opts.parMesure || 4;
    var pxParTemps = opts.pxParTemps || 46;
    var margeG = 62, margeD = 10;
    var hautExtra = 44, basExtra = 52;   // place pour les lignes supplémentaires
    var yHaut = hautExtra;               // ligne du haut
    var yBas = yHaut + 40;               // 5 lignes, 10 px d'écart
    var L = margeG + (ligne.fin - ligne.debut) * pxParTemps + margeD;
    var H = yBas + basExtra;

    var p = ['<svg viewBox="0 0 ' + L + ' ' + H + '" class="portee" preserveAspectRatio="xMinYMid meet">'];
    for (var i = 0; i < 5; i++) {
      var y = yHaut + i * 10;
      p.push('<line x1="' + margeG + '" y1="' + y + '" x2="' + (L - margeD) + '" y2="' + y + '" class="portee-ligne"/>');
    }
    p.push(cleDeSol(margeG - 46, yBas));
    if (opts.signature) {
      p.push('<text x="' + (margeG - 14) + '" y="' + (yHaut + 18) + '" class="portee-chiffrage" text-anchor="middle">' + opts.signature[0] + '</text>');
      p.push('<text x="' + (margeG - 14) + '" y="' + (yHaut + 38) + '" class="portee-chiffrage" text-anchor="middle">' + opts.signature[1] + '</text>');
    }
    for (var t = ligne.debut; t <= ligne.fin; t += parMesure) {
      var x = margeG + (t - ligne.debut) * pxParTemps;
      p.push('<line x1="' + x + '" y1="' + yHaut + '" x2="' + x + '" y2="' + yBas + '" class="portee-mesure"/>');
    }

    ligne.notes.forEach(function (n) {
      var x = margeG + (n.temps - ligne.debut) * pxParTemps + 10;
      var pos = yDeNote(n.midi != null ? n.midi : Theorie.midiDeCase(n.corde, n.frette), yBas);
      p.push('<g class="portee-note" data-temps="' + n.temps + '">');
      if (pos.y > yBas || pos.y < yHaut) p.push(lignesSupplementaires(x, pos.y, yBas, yHaut));
      if (pos.alteration) p.push('<text x="' + (x - 13) + '" y="' + (pos.y + 5) + '" class="portee-alteration" text-anchor="middle">♯</text>');
      // Queue vers le haut sous la 3e ligne, vers le bas au-dessus : règle
      // d'écriture habituelle, et ça évite que les queues sortent du cadre.
      p.push(teteEtQueue(x, pos.y, n.duree || 1, pos.y < yHaut + 20));
      p.push('</g>');
    });
    p.push('</svg>');
    return p.join('');
  }

  function svg(piece, opts) {
    opts = opts || {};
    var parMesure = Tablature.noiresParMesure(piece);
    var lignes = Tablature.systemes(piece, opts.mesuresParLigne || 2);
    return lignes.map(function (l, i) {
      return '<div class="portee-ligne-bloc">' + svgSysteme(l, {
        parMesure: parMesure,
        pxParTemps: opts.pxParTemps,
        signature: i === 0 ? (piece.signature || [4, 4]) : null
      }) + '</div>';
    }).join('');
  }

  global.Portee = { svg: svg, svgSysteme: svgSysteme, degre: degre, yDeNote: yDeNote };
})(typeof window !== 'undefined' ? window : globalThis);
