/* Vérifie la MUSIQUE, pas l'interface : fréquences, doigtés, tablatures.
 *
 * Une app de guitare qui affiche un mauvais doigté est pire qu'inutile — elle
 * fait apprendre une erreur. Ces contrôles tournent avant chaque build.
 */
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const ctx = { console, Math, Date, JSON, parseInt, parseFloat, isFinite, Object, Array, String, Number, Error };
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);
['theorie.js', 'accords.js', 'tablature.js', 'morceaux.js', 'lecons.js', 'oreille.js', 'accordeur.js', 'illustrations.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'www', f), 'utf8'), ctx, { filename: f }));

const { Theorie, Accords, Morceaux, Lecons, Tablature, Accordeur, Illustrations } = ctx;

let ok = 0, ko = 0;
function verifie(nom, cond, detail) {
  if (cond) { console.log('  ✓ ' + nom); ok++; }
  else { console.log('  ✗ ' + nom + (detail ? ' — ' + detail : '')); ko++; }
}
const proche = (a, b, tol) => Math.abs(a - b) <= tol;

console.log('\n— Fréquences —');
verifie('La3 = 440 Hz', Theorie.freqDeMidi(69) === 440);
// Valeurs de référence d'un accordeur du commerce, à 0,01 Hz près.
const ATTENDU = { 6: 82.41, 5: 110.00, 4: 146.83, 3: 196.00, 2: 246.94, 1: 329.63 };
Object.keys(ATTENDU).forEach(n => {
  const f = Theorie.freqDeCase(Number(n), 0);
  verifie('corde ' + n + ' à vide = ' + ATTENDU[n] + ' Hz', proche(f, ATTENDU[n], 0.01), f.toFixed(3));
});
verifie('une octave double la fréquence', proche(Theorie.freqDeCase(6, 12), 2 * Theorie.freqDeCase(6, 0), 0.001));
verifie('12 cases = 1200 centièmes', proche(Theorie.cents(Theorie.freqDeCase(5, 12), Theorie.freqDeCase(5, 0)), 1200, 0.001));

console.log('\n— Accordeur : quelle corde vise-t-on —');
verifie('82,41 Hz → corde 6 juste', (() => {
  const r = Theorie.cordeLaPlusProche(82.41);
  return r && r.corde === 6 && Math.abs(r.cents) < 1;
})());
verifie('330 Hz → corde 1', (Theorie.cordeLaPlusProche(330) || {}).corde === 1);
verifie('une note à mi-chemin entre deux cordes est refusée', Theorie.cordeLaPlusProche(95) === null,
        JSON.stringify(Theorie.cordeLaPlusProche(95)));

console.log('\n— Détection de hauteur sur signal connu —');
[82.41, 110, 196, 246.94, 329.63].forEach(f => {
  const sr = 44100, n = 4096, buf = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    // Fondamentale + deux harmoniques : une corde réelle n'est jamais une
    // sinusoïde pure, et c'est là que les détecteurs naïfs se trompent d'octave.
    buf[i] = 0.5 * Math.sin(2 * Math.PI * f * i / sr)
           + 0.25 * Math.sin(2 * Math.PI * 2 * f * i / sr)
           + 0.12 * Math.sin(2 * Math.PI * 3 * f * i / sr);
  }
  const r = Accordeur.detecter(buf, sr);
  verifie(f + ' Hz détecté à moins de 2 centièmes',
          r && Math.abs(Theorie.cents(r.freq, f)) < 2, r ? r.freq.toFixed(2) : 'rien');
});
verifie('le silence ne renvoie rien', Accordeur.detecter(new Float32Array(4096), 44100) === null);

console.log('\n— Accords —');
const ATTENDU_NOTES = {
  Em: ['Mi', 'Sol', 'Si'], Am: ['La', 'Do', 'Mi'], C: ['Do', 'Mi', 'Sol'],
  G: ['Sol', 'Si', 'Ré'], D: ['Ré', 'Fa♯', 'La'], E: ['Mi', 'Sol♯', 'Si'],
  A: ['La', 'Do♯', 'Mi'], Dm: ['Ré', 'Fa', 'La'], F: ['Fa', 'La', 'Do']
};
Object.keys(ATTENDU_NOTES).forEach(id => {
  const notes = [...new Set(Accords.notes(Accords.get(id)))].sort();
  const attendu = [...ATTENDU_NOTES[id]].sort();
  verifie(id + ' contient exactement ' + ATTENDU_NOTES[id].join('-'),
          JSON.stringify(notes) === JSON.stringify(attendu), notes.join(','));
});
verifie('tous les accords ont 6 frettes et 6 doigts',
        Accords.tous().every(a => a.frettes.length === 6 && (!a.doigts || a.doigts.length === 6)));
verifie('aucun accord ne demande plus de 4 doigts',
        Accords.tous().every(a => {
          if (a.barre) return true;   // le barré compte pour un seul doigt
          return a.frettes.filter(f => f > 0).length <= 4;
        }), Accords.tous().filter(a => !a.barre && a.frettes.filter(f => f > 0).length > 4).map(a => a.id).join(','));
verifie('l’écart de cases reste jouable (≤ 3 cases)',
        Accords.tous().every(a => {
          const f = a.frettes.filter(x => x > 0);
          return !f.length || (Math.max(...f) - Math.min(...f)) <= 3;
        }));
verifie('un diagramme est produit pour chaque accord',
        Accords.tous().every(a => Accords.svg(a).indexOf('<svg') === 0));

console.log('\n— Morceaux —');
Morceaux.tous().forEach(p => {
  verifie(p.id + ' : chaque note correspond à sa corde/case',
          p.notes.every(n => !n.midi || n.midi === Theorie.midiDeCase(n.corde, n.frette)));
  verifie(p.id + ' : rien au-delà de la 5e case (première position)',
          p.notes.every(n => n.frette >= 0 && n.frette <= 5),
          p.notes.filter(n => n.frette > 5).map(n => n.frette).join(','));
  verifie(p.id + ' : durées et temps positifs',
          p.notes.every(n => n.duree > 0 && n.temps >= 0));
});
verifie('Ode à la joie commence bien par mi-mi-fa-sol',
        Morceaux.get('ode-joie').notes.slice(0, 4).map(n => Theorie.nom(n.midi)).join(' ') === 'Mi4 Mi4 Fa4 Sol4');
verifie('l’étude en Mi mineur alterne p-i-m-a',
        Morceaux.get('etude-mim').notes.slice(0, 4).map(n => n.main).join('') === 'pima');

console.log('\n— Tablature —');
const p = Morceaux.get('au-clair');
verifie('durée totale = somme des durées', Tablature.duree_totale(p) === p.notes.reduce((t, n) => Math.max(t, n.temps + n.duree), 0));
verifie('découpage en systèmes de 2 mesures', Tablature.systemes(p, 2).length === Math.ceil(Tablature.duree_totale(p) / 8),
        String(Tablature.systemes(p, 2).length));
verifie('aucune note perdue au découpage',
        Tablature.systemes(p, 2).reduce((n, l) => n + l.notes.length, 0) === p.notes.length);

console.log('\n— Parcours —');
const ids = Lecons.tous().map(l => l.id);
verifie('identifiants de leçon uniques', new Set(ids).size === ids.length);
verifie('chaque exercice pointe sur une ressource existante',
        Lecons.tous().every(l => {
          const e = l.exercice;
          if (e.type === 'morceau') return !!Morceaux.get(e.ref);
          if (e.type === 'accord') return !!Accords.get(e.ref);
          if (e.type === 'changements') return e.ref.every(r => !!Accords.get(r));
          return true;
        }));
verifie('chaque leçon a un texte et une validation',
        Lecons.tous().every(l => l.texte && l.texte.length > 80 && l.validation));
verifie('la première leçon non faite est la première de la liste',
        Lecons.suivante([]).id === Lecons.tous()[0].id);

console.log('\n— Schémas —');
verifie('chaque schéma rend du SVG avec un titre accessible',
        Illustrations.liste().every((id) => {
          const s = Illustrations.rendre(id);
          return s.startsWith('<svg') && s.indexOf('aria-label') !== -1 && s.indexOf('<title>') !== -1;
        }));
verifie('les schémas cités par les leçons existent tous',
        Lecons.tous().every((l) => (l.images || []).every((i) => Illustrations.liste().indexOf(i) !== -1)),
        Lecons.tous().flatMap((l) => (l.images || []).filter((i) => Illustrations.liste().indexOf(i) === -1)).join(','));
verifie('aucun schéma orphelin (tous servent quelque part)',
        (() => {
          const cites = new Set(Lecons.tous().flatMap((l) => l.images || []));
          // 'tete' et 'tablature' sont aussi posés par app.js (accordeur, morceau)
          ['tete', 'tablature'].forEach((i) => cites.add(i));
          return Illustrations.liste().every((i) => cites.has(i));
        })(),
        Illustrations.liste().join(','));
verifie('les schémas n’utilisent que des classes du thème',
        Illustrations.liste().every((id) => !/fill="#|stroke="#/.test(Illustrations.rendre(id))),
        Illustrations.liste().filter((id) => /fill="#|stroke="#/.test(Illustrations.rendre(id))).join(','));

console.log(`\n=== ${ok} réussis, ${ko} échoués ===`);
process.exit(ko ? 1 : 0);
