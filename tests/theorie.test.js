/* Vérifie la MUSIQUE, pas l'interface : fréquences, doigtés, tablatures.
 *
 * Une app de guitare qui affiche un mauvais doigté est pire qu'inutile — elle
 * fait apprendre une erreur. Ces contrôles tournent avant chaque build.
 */
const path = require('path');
const fs = require('fs');
const vm = require('vm');

const ctx = { console, Math, Date, JSON, parseInt, parseFloat, isFinite, Object, Array, String, Number, Error, setTimeout, clearTimeout };
ctx.window = ctx;
ctx.globalThis = ctx;
vm.createContext(ctx);
/* AudioContext de test : on ne peut pas écouter dans un CI, mais on peut
 * MESURER. Le stub capture les buffers produits par la synthèse, qu'on passe
 * ensuite dans le détecteur de hauteur de l'accordeur : si la corde
 * synthétisée ne sonne pas juste, le test le dit. */
const buffersProduits = [];
function noeud() {
  return { connect: (n) => n, frequency: { value: 0 }, Q: { value: 0 }, gain: { value: 0, setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {}, cancelScheduledValues() {} }, type: '' };
}
ctx.AudioContext = function () {
  this.sampleRate = 44100;
  this.currentTime = 0;
  this.state = 'running';
  this.destination = noeud();
  this.createGain = noeud;
  this.createBiquadFilter = noeud;
  this.createOscillator = () => Object.assign(noeud(), { start() {}, stop() {} });
  this.createBufferSource = () => {
    const n = noeud();
    n.start = () => {}; n.stop = () => {};
    // defineProperty, pas Object.assign : assign COPIE la valeur d'un
    // accesseur au lieu de l'accesseur lui-même, et le buffer n'était donc
    // jamais capturé.
    Object.defineProperty(n, 'buffer', { set(b) { buffersProduits.push(b); }, get() { return null; } });
    return n;
  };
  this.createBuffer = (canaux, n) => {
    const data = new Float32Array(n);
    return { length: n, getChannelData: () => data };
  };
  this.resume = () => {};
};

['theorie.js', 'accords.js', 'tablature.js', 'repertoire.js', 'morceaux.js', 'lecons.js', 'oreille.js', 'accordeur.js', 'illustrations.js', 'audio.js', 'manche.js', 'gammes.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'www', f), 'utf8'), ctx, { filename: f }));

const { Theorie, Accords, Morceaux, Lecons, Tablature, Accordeur, Illustrations, Audio5, Manche, Gammes } = ctx;

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
  // Le répertoire Mutopia monte parfois plus haut, et c'est voulu : il est
  // contrôlé à part plus bas. Ici, les morceaux écrits pour l'app.
  if (!p.source) verifie(p.id + ' : rien au-delà de la 5e case (première position)',
          p.notes.every(n => n.frette >= 0 && n.frette <= 5),
          p.notes.filter(n => n.frette > 5).map(n => n.frette).join(','));
  verifie(p.id + ' : durées et temps positifs',
          p.notes.every(n => n.duree > 0 && n.temps >= 0));
});
verifie('Ode à la joie commence bien par mi-mi-fa-sol',
        Morceaux.get('ode-joie').notes.slice(0, 4).map(n => Theorie.nom(n.midi)).join(' ') === 'Mi4 Mi4 Fa4 Sol4');
verifie('l’étude en Mi mineur alterne p-i-m-a',
        Morceaux.get('etude-mim').notes.slice(0, 4).map(n => n.main).join('') === 'pima');

{
  const z = Morceaux.get('zombie');
  verifie('Zombie : grille Em-Cmaj7-G-D, une mesure chacun',
          [0, 4, 8, 12].map((t) => z.notes.find((n) => n.temps === t).accord).join('-') === 'Em-Cmaj7-G-D');
  verifie('Zombie : 16 mesures', Tablature.duree_totale(z) === 64);
  verifie('Zombie : chaque case pressée a son doigt de main gauche',
          z.notes.every((n) => (n.frette === 0) === !n.doigt));
  verifie('Zombie : chaque note a son doigt de main droite', z.notes.every((n) => /^[pima]$/.test(n.main)));
  verifie('Zombie : jamais deux notes sur la même corde au même instant', (() => {
    const par = {};
    z.notes.forEach((n) => { (par[n.temps] = par[n.temps] || []).push(n.corde); });
    return Object.values(par).every((c) => new Set(c).size === c.length);
  })());
  verifie('Zombie : doigtés cohérents (Cmaj7 garde le majeur de Em sur la 4e corde)', (() => {
    const [em, c] = z.mains.gauche;
    return em.frettes[3] === c.frettes[3] && em.doigts[3] === 2 && c.doigts[3] === 2;
  })());
}

{
  const debutants = ['trois-cordes', 'hot-cross-buns', 'mary-agneau', 'saints', 'joyeux-anniversaire', 'jingle-bells'];
  verifie('grand débutant : 6 morceaux présents', debutants.every((id) => Morceaux.get(id)));
  verifie('grand débutant : trois cordes aiguës, rien au-delà de la case 3',
          debutants.every((id) => Morceaux.get(id).notes.every((n) => n.corde <= 3 && n.frette <= 3)));
  verifie('« Trois cordes à vide » : aucune case pressée', Morceaux.get('trois-cordes').notes.every((n) => n.frette === 0));
  verifie('grand débutant : un doigt par case (case = doigt), main droite i-m alternée',
          debutants.every((id) => Morceaux.get(id).notes.every((n, i) =>
            (n.frette === 0 ? !n.doigt : n.doigt === n.frette) && n.main === (i % 2 ? 'm' : 'i'))));
  verifie('grand débutant : chaque morceau finit sur une barre de mesure',
          debutants.every((id) => { const p = Morceaux.get(id); return Tablature.duree_totale(p) % Tablature.noiresParMesure(p) === 0; }));
  verifie('grand débutant : aucune note ne déborde sur la mesure suivante',
          debutants.every((id) => { const p = Morceaux.get(id), m = Tablature.noiresParMesure(p);
            return p.notes.every((n) => Math.floor(n.temps / m) === Math.floor((n.temps + n.duree - 1e-6) / m)); }));
  verifie('Saints : la phrase commence après un temps de silence', Morceaux.get('saints').notes[0].temps === 1);
  verifie('Joyeux anniversaire : levée au 3e temps, Sol Sol La Sol Do Si',
          Morceaux.get('joyeux-anniversaire').notes[0].temps === 2 &&
          Morceaux.get('joyeux-anniversaire').notes.slice(0, 6).map((n) => Theorie.nom(n.midi)).join(' ') === 'Sol3 Sol3 La3 Sol3 Do4 Si3');
  verifie('mélodies : le doigt de main gauche est noté (Au clair : Ré = annulaire)',
          Morceaux.get('au-clair').notes[3].doigt === 3);
}

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

console.log('\n— Synthèse des cordes —');
[[6, 0], [5, 0], [3, 0], [1, 0], [1, 5]].forEach(([corde, frette]) => {
  buffersProduits.length = 0;
  Audio5.jouerCase(corde, frette, { duree: 1.2, timbre: 'nylon' });
  const buf = buffersProduits[0] && buffersProduits[0].getChannelData(0);
  const attendue = Theorie.freqDeCase(corde, frette);
  if (!buf) { verifie('corde ' + corde + ' case ' + frette + ' : buffer produit', false); return; }
  // On analyse une fenêtre prise après l'attaque, là où la corde est établie.
  const fenetre = buf.slice(4096, 4096 + 4096);
  const mesure = Accordeur.detecter(fenetre, 44100);
  verifie('corde ' + corde + ' case ' + frette + ' sonne à la bonne hauteur',
          mesure && Math.abs(Theorie.cents(mesure.freq, attendue)) < 15,
          mesure ? mesure.freq.toFixed(1) + ' Hz au lieu de ' + attendue.toFixed(1) : 'aucune hauteur détectée');
  const crete = buf.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
  verifie('corde ' + corde + ' case ' + frette + ' : niveau exploitable, sans saturation',
          crete > 0.05 && crete <= 1.0, 'crête ' + crete.toFixed(3));
  const fini = buf.every((v) => isFinite(v));
  verifie('corde ' + corde + ' case ' + frette + ' : aucun échantillon aberrant', fini);
});
{
  // Le nylon doit s'éteindre plus vite que l'acier : c'est le repère qui
  // distingue les deux timbres à l'oreille, et il se mesure.
  function energieFin(timbre) {
    buffersProduits.length = 0;
    Audio5.jouerCase(3, 0, { duree: 2.0, timbre: timbre });
    const b = buffersProduits[0].getChannelData(0);
    const fin = b.slice(b.length - 8192);
    return Math.sqrt(fin.reduce((t, v) => t + v * v, 0) / fin.length);
  }
  const nylon = energieFin('nylon'), acier = energieFin('acier');
  verifie('le nylon s’éteint plus vite que l’acier', nylon < acier,
          'nylon ' + nylon.toFixed(4) + ' vs acier ' + acier.toFixed(4));
}

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
// La tête d'une guitare est le seul schéma où une erreur fait AGIR à tort :
// on tourne la mauvaise mécanique. D'où ce contrôle sur la place des numéros.
{
  const tete = Illustrations.rendre('tete');
  const etiquettes = [...tete.matchAll(/<text x="(-?[\d.]+)" y="(-?[\d.]+)"[^>]*>(\d) ([^<]+)</g)]
    .map((m) => ({ x: +m[1], y: +m[2], num: +m[3], note: m[4] }));
  const gauche = etiquettes.filter((e) => e.x < 175).sort((a, b) => a.y - b.y);
  const droite = etiquettes.filter((e) => e.x > 175).sort((a, b) => a.y - b.y);
  verifie('tête : les graves (6-5-4) à gauche, de haut en bas',
          gauche.map((e) => e.num).join('') === '654', gauche.map((e) => e.num + e.note).join(' '));
  verifie('tête : les aiguës (1-2-3) à droite, de haut en bas',
          droite.map((e) => e.num).join('') === '123', droite.map((e) => e.num + e.note).join(' '));
  verifie('tête : chaque numéro porte le bon nom de note',
          etiquettes.every((e) => e.note === ['', 'Mi', 'Si', 'Sol', 'Ré', 'La', 'Mi'][e.num]),
          etiquettes.map((e) => e.num + e.note).join(' '));
}

// Un texte qui déborde du viewBox est simplement COUPÉ à l'affichage, sans
// erreur : « cuisse gauche » s'est affiché « e gauche » sur la télé. On estime
// donc la largeur de chaque étiquette et on vérifie qu'elle tient dans le cadre.
{
  const TAILLES = { 'sch-txt': 13, 'sch-petit': 12, 'sch-doigt-nom': 17, 'sch-chiffre': 14,
                    'sch-croix': 20, 'sch-ok': 20, 'sch-exception-txt': 12 };
  const debords = [];
  Illustrations.liste().forEach((id) => {
    const svg = Illustrations.rendre(id);
    const largeur = +/viewBox="0 0 ([\d.]+) /.exec(svg)[1];
    for (const m of svg.matchAll(/<text x="(-?[\d.]+)" y="[-\d.]+" class="([^"]+)"(?: text-anchor="(\w+)")?[^>]*>([^<]*)</g)) {
      const x = +m[1], police = TAILLES[m[2].split(' ')[0]] || 13, ancre = m[3] || 'start';
      // 0,55 em par caractère : approximation large pour une police système.
      const l = m[4].length * police * 0.55;
      const gauche = ancre === 'end' ? x - l : (ancre === 'middle' ? x - l / 2 : x);
      if (gauche < -1 || gauche + l > largeur + 1) {
        debords.push(id + ' « ' + m[4] + ' »');
      }
    }
  });
  verifie('aucune étiquette ne déborde de son cadre', debords.length === 0, debords.join(' · '));
}

// Vues paramétrées (une par accord) : elles ne sont pas dans la liste des
// schémas fixes, mais elles doivent tenir pour LES 23 accords, barrés compris.
verifie('la vue « main » existe pour chaque accord et place tous les doigts',
        Accords.tous().every((a) => {
          const svg = Illustrations.mainAccord(a);
          if (svg.indexOf('<svg') !== 0) return false;
          const attendus = a.barre
            ? a.frettes.filter((f, i) => f > 0 && a.doigts[i] > 1).length + 1
            : a.frettes.filter((f) => f > 0).length;
          const dessines = (svg.match(/sch-doigt-bout/g) || []).length + (a.barre ? 1 : 0);
          return dessines === attendus;
        }),
        Accords.tous().filter((a) => {
          const svg = Illustrations.mainAccord(a);
          const attendus = a.barre
            ? a.frettes.filter((f, i) => f > 0 && a.doigts[i] > 1).length + 1
            : a.frettes.filter((f) => f > 0).length;
          return (svg.match(/sch-doigt-bout/g) || []).length + (a.barre ? 1 : 0) !== attendus;
        }).map((a) => a.id).join(','));
verifie('la vue « sur la guitare » situe la zone et marque chaque corde',
        Accords.tous().every((a) => {
          const svg = Illustrations.positionSurGuitare(a);
          const marques = (svg.match(/sch-doigt-bout|sch-vide|sch-mute/g) || []).length;
          return svg.indexOf('<svg') === 0 && marques >= 6;   // une marque par corde au moins
        }));

verifie('les schémas n’utilisent que des classes du thème',
        Illustrations.liste().every((id) => !/fill="#|stroke="#/.test(Illustrations.rendre(id))),
        Illustrations.liste().filter((id) => /fill="#|stroke="#/.test(Illustrations.rendre(id))).join(','));

console.log('\n— Gammes —');
{
  const nomsDe = (t, g) => Gammes.noms(t, g).join(' ');
  verifie('Do majeur = sans altération', nomsDe(0, 'majeure') === 'Do Ré Mi Fa Sol La Si', nomsDe(0, 'majeure'));
  verifie('Sol majeur = un Fa♯', nomsDe(7, 'majeure') === 'Sol La Si Do Ré Mi Fa♯', nomsDe(7, 'majeure'));
  verifie('La mineur naturelle = relative de Do (mêmes notes)',
          Gammes.classes(9, 'mineure').slice().sort((a, b) => a - b).join() === Gammes.classes(0, 'majeure').slice().sort((a, b) => a - b).join());
  verifie('La pentatonique mineure = La Do Ré Mi Sol', nomsDe(9, 'penta-min') === 'La Do Ré Mi Sol', nomsDe(9, 'penta-min'));
  verifie('La mineure harmonique a son Sol♯', nomsDe(9, 'harmonique').split(' ')[6] === 'Sol♯');
  verifie('Mi blues = Mi Sol La La♯ Si Ré', nomsDe(4, 'blues') === 'Mi Sol La La♯ Si Ré', nomsDe(4, 'blues'));
  const pos = Gammes.positions(4, 'penta-min', 12);
  verifie('Mi penta sur le manche : les 6 cordes à vide en font partie (Mi, La, Ré, Sol, Si, Mi)',
          [1, 2, 3, 4, 5, 6].every((c) => pos.some((p) => p.corde === c && p.frette === 0)));
  verifie('chaque position est bien une note de la gamme',
          pos.every((p) => Gammes.classes(4, 'penta-min').indexOf(Theorie.midiDeCase(p.corde, p.frette) % 12) !== -1));
  verifie('toniques marquées = Mi uniquement', pos.filter((p) => p.tonique).every((p) => p.nom === 'Mi'));
  const seq = Gammes.aJouer(9, 'majeure', 2);
  verifie('gamme jouée : part de la tonique la plus grave (La2 = 45)', seq[0] === 45, seq[0]);
  verifie('gamme jouée : monte deux octaves puis redescend', Math.max(...seq) === 69 && seq[seq.length - 1] === 45 && seq.length === 29, seq.length);
  verifie('manche : une pastille par point demandé',
          (Manche.svg({ points: pos }).match(/manche-point/g) || []).length === pos.length);
}

console.log('\n— Tablature texte —');
{
  const ode = Morceaux.get('ode-joie');
  const txt = Tablature.versTexte(ode, 4);
  const lignes = txt.split('\n');
  verifie('export : six lignes e B G D A E', lignes.slice(0, 6).map((l) => l[0]).join('') === 'eBGDAE', lignes.slice(0, 6).map((l) => l[0]).join(''));
  verifie('export : lignes de même longueur', new Set(lignes.slice(0, 6).map((l) => l.length)).size === 1);
  const relu = Tablature.depuisTexte(txt);
  verifie('aller-retour : mêmes notes, même ordre',
          relu.length === ode.notes.length && relu.every((n, i) => n.corde === ode.notes[i].corde && n.frette === ode.notes[i].frette),
          relu.length + ' vs ' + ode.notes.length);
  verifie('aller-retour : mêmes hauteurs', relu.every((n, i) => n.midi === ode.notes[i].midi));
  const web = Tablature.depuisTexte('Intro :\ne|-----0-----|\nB|---1---1---|\nG|-2-------2-|\nD|-----------|\nA|-----------|\nE|-12--------|\nparoles ici');
  verifie('import : case à deux chiffres lue comme 12, pas 1 puis 2', web.some((n) => n.corde === 6 && n.frette === 12) && !web.some((n) => n.corde === 6 && n.frette === 2));
  verifie('import : notes simultanées au même temps', web.filter((n) => n.temps === 0).length === 2);
  verifie('import : texte autour ignoré', web.length === 6, web.length);
  verifie('import : rien reconnu = liste vide', Tablature.depuisTexte('bonjour').length === 0);
}

console.log('\n— Lecteur —');
{
  const joue = [];
  const avant = Audio5.jouerNote, clic = Audio5.jouerClic;
  Audio5.jouerNote = (midi, o) => { joue.push({ midi, retard: o.retard }); };
  let clics = [];
  Audio5.jouerClic = (r, acc) => clics.push({ r, acc });
  const p = Morceaux.get('au-clair');            // 4/4, 4 mesures
  Tablature.jouer(p, { tempo: 60, de: 4, a: 8, decompte: 4, capo: 2, metronome: true });
  Tablature.arreter();
  const attendues = p.notes.filter((n) => n.temps >= 4 && n.temps < 8);
  verifie('section : seules les notes de la mesure 2 sont jouées', joue.length === attendues.length, joue.length);
  verifie('capodastre 2 : tout sonne un ton plus haut', joue.every((j, i) => j.midi === attendues[i].midi + 2));
  verifie('décompte : la première note tombe après 4 temps', Math.abs(joue[0].retard - 4) < 1e-9, joue[0].retard);
  verifie('décompte + clic : 4 + 4 clics, premier temps accentué', clics.length === 8 && clics[0].acc && clics[4].acc && !clics[1].acc, clics.length);
  joue.length = 0; clics = [];
  Tablature.jouer(p, { tempo: 60, muet: true });
  Tablature.arreter();
  verifie('guitare muette : aucune note jouée', joue.length === 0);
  Audio5.jouerNote = avant; Audio5.jouerClic = clic;
}

console.log('\n— Répertoire Mutopia —');
{
  const rep = Morceaux.tous().filter((p) => p.source);
  verifie('22 pièces importées', rep.length === 22, rep.length);
  verifie('identifiants uniques', new Set(Morceaux.tous().map((p) => p.id)).size === Morceaux.tous().length);
  verifie('licences : domaine public ou CC-BY seulement (pas de ShareAlike)',
          rep.every((p) => /^(Public Domain|Creative Commons Attribution \d\.\d)$/.test(p.source.licence)),
          rep.filter((p) => !/^(Public Domain|Creative Commons Attribution \d\.\d)$/.test(p.source.licence)).map((p) => p.id).join(','));
  verifie('CC-BY : l’éditeur de la partition est crédité', rep.every((p) => p.source.licence === 'Public Domain' || p.source.copiste));
  verifie('chaque pièce renvoie à sa fiche Mutopia', rep.every((p) => /^https:\/\/www\.mutopiaproject\.org\/cgibin\/piece-info\.cgi\?id=\d+$/.test(p.source.url)));
  const mauvaises = [];
  rep.forEach((p) => p.notes.forEach((n) => { if (Theorie.midiDeCase(n.corde, n.frette) !== n.midi) mauvaises.push(p.id + '@' + n.temps); }));
  verifie('chaque case jouée donne la hauteur de la partition', mauvaises.length === 0, mauvaises.slice(0, 5).join(','));
  verifie('toutes les cases entre 0 et 12, cordes 1 à 6',
          rep.every((p) => p.notes.every((n) => n.frette >= 0 && n.frette <= 12 && n.corde >= 1 && n.corde <= 6)));
  verifie('deux notes attaquées ensemble ne sont jamais sur la même corde',
          rep.every((p) => {
            const par = {};
            p.notes.forEach((n) => { (par[n.temps] = par[n.temps] || []).push(n.corde); });
            return Object.values(par).every((c) => new Set(c).size === c.length);
          }));
  verifie('une corde ne joue jamais deux notes à la fois (les basses tenues sont lâchées à temps)',
          rep.every((p) => [...new Set(p.notes.map((n) => n.temps))].every((t) => {
            const c = p.notes.filter((n) => n.temps <= t && t < n.temps + n.duree - 1e-6).map((n) => n.corde);
            return new Set(c).size === c.length;
          })));
  verifie('accords jouables : écart de main de 4 cases au plus à chaque attaque',
          rep.every((p) => {
            const par = {};
            p.notes.forEach((n) => { if (n.frette > 0) (par[n.temps] = par[n.temps] || []).push(n.frette); });
            return Object.values(par).every((f) => Math.max(...f) - Math.min(...f) <= 4);
          }));
  verifie('pièces faciles (niveau 3) en première position (case ≤ 5), sauf le Menuet et Bergère',
          rep.filter((p) => p.niveau === 3 && !/menuet|bergere/.test(p.id)).every((p) => p.notes.filter((n) => n.frette > 5).length <= 2));
  verifie('rien sous le Mi grave (accordage standard)', rep.every((p) => p.notes.every((n) => n.midi >= 40)));
  verifie('durées positives', rep.every((p) => p.notes.every((n) => n.duree > 0)));
  verifie('mesure en noires : 3/8 → 1,5 · 6/8 → 3 · 2/2 → 4',
          Tablature.noiresParMesure({ signature: [3, 8] }) === 1.5 && Tablature.noiresParMesure({ signature: [6, 8] }) === 3 &&
          Tablature.noiresParMesure({ signature: [2, 2] }) === 4);
  verifie('mise en page : plus de place par temps pour les pièces en doubles croches',
          Tablature.miseEnPage(Morceaux.get('mertz-etude')).pxParTemps > 46 && Tablature.miseEnPage(Morceaux.get('au-clair')).pxParTemps === 46);
  verifie('mise en page : quelques petites notes d’ornement n’étirent pas la partition',
          Tablature.miseEnPage(Morceaux.get('horetzky-bergere')).pxParTemps < 100, Tablature.miseEnPage(Morceaux.get('horetzky-bergere')).pxParTemps);
  verifie('Menuet : premières notes = Ré5 sur Sol2 (partition)', (() => {
    const deb = Morceaux.get('menuet-sol').notes.filter((n) => n.temps === Morceaux.get('menuet-sol').notes[0].temps).map((n) => n.midi).sort();
    return deb.join() === '43,62';
  })());
  verifie('la tablature de chaque pièce se dessine', rep.every((p) => (Tablature.svg(p, Tablature.miseEnPage(p)).match(/tab-note/g) || []).length === p.notes.length));
}

console.log(`\n=== ${ok} réussis, ${ko} échoués ===`);
process.exit(ko ? 1 : 0);
