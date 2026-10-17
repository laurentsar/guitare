/* Chansons françaises : grands classiques et hits récents.
 *
 * Ces chansons sont SOUS DROITS : ni mélodie, ni riff, ni paroles ici. Ce
 * fichier ne contient que des GRILLES D'ACCORDS (l'enchaînement des accords,
 * qui n'est pas protégé) ; l'accompagnement joué (arpège, basse + accord…)
 * est écrit pour cette app par morceaux.js, comme pour Zombie.
 *
 * Grilles relevées sur boiteachansons.net (oct. 2026), recoupées avec les
 * enregistrements connus, puis SIMPLIFIÉES pour la guitare classique :
 *   - les accords sont écrits tels qu'on les JOUE avec le capodastre indiqué
 *     (champ `capo`) : la tonalité du disque est retrouvée, les doigtés
 *     restent ceux de la bibliothèque d'accords ;
 *   - accords à basse décalée (C/B…) → accord simple ; sus/add9/6/9 → accord
 *     de base ou sa septième ; un accord diminué → l'accord de 7e qui joue le
 *     même rôle (noté dans la description) ;
 *   - la forme est raccourcie (un tour de chaque partie, parfois deux) : de
 *     quoi apprendre la chanson, pas la jouer à l'identique.
 *
 * Grille : une case = une mesure à 4 temps ; 'F|G' = deux accords dans la
 * mesure (2 temps chacun). Motifs de main droite, voir morceaux.js :
 *   arpege  p-i-m-a-m-i-m-i en croches
 *   balade  p-i-m-i-alt-i-m-i en croches (basse alternée au 3e temps)
 *   plaque  basse, accord pincé, basse alternée, accord pincé (noires)
 */
(function (global) {
  'use strict';

  global.CHANSONS = [
    // ------------------------------------------------ Grands classiques
    { id: 'ch-je-l-aime-a-mourir', titre: 'Je l’aime à mourir', artiste: 'Francis Cabrel', annee: 1979,
      capo: 0, tempo: 72, groupe: 'classique',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['C', 'C', 'Am', 'Dm', 'F|G7', 'C', 'Am', 'Am'] },
        { titre: 'Pont', motif: 'plaque', grille: ['E|Am', 'G|C', 'E|Am', 'Bb|C'] }
      ] },
    { id: 'ch-lacs-du-connemara', titre: 'Les Lacs du Connemara', artiste: 'Michel Sardou', annee: 1981,
      capo: 0, tempo: 84, groupe: 'classique',
      note: 'Le couplet seulement (la partie en Ré) : le refrain change de tonalité plusieurs fois, il demande des barrés.',
      sections: [
        { titre: 'Couplet, 1re moitié', motif: 'balade', grille: ['D', 'G|D', 'A', 'Bm', 'A', 'Em|B7', 'B7|Em', 'A'] },
        { titre: 'Couplet, 2e moitié', motif: 'balade', grille: ['D', 'G|D', 'A', 'Bm', 'A|B7', 'Em|B7', 'B7|Em', 'Em'] }
      ] },
    { id: 'ch-belle-ile-en-mer', titre: 'Belle-Île-en-Mer, Marie-Galante', artiste: 'Laurent Voulzy', annee: 1985,
      capo: 0, tempo: 88, groupe: 'classique',
      sections: [
        { titre: 'Couplet', motif: 'arpege', grille: ['G', 'C', 'Bm', 'E7', 'Am7|D7', 'Bm', 'E7|Am7', 'D7|G'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['G7|C', 'G7|C', 'G7|C', 'C7|F', 'G7|C', 'C7|F', 'E7', 'Am7|D7'] }
      ] },
    { id: 'ch-encore-et-encore', titre: 'Encore et encore', artiste: 'Francis Cabrel', annee: 1985,
      capo: 1, tempo: 80, groupe: 'classique',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['Em', 'G', 'C', 'Am'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['Em', 'G', 'D', 'Em|C', 'G', 'B7', 'Am', 'Am'] }
      ] },
    { id: 'ch-petite-marie', titre: 'Petite Marie', artiste: 'Francis Cabrel', annee: 1977,
      capo: 2, tempo: 76, groupe: 'classique',
      sections: [
        { titre: 'Introduction', motif: 'arpege', grille: ['Am|G', 'Em|Am', 'Dm|G', 'Em|Am'] },
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['Dm|G7', 'Am', 'Dm|E', 'Am'] },
        { titre: 'Refrain', motif: 'balade', grille: ['F|G', 'Am', 'F|G', 'Em', 'F|G', 'Am|E', 'C|D', 'Am'] }
      ] },
    { id: 'ch-mistral-gagnant', titre: 'Mistral gagnant', artiste: 'Renaud', annee: 1985,
      capo: 3, tempo: 66, groupe: 'classique',
      sections: [
        { titre: 'Couplet', motif: 'arpege', grille: ['Am', 'Dm', 'G', 'C', 'Am', 'Dm', 'G', 'C'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['F|E', 'Am', 'F|E', 'Am', 'F', 'G'] }
      ] },
    { id: 'ch-le-sud', titre: 'Le Sud', artiste: 'Nino Ferrer', annee: 1975,
      capo: 4, tempo: 80, groupe: 'classique',
      sections: [
        { titre: 'Introduction', motif: 'arpege', grille: ['C', 'Em', 'Am', 'C', 'D7', 'Fm', 'C', 'C'] },
        { titre: 'Couplet', motif: 'arpege', grille: ['C', 'Em', 'Am', 'C', 'D7', 'F', 'C', 'C'] },
        { titre: 'Refrain', motif: 'balade', grille: ['F', 'C|C7', 'F', 'C|C7', 'F', 'C', 'Am', 'D'] }
      ] },
    { id: 'ch-la-boheme', titre: 'La Bohème', artiste: 'Charles Aznavour', annee: 1965,
      capo: 3, tempo: 76, groupe: 'classique',
      sections: [
        { titre: 'Couplet', motif: 'plaque', grille: ['Dm', 'Bm7b5', 'Am', 'Am|Dm', 'E7|Am', 'Am', 'Dm', 'Bm7b5', 'Am', 'Am|Dm', 'E7', 'Am'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['A7', 'Dm', 'Am7', 'Dm|E7', 'Am', 'A7', 'Dm', 'Bm7b5', 'Am', 'Dm|E7', 'Am'] }
      ] },
    { id: 'ch-champs-elysees', titre: 'Les Champs-Élysées', artiste: 'Joe Dassin', annee: 1969,
      capo: 4, tempo: 92, groupe: 'classique',
      sections: [
        { titre: 'Couplet', motif: 'balade', grille: ['C', 'G', 'Am', 'C7', 'F', 'C', 'D', 'G', 'C', 'G', 'Am', 'C7', 'F', 'C', 'F|G', 'C'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['C', 'E7', 'Am', 'C', 'F|Em', 'D|G', 'C', 'E7', 'Am', 'C7', 'F', 'C', 'F|G', 'C'] }
      ] },
    { id: 'ch-foule-sentimentale', titre: 'Foule sentimentale', artiste: 'Alain Souchon', annee: 1993,
      capo: 0, tempo: 92, groupe: 'classique',
      sections: [
        { titre: 'Couplet', motif: 'balade', tours: 2, grille: ['Em', 'Am', 'D', 'B7', 'Em', 'C', 'Am', 'B7'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['Em', 'Am', 'D', 'B7', 'Em', 'C', 'Am', 'B7'] }
      ] },
    { id: 'ch-je-te-promets', titre: 'Je te promets', artiste: 'Johnny Hallyday', annee: 1986,
      capo: 0, tempo: 70, groupe: 'classique',
      sections: [
        { titre: 'Couplet', motif: 'arpege', grille: ['C', 'Em7', 'Dm', 'Fmaj7|G', 'C', 'Em7', 'Dm', 'Fmaj7|G'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['F|C', 'Dm|Am', 'F|C', 'Dm|C', 'F|G', 'G'] }
      ] },
    { id: 'ch-desenchantee', titre: 'Désenchantée', artiste: 'Mylène Farmer', annee: 1991,
      capo: 0, tempo: 90, groupe: 'classique',
      sections: [
        { titre: 'Couplet', motif: 'balade', grille: ['Em', 'Bm', 'D', 'Bm', 'Em', 'Bm|D', 'Bm', 'Bm'] },
        { titre: 'Avant le refrain', motif: 'balade', grille: ['F#m', 'E|D', 'F#m', 'E|D', 'F#m', 'E|D', 'A', 'A'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['Bm', 'G|A', 'Bm', 'G|A', 'Bm', 'G|A', 'Bm', 'G|A'] }
      ] },
    { id: 'ch-ne-me-quitte-pas', titre: 'Ne me quitte pas', artiste: 'Jacques Brel', annee: 1959,
      capo: 0, tempo: 66, groupe: 'classique',
      sections: [
        { titre: 'Couplet', motif: 'arpege', grille: ['Am', 'Am7', 'Dm', 'E7', 'Dm', 'E7', 'Am', 'Am7', 'Dm', 'E7', 'Am', 'Dm|Am', 'Dm', 'E7', 'Am', 'Am'] },
        { titre: 'Milieu', motif: 'arpege', grille: ['Am', 'F', 'E7', 'Am|E7', 'Am', 'F', 'G', 'Dm|E7', 'Am', 'Gm', 'F', 'E7|Am', 'G', 'Dm', 'E7', 'E7'] }
      ] },
    { id: 'ch-santiano', titre: 'Santiano', artiste: 'Hugues Aufray', annee: 1961,
      capo: 0, tempo: 100, groupe: 'classique',
      sections: [
        { titre: 'Couplet et refrain', motif: 'plaque', tours: 3, grille: ['Em', 'Em|D', 'Em', 'D', 'Am', 'D', 'Em|D', 'Em'] }
      ] },
    { id: 'ch-en-apesanteur', titre: 'En apesanteur', artiste: 'Calogero', annee: 2002,
      capo: 5, tempo: 72, groupe: 'classique',
      note: 'L’accord diminué du disque est remplacé par un Ré 7 (même rôle, plus simple).',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['Am', 'C', 'D7', 'F'] },
        { titre: 'Refrain', motif: 'balade', tours: 2, grille: ['Dm|G', 'Am', 'Dm|G', 'F'] }
      ] },

    // ------------------------------------------------------ Hits récents
    { id: 'ch-papaoutai', titre: 'Papaoutai', artiste: 'Stromae', annee: 2013,
      capo: 1, tempo: 90, groupe: 'hit',
      sections: [
        { titre: 'Couplet', motif: 'plaque', grille: ['Am', 'G', 'F', 'F', 'Dm', 'G', 'Am', 'Am'] },
        { titre: 'Refrain', motif: 'balade', tours: 2, grille: ['F', 'Dm', 'G', 'Am'] }
      ] },
    { id: 'ch-derniere-danse', titre: 'Dernière danse', artiste: 'Indila', annee: 2013,
      capo: 3, tempo: 72, groupe: 'hit',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['Am|Dm', 'C|E', 'Am|Dm', 'C|E'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['Am|Dm', 'C|E', 'Am|Dm', 'C|E'] }
      ] },
    { id: 'ch-je-m-en-vais', titre: 'Je m’en vais', artiste: 'Vianney', annee: 2016,
      capo: 3, tempo: 84, groupe: 'hit',
      sections: [
        { titre: 'Couplet', motif: 'balade', grille: ['Em|C', 'D|Em', 'Em|C', 'D|Em', 'Em|C', 'D|Em', 'Em|C', 'D'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['Em|C', 'D|Em', 'Em|C', 'Bm|Em'] },
        { titre: 'Pont', motif: 'arpege', grille: ['C|Am', 'D|G', 'C|Am', 'Bm'] }
      ] },
    { id: 'ch-popcorn-sale', titre: 'Popcorn salé', artiste: 'Santa', annee: 2024,
      capo: 1, tempo: 80, groupe: 'hit',
      sections: [
        { titre: 'Couplet', motif: 'arpege', grille: ['D', 'F#m', 'D', 'F#m', 'Gmaj7', 'Em', 'Gmaj7', 'Em'] },
        { titre: 'Refrain', motif: 'balade', grille: ['D', 'F#m', 'D|F#m', 'G|Em', 'D', 'F#m', 'D|F#m', 'G|Em'] }
      ] },
    { id: 'ch-maman-louane', titre: 'Maman', artiste: 'Louane', annee: 2025,
      capo: 3, tempo: 72, groupe: 'hit',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['Am|G', 'Dm|G', 'F|Em', 'Am'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['F|G', 'C|F', 'F|Em', 'Am', 'F|G', 'C|F', 'F|Em', 'Am'] }
      ] },
    { id: 'ch-comme-un-oiseau', titre: 'Comme un oiseau', artiste: 'Slimane',
      capo: 3, tempo: 76, groupe: 'hit',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['Em', 'Am7', 'D', 'G|B7'] },
        { titre: 'Refrain', motif: 'plaque', tours: 3, grille: ['Em|Am7', 'D|G'] }
      ] }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
