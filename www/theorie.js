/* Théorie : notes, fréquences, manche.
 *
 * Tout le reste de l'app (accordeur, diagrammes, tablatures, oreille) se sert
 * d'ici — une seule définition du manche, donc une seule chose à corriger si
 * elle est fausse. Les tests (tests/theorie.test.js) vérifient ce fichier
 * contre des valeurs connues (La3 = 440 Hz, corde 6 à vide = Mi2 = 82,41 Hz…).
 */
(function (global) {
  'use strict';

  // Noms français ET internationaux : les méthodes de guitare classique
  // françaises écrivent « Ré », les diagrammes d'accords « D ».
  var NOMS_FR = ['Do', 'Do♯', 'Ré', 'Ré♯', 'Mi', 'Fa', 'Fa♯', 'Sol', 'Sol♯', 'La', 'La♯', 'Si'];
  var NOMS_EN = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

  // Cordes de la guitare, accordage standard. L'index 1 est la corde la plus
  // AIGUË : c'est la convention des tablatures (ligne du haut = corde 1), et
  // s'en écarter ici obligerait à inverser dans chaque module.
  var CORDES = [
    null,
    { num: 1, midi: 64, nom: 'Mi aigu', court: 'Mi', en: 'E4' },
    { num: 2, midi: 59, nom: 'Si',      court: 'Si', en: 'B3' },
    { num: 3, midi: 55, nom: 'Sol',     court: 'Sol', en: 'G3' },
    { num: 4, midi: 50, nom: 'Ré',      court: 'Ré', en: 'D3' },
    { num: 5, midi: 45, nom: 'La',      court: 'La', en: 'A2' },
    { num: 6, midi: 40, nom: 'Mi grave', court: 'Mi', en: 'E2' }
  ];

  var LA_440 = 440;

  function freqDeMidi(midi) { return LA_440 * Math.pow(2, (midi - 69) / 12); }

  // Le résultat est fractionnaire : un micro ne rend jamais un demi-ton pile,
  // et l'accordeur a besoin de l'écart, pas d'un arrondi.
  function midiDeFreq(freq) { return 69 + 12 * Math.log2(freq / LA_440); }

  function cents(freq, freqRef) { return 1200 * Math.log2(freq / freqRef); }

  function nom(midi, style) {
    var m = Math.round(midi);
    var i = ((m % 12) + 12) % 12;
    var octave = Math.floor(m / 12) - 1;
    return (style === 'en' ? NOMS_EN[i] : NOMS_FR[i]) + octave;
  }

  function nomSansOctave(midi, style) {
    var i = ((Math.round(midi) % 12) + 12) % 12;
    return (style === 'en' ? NOMS_EN[i] : NOMS_FR[i]);
  }

  // Note produite par une corde pressée à une frette. frette 0 = corde à vide.
  function midiDeCase(corde, frette) {
    var c = CORDES[corde];
    if (!c) return null;
    return c.midi + frette;
  }

  function freqDeCase(corde, frette) { return freqDeMidi(midiDeCase(corde, frette)); }

  // Accordeur : quelle corde à vide est visée par ce que le micro entend ?
  // On prend la plus proche en demi-tons, mais on refuse au-delà d'un demi-ton
  // et demi — au-delà, c'est une autre corde ou du bruit, et afficher « corde 5
  // très fausse » alors que l'élève joue la 6 est pire que ne rien afficher.
  function cordeLaPlusProche(freq, tolDemiTons) {
    if (!freq || freq <= 0) return null;
    var midi = midiDeFreq(freq);
    var best = null;
    for (var n = 1; n <= 6; n++) {
      var ecart = midi - CORDES[n].midi;
      if (!best || Math.abs(ecart) < Math.abs(best.demiTons)) {
        best = { corde: n, demiTons: ecart };
      }
    }
    var tol = tolDemiTons == null ? 1.5 : tolDemiTons;
    if (Math.abs(best.demiTons) > tol) return null;
    return {
      corde: best.corde,
      cents: cents(freq, freqDeMidi(CORDES[best.corde].midi)),
      freqCible: freqDeMidi(CORDES[best.corde].midi)
    };
  }

  // Accord = suite de frettes par corde, index 0 = corde 1 (aiguë).
  // -1 (ou 'x') : corde étouffée, elle ne sonne pas.
  function notesDeGrille(frettes) {
    var out = [];
    for (var i = 0; i < frettes.length; i++) {
      var f = frettes[i];
      if (f === -1 || f === 'x' || f == null) continue;
      out.push({ corde: i + 1, frette: f, midi: midiDeCase(i + 1, f) });
    }
    return out;
  }

  global.Theorie = {
    NOMS_FR: NOMS_FR, NOMS_EN: NOMS_EN, CORDES: CORDES, LA_440: LA_440,
    freqDeMidi: freqDeMidi, midiDeFreq: midiDeFreq, cents: cents,
    nom: nom, nomSansOctave: nomSansOctave,
    midiDeCase: midiDeCase, freqDeCase: freqDeCase,
    cordeLaPlusProche: cordeLaPlusProche, notesDeGrille: notesDeGrille
  };
})(typeof window !== 'undefined' ? window : globalThis);
