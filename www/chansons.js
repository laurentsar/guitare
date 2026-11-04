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
      ] },
    { id: 'ch-go-far-kid', titre: 'You’re Gonna Go Far, Kid', artiste: 'The Offspring', annee: 2008,
      capo: 0, tempo: 126, groupe: 'rock',
      note: 'Accords ouverts grattés au pouce ; le Fa est barré.',
      sections: [
        { titre: 'Couplet', motif: 'rock', tours: 2, grille: ['Am', 'F', 'C', 'G'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['F', 'Dm', 'F', 'Em', 'G', 'G'] }
      ] },
    { id: 'ch-get-a-job', titre: 'Why Don’t You Get a Job?', artiste: 'The Offspring', annee: 1998,
      capo: 1, tempo: 108, groupe: 'rock',
      note: 'Capo case 1 : les accords Fa – Si♭ – Do du disque se jouent Mi – La – Si7 (le Si7 remplace le Si, sans barré).',
      sections: [
        { titre: 'Couplet et refrain', motif: 'balade', tours: 4, grille: ['E', 'A', 'E', 'B7'] },
        { titre: 'Pont', motif: 'plaque', grille: ['A', 'E', 'B7', 'A7', 'E', 'E'] }
      ] },
    { id: 'ch-want-you-bad', titre: 'Want You Bad', artiste: 'The Offspring', annee: 2000,
      capo: 0, tempo: 106, groupe: 'rock',
      note: 'Tout en power chords. Le Sol♯ m du disque est laissé de côté.',
      sections: [
        { titre: 'Intro', motif: 'rock', grille: ['E5', 'B5', 'A5', 'C#5|B5'] },
        { titre: 'Couplet et refrain', motif: 'rock', tours: 2, grille: ['E5', 'C#5', 'B5', 'A5'] },
        { titre: 'Pré-refrain', motif: 'rock', grille: ['A5', 'B5', 'C#5', 'E5'] },
        { titre: 'Pont', motif: 'rock', grille: ['B5', 'A5', 'E5', 'E5'] }
      ] },
    { id: 'ch-lithium', titre: 'Lithium', artiste: 'Nirvana', annee: 1991,
      capo: 0, tempo: 123, groupe: 'rock',
      note: 'Power chords sur les fondamentales du disque (Ré, Fa♯, Si, Sol, Si♭) : la même forme glisse le long du manche.',
      sections: [
        { titre: 'Couplet et refrain', motif: 'rock', tours: 4, grille: ['D5', 'F#5', 'B5', 'G5', 'Bb5'] },
        { titre: 'Fin du refrain', motif: 'rock', tours: 2, grille: ['G5', 'Bb5'] }
      ] },
    { id: 'ch-heart-shaped-box', titre: 'Heart-Shaped Box', artiste: 'Nirvana', annee: 1993,
      capo: 0, tempo: 100, groupe: 'rock',
      note: 'Power chords sur les fondamentales du disque (Sol♯, Mi, Do♯) ; les accords sus du disque sont joués simples.',
      sections: [
        { titre: 'Couplet', motif: 'rock', tours: 2, grille: ['G#5', 'E5', 'C#5', 'G#5'] },
        { titre: 'Refrain', motif: 'rock', tours: 2, grille: ['G#5', 'E5', 'C#5', 'C#5'] }
      ] },
    { id: 'ch-when-youre-gone', titre: 'When You’re Gone', artiste: 'The Cranberries', annee: 1996,
      capo: 3, tempo: 66, groupe: 'rock',
      note: 'Capo case 3 : Mi♭ – Do m – Sol m – Si♭ se jouent Do – La m – Mi m – Sol. Au refrain, le La♭7 du disque devient Fa (barré).',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['C', 'Am', 'Em', 'G'] },
        { titre: 'Refrain', motif: 'balade', tours: 2, grille: ['C', 'Am', 'Em', 'F'] }
      ] },
    { id: 'ch-ode-to-my-family', titre: 'Ode to My Family', artiste: 'The Cranberries', annee: 1994,
      capo: 2, tempo: 87, groupe: 'rock',
      note: 'Capo case 2 : Ré – Si m – Fa♯ m – Sol se jouent Do – La m – Mi m – Fa (ici Fa maj7, sans barré). La grille de l’intro, qui revient tout le long.',
      sections: [
        { titre: 'Intro', motif: 'arpege', tours: 2, grille: ['C', 'Am', 'Em', 'Fmaj7'] },
        { titre: 'Couplet', motif: 'balade', tours: 2, grille: ['C', 'Am', 'Em', 'Fmaj7'] }
      ] },
    { id: 'ch-so-lonely', titre: 'So Lonely', artiste: 'The Police', annee: 1978,
      capo: 0, tempo: 150, groupe: 'rock',
      note: 'La même grille du début à la fin (Do – Sol – La m – Fa) ; le Fa est barré.',
      sections: [
        { titre: 'Couplet et refrain', motif: 'plaque', tours: 4, grille: ['C', 'G', 'Am', 'F'] }
      ] },
    { id: 'ch-walking-on-the-moon', titre: 'Walking on the Moon', artiste: 'The Police', annee: 1979,
      capo: 0, tempo: 72, groupe: 'rock',
      note: 'Les accords enrichis du couplet (Ré m7, Do9sus4) sont joués simples. Le refrain demande deux barrés (Si♭, Sol m).',
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['Dm', 'C', 'Am', 'Am'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['Bb', 'F', 'C', 'Gm'] }
      ] },
    { id: 'ch-stir-it-up', titre: 'Stir It Up', artiste: 'Bob Marley', annee: 1973,
      capo: 0, tempo: 75, groupe: 'rock',
      note: 'Trois accords (La – Ré – Mi), joués plaqués à contretemps comme au reggae.',
      sections: [
        { titre: 'Refrain', motif: 'plaque', tours: 4, grille: ['A', 'A', 'D', 'E'] }
      ] },
    { id: 'ch-buffalo-soldier', titre: 'Buffalo Soldier', artiste: 'Bob Marley', annee: 1983,
      capo: 2, tempo: 125, groupe: 'rock',
      note: 'Capo case 2 : La – Fa♯ m – Ré7 se jouent Sol – Mi m – Do7, sans barré.',
      sections: [
        { titre: 'Couplet', motif: 'plaque', tours: 4, grille: ['G', 'Em', 'C7', 'Em'] }
      ] },
    { id: 'ch-one-love', titre: 'One Love', artiste: 'Bob Marley', annee: 1977,
      capo: 3, tempo: 76, groupe: 'rock',
      note: 'Capo case 3 : Si♭ – Fa – Mi♭ se jouent Sol – Ré – Do. Le refrain seulement.',
      sections: [
        { titre: 'Refrain', motif: 'plaque', tours: 4, grille: ['G', 'D', 'C', 'G|D'] }
      ] },
    /* Vu sur TikTok : chansons dont les vidéos montraient le riff. Le riff
     * est la mélodie de la chanson, sous droits : ici la grille seulement,
     * rangée dans la section 📱 TikTok. Grilles d'après Hooktheory. */
    { id: 'ch-smoke-on-the-water', titre: 'Smoke on the Water', artiste: 'Deep Purple', annee: 1972,
      capo: 0, tempo: 112, groupe: 'tiktok',
      structure: ['Intro', 'Couplet:Couplet', 'Refrain', 'Intro:Riff', 'Couplet', 'Refrain', 'Intro:Riff', 'Couplet:Solo', 'Couplet', 'Refrain', 'Intro:Fin'],
      note: 'En Sol mineur, tout en power chords. Les accords de l’intro (Sol, Si♭, Do) sont ceux sur lesquels tourne le riff célèbre.',
      sections: [
        { titre: 'Intro', motif: 'rock', tours: 2, grille: ['G5', 'Bb5', 'C5', 'G5'] },
        { titre: 'Couplet', motif: 'rock', tours: 2, grille: ['G5', 'F5', 'G5', 'G5'] },
        { titre: 'Refrain', motif: 'rock', tours: 2, grille: ['C5', 'Ab5', 'G5', 'G5|Bb5'] }
      ] },
    { id: 'ch-feel-good-inc', titre: 'Feel Good Inc', artiste: 'Gorillaz', annee: 2005,
      capo: 6, tempo: 138, groupe: 'tiktok',
      structure: ['Couplet', 'Refrain', 'Couplet', 'Refrain', 'Couplet:Pont', 'Refrain', 'Couplet:Fin:1'],
      note: 'Capo case 6 : Ré♯ m – La♯7 – Sol♯ m7 se jouent La m – Mi7 – Ré m (le m7 joué simple).',
      sections: [
        { titre: 'Couplet', motif: 'balade', tours: 2, grille: ['Am', 'E7', 'Dm', 'Am'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['Am', 'G', 'Dm', 'E7'] }
      ] },
    { id: 'ch-do-i-wanna-know', titre: 'Do I Wanna Know?', artiste: 'Arctic Monkeys', annee: 2013,
      capo: 3, tempo: 85, groupe: 'tiktok',
      structure: ['Couplet et refrain:Intro:1', 'Couplet et refrain:Couplet', 'Pré-refrain', 'Couplet et refrain:Refrain', 'Couplet et refrain:Couplet', 'Pré-refrain', 'Couplet et refrain:Refrain', 'Couplet et refrain:Fin:1'],
      note: 'Capo case 3 : Sol m – Mi♭ – Do m – Ré se jouent Mi m – Do – La m – Si7.',
      sections: [
        { titre: 'Couplet et refrain', motif: 'plaque', tours: 2, grille: ['Em', 'C', 'Am', 'B7'] },
        { titre: 'Pré-refrain', motif: 'balade', grille: ['C', 'Am', 'Em', 'Em'] }
      ] },
    { id: 'ch-dance-monkey', titre: 'Dance Monkey', artiste: 'Tones and I', annee: 2019,
      capo: 2, tempo: 98, groupe: 'tiktok',
      structure: ['Couplet', 'Refrain', 'Couplet', 'Refrain', 'Refrain:Refrain final'],
      note: 'Capo case 2 : Fa♯ m – Ré – Mi – Do♯ m se jouent Mi m – Do – Ré – Si m (barré).',
      sections: [
        { titre: 'Couplet', motif: 'plaque', tours: 2, grille: ['Bm', 'Em', 'C', 'D'] },
        { titre: 'Refrain', motif: 'balade', tours: 2, grille: ['Em', 'C', 'D', 'Bm'] }
      ] },
    { id: 'ch-where-is-my-mind', titre: 'Where Is My Mind?', artiste: 'Pixies', annee: 1988,
      capo: 4, tempo: 81, groupe: 'tiktok',
      structure: ['Couplet et refrain:Intro:1', 'Couplet et refrain:Couplet:2', 'Couplet et refrain:Refrain:2', 'Couplet et refrain:Couplet:2', 'Couplet et refrain:Refrain:2', 'Couplet et refrain:Solo:2', 'Couplet et refrain:Refrain final:2'],
      note: 'Capo case 4 : Mi – Do♯ m – Sol♯ – La se jouent Do – La m – Mi – Fa (barré). La même grille du début à la fin.',
      sections: [
        { titre: 'Couplet et refrain', motif: 'balade', tours: 4, grille: ['C', 'Am', 'E', 'F'] }
      ] },
    { id: 'ch-hit-the-road-jack', titre: 'Hit the Road Jack', artiste: 'Ray Charles', annee: 1961,
      capo: 4, tempo: 87, groupe: 'tiktok',
      structure: ['Grille:Refrain:2', 'Grille:Couplet:2', 'Grille:Refrain:2', 'Grille:Couplet:2', 'Grille:Refrain:2', 'Grille:Couplet:2', 'Grille:Fin:2'],
      note: 'Capo case 4 : Sol♯ m – Fa♯ – Mi – Ré♯ se jouent Mi m – Ré – Do – Si7 : quatre accords qui descendent, en boucle.',
      sections: [
        { titre: 'Grille', motif: 'plaque', tours: 4, grille: ['Em', 'D', 'C', 'B7'] }
      ] },
    { id: 'ch-final-countdown', titre: 'The Final Countdown', artiste: 'Europe', annee: 1986,
      capo: 2, tempo: 118, groupe: 'tiktok',
      structure: ['Intro et refrain:Intro:1', 'Couplet', 'Intro et refrain:Refrain', 'Couplet', 'Intro et refrain:Refrain', 'Couplet:Solo', 'Intro et refrain:Refrain final'],
      note: 'Capo case 2 : Fa♯ m – Ré – Si m – Mi du disque se jouent Mi m – Do – La m – Ré, les accords que montre la vidéo. Deux mesures par accord, comme sous le riff du synthé.',
      sections: [
        { titre: 'Intro et refrain', motif: 'plaque', tours: 2, grille: ['Em', 'Em', 'C', 'C', 'Am', 'Am', 'D', 'D'] },
        { titre: 'Couplet', motif: 'balade', tours: 2, grille: ['Em', 'C', 'Am', 'D'] }
      ] },
    /* Top 20 de la guitare acoustique, par niveau (top : 1 débutant, 2
     * intermédiaire, 3 confirmé, 4 avancé). Grilles d'après Hooktheory,
     * simplifiées et transposées au capo vers des formes ouvertes. */
    { id: 'ch-wonderwall', titre: 'Wonderwall', artiste: 'Oasis', annee: 1995, capo: 2, tempo: 87, groupe: 'top20', top: 1,
      note: 'Capo case 2 : Fa♯ m7 – La – Mi sus4 – Si m7 du disque se jouent Mi m7 – Sol – Ré – La7 (sus4 joués simples).',
      structure: ['Couplet', 'Pré-refrain', 'Couplet', 'Pré-refrain', 'Refrain', 'Couplet', 'Pré-refrain', 'Refrain', 'Refrain:Fin:1'],
      sections: [
        { titre: 'Couplet', motif: 'balade', tours: 2, grille: ['Em7', 'G', 'D', 'A7'] },
        { titre: 'Pré-refrain', motif: 'plaque', grille: ['C', 'D', 'Em7', 'Em7'] },
        { titre: 'Refrain', motif: 'plaque', tours: 2, grille: ['C', 'Em7', 'G', 'Em7'] }
      ] },
    { id: 'ch-vent-nous-portera', titre: 'Le vent nous portera', artiste: 'Noir Désir', annee: 2001, capo: 0, tempo: 105, groupe: 'top20', top: 1,
      note: 'Deux accords du début à la fin : Mi m (quatre mesures), Ré (deux), Mi m (deux).',
      structure: ['Grille:Intro:1', 'Grille:Couplet', 'Grille:Refrain', 'Grille:Couplet', 'Grille:Refrain', 'Grille:Fin:1'],
      sections: [
        { titre: 'Grille', motif: 'balade', tours: 2, grille: ['Em', 'Em', 'Em', 'Em', 'D', 'D', 'Em', 'Em'] }
      ] },
    { id: 'ch-talkin-revolution', titre: 'Talkin’ Bout a Revolution', artiste: 'Tracy Chapman', annee: 1988, capo: 0, tempo: 120, groupe: 'top20', top: 1,
      note: 'Quatre accords en boucle : Sol – Do – Mi m – Ré.',
      structure: ['Grille:Intro:1', 'Grille:Couplet', 'Grille:Refrain', 'Grille:Couplet', 'Grille:Refrain', 'Grille:Fin:1'],
      sections: [
        { titre: 'Grille', motif: 'balade', tours: 2, grille: ['G', 'C', 'Em', 'D'] }
      ] },
    { id: 'ch-horse-no-name', titre: 'A Horse with No Name', artiste: 'America', annee: 1971, capo: 0, tempo: 120, groupe: 'top20', top: 1,
      note: 'Deux accords pour toute la chanson : Mi m et Ré (le disque joue des Mi m9 et Ré6/9, plus riches, avec les mêmes basses).',
      structure: ['Grille:Intro:1', 'Grille:Couplet', 'Grille:Refrain', 'Grille:Couplet', 'Grille:Refrain', 'Grille:Couplet', 'Grille:Refrain', 'Grille:Fin'],
      sections: [
        { titre: 'Grille', motif: 'balade', tours: 2, grille: ['Em', 'D', 'Em', 'D'] }
      ] },
    { id: 'ch-im-yours', titre: 'I’m Yours', artiste: 'Jason Mraz', annee: 2008, capo: 4, tempo: 76, groupe: 'top20', top: 1,
      note: 'Capo case 4 : Si – Fa♯ – Sol♯ m – Mi du disque se jouent Sol – Ré – Mi m – Do (I – V – vi – IV).',
      structure: ['Couplet:Intro:1', 'Couplet', 'Couplet:Refrain', 'Couplet', 'Couplet:Refrain', 'Pont', 'Couplet:Refrain', 'Couplet:Fin:1'],
      sections: [
        { titre: 'Couplet', motif: 'plaque', tours: 2, grille: ['G', 'D', 'Em', 'C'] },
        { titre: 'Pont', motif: 'plaque', grille: ['G', 'D', 'Em', 'D', 'C', 'C'] }
      ] },
    { id: 'ch-hotel-california', titre: 'Hotel California', artiste: 'Eagles', annee: 1976, capo: 7, tempo: 74, groupe: 'top20', top: 2,
      note: 'Capo case 7, la version simple : Si m – Fa♯7 – La – Mi – Sol – Ré – Mi m – Fa♯7 du disque se jouent Mi m – Si7 – Ré – La – Do – Sol – La m – Si7.',
      structure: ['Couplet:Intro', 'Couplet', 'Refrain', 'Couplet', 'Refrain', 'Couplet:Solo', 'Couplet:Fin'],
      sections: [
        { titre: 'Couplet', motif: 'arpege', grille: ['Em', 'B7', 'D', 'A', 'C', 'G', 'Am', 'B7'] },
        { titre: 'Refrain', motif: 'plaque', grille: ['C', 'G', 'B7', 'Em', 'C', 'G', 'Am', 'B7'] }
      ] },
    { id: 'ch-wish-you-were-here', titre: 'Wish You Were Here', artiste: 'Pink Floyd', annee: 1975, capo: 0, tempo: 62, groupe: 'top20', top: 2,
      note: 'Intro en Mi m7 – Sol – La m – Sol, puis le couplet Do – Ré – La m – Sol – Ré. (Le solo d’intro, une mélodie, n’est pas reproduit.)',
      structure: ['Intro', 'Couplet', 'Intro:Interlude', 'Couplet', 'Intro:Fin'],
      sections: [
        { titre: 'Intro', motif: 'plaque', tours: 2, grille: ['Em7', 'G', 'Am', 'G'] },
        { titre: 'Couplet', motif: 'balade', tours: 2, grille: ['C', 'D', 'Am', 'G', 'D', 'C', 'Am', 'G'] }
      ] },
    { id: 'ch-fast-car', titre: 'Fast Car', artiste: 'Tracy Chapman', annee: 1988, capo: 2, tempo: 104, groupe: 'top20', top: 2,
      note: 'Capo case 2 : Ré – La – Fa♯ m – Mi du disque se jouent Do – Sol – Mi m – Ré.',
      structure: ['Couplet:Intro:1', 'Couplet', 'Refrain', 'Couplet', 'Refrain', 'Couplet', 'Refrain', 'Couplet:Fin:1'],
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['C', 'G', 'Em', 'D'] },
        { titre: 'Refrain', motif: 'balade', tours: 2, grille: ['C', 'G', 'Em', 'D', 'C', 'C'] }
      ] },
    { id: 'ch-losing-my-religion', titre: 'Losing My Religion', artiste: 'R.E.M.', annee: 1991, capo: 0, tempo: 126, groupe: 'top20', top: 2,
      note: 'Couplet La m – Mi m, refrain Fa – Ré m – Sol – La m (Fa barré). La mandoline du disque est remplacée par l’arpège.',
      structure: ['Refrain:Intro:1', 'Couplet', 'Refrain', 'Couplet', 'Refrain', 'Couplet', 'Refrain', 'Refrain:Fin:1'],
      sections: [
        { titre: 'Couplet', motif: 'arpege', grille: ['Am', 'Em', 'Am', 'Em', 'Am', 'Em', 'Dm', 'G'] },
        { titre: 'Refrain', motif: 'balade', tours: 2, grille: ['F', 'Dm', 'G', 'Am'] }
      ] },
    { id: 'ch-hey-jude', titre: 'Hey Jude', artiste: 'The Beatles', annee: 1968, capo: 3, tempo: 74, groupe: 'top20', top: 2,
      note: 'Capo case 3 : Fa – Do – Si♭ du disque se jouent Ré – La – Sol. La fin (« na na na ») : Ré – Do – Sol – Ré.',
      structure: ['Couplet', 'Couplet', 'Pont', 'Couplet', 'Fin', 'Fin', 'Fin'],
      sections: [
        { titre: 'Couplet', motif: 'plaque', grille: ['D', 'A', 'A7', 'D', 'G', 'D', 'A7', 'D'] },
        { titre: 'Pont', motif: 'balade', grille: ['D7', 'G', 'Em', 'A7', 'D', 'D'] },
        { titre: 'Fin', motif: 'plaque', grille: ['D', 'C', 'G', 'D'] }
      ] },
    { id: 'ch-jument-michao', titre: 'La jument de Michao', artiste: 'Tri Yann', annee: 1976, capo: 0, tempo: 120, groupe: 'top20', top: 2,
      note: 'Chanson traditionnelle de Bretagne, rendue célèbre par Tri Yann ; grille simplifiée en Mi mineur. Couplet Mi m – Ré – Mi m, refrain Do – Ré – Mi m, avec une rythmique bien appuyée.',
      structure: ['Couplet:Intro:1', 'Couplet', 'Refrain', 'Couplet', 'Refrain', 'Couplet', 'Refrain', 'Refrain:Fin:1'],
      sections: [
        { titre: 'Couplet', motif: 'rock', tours: 2, grille: ['Em', 'D', 'Em', 'Em'] },
        { titre: 'Refrain', motif: 'rock', tours: 2, grille: ['C', 'D', 'Em', 'Em'] }
      ] },
    { id: 'ch-blackbird', titre: 'Blackbird', artiste: 'The Beatles', annee: 1968, capo: 0, tempo: 91, groupe: 'top20', top: 3,
      signature: [3, 4],
      note: 'À trois temps. Le disque change souvent de mesure (3/4 et 4/4) et joue une mélodie en contrepoint sur les accords : ici, tout à trois temps et la grille seule. Couplet Sol – La m7 – Si m – Sol – Do, pont en Fa (Fa – Ré m – Do – Si♭, deux barrés ; le Mi dim du disque est omis).',
      structure: ['Couplet', 'Couplet', 'Pont', 'Couplet', 'Pont', 'Couplet:Fin:1'],
      sections: [
        { titre: 'Couplet', motif: 'arpege-3', tours: 2, grille: ['G', 'Am7', 'Bm', 'G', 'C', 'C'] },
        { titre: 'Pont', motif: 'valse', tours: 2, grille: ['F', 'Dm', 'C', 'Bb'] }
      ] },
    { id: 'ch-dust-in-the-wind', titre: 'Dust in the Wind', artiste: 'Kansas', annee: 1977, capo: 0, tempo: 94, groupe: 'top20', top: 3,
      note: 'Arpège constant (picking) : Do – La m, puis Do – Sol – La m – Sol – Ré m.',
      structure: ['Intro', 'Couplet', 'Intro', 'Couplet', 'Fin', 'Couplet', 'Intro:Fin'],
      sections: [
        { titre: 'Intro', motif: 'arpege', tours: 2, grille: ['C', 'Am', 'C', 'Am'] },
        { titre: 'Couplet', motif: 'arpege', grille: ['C', 'G', 'Am', 'G', 'Dm', 'Am'] },
        { titre: 'Fin', motif: 'arpege', grille: ['D', 'G', 'Am', 'Am'] }
      ] },
    { id: 'ch-tears-in-heaven', titre: 'Tears in Heaven', artiste: 'Eric Clapton', annee: 1992, capo: 0, tempo: 77, groupe: 'top20', top: 3,
      note: 'Couplet La – Mi – Fa♯ m – La – Ré – La – Mi7 – La (le disque fait descendre la basse : La, Sol♯, Fa♯, Mi, Ré…). Pont Do – Sol – La m7 – Ré – Sol. Fa♯ m est barré.',
      structure: ['Couplet:Intro:1', 'Couplet', 'Couplet', 'Pont', 'Couplet', 'Couplet:Fin:1'],
      sections: [
        { titre: 'Couplet', motif: 'arpege', tours: 2, grille: ['A', 'E', 'F#m', 'A', 'D', 'A', 'E7', 'A'] },
        { titre: 'Pont', motif: 'balade', grille: ['C', 'G', 'Am7', 'D', 'G', 'G'] }
      ] },
    { id: 'ch-more-than-words', titre: 'More Than Words', artiste: 'Extreme', annee: 1990, capo: 0, tempo: 92, groupe: 'top20', top: 3,
      note: 'Écrit en Sol : le disque est accordé un demi-ton plus bas. Couplet Sol – Do – La m7 – Do – Ré, refrain Sol – Ré – Mi m – Si m – Do (Si m barré).',
      structure: ['Couplet', 'Couplet', 'Refrain', 'Couplet', 'Refrain', 'Refrain:Fin'],
      sections: [
        { titre: 'Couplet', motif: 'arpege', grille: ['G', 'C', 'Am7', 'C', 'D', 'D', 'G', 'G'] },
        { titre: 'Refrain', motif: 'balade', grille: ['G', 'D', 'Em', 'Bm', 'C', 'C', 'D', 'D'] }
      ] },
    { id: 'ch-neon', titre: 'Neon', artiste: 'John Mayer', annee: 2001, capo: 3, tempo: 103, groupe: 'top20', top: 4,
      note: 'Capo case 3 : Do m7 – Mi♭ – Fa m7 – La♭ – Si♭ du disque se jouent La m7 – Do – Ré m – Fa – Sol. Le jeu percussif du disque (pouce slappé) n’est pas reproduit : ici la grille.',
      structure: ['Grille:Intro:1', 'Grille:Couplet', 'Grille:Refrain', 'Grille:Couplet', 'Grille:Refrain', 'Grille:Fin:1'],
      sections: [
        { titre: 'Grille', motif: 'balade', tours: 2, grille: ['Am7', 'C', 'Dm', 'F', 'G', 'G'] }
      ] },
    { id: 'ch-classical-gas', titre: 'Classical Gas', artiste: 'Mason Williams', annee: 1968, capo: 0, tempo: 112, groupe: 'top20', top: 4,
      note: 'Un instrumental : le disque joue le thème en fingerstyle par-dessus ces accords. Ici la grille seule, simplifiée, en La mineur : thème La m – Sol – Fa – Mi, puis Do – Sol – La m – Mi et Ré m – La m – Mi – La m (Fa barré).',
      structure: ['Thème:Intro:1', 'Thème', 'Partie B', 'Thème', 'Pont', 'Thème', 'Partie B', 'Thème:Fin:1'],
      sections: [
        { titre: 'Thème', motif: 'arpege', tours: 2, grille: ['Am', 'G', 'F', 'E'] },
        { titre: 'Partie B', motif: 'arpege', tours: 2, grille: ['C', 'G', 'Am', 'E'] },
        { titre: 'Pont', motif: 'balade', grille: ['Dm', 'Am', 'E', 'Am'] }
      ] },
    { id: 'ch-angeles', titre: 'Angeles', artiste: 'Elliott Smith', annee: 1997, capo: 0, tempo: 118, groupe: 'top20', top: 4,
      note: 'La m – Ré – Do – Ré – Do (le disque joue des renversements et un Ré sus4) ; le picking rapide est remplacé par l’arpège.',
      structure: ['Grille:Intro:1', 'Grille:Couplet', 'Grille:Couplet', 'Grille:Fin:1'],
      sections: [
        { titre: 'Grille', motif: 'arpege', tours: 2, grille: ['Am', 'D', 'C', 'D', 'C', 'C'] }
      ] }
  ];
})(typeof window !== 'undefined' ? window : globalThis);
