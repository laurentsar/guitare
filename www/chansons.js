/* Chansons : françaises (grands classiques, hits récents) et internationales.
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
      ] },

    // ------------------------------------------- Chansons internationales
    // Mêmes règles : grille seule, simplifiée, capo pour la tonalité du disque.
    { id: 'ch-knockin', titre: 'Knockin’ on Heaven’s Door', artiste: 'Bob Dylan', annee: 1973,
      capo: 0, tempo: 68, groupe: 'international',
      sections: [
        { titre: 'Couplet', motif: 'balade', tours: 2, grille: ['G', 'D', 'Am', 'Am', 'G', 'D', 'C', 'C'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['G', 'D', 'Am', 'Am', 'G', 'D', 'C', 'C'] }
      ] },
    { id: 'ch-let-it-be', titre: 'Let It Be', artiste: 'The Beatles', annee: 1970,
      capo: 0, tempo: 72, groupe: 'international',
      note: 'Le Fa est le Fa barré : s’il résiste encore, joue Fa maj7 (onglet Accords) à la place.',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['C', 'G', 'Am', 'F', 'C', 'G', 'F|C', 'C'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['Am', 'G', 'F', 'C', 'C', 'G', 'F|C', 'C'] }
      ] },
    { id: 'ch-stand-by-me', titre: 'Stand By Me', artiste: 'Ben E. King', annee: 1961,
      capo: 0, tempo: 100, groupe: 'international',
      note: 'Fa♯ mineur est barré à la 2e case.',
      sections: [
        { titre: 'Couplet et refrain', motif: 'balade', tours: 2, grille: ['A', 'A', 'F#m', 'F#m', 'D', 'E', 'A', 'A'] }
      ] },
    { id: 'ch-no-woman-no-cry', titre: 'No Woman, No Cry', artiste: 'Bob Marley', annee: 1974,
      capo: 0, tempo: 76, groupe: 'international',
      sections: [
        { titre: 'Grille', motif: 'plaque', tours: 2, grille: ['C', 'G', 'Am', 'F', 'C', 'F', 'C', 'G'] },
        { titre: 'Grille en arpège', motif: 'arpege', grille: ['C', 'G', 'Am', 'F', 'C', 'F', 'C', 'G'] }
      ] },
    { id: 'ch-perfect', titre: 'Perfect', artiste: 'Ed Sheeran', annee: 2017,
      capo: 1, tempo: 63, groupe: 'international',
      note: 'Sur le disque, la mesure est à 6/8 (balancée) ; ici à 4 temps pour apprendre les changements.',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['G', 'Em', 'C', 'D'] },
        { titre: 'Pré-refrain', motif: 'balade', grille: ['Em', 'C', 'G', 'D', 'Em', 'C', 'D', 'D'] }
      ] },
    { id: 'ch-someone-like-you', titre: 'Someone Like You', artiste: 'Adele', annee: 2011,
      capo: 2, tempo: 68, groupe: 'international',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['G', 'D', 'Em', 'C'] },
        { titre: 'Refrain', motif: 'balade', tours: 2, grille: ['G', 'D', 'Em', 'C'] }
      ] },
    { id: 'ch-viva-la-vida', titre: 'Viva la Vida', artiste: 'Coldplay', annee: 2008,
      capo: 1, tempo: 100, groupe: 'international',
      note: 'Tempo du disque : environ 138. Monte-le avec l’entraîneur de vitesse.',
      sections: [
        { titre: 'Couplet', motif: 'plaque', tours: 2, grille: ['C', 'D', 'G', 'Em'] },
        { titre: 'Refrain', motif: 'balade', tours: 2, grille: ['C', 'D', 'G', 'Em'] }
      ] },
    { id: 'ch-riptide', titre: 'Riptide', artiste: 'Vance Joy', annee: 2013,
      capo: 1, tempo: 100, groupe: 'international',
      sections: [
        { titre: 'Couplet et refrain', motif: 'plaque', tours: 4, grille: ['Am', 'G', 'C', 'C'] }
      ] },
    { id: 'ch-country-roads', titre: 'Take Me Home, Country Roads', artiste: 'John Denver', annee: 1971,
      capo: 2, tempo: 80, groupe: 'international',
      sections: [
        { titre: 'Couplet', motif: 'balade', grille: ['G', 'Em', 'D', 'C', 'G', 'D', 'C', 'G'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['G', 'D', 'Em', 'C', 'G', 'D', 'C', 'G'] }
      ] },
    { id: 'ch-hallelujah', titre: 'Hallelujah', artiste: 'Leonard Cohen', annee: 1984,
      capo: 0, tempo: 56, groupe: 'international',
      note: 'Sur le disque, la mesure est balancée (12/8) ; ici à 4 temps, en arpège.',
      sections: [
        { titre: 'Couplet, début', motif: 'arpege', grille: ['C', 'Am', 'C', 'Am', 'F', 'G', 'C', 'G'] },
        { titre: 'Couplet, fin', motif: 'arpege', grille: ['C', 'F|G', 'Am', 'F', 'G', 'E7', 'Am', 'Am'] },
        { titre: 'Refrain', motif: 'arpege', grille: ['F', 'F', 'Am', 'Am', 'F', 'F', 'C|G', 'C'] }
      ] },
    { id: 'ch-sweet-home-alabama', titre: 'Sweet Home Alabama', artiste: 'Lynyrd Skynyrd', annee: 1974,
      capo: 0, tempo: 96, groupe: 'international',
      note: 'Le Do se joue souvent Do add9 sur le disque ; ici le Do simple.',
      sections: [
        { titre: 'Grille', motif: 'plaque', tours: 4, grille: ['D', 'C|G'] }
      ] },
    { id: 'ch-imagine', titre: 'Imagine', artiste: 'John Lennon', annee: 1971,
      capo: 0, tempo: 76, groupe: 'international',
      sections: [
        { titre: 'Couplet', motif: 'arpege', grille: ['C', 'Cmaj7', 'F', 'F', 'C', 'Cmaj7', 'F', 'F'] },
        { titre: 'Pont', motif: 'arpege', grille: ['Am', 'Dm', 'F', 'G', 'G7', 'G7', 'G7', 'G7'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['F', 'G', 'C', 'E7', 'F', 'G', 'C', 'C'] }
      ] },

    // ------------------------------------------------- Rock et reggae
    // Progressions vérifiées sur Hooktheory (analyses en degrés, oct. 2026),
    // puis jouées en accords de guitare. Power chords (A5, F5…) pour le rock :
    // motif « rock », le pouce balaie l'accord en croches.
    { id: 'ch-self-esteem', titre: 'Self Esteem', artiste: 'The Offspring', annee: 1994,
      capo: 0, tempo: 104, groupe: 'rock',
      note: 'Tout le morceau tourne sur La – Fa – Do – Sol en power chords ; le pont passe en Ré.',
      sections: [
        { titre: 'Couplet et refrain', motif: 'rock', tours: 4, grille: ['A5', 'F5', 'C5', 'G5'] },
        { titre: 'Pont', motif: 'rock', tours: 2, grille: ['D5', 'Bb5', 'F5', 'C5'] }
      ] },
    { id: 'ch-kids-arent-alright', titre: 'The Kids Aren’t Alright', artiste: 'The Offspring', annee: 1998,
      capo: 1, tempo: 100, groupe: 'rock',
      note: 'Même grille que Self Esteem, un demi-ton plus haut (capo case 1).',
      sections: [
        { titre: 'Couplet et refrain', motif: 'rock', tours: 4, grille: ['A5', 'F5', 'C5', 'G5'] }
      ] },
    { id: 'ch-teen-spirit', titre: 'Smells Like Teen Spirit', artiste: 'Nirvana', annee: 1991,
      capo: 0, tempo: 116, groupe: 'rock',
      note: 'Quatre power chords, deux par mesure, qui ne changent jamais (Fa, Si♭, La♭, Ré♭). La main gauche glisse le long du manche sans changer de forme.',
      sections: [
        { titre: 'Grille', motif: 'rock', tours: 4, grille: ['F5|Bb5', 'Ab5|Db5'] }
      ] },
    { id: 'ch-come-as-you-are', titre: 'Come As You Are', artiste: 'Nirvana', annee: 1992,
      capo: 0, tempo: 110, groupe: 'rock',
      note: 'Sur le disque, la guitare est accordée un ton plus bas : ici en accordage normal, les accords se jouent comme écrits (Mi m – Ré, puis La m – Do).',
      sections: [
        { titre: 'Couplet', motif: 'balade', tours: 2, grille: ['Em', 'D', 'Em', 'D'] },
        { titre: 'Pré-refrain', motif: 'balade', grille: ['Em', 'G', 'Em', 'G'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['Am', 'C', 'Am', 'C'] }
      ] },
    { id: 'ch-polly', titre: 'Polly', artiste: 'Nirvana', annee: 1991,
      capo: 0, tempo: 120, groupe: 'rock',
      note: 'Sur le disque, accordage un ton plus bas. Le refrain passe par Si♭ (barré) ; les accords sus et add9 du disque sont joués simples.',
      sections: [
        { titre: 'Couplet', motif: 'balade', tours: 2, grille: ['Em', 'G', 'D', 'C'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['D', 'C', 'G', 'Bb', 'Am', 'Am'] }
      ] },
    { id: 'ch-linger', titre: 'Linger', artiste: 'The Cranberries', annee: 1993,
      capo: 0, tempo: 95, groupe: 'rock',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['D', 'A', 'G', 'G'] },
        { titre: 'Refrain', motif: 'balade', tours: 2, grille: ['D', 'A', 'G', 'G'] }
      ] },
    { id: 'ch-dreams', titre: 'Dreams', artiste: 'The Cranberries', annee: 1992,
      capo: 0, tempo: 110, groupe: 'rock',
      sections: [
        { titre: 'Couplet et refrain', motif: 'balade', tours: 4, grille: ['E', 'A', 'B7', 'B7'] },
        { titre: 'Fin', motif: 'plaque', tours: 2, grille: ['G', 'C'] }
      ] },
    { id: 'ch-every-breath', titre: 'Every Breath You Take', artiste: 'The Police', annee: 1983,
      capo: 1, tempo: 100, groupe: 'rock',
      note: 'Le couplet seulement (Sol – Mi m – Do – Ré), en arpège comme sur le disque ; les accords add9 du disque sont joués simples.',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['G', 'G', 'Em', 'Em', 'C', 'D', 'G', 'G'] }
      ] },
    { id: 'ch-message-in-a-bottle', titre: 'Message in a Bottle', artiste: 'The Police', annee: 1979,
      capo: 0, tempo: 110, groupe: 'rock',
      note: 'Sur le disque, le riff du couplet est fait d’accords « sus2 » très écartés ; ici des power chords sur les mêmes notes de basse (Do♯, La, Si, Fa♯).',
      sections: [
        { titre: 'Couplet', motif: 'rock', tours: 2, grille: ['C#5', 'A5', 'B5', 'F#5'] },
        { titre: 'Pré-refrain', motif: 'plaque', grille: ['A', 'D', 'E', 'E'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['C#m', 'A'] }
      ] },
    { id: 'ch-redemption-song', titre: 'Redemption Song', artiste: 'Bob Marley', annee: 1980,
      capo: 0, tempo: 70, groupe: 'rock',
      sections: [
        { titre: 'Couplet', motif: 'balade', tours: 2, grille: ['G', 'Em', 'C', 'Am'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['D', 'G', 'C', 'C'] }
      ] },
    { id: 'ch-three-little-birds', titre: 'Three Little Birds', artiste: 'Bob Marley', annee: 1977,
      capo: 0, tempo: 74, groupe: 'rock',
      sections: [
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['A', 'A', 'D', 'A'] },
        { titre: 'Couplet', motif: 'plaque', tours: 2, grille: ['A', 'E', 'A', 'D'] }
      ] },
    { id: 'ch-is-this-love', titre: 'Is This Love', artiste: 'Bob Marley', annee: 1978,
      capo: 2, tempo: 100, groupe: 'rock',
      note: 'Capo case 2 : les accords Fa♯ m – Ré – La du disque se jouent Mi m – Do – Sol. Le pont demande Si m (barré).',
      sections: [
        { titre: 'Couplet et refrain', motif: 'plaque', tours: 2, grille: ['Em', 'C', 'G', 'G'] },
        { titre: 'Pont', motif: 'plaque', tours: 2, grille: ['Bm', 'Am'] }
      ] }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
