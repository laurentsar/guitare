/* Vérifie la MUSIQUE, pas l'interface : fréquences, doigtés, tablatures.
 *
 * Une app de guitare qui affiche un mauvais doigté est pire qu'inutile — elle
 * fait apprendre une erreur. Ces contrôles tournent avant chaque build.
 */
const path = require('path');
const fs = require('fs');
const vm = require('vm');

// Hasard à graine fixe : la synthèse de la corde part d'un bruit aléatoire,
// et un tirage malchanceux faisait échouer un test audio environ une fois
// sur cent (détection à l'octave, extinction nylon/acier) — assez pour
// bloquer un build au hasard. Même suite de tirages à chaque exécution.
const MathTest = Object.create(Math);
let graine = 0x9e3779b9;
MathTest.random = () => {
  graine = (graine + 0x6D2B79F5) | 0;
  let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const ctx = { console, Math: MathTest, Date, JSON, parseInt, parseFloat, isFinite, Object, Array, String, Number, Error, setTimeout, clearTimeout };
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

['theorie.js', 'accords.js', 'tablature.js', 'repertoire.js', 'chansons.js', 'morceaux.js', 'lecons.js', 'oreille.js', 'accordeur.js', 'illustrations.js', 'audio.js', 'manche.js', 'gammes.js', 'programme.js']
  .forEach(f => vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'www', f), 'utf8'), ctx, { filename: f }));

const { Theorie, Accords, Morceaux, Lecons, Tablature, Accordeur, Illustrations, Audio5, Manche, Gammes, Programme } = ctx;

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
  // Un exercice qui annonce sa position (Ve position…) reste dans ses quatre
  // cases ; les autres morceaux écrits pour l'app, en première position.
  if (p.position) verifie(p.id + ' : cordes à vide ou cases ' + p.position + ' à ' + (p.position + 3),
          p.notes.every(n => n.frette === 0 || (n.frette >= p.position && n.frette <= p.position + 3)));
  // Chansons : chaque note suit la forme de son accord (vérifié plus bas) ;
  // les power chords du rock montent jusqu'à la case 6.
  else if (p.chanson) verifie(p.id + ' : formes d’accords, rien au-delà de la case 7', p.notes.every(n => n.frette <= 7));
  else if (!p.source) verifie(p.id + ' : rien au-delà de la 5e case (première position)',
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

console.log('\n— Consignes des mains —');
{
  const re = Tablature.consigne([{ corde: 2, frette: 3, doigt: 3, main: 'm', midi: 62 }]);
  verifie('Ré : annulaire, 2e corde, case 3', /Pose l’annulaire \(doigt 3\) sur la 2e corde \(Si\), case 3/.test(re.gauche[0].texte), re.gauche[0].texte);
  verifie('Ré : le majeur pince la 2e corde', /^Le majeur \(m\) pince la 2e corde/.test(re.droite[0].texte), re.droite[0].texte);
  verifie('corde à vide : aucun doigt', /^Aucun doigt sur la 1re corde \(Mi aigu, la plus fine\)/.test(Tablature.consigne([{ corde: 1, frette: 0, midi: 64 }]).gauche[0].texte));
  verifie('sans doigt noté : un doigt par case, pouce sur les graves', (() => {
    const c = Tablature.consigne([{ corde: 5, frette: 2 }]);
    return c.gauche[0].doigt === 2 && c.droite[0].main === 'p';
  })());
  verifie('au-delà de la case 4 sans doigt noté : laissé au choix', Tablature.consigne([{ corde: 1, frette: 7 }]).gauche[0].doigt === 0);
  const acc = Tablature.consigne(Morceaux.get('zombie').notes.filter((n) => n.temps === 4 * 8 + 1));
  verifie('accord plaqué : trois cordes, pincées ensemble', acc.gauche.length === 3 && /en même temps/.test(acc.droite[acc.droite.length - 1].texte));
  verifie('chaque note de chaque morceau a une consigne',
          Morceaux.tous().every((p) => p.notes.every((n) => { const c = Tablature.consigne([n]); return c.gauche[0].texte && c.droite[0].texte; })));
}

console.log('\n— Dessin des deux mains —');
{
  const re = Illustrations.deuxMains(Tablature.consigne([{ corde: 2, frette: 3, doigt: 3, main: 'm', midi: 62 }]));
  verifie('Ré : un doigt gauche (3) et un doigt droit (m) dessinés',
          (re.match(/sch-bout-cerne sch-doigt-3/g) || []).length === 1 && (re.match(/sch-bout-cerne sch-droite/g) || []).length === 1);
  verifie('Ré : la 2e corde est surlignée, et elle seule', (re.match(/class="sch-corde-jouee"/g) || []).length === 1);
  verifie('Ré : étiquette « annulaire (3) · 2e corde · case 3 »', re.indexOf('annulaire (3) · 2e corde · case 3') !== -1);
  const vide = Illustrations.deuxMains(Tablature.consigne([{ corde: 1, frette: 0, main: 'i', midi: 64 }]));
  verifie('corde à vide : aucun doigt gauche, anneau au sillet', !/sch-doigt-[1-4]"/.test(vide) && /sch-vide-jouee/.test(vide));
  const c = Tablature.consigne([{ corde: 3, frette: 0, main: 'i' }, { corde: 2, frette: 0, main: 'm' }, { corde: 1, frette: 0, main: 'a' }]);
  c.accord = 'Em'; c.tenus = [{ corde: 5, frette: 2, doigt: 1 }, { corde: 4, frette: 2, doigt: 2 }];
  const em = Illustrations.deuxMains(c);
  verifie('accord tenu : les deux doigts de Em dessinés, trois doigts droits',
          /sch-bout-cerne sch-doigt-1/.test(em) && /sch-bout-cerne sch-doigt-2/.test(em) && (em.match(/sch-bout-cerne sch-droite/g) || []).length === 3);
}

console.log('\n— Apprendre pas à pas —');
{
  const nb = (p) => Math.ceil(Tablature.duree_totale(p) / Tablature.noiresParMesure(p));
  const mary = Morceaux.get('mary-agneau'), em = Morceaux.etapes(mary, nb(mary));
  verifie('Mary : accordeur, écoute, note par note, 2 × 4 mesures, tout lent, vitesse, seul',
          em.map((e) => e.action.type).join(',') === 'accordeur,section,guide,section,section,section,section,section', em.map((e) => e.titre).join(' | '));
  verifie('Mary : les phrases couvrent les mesures 1-4 et 5-8', em[3].action.de === 1 && em[3].action.a === 4 && em[4].action.de === 5 && em[4].action.a === 8);
  verifie('étapes de travail : 60 % en boucle', em[3].action.pct === 60 && em[3].action.boucle);
  verifie('dernière étape : guitare muette, clic, 100 %', em[em.length - 1].action.muet && em[em.length - 1].action.clic && em[em.length - 1].action.pct === 100);
  const z = Morceaux.get('zombie'), ez = Morceaux.etapes(z, nb(z));
  verifie('Zombie : accords, passages, couplet, refrain', /4 accords/.test(ez[2].titre) && /Em → Cmaj7 → G → D → Em/.test(ez[3].texte) &&
          ez.some((e) => /Couplet/.test(e.titre) && e.action.de === 1 && e.action.a === 4) && ez.some((e) => /Refrain/.test(e.titre) && e.action.de === 9));
  verifie('chaque morceau : des étapes, toutes les mesures couvertes par les sections', Morceaux.tous().every((p) => {
    const n = nb(p), e = Morceaux.etapes(p, n);
    return e.length >= 7 && e.every((x) => x.titre && x.texte && x.bouton) &&
           (p.sections || e.filter((x) => /^Mesures/.test(x.titre)).reduce((t, x) => t + x.action.a - x.action.de + 1, 0) === n);
  }));
}

console.log('\n— Doigtés de tous les morceaux —');
{
  const tous = Morceaux.tous();
  verifie('chaque note de chaque morceau : doigt gauche (si case pressée) et doigt droit',
          tous.every((p) => p.notes.every((n) => (n.frette === 0 || (n.doigt >= 1 && n.doigt <= 4)) && /^[pima]$/.test(n.main))),
          tous.filter((p) => p.notes.some((n) => (n.frette > 0 && !(n.doigt >= 1 && n.doigt <= 4)) || !/^[pima]$/.test(n.main))).map((p) => p.id).join(','));
  // Doigtés CALCULÉS seulement : un accord de la bibliothèque peut croiser les
  // doigts d'une corde éloignée à l'autre (Gmaj7 : majeur case 3 sur la 6e,
  // annulaire case 2 sur la 1re), et c'est voulu.
  verifie('doigtés calculés : dans un accord, une case plus haute ne prend jamais un doigt plus bas', tous.every((p) => {
    const par = {};
    p.notes.forEach((n) => { if (n.frette > 0 && !n.accord) (par[n.temps] = par[n.temps] || []).push(n); });
    return Object.values(par).every((g) => g.every((a) => g.every((b) => !(b.frette > a.frette && b.doigt < a.doigt))));
  }));
  verifie('main droite : la basse d’un accord (corde 4 à 6) est au pouce', tous.filter((p) => p.source).every((p) => {
    const par = {};
    p.notes.forEach((n) => (par[n.temps] = par[n.temps] || []).push(n));
    return Object.values(par).every((g) => { const b = g.reduce((x, y) => (y.corde > x.corde ? y : x)); return g.length < 2 || b.corde < 4 || b.main === 'p'; });
  }));
  const valse = Morceaux.get('carulli-valse-11').notes;
  verifie('répertoire : un doigt par case en première position (Carulli, case 2 = majeur)', valse.filter((n) => n.frette === 2).every((n) => n.doigt === 2));
  verifie('études d’arpèges : accords nommés et position des mains', ['etude-mim', 'etude-lam'].every((id) => {
    const p = Morceaux.get(id);
    return p.mains && p.mains.gauche.length === 3 && p.notes.every((n) => n.accord) && /index|majeur|annulaire/.test(p.mains.gauche[0].consigne);
  }));
  const faciles = ['basses-pouce', 'premieres-notes', 'old-macdonald', 'london-bridge', 'yankee-doodle', 'row-your-boat', 'michael-row'];
  verifie('7 nouvelles mélodies faciles, niveaux 1-2, case 3 au plus', faciles.every((id) => { const p = Morceaux.get(id); return p && p.niveau <= 2 && p.notes.every((n) => n.frette <= 3); }));
  verifie('« Les basses au pouce » : cordes 4 à 6 à vide, au pouce', Morceaux.get('basses-pouce').notes.every((n) => n.corde >= 4 && n.frette === 0 && n.main === 'p'));
  verifie('nouvelles mélodies : mesures complètes, aucune note à cheval', faciles.every((id) => {
    const p = Morceaux.get(id), m = Tablature.noiresParMesure(p);
    return Tablature.duree_totale(p) % m === 0 && p.notes.every((n) => Math.floor(n.temps / m + 1e-9) === Math.floor((n.temps + n.duree) / m - 1e-9));
  }));
  verifie('niveaux 1 à 3 : au moins 35 morceaux', tous.filter((p) => p.niveau <= 3).length >= 35, tous.filter((p) => p.niveau <= 3).length);
}

console.log('\n— Travailler les accords —');
{
  const ex = Morceaux.tous().filter((p) => p.categorie === 'accords');
  verifie('14 exercices d’accords', ex.length === 14, ex.map((p) => p.id).join(','));
  verifie('chaque note d’un exercice appartient à l’accord en cours (même case que la bibliothèque)',
          ex.every((p) => p.notes.every((n) => Accords.get(n.accord).frettes[n.corde - 1] === n.frette)));
  verifie('jamais une corde étouffée jouée', ex.every((p) => p.notes.every((n) => Accords.get(n.accord).frettes[n.corde - 1] >= 0)));
  verifie('doigts de la main gauche = ceux du diagramme de l’accord',
          ex.every((p) => p.notes.every((n) => n.frette === 0 || n.doigt === Accords.get(n.accord).doigts[n.corde - 1])));
  // Une mesure porte un accord, ou deux (« F|G », 2 temps chacun).
  verifie('un accord par demi-mesure : les notes de chaque moitié de mesure viennent du même accord', ex.every((p) => {
    const par = {};
    p.notes.forEach((n) => { const m = Math.floor(n.temps / 2); (par[m] = par[m] || new Set()).add(n.accord); });
    return Object.values(par).every((x) => x.size === 1);
  }));
  verifie('balayé : toutes les cordes jouables de l’accord, au pouce', (() => {
    const p = Morceaux.get('acc-em-am'), t0 = p.notes.filter((n) => n.temps === 0);
    return t0.length === 6 && t0.every((n) => n.main === 'p');
  })());
  verifie('balayé sur Ré : seulement les 4 cordes jouables', Morceaux.get('acc-d-a').notes.filter((n) => n.temps === 0).length === 4);
  verifie('paliers = sections qui couvrent un tour de grille chacun', ex.every((p) => p.sections.length >= 1 && p.sections.every((s) => s.a >= s.de)));
  verifie('blues en La : 12 mesures par grille', Morceaux.get('acc-blues-la').sections[0].a === 12);
  verifie('revue : les 23 accords, dans l’ordre d’apprentissage', Morceaux.get('acc-revue').mains.gauche.length === 23);
  verifie('consigne de chaque accord rédigée (doigts, cases, cordes à vide ou muettes)',
          ex.every((p) => p.mains.gauche.every((a) => /case \d sur la/.test(a.consigne) || /vide/.test(a.consigne))));
  verifie('barré : la consigne le dit', /Barré : l’index couche/.test(Morceaux.get('acc-barre').mains.gauche.find((a) => a.id === 'F').consigne));
  verifie('pas à pas : une étape par palier', (() => {
    const p = Morceaux.get('acc-g-c-d'), e = Morceaux.etapes(p, 20);
    return e.filter((x) => /^Palier/.test(x.titre)).length === 3 && /G → C → D → G/.test(e[3].texte);
  })());
}

console.log('\n— Entraînement (tablatures du cours) —');
{
  const v3 = Morceaux.get('ent-v-0303').notes, v1 = Morceaux.get('ent-v-0101').notes;
  verifie('0 3 0 3 : à vide puis case VII au 3e doigt, pouce buté', v3.slice(0, 4).map((n) => n.frette).join() === '0,7,0,7' &&
          v3.filter((n) => n.frette).every((n) => n.frette === 7 && n.doigt === 3) && v3.every((n) => n.main === 'p'));
  verifie('0 1 0 1 : case V au 1er doigt', v1.filter((n) => n.frette).every((n) => n.frette === 5 && n.doigt === 1));
  const chemin = (notes) => notes.map((n) => n.corde).filter((c, i, a) => i === 0 || c !== a[i - 1]).join('');
  verifie('chemin de la 6e à la 2e corde et retour à la 6e', chemin(v3) === '654323456' && chemin(Morceaux.get('ent-pouce-bute-4').notes) === '654323456');
  verifie('pouce buté 4 fois : quatre attaques par corde', Morceaux.get('ent-pouce-bute-4').notes.length === 36);
  verifie('nom des cordes : 6 → 1 puis 1 → 6, à vide', chemin(Morceaux.get('ent-noms-cordes').notes) === '654321123456'.replace('11', '1') &&
          Morceaux.get('ent-noms-cordes').notes.every((n) => n.frette === 0));
  const zb = Morceaux.get('ent-zombie-balaye');
  verifie('balayages Zombie : mêmes doigtés que le morceau Zombie (Em à l’index et au majeur)',
          zb.mains.gauche[0].id === 'Em' && zb.mains.gauche[0].doigts.join() === Morceaux.get('zombie').mains.gauche[0].doigts.join());
  verifie('exercices du cours hors de la liste des morceaux (catégorie entraînement)',
          ['ent-noms-cordes', 'ent-pouce-bute-1', 'ent-pouce-bute-4', 'ent-v-0303', 'ent-v-0101', 'ent-zombie-balaye'].every((id) => Morceaux.get(id).categorie === 'entrainement'));
}

console.log('\n— Tablature : main droite lisible —');
{
  const z = Morceaux.get('zombie'), svg = Tablature.svg(z, Tablature.miseEnPage(z));
  const etiquettes = (svg.match(/class="tab-main"[^>]*>[^<]*/g) || []).map((x) => x.replace(/.*>/, ''));
  verifie('une étiquette par attaque (plus de lettres superposées)', etiquettes.length === new Set(z.notes.map((n) => n.temps)).size, etiquettes.length);
  verifie('accord plaqué i-m-a : une seule étiquette « ima »', etiquettes.includes('ima'));
  const b = Morceaux.get('acc-em-am'), sb = Tablature.svg(b, Tablature.miseEnPage(b));
  verifie('accord balayé au pouce : un seul « p »', !(sb.match(/class="tab-main"[^>]*>pp/)) && /class="tab-main"[^>]*>p</.test(sb));
}

console.log('\n— Nouvelles tablatures (v1.21) —');
{
  const nom = (p) => p.notes.map((n) => Theorie.nom(n.midi));
  const elise = Morceaux.get('lettre-elise');
  verifie('Lettre à Élise : Mi Ré♯ Mi Ré♯ Mi Si Ré Do La', nom(elise).slice(0, 9).join(' ') === 'Mi4 Ré♯4 Mi4 Ré♯4 Mi4 Si3 Ré4 Do4 La3', nom(elise).slice(0, 9).join(' '));
  verifie('Lettre à Élise : levée au 3e temps, 9 mesures de 3/8 complètes',
          elise.notes[0].temps === 1 && Tablature.duree_totale(elise) === 13.5);
  verifie('Lettre à Élise : Ré♯ à l’auriculaire, 2e corde case 4', elise.notes.filter((n) => n.midi === 63).every((n) => n.corde === 2 && n.frette === 4 && n.doigt === 4));
  verifie('mélodies : les basses (cordes 4 à 6) au pouce', ['lettre-elise', 'petite-musique-nuit'].every((id) => Morceaux.get(id).notes.every((n) => n.corde < 4 || n.main === 'p')));
  const nuit = Morceaux.get('petite-musique-nuit');
  verifie('Petite musique de nuit : Sol Ré Sol Ré Sol Ré Sol Si Ré', nom(nuit).slice(0, 9).join(' ') === 'Sol3 Ré3 Sol3 Ré3 Sol3 Ré3 Sol3 Si3 Ré4', nom(nuit).slice(0, 9).join(' '));
  verifie('nouvelles mélodies : première position, mesures complètes', ['lettre-elise', 'petite-musique-nuit'].every((id) => {
    const p = Morceaux.get(id), m = Tablature.noiresParMesure(p);
    return p.notes.every((n) => n.frette <= 5) && Math.abs(Tablature.duree_totale(p) / m - Math.round(Tablature.duree_totale(p) / m)) < 1e-9;
  }));
  const inter = Morceaux.tous().filter((p) => p.chanson && p.niveau === 8);
  verifie('12 chansons internationales (niveau 8, grilles d’accords seules)', inter.length === 12 && inter.every((p) => /grille d’accords/.test(p.sous_titre)), inter.length);
  verifie('chansons internationales : chaque note appartient à son accord, doigts des deux mains',
          inter.every((p) => p.notes.every((n) => n.accord && /^[pima]$/.test(n.main) && (n.frette === 0 || n.doigt >= 1))));
  verifie('Canon de Pachelbel : D A Bm F♯m G D G A', Morceaux.get('acc-canon-pachelbel').mains.gauche.map((a) => a.id).join(' ') === 'D A Bm F#m G');
  verifie('La Bamba : deux accords dans la mesure (Fa maj7 | Sol)', (() => {
    const n = Morceaux.get('acc-la-bamba').notes.filter((x) => x.temps >= 4 && x.temps < 8);
    return n.some((x) => x.accord === 'Fmaj7' && x.temps < 6) && n.some((x) => x.accord === 'G' && x.temps >= 6);
  })());
}

console.log('\n— Rock et reggae —');
{
  const rk = Morceaux.tous().filter((p) => p.chanson && p.niveau === 9);
  const par = (a) => rk.filter((p) => new RegExp(a).test(p.sous_titre)).length;
  verifie('12 chansons rock et reggae : Offspring 2, Nirvana 3, Cranberries 2, Police 2, Marley 3',
          rk.length === 12 && par('Offspring') === 2 && par('Nirvana') === 3 && par('Cranberries') === 2 && par('Police') === 2 && par('Marley') === 3, rk.length);
  const ts = Morceaux.get('ch-teen-spirit');
  verifie('Teen Spirit : F5 Bb5 Ab5 Db5, deux par mesure, power chords sur 3 cordes',
          ts.notes.filter((n) => n.temps === 0).length === 3 && ['F5', 'Bb5', 'Ab5', 'Db5'].every((id) => ts.mains.gauche.some((a) => a.id === id)) &&
          ts.notes.some((n) => n.accord === 'Bb5' && n.temps === 2));
  verifie('motif rock : le pouce balaie en croches, toujours vers le bas', Morceaux.get('ch-self-esteem').notes.every((n) => n.main === 'p') &&
          new Set(Morceaux.get('ch-self-esteem').notes.map((n) => n.temps)).size === Tablature.duree_totale(Morceaux.get('ch-self-esteem')) * 2);
  verifie('power chord : la basse est la fondamentale, une case plus haut que l’index… (F5 : index case 1, 6e corde)',
          (() => { const f = ts.mains.gauche.find((a) => a.id === 'F5'); return f.basse === 6 && f.frettes[5] === 1 && f.doigts[5] === 1; })());
  verifie('capo : Kids Aren’t Alright case 1, Every Breath case 1, Is This Love case 2',
          Morceaux.get('ch-kids-arent-alright').capo === 1 && Morceaux.get('ch-every-breath').capo === 1 && Morceaux.get('ch-is-this-love').capo === 2);
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
  // Rapport fin / début de la note : c'est l'extinction qu'on compare, pas le
  // volume. Les deux sons partent d'un bruit tiré au hasard ; comparer leurs
  // énergies absolues faisait échouer le test au hasard (1 fois sur 30).
  function energieFin(timbre) {
    buffersProduits.length = 0;
    Audio5.jouerCase(3, 0, { duree: 2.0, timbre: timbre });
    const b = buffersProduits[0].getChannelData(0);
    const rms = (x) => Math.sqrt(x.reduce((t, v) => t + v * v, 0) / x.length);
    // Fenêtres « établies » : après l'attaque (plus brillante à l'acier) et
    // avant le fondu de fin, sinon l'un ou l'autre fausse le rapport.
    const a = Math.round(0.5 * 44100), z = Math.round(1.5 * 44100);
    return rms(b.slice(z, z + 4096)) / rms(b.slice(a, a + 4096));
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
  verifie('46 pièces importées', rep.length === 46, rep.length);
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

console.log('\n— Chansons : grilles d’accords (v1.18) —');
{
  const ch = Morceaux.tous().filter((p) => p.chanson);
  verifie('au moins 20 chansons (classiques + hits récents)', ch.length >= 20, ch.length);
  verifie('deux groupes : classiques (6) et hits récents (7)', ch.some((p) => p.niveau === 6) && ch.some((p) => p.niveau === 7));
  // Chaque accord joué doit sonner EXACTEMENT les notes de son nom.
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const INTERVALLES = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], m7b5: [0, 3, 6, 10], '5': [0, 7] };
  function attendu(id) {
    const m = /^([A-G])(#|b)?(m7b5|maj7|m7|m|7|5)?$/.exec(id);
    if (!m) return null;
    const r = (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12;
    return { racine: r, notes: new Set(INTERVALLES[m[3] || ''].map((i) => (r + i) % 12)) };
  }
  const fautes = [];
  ch.forEach((p) => p.mains.gauche.forEach((a) => {
    const e = attendu(a.id);
    if (!e) { fautes.push(p.id + ' : nom ' + a.id); return; }
    const joue = new Set(a.frettes.map((f, i) => f < 0 ? null : Theorie.midiDeCase(i + 1, f) % 12).filter((x) => x !== null));
    const ok = [...joue].every((x) => e.notes.has(x)) && joue.has(e.racine) && joue.size >= Math.min(3, e.notes.size);
    // La basse jouée par le pouce doit être la fondamentale.
    const basse = Theorie.midiDeCase(a.basse, a.frettes[a.basse - 1]) % 12;
    if (!ok || basse !== e.racine) fautes.push(p.id + ' : ' + a.id);
  }));
  verifie('chaque accord des chansons sonne ses notes, basse = fondamentale', !fautes.length, [...new Set(fautes)].join(', '));
  verifie('chaque note d’une chanson appartient à son accord', ch.every((p) => p.notes.every((n) => {
    const a = p.mains.gauche.find((x) => x.id === n.accord);
    return a && a.frettes[n.corde - 1] === n.frette;
  })));
  const nbMesures = (p) => Math.ceil(Tablature.duree_totale(p) / 4);
  verifie('sections contiguës qui couvrent tout le morceau', ch.every((p) => p.sections[0].de === 1 &&
    p.sections.every((s, i) => i === 0 || s.de === p.sections[i - 1].a + 1) && p.sections[p.sections.length - 1].a === nbMesures(p)));
  const lb = Morceaux.get('ch-je-l-aime-a-mourir');
  verifie('demi-mesure « F|G7 » : Fa sur les temps 1-2, Sol 7 (basse) au 3e temps',
    lb.notes.some((n) => n.accord === 'F' && n.temps === 16) && lb.notes.some((n) => n.accord === 'G7' && n.temps === 18 && n.main === 'p'));
  verifie('capo noté sur le morceau (Mistral gagnant : case 3)', Morceaux.get('ch-mistral-gagnant').capo === 3 && /capo case 3/.test(Morceaux.get('ch-mistral-gagnant').sous_titre));
  verifie('ni paroles ni mélodie : la description le dit', ch.every((p) => /ni mélodie ni paroles/.test(p.description)));
  verifie('chaque chanson se dessine en tablature', ch.every((p) => (Tablature.svg(p, Tablature.miseEnPage(p)).match(/tab-note/g) || []).length === p.notes.length));
}

console.log('\n— Programme progressif —');
{
  const tous = Morceaux.tous();
  const pals = Programme.paliers(tous);
  const ranges = pals.reduce((t, p) => t.concat(p.ids), []);
  verifie('chaque morceau est dans exactement un palier', ranges.length === tous.length && new Set(ranges).size === tous.length);
  verifie('7 paliers, aucun vide', pals.length === 7 && pals.every((p) => p.ids.length > 0));
  verifie('palier 1 : pas de chanson ni de barré', pals[0].ids.every((id) => !Morceaux.get(id).chanson));
  const barre = (id) => (Morceaux.get(id).mains || { gauche: [] }).gauche.some((a) => a.barre);
  verifie('les chansons avec barré sont au palier 5', tous.filter((p) => p.chanson && barre(p.id)).every((p) => Programme.palierDe(p) === 4));
  verifie('les trois accords de Santiano : palier 2', Programme.palierDe(Morceaux.get('ch-santiano')) === 1);
  verifie('les études (niveau 5) au dernier palier', tous.filter((p) => p.niveau === 5 && !p.categorie).every((p) => Programme.palierDe(p) === 6));
  verifie('dans un palier, la technique avant la musique', Morceaux.get(pals[0].ids[0]).categorie === 'entrainement');

  const T = Date.UTC(2026, 9, 1, 12);
  const J = 86400000;
  let e = Programme.noter(null, 'moyen', T);
  verifie('« ça va » sur un nouveau : boîte 1, revu le lendemain', e.b === 1 && !Programme.aRevoir(e, T + 0.5 * J) && Programme.aRevoir(e, T + J));
  e = Programme.noter(e, 'facile', T);
  verifie('« facile » : +2 boîtes, revu dans 4 jours', e.b === 3 && Programme.acquis(e) && Programme.joursAvant(e, T) === 4);
  e = Programme.noter(Programme.noter(e, 'facile', T), 'facile', T);
  verifie('boîte plafonnée à 5 (16 jours)', e.b === 5 && Programme.joursAvant(e, T) === 16);
  verifie('« dur » : retour en boîte 1', Programme.noter(e, 'dur', T).b === 1);
  verifie('passages : du lent au tempo normal', Programme.passages(null).join() === '60,80,100' && Programme.passages({ b: 4 }).join() === '100');

  const vierge = Programme.seance(tous, {}, [], T);
  verifie('séance vierge : palier 1, échauffement + 2 nouveautés', vierge.palier.num === 1 && vierge.items.length === 3 &&
          vierge.items[0].raison === 'echauffement' && vierge.items.slice(1).every((x) => x.raison === 'nouveau'));
  verifie('séance vierge : rien hors du palier 1', vierge.items.every((x) => pals[0].ids.includes(x.id)));

  // 4 morceaux acquis au palier 1 → le palier 2 s'ouvre.
  const suivi = {};
  pals[0].ids.slice(0, 4).forEach((id) => { suivi[id] = { b: 3, t: T, n: 2 }; });
  const s2 = Programme.seance(tous, suivi, [], T + J);
  verifie('4 acquis au palier 1 → palier 2 ouvert', s2.palier.num === 2 && s2.paliers[1].ouvert && !s2.paliers[2].ouvert);

  // Un favori passe devant les autres nouveautés.
  const fav = pals[1].ids.filter((id) => Morceaux.get(id).chanson).slice(-1)[0];
  const s3 = Programme.seance(tous, suivi, [fav], T + J);
  verifie('♥ : le favori est la première nouveauté', s3.items.some((x) => x.id === fav && x.raison === 'favori'));

  // Révisions dues : favori d'abord.
  const dus = {};
  pals[0].ids.slice(4, 8).forEach((id, k) => { dus[id] = { b: 1, t: T - (k + 2) * J, n: 1 }; });
  const aimeDu = pals[0].ids[6];
  const s4 = Programme.seance(tous, dus, [aimeDu], T);
  const revs = s4.items.filter((x) => x.raison === 'revision' || x.raison === 'echauffement');
  verifie('révisions dues proposées, au plus 5 morceaux', revs.length >= 3 && s4.items.length <= 5);
  verifie('révisions : le favori avant les autres', s4.items.filter((x) => x.raison === 'revision')[0].id === aimeDu ||
          s4.items[0].id === aimeDu);
  verifie('beaucoup en cours → une seule nouveauté au plus', s4.items.filter((x) => x.raison === 'nouveau' || x.raison === 'favori').length <= 1);

  // Un favori du palier suivant : proposé en défi, lentement.
  const defi = Programme.seance(tous, {}, ['ch-linger'], T).items.find((x) => x.raison === 'defi');
  verifie('favori du palier suivant : défi à 50 → 70 %', defi && defi.id === 'ch-linger' && defi.passages.join() === '50,60,70');
}

console.log(`\n=== ${ok} réussis, ${ko} échoués ===`);
process.exit(ko ? 1 : 0);
