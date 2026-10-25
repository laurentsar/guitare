/* Interface, dans jsdom : est-ce que les écrans se remplissent vraiment ?
 *
 * Les modules sont déjà vérifiés par theorie.test.js ; ici on ne teste que
 * l'assemblage — c'est-à-dire ce qui casse quand on renomme un identifiant ou
 * qu'on oublie un rendu. Une release verte dont l'écran reste vide part sur le
 * téléphone ET sur la télé, où le diagnostic est pénible.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { JSDOM } = require('jsdom');

const RACINE = path.join(__dirname, '..', 'www');
const html = fs.readFileSync(path.join(RACINE, 'index.html'), 'utf8');

const dom = new JSDOM(html, { runScripts: 'outside-only', pretendToBeVisual: true, url: 'https://exemple.test/app/' });
const w = dom.window;
const erreurs = [];
w.addEventListener('error', (e) => erreurs.push(String(e.message)));

// Pas d'AudioContext ni de micro dans jsdom : les modules doivent le supporter
// sans planter (c'est aussi le cas d'un vieux téléphone).
w.matchMedia = w.matchMedia || (() => ({ matches: false, addListener() {}, removeListener() {} }));
// jsdom n'implémente pas scrollTo et hurle à chaque appel : l'app s'en sert à
// chaque changement d'écran, le bruit masquerait les vrais échecs.
w.scrollTo = () => {};

function charge(f) {
  const code = fs.readFileSync(path.join(RACINE, f), 'utf8');
  try { vm.runInContext(code, dom.getInternalVMContext(), { filename: f }); }
  catch (e) { erreurs.push(f + ' : ' + e.message); }
}

vm.runInContext("window.BACKUP_APP='guitare'; window.APP_VERSION='1.0';", dom.getInternalVMContext());
['theorie.js', 'audio.js', 'accords.js', 'illustrations.js', 'tablature.js', 'portee.js', 'manche.js', 'gammes.js', 'apk-update.js', 'repertoire.js', 'chansons.js', 'morceaux.js', 'entrainement.js', 'programme.js', 'lecons.js',
 'accordeur.js', 'oreille.js', 'store.js', 'ecran.js', 'dpad-nav.js', 'tv.js', 'cast.js', 'vr.js', 'app.js'].forEach(charge);

const $ = (id) => w.document.getElementById(id);
// Les exercices d'entraînement s'ouvrent depuis leur écran, pas depuis la liste.
const listables = () => w.Morceaux.tous().filter((p) => p.categorie !== 'entrainement').length;
// Les aides débutant sont éteintes par défaut (v1.16) ; les blocs ci-dessous
// les testent, on les allume. Le comportement par défaut a son propre bloc.
w.Store.reglage('aides', true);
const attendre = (ms) => new Promise((r) => setTimeout(r, ms));
let ok = 0, ko = 0;
function verifie(nom, cond, detail) {
  if (cond) { console.log('  ✓ ' + nom); ok++; }
  else { console.log('  ✗ ' + nom + (detail ? ' — ' + detail : '')); ko++; }
}

(async () => {
  // L'app s'initialise sur DOMContentLoaded : on lui laisse le temps.
  await attendre(120);

  console.log('\n— Démarrage —');
  verifie('aucune erreur au chargement', erreurs.length === 0, erreurs.join(' | '));
  verifie('version affichée', $('chipVersion').textContent === 'v1.0', $('chipVersion').textContent);
  verifie('accueil rempli', $('carteReprendre').children.length > 0);
  verifie('première leçon proposée', /S’asseoir|S'asseoir/.test($('carteReprendre').textContent), $('carteReprendre').textContent.slice(0, 60));

  console.log('\n— Navigation —');
  ['parcours', 'accords', 'accordeur', 'metronome', 'morceaux', 'oreille', 'gammes', 'reglages', 'accueil'].forEach((nom) => {
    w.AppGuitare.aller(nom);
    verifie('écran ' + nom + ' affiché', $('ecran-' + nom).classList.contains('actif'));
  });

  console.log('\n— Parcours —');
  w.AppGuitare.aller('parcours');
  const lignes = $('listeParcours').querySelectorAll('.ligne-lecon');
  verifie('18 leçons listées', lignes.length === 18, 'n=' + lignes.length);
  verifie('6 chapitres', $('listeParcours').querySelectorAll('h3').length === 6);
  w.AppGuitare.ouvrirLecon('premier-accord');
  verifie('leçon ouverte avec son texte', $('detailLecon').textContent.indexOf('Mi mineur') !== -1);
  verifie('l’exercice affiche un diagramme', $('detailLecon').querySelectorAll('svg.diagramme').length === 1);
  verifie('un bouton de validation est proposé', /cordes sonnent clair/.test($('detailLecon').textContent));

  // Valider une leçon la marque faite, et la marque survit au rendu suivant.
  const boutons = [...$('detailLecon').querySelectorAll('button')];
  boutons[boutons.length - 1].click();
  w.AppGuitare.aller('parcours');
  verifie('leçon validée = puce cochée',
          $('listeParcours').querySelectorAll('.ligne-lecon.faite').length === 1,
          'n=' + $('listeParcours').querySelectorAll('.ligne-lecon.faite').length);

  w.AppGuitare.ouvrirLecon('tenue');
  verifie('une leçon illustrée montre ses schémas',
          $('detailLecon').querySelectorAll('svg.schema').length === 2,
          'n=' + $('detailLecon').querySelectorAll('svg.schema').length);
  verifie('le schéma est placé avant le texte',
          $('detailLecon').querySelector('svg.schema').compareDocumentPosition($('detailLecon').querySelector('.lecon-texte')) & 4);
  w.AppGuitare.aller('accordeur');
  verifie('l’accordeur montre la tête et la méthode sans micro',
          $('ecran-accordeur').querySelectorAll('svg.schema').length === 2,
          'n=' + $('ecran-accordeur').querySelectorAll('svg.schema').length);
  verifie('la méthode de la 5e case est repliée par défaut',
          $('ecran-accordeur').querySelector('details') && !$('ecran-accordeur').querySelector('details').open);

  console.log('\n— Accords —');
  w.AppGuitare.aller('accords');
  const vignettes = $('grilleAccords').querySelectorAll('.accord-vignette');
  verifie('tous les accords sont affichés', vignettes.length === w.Accords.tous().length, 'n=' + vignettes.length);
  verifie('chaque vignette porte un diagramme',
          [...vignettes].every((v) => v.querySelector('svg.diagramme')));
  w.AppGuitare.ouvrirAccord('F');
  verifie('fiche d’accord : notes listées', /Fa · La · Do|Notes :/.test($('detailAccord').textContent));
  verifie('fiche d’accord : le barré est expliqué', /Barré/.test($('detailAccord').textContent));
  w.AppGuitare.ouvrirAccord('Am');
  verifie('fiche d’accord : corde à ne pas jouer signalée', /ne pas jouer/.test($('detailAccord').textContent));
  verifie('fiche d’accord : diagramme + main + guitare entière',
          $('detailAccord').querySelectorAll('svg').length === 3,
          'n=' + $('detailAccord').querySelectorAll('svg').length);
  verifie('fiche d’accord : les doigts sont colorés par numéro',
          $('detailAccord').querySelector('.diagramme .doigt-1') && $('detailAccord').querySelector('.sch-doigt-2'));

  console.log('\n— Morceaux —');
  w.AppGuitare.aller('morceaux');
  verifie('tous les morceaux sont listés',
          $('listeMorceaux').querySelectorAll('.ligne-morceau').length === listables());
  w.AppGuitare.ouvrirMorceau('ode-joie');
  const notesTab = $('detailMorceau').querySelectorAll('.tab-note');
  verifie('la tablature contient toutes les notes',
          notesTab.length === w.Morceaux.get('ode-joie').notes.length, 'n=' + notesTab.length);
  verifie('la portée contient autant de notes que la tablature',
          $('detailMorceau').querySelectorAll('.portee-note').length === notesTab.length,
          'n=' + $('detailMorceau').querySelectorAll('.portee-note').length);
  verifie('la clé de sol et le chiffrage sont là',
          $('detailMorceau').querySelector('.portee-cle') && /4/.test($('detailMorceau').querySelector('.portee-chiffrage').textContent));
  // Basculer en tablature seule doit vraiment retirer la portée.
  [...$('detailMorceau').querySelectorAll('.filtres button')].find((b) => b.dataset.vue === 'tablature').click();
  verifie('vue « Tablature » : plus de portée',
          $('detailMorceau').querySelectorAll('.portee-note').length === 0 &&
          $('detailMorceau').querySelectorAll('.tab-note').length > 0);
  [...$('detailMorceau').querySelectorAll('.filtres button')].find((b) => b.dataset.vue === 'portee').click();
  verifie('vue « Portée » : plus de tablature',
          $('detailMorceau').querySelectorAll('.tab-note').length === 0 &&
          $('detailMorceau').querySelectorAll('.portee-note').length > 0);
  verifie('le choix de vue est mémorisé', w.Store.reglages().vuePartition === 'portee');
  [...$('detailMorceau').querySelectorAll('.filtres button')].find((b) => b.dataset.vue === 'deux').click();
  verifie('le morceau affiche son tempo', /♩ = 88/.test($('detailMorceau').textContent));
  verifie('la légende de lecture est disponible, repliée',
          $('detailMorceau').querySelector('details') && $('detailMorceau').querySelector('details svg.schema'));

  console.log('\n— Lecteur façon Guitar Pro —');
  w.AppGuitare.ouvrirMorceau('etude-mim');
  const det = $('detailMorceau');
  const opt = (txt) => [...det.querySelectorAll('.options-lecture button')].find((b) => b.textContent.indexOf(txt) !== -1);
  verifie('les options de travail sont là', ['Boucle', 'Entraîneur', 'Décompte', 'Clic', 'muette', 'Manche'].every((t) => opt(t)));
  verifie('le manche virtuel est dessiné', det.querySelector('.manche-boite svg.manche'));
  opt('Entraîneur').click();
  verifie('entraîneur : démarre à 60 % et active la boucle',
          /\(60 %\)/.test(det.textContent) && opt('Boucle').classList.contains('actif'));
  const reglages = [...det.querySelectorAll('.reglage-lecteur')];
  verifie('section et capo réglables', reglages.length === 3);
  reglages[1].querySelector('button').click();           // « jusqu’à » −1
  verifie('section réduite : les notes hors section sont estompées',
          det.querySelectorAll('.tab-note.hors-section').length > 0);
  reglages[2].querySelectorAll('button')[1].click();     // capo +1
  verifie('capodastre affiché', /case 1/.test(reglages[2].textContent));
  verifie('tablature texte proposée', /e\|/.test(det.querySelector('.tab-texte').textContent));

  console.log('\n— Éditeur de tablature —');
  w.AppGuitare.ouvrirEditeur(null);
  verifie('écran éditeur affiché', $('ecran-editeur').classList.contains('actif'));
  const edh = $('editeurTab');
  const bouton = (txt) => [...edh.querySelectorAll('button')].find((b) => b.textContent.trim() === txt);
  [...edh.querySelectorAll('.filtres button')].find((b) => /^2 · Si/.test(b.textContent)).click();
  bouton('1').click();                                   // corde 2, case 1 = Do
  bouton('3').click();                                   // corde 2, case 3 = Ré
  verifie('deux notes saisies, curseur avancé', w.document.getElementById('editeurTab').textContent.indexOf('2 notes') !== -1);
  bouton('↶ Dernière note').click();
  verifie('annuler retire la dernière note', /1 notes|1 note/.test($('editeurTab').textContent));
  const ta = $('editeurTab').querySelector('textarea');
  ta.value = 'e|-0-|\nB|---|\nG|---|\nD|---|\nA|---|\nE|---|';
  [...$('editeurTab').querySelectorAll('button')].find((b) => b.textContent === 'Importer').click();
  verifie('import d’une tab texte ajouté à la suite', /2 notes/.test($('editeurTab').textContent));
  [...$('editeurTab').querySelectorAll('button')].find((b) => /Enregistrer/.test(b.textContent)).click();
  verifie('enregistrée puis ouverte dans le lecteur', $('ecran-morceau').classList.contains('actif') && w.Store.tablatures().length === 1);
  w.AppGuitare.aller('morceaux');
  verifie('« Mes tablatures » la liste', /Mes tablatures/.test($('listeMorceaux').textContent) &&
          $('listeMorceaux').querySelectorAll('.ligne-morceau').length === listables() + 1);

  console.log('\n— Gammes —');
  w.AppGuitare.aller('gammes');
  verifie('gamme par défaut : La pentatonique mineure', /: La · Do · Ré · Mi · Sol/.test($('gammesContenu').textContent));
  verifie('pastilles sur le manche', $('gammesContenu').querySelectorAll('.manche-point').length > 20);
  [...$('gammesContenu').querySelectorAll('.filtres button')].find((b) => b.textContent === 'Majeure').click();
  verifie('changer de type redessine', /La · Si · Do♯ · Ré · Mi · Fa♯ · Sol♯/.test($('gammesContenu').textContent));

  console.log('\n— Casque VR —');
  verifie('pas de mode casque sur un navigateur ordinaire', !w.document.documentElement.classList.contains('casque'));
  verifie('raccourci casque masqué hors casque', $('raccourciVR').hidden === true);
  w.CasqueVR._etat.piece = w.Morceaux.get('ode-joie');
  verifie('module casque exposé', typeof w.CasqueVR.brancher === 'function' && typeof w.CasqueVR.note === 'function');

  console.log('\n— Pupitre (mode casque) —');
  w.AppGuitare.ouvrirMorceau('etude-lam');
  const bPup = [...$('detailMorceau').querySelectorAll('button')].find((b) => /Mode casque/.test(b.textContent));
  verifie('bouton « Mode casque » dans le morceau', !!bPup);
  bPup.click();
  verifie('pupitre affiché, en-tête et onglets masqués',
          $('ecran-pupitre').classList.contains('actif') && w.document.documentElement.classList.contains('en-pupitre'));
  verifie('ligne en cours + ligne suivante', $('pupitreVue').querySelectorAll('.pupitre-ligne').length === 2 &&
          $('pupitreVue').querySelectorAll('.pupitre-ligne.suivante').length === 1);
  verifie('manche et barre de commandes', $('pupitreVue').querySelector('.pupitre-manche svg') &&
          $('pupitreVue').querySelectorAll('.pupitre-barre .btn').length >= 7);
  const pup = w.AppGuitare.pupitre();
  const pieceL = w.Morceaux.get('etude-lam');
  const noteLoin = pieceL.notes.find((n) => n.temps >= 8);
  pup.note(noteLoin);
  verifie('les pages tournent : la ligne affichée suit la note', /mesure 3/.test($('pupitreVue').textContent), $('pupitreVue').querySelector('.pupitre-info').textContent);
  verifie('note en cours allumée dans le pupitre', $('pupitreVue').querySelectorAll('.pupitre-ligne:not(.suivante) .tab-note.en-cours').length >= 1);
  verifie('et sur le manche', $('pupitreVue').querySelectorAll('.manche-point.joue').length >= 1);
  const bBoucle = [...$('pupitreVue').querySelectorAll('.pupitre-barre .btn')].find((b) => /Boucle/.test(b.textContent));
  bBoucle.click();
  verifie('boucle depuis le pupitre = même réglage que le lecteur', bBoucle.classList.contains('actif') &&
          [...$('detailMorceau').querySelectorAll('.options-lecture button')].find((b) => /Boucle/.test(b.textContent)).classList.contains('actif'));
  [...$('pupitreVue').querySelectorAll('button')].find((b) => /Quitter/.test(b.textContent)).click();
  verifie('quitter revient au morceau et rend l’en-tête', $('ecran-morceau').classList.contains('actif') && !w.document.documentElement.classList.contains('en-pupitre'));

  w.AppGuitare.aller('reglages');
  $('regCasque').value = 'oui'; $('regCasque').onchange();
  verifie('réglage « Mode casque : toujours » = classe casque + raccourci', w.document.documentElement.classList.contains('casque') && !$('raccourciVR').hidden);
  $('regCasque').value = 'auto'; $('regCasque').onchange();
  verifie('réglage « automatique » = pas de casque sur ce navigateur', !w.document.documentElement.classList.contains('casque'));
  const lien = w.CasqueVR.lienProfond(w.Store.tablatures()[0]);
  verifie('lien profond d’une tablature perso : elle voyage dans l’URL', /#tab=/.test(lien) &&
          JSON.parse(decodeURIComponent(lien.split('#tab=')[1])).notes.length === w.Store.tablatures()[0].notes.length);
  verifie('lien profond d’un morceau intégré', w.CasqueVR.lienProfond(pieceL) === 'https://laurentsar.github.io/guitare/?morceau=etude-lam');

  console.log('\n— Répertoire Mutopia (interface) —');
  w.AppGuitare.aller('morceaux');
  verifie('niveaux du répertoire listés', /Niveau 4 — répertoire/.test($('listeMorceaux').textContent) && /Niveau 5 — études/.test($('listeMorceaux').textContent));
  w.AppGuitare.ouvrirMorceau('sor-landler');
  verifie('fiche : crédit Mutopia + éditeur + licence', /Mutopia Project, édition de Louie van Bommel · Creative Commons Attribution 3\.0/.test($('detailMorceau').textContent));
  verifie('fiche : lien vers la partition source', $('detailMorceau').querySelector('.credit a').href.indexOf('mutopiaproject.org') !== -1);
  verifie('3/8 : chiffrage affiché 3 sur 8', [...$('detailMorceau').querySelectorAll('.portee-chiffrage')].map((t) => t.textContent).join('/') === '3/8');
  w.AppGuitare.ouvrirMorceau('carcassi-60-1');
  verifie('Carcassi : toutes les notes dessinées', $('detailMorceau').querySelectorAll('.tab-note').length === w.Morceaux.get('carcassi-60-1').notes.length);

  w.AppGuitare.ouvrirMorceau('zombie');
  verifie('Zombie : position des mains, 4 accords dessinés avec la main',
          $('detailMorceau').querySelectorAll('.main-accord').length === 4 &&
          $('detailMorceau').querySelectorAll('.main-accord .diagramme').length === 4 &&
          /Main droite/.test($('detailMorceau').textContent));

  w.AppGuitare.ouvrirMorceau('hot-cross-buns');
  {
    const g = $('detailMorceau').querySelector('.guide-mains');
    verifie('guide des mains : 1re note dite en phrases', g && /Note 1 sur \d+ : Mi/.test(g.textContent) && /Aucun doigt sur la 1re corde/.test(g.textContent) && /L’index \(i\) pince/.test(g.textContent));
    [...g.querySelectorAll('button')].find((b) => /Suivante/.test(b.textContent)).click();
    verifie('guide des mains : « Suivante » passe au Ré, annulaire case 3', /Note 2 sur/.test(g.textContent) && /annulaire \(doigt 3\).*case 3/.test(g.textContent));
    verifie('guide des mains : la note est surlignée sur la tablature', $('detailMorceau').querySelectorAll('.tab-note.en-cours').length === 1);
    verifie('manche : pastille colorée du doigt 3', !!$('detailMorceau').querySelector('.manche-point.doigt-3'));
    verifie('guide des mains : dessin des deux mains sur la guitare', !!g.querySelector('.guide-dessin svg') && /MAIN GAUCHE/.test(g.querySelector('.guide-dessin').textContent));
  }
  w.AppGuitare.ouvrirMorceau('zombie');
  {
    const g = $('detailMorceau').querySelector('.guide-mains');
    for (let k = 0; k < 65; k++) [...g.querySelectorAll('button')].find((b) => /Suivante/.test(b.textContent)).click();
    verifie('Zombie, refrain : « Garde l’accord Em posé » et les doigts tenus dessinés',
            /Garde l’accord Em posé/.test(g.textContent) && /accord Em posé/.test(g.querySelector('.guide-dessin').textContent));
  }

  w.AppGuitare.ouvrirMorceau('mary-agneau');
  {
    const bloc = $('detailMorceau').querySelector('.etapes-morceau');
    verifie('pas à pas : liste d’étapes ouverte, 0 / 8', bloc && bloc.open && /0 \/ 8 étapes/.test(bloc.querySelector('summary').textContent));
    const etapes = bloc.querySelectorAll('.etape');
    etapes[3].querySelector('button').click();
    const txt = $('detailMorceau').textContent;
    verifie('pas à pas : « Mesures 1 à 4 » règle la section et 60 %', /Jusqu’à la mesure\s*−\s*4 \/ 8/.test(txt) && /♩ = 48/.test(txt), txt.match(/♩ = \d+/));
    w.Tablature.arreter();
    etapes[0].querySelector('input').click();
    verifie('pas à pas : étape cochée, mémorisée, la suivante mise en avant',
            /1 \/ 8/.test(bloc.querySelector('summary').textContent) && w.Store.etapesFaites('mary-agneau').join() === '0' &&
            bloc.querySelectorAll('.etape')[1].classList.contains('prochaine'));
    w.Store.marquerEtape('mary-agneau', 0, false);
  }

  w.AppGuitare.ouvrirMorceau('sor-35-14');
  {
    const g = $('detailMorceau').querySelector('.guide-mains');
    const suiv = [...g.querySelectorAll('button')].find((b) => /Suivante/.test(b.textContent));
    let vu = false;
    for (let k = 0; k < 40 && !vu; k++) { suiv.click(); vu = /Laisse posé/.test(g.textContent); }
    verifie('répertoire : le guide dit quels doigts laisser posés pendant une note tenue', vu);
    verifie('répertoire : chaque note a un doigt gauche nommé (plus de « un doigt » au choix)', !/Pose un doigt/.test(g.textContent));
  }

  console.log('\n— Tablature d’abord, plein écran (v1.16) —');
  {
    w.Store.reglage('aides', false);
    w.AppGuitare.ouvrirMorceau('zombie');
    const d = $('detailMorceau');
    verifie('aides éteintes par défaut : ni mains, ni pas à pas, ni guide, ni légende',
            !d.querySelector('.mains-morceau') && !d.querySelector('.etapes-morceau') && !d.querySelector('.guide-mains') &&
            ![...d.querySelectorAll('summary')].some((x) => /Comment lire/.test(x.textContent)));
    verifie('la tablature est dessinée en entier', d.querySelectorAll('.tab-note').length === w.Morceaux.get('zombie').notes.length);
    const css = fs.readFileSync(path.join(RACINE, 'styles.css'), 'utf8');
    verifie('plus de largeur minimale qui fait déborder tablature et portée', !/\.tab\s*\{[^}]*min-width:\s*420px/.test(css) && !/\.portee\s*\{[^}]*min-width:\s*420px/.test(css));
    const z = w.Morceaux.get('zombie');
    // Règle : le dessin n'est jamais réduit sous 80 % (sauf s'il ne reste qu'une
    // mesure par ligne), sur TOUT le répertoire, au téléphone comme en paysage.
    const tous = w.Morceaux.tous();
    const lisible = (l) => tous.every((m) => {
      const pg = w.Tablature.miseEnPage(m, l);
      const nat = 36 + pg.mesuresParLigne * w.Tablature.noiresParMesure(m) * pg.pxParTemps;
      return pg.mesuresParLigne === 1 || l / nat >= 0.8;
    });
    verifie('mesures par ligne selon la largeur : jamais réduit sous 80 % (380 px et 900 px)', lisible(380) && lisible(900));
    verifie('paysage : plus de mesures par ligne qu’en portrait, 4 max',
            w.Tablature.miseEnPage(z, 900).mesuresParLigne > w.Tablature.miseEnPage(z, 380).mesuresParLigne &&
            w.Tablature.miseEnPage(z, 3000).mesuresParLigne === 4);
    const bPE = [...d.querySelectorAll('button')].find((b) => /Plein écran/.test(b.textContent));
    verifie('bouton « ⛶ Plein écran » présent', !!bPE);
    bPE.click();
    const boite = d.querySelector('.partition');
    verifie('plein écran : la partition passe en calque plein écran avec sa barre',
            boite.classList.contains('plein-ecran') && !!boite.querySelector('.pe-barre') && /♩ \d+/.test(boite.querySelector('.pe-barre').textContent));
    [...boite.querySelectorAll('.pe-barre button')].find((b) => b.getAttribute('aria-label') === 'Quitter le plein écran').click();
    verifie('plein écran : ✕ referme', !boite.classList.contains('plein-ecran'));
    // Zoom (v1.19) : échelle fixe du dessin, mise en page à cette échelle.
    verifie('télé : 2 mesures par ligne au plus quand c’est ajusté', w.Tablature.miseEnPage(z, 3000, 2).mesuresParLigne === 2);
    const bZ = (lbl) => [...d.querySelectorAll('.partition-barre button')].find((b) => b.getAttribute('aria-label') === lbl);
    verifie('zoom : boutons 🔍− / Ajusté / 🔍+ près du plein écran', !!bZ('Zoomer') && !!bZ('Dézoomer') && bZ('Ajuster à la largeur').textContent === 'Ajusté');
    bZ('Zoomer').click();
    const z1 = w.Store.reglages().zoomPartition;
    const svgZ = d.querySelector('.partition svg.tab, .partition svg.portee');
    verifie('zoom + : échelle mémorisée, largeur du dessin = viewBox × échelle',
            z1 > 1 && svgZ.style.width === Math.round(+svgZ.getAttribute('viewBox').split(' ')[2] * z1) + 'px' && bZ('Ajuster à la largeur').textContent === Math.round(z1 * 100) + ' %');
    bZ('Dézoomer').click(); bZ('Dézoomer').click();
    verifie('zoom − : échelle plus petite', w.Store.reglages().zoomPartition < z1);
    bZ('Ajuster à la largeur').click();
    verifie('« Ajusté » rend la largeur à la page', w.Store.reglages().zoomPartition === null && !d.querySelector('.partition svg.tab').style.width);
    bPE.click();
    verifie('plein écran : le focus passe sur ▶ (plus caché sous le calque)', w.document.activeElement && w.document.activeElement.getAttribute('aria-label') === 'Jouer');
    verifie('plein écran : la barre a aussi le zoom', !!boite.querySelector('.pe-barre .zoom-groupe'));
    verifie('plein écran : flèches limitées au calque',
            w.DpadNav && [...boite.querySelectorAll('button')].length > 0 && w.document.querySelector('.plein-ecran') === boite);
    w.dispatchEvent(new w.PopStateEvent('popstate', { state: null }));
    verifie('plein écran : la touche Retour (popstate) referme au lieu de quitter', !boite.classList.contains('plein-ecran'));
    w.AppGuitare.aller('reglages');
    verifie('réglage « Aides débutant » affiché sur Non', $('regAides').value === 'non');
    $('regAides').value = 'oui'; $('regAides').dispatchEvent(new w.Event('change'));
    w.AppGuitare.ouvrirMorceau('zombie');
    verifie('aides rallumées : le pas à pas revient', !!$('detailMorceau').querySelector('.etapes-morceau') && w.Store.reglages().aides === true);
  }

  console.log('\n— Enchaînement de morceaux (v1.17) —');
  {
    // Révision du jour : 5 morceaux, ce qui est joué depuis le plus longtemps d'abord.
    const ids = w.Morceaux.tous().map((m) => m.id);
    const jadis = Date.now() - 30 * 86400000;
    w.Store.sauverRevision(null);
    const j = {}; j[ids[7]] = { n: 2, t: jadis }; j[ids[3]] = { n: 1, t: jadis + 86400000 };
    w.localStorage.setItem('guitare:joues', JSON.stringify(j));
    w.AppGuitare.aller('morceaux');
    const blocE = $('listeMorceaux').querySelector('.enchainer');
    verifie('écran Morceaux : bloc « Enchaîner » avec la révision du jour', !!blocE && /Révision du jour/.test(blocE.textContent));
    const rev = w.Store.revision();
    verifie('révision du jour : 5 morceaux, figée pour la journée', rev && rev.ids.length === 5 && rev.jour === w.Store.jourCourant());
    verifie('révision du jour : le plus anciennement joué d’abord, puis du neuf', rev.ids[0] === ids[7] && rev.ids[1] === ids[3] && !j[rev.ids[2]], rev.ids.join(','));

    // Éditeur : nouvelle liste, ajout, réordonnancement, tempo commun.
    [...blocE.querySelectorAll('button')].find((b) => /Nouvelle liste/.test(b.textContent)).click();
    const ed = $('editeurListe');
    verifie('éditeur de liste ouvert', $('ecran-liste').classList.contains('actif') && /Nouvelle liste/.test(ed.textContent));
    ed.querySelector('input').value = 'Répét';
    const ajout = (titre) => [...ed.querySelectorAll('.ajout-liste .ligne-morceau')].find((b) => b.textContent.indexOf(titre) !== -1).click();
    const t = ids.slice(0, 3).map((id) => w.Morceaux.get(id).titre);
    t.forEach(ajout);
    verifie('éditeur : 3 morceaux ajoutés dans l’ordre', [...ed.querySelectorAll('.ordre-titre')].map((x) => x.textContent).join('|') === t.join('|'));
    ed.querySelectorAll('.ordre-ligne')[2].querySelector('[aria-label="Monter"]').click();
    verifie('éditeur : « Monter » réordonne', ed.querySelectorAll('.ordre-titre')[1].textContent === t[2]);
    ed.querySelector('select').value = '80';
    [...ed.querySelectorAll('button')].find((b) => /^💾/.test(b.textContent)).click();
    const l = w.Store.listes().find((x) => x.nom === 'Répét');
    verifie('liste enregistrée (nom, ordre, tempo 80 %)', l && l.morceaux.length === 3 && l.pct === 80 && l.morceaux[1] === ids[2]);

    // Lecture enchaînée : bandeau, tempo commun, ⏭, fin de liste.
    w.Tablature.jouer = () => {};       // pas d'audio dans jsdom
    [...$('listeMorceaux').querySelectorAll('.liste-ligne')].find((x) => /Répét/.test(x.textContent)).querySelector('.btn.primaire').click();
    let d = $('detailMorceau');
    verifie('lancer : 1er morceau, bandeau « 1 / 3 » + suivant annoncé, plein écran',
            /Répét — 1 \/ 3/.test(d.textContent) && d.textContent.indexOf('ensuite : ' + t[2]) !== -1 && !!d.querySelector('.partition.plein-ecran'));
    await attendre(450);                // lecture auto d'un morceau de liste : +400 ms
    verifie('lecture auto du 1er morceau, noté pour la révision', !!(w.Store.joues()[ids[0]] && w.Store.joues()[ids[0]].n >= 1));
    verifie('tempo commun : 80 % du tempo du morceau', d.textContent.indexOf('♩ = ' + Math.round(w.Morceaux.get(ids[0]).tempo * 0.8)) !== -1);
    d.querySelector('[aria-label="Morceau suivant"]').click();
    d = $('detailMorceau');
    verifie('⏭ : passe au morceau 2 / 3', /Répét — 2 \/ 3/.test(d.textContent) && d.querySelector('h2').textContent === t[2]);
    d.querySelector('[aria-label="Morceau précédent"]').click();
    verifie('⏮ : revient au morceau 1 / 3', /Répét — 1 \/ 3/.test($('detailMorceau').textContent));
    $('detailMorceau').querySelector('[aria-label="Morceau suivant"]').click();
    $('detailMorceau').querySelector('[aria-label="Morceau suivant"]').click();
    $('detailMorceau').querySelector('[aria-label="Morceau suivant"]').click();
    verifie('fin de liste : « terminée » affiché', /Liste « Répét » terminée/.test($('detailMorceau').textContent));
    w.AppGuitare.ouvrirMorceau(ids[0]);
    verifie('ouvrir un morceau hors liste : plus de bandeau', !$('detailMorceau').querySelector('.bandeau-liste'));
  }

  console.log('\n— Pouce seul (v1.25) —');
  w.AppGuitare.aller('morceaux');
  {
    const titres = [...$('listeMorceaux').querySelectorAll('h3')].map((x) => x.textContent);
    const iP = titres.indexOf('👍 Pouce seul');
    verifie('Morceaux : section « 👍 Pouce seul » juste après les accords', iP > 0 && /accords/.test(titres[iP - 1]), titres.join(' | '));
    verifie('section pouce : rythme, gamme, mélodies et chansons listés', ['Le pouce en rythme', 'Gamme de Sol dans les basses', 'Au clair de la lune au pouce', 'Santiano au pouce']
      .every((t) => $('listeMorceaux').textContent.indexOf(t) !== -1));
    w.AppGuitare.ouvrirMorceau('pouce-g-c-d');
    verifie('fiche : main droite « pom-tcha » au pouce', /pom-tcha/i.test($('detailMorceau').textContent));
  }

  console.log('\n— Programme progressif et ♥ (v1.22) —');
  {
    ['suivi', 'seance', 'aimes'].forEach((k) => w.localStorage.removeItem('guitare:' + k));
    w.AppGuitare.aller('accueil');
    verifie('accueil : bouton « Programme du jour »', /Programme du jour : 0 \/ \d · palier 1/.test($('carteReprendre').textContent));
    w.AppGuitare.aller('programme');
    const pg = $('pageProgramme');
    verifie('programme : séance du jour au palier 1', /Séance du jour/.test(pg.textContent) && /Palier 1 — Premiers pas/.test(pg.textContent));
    verifie('programme : échauffement puis morceaux nouveaux, 3 passages 60 → 80 → 100 %',
            /Échauffement/.test(pg.textContent) && /Nouveau/.test(pg.textContent) && /60 → 80 → 100 %/.test(pg.textContent));
    verifie('programme : 7 paliers, seul le premier ouvert', pg.querySelectorAll('details.palier').length === 7 &&
            pg.querySelectorAll('details.palier.ferme').length === 6);

    // ♥ depuis la fiche d'un morceau.
    w.AppGuitare.ouvrirMorceau('ch-linger');
    const bAime = $('detailMorceau').querySelector('.ressenti .aime');
    verifie('fiche morceau : bouton « ♡ J’aime »', !!bAime && /♡ J’aime/.test(bAime.textContent));
    bAime.click();
    verifie('♥ enregistré et bouton allumé', w.Store.aime('ch-linger') && /♥ J’aime/.test($('detailMorceau').querySelector('.ressenti .aime').textContent));
    w.AppGuitare.aller('morceaux');
    verifie('liste Morceaux : rubrique « ♥ Mes favoris »', /♥ Mes favoris/.test($('listeMorceaux').textContent) && /♥ Linger/.test($('listeMorceaux').textContent));
    w.AppGuitare.aller('programme');
    verifie('programme : le favori du palier 2 proposé en défi lent', /Défi ♥/.test(pg.textContent) && /50 → 60 → 70 %/.test(pg.textContent));
    verifie('programme : chemin vers le favori affiché', /♥ Linger/.test(pg.textContent) && /encore 4 morceau\(x\) à acquérir/.test(pg.textContent));

    // Ressenti → boîte de Leitner.
    w.AppGuitare.ouvrirMorceau('chromatique');
    [...$('detailMorceau').querySelectorAll('.ressenti .btn')].find((b) => /Facile/.test(b.textContent)).click();
    verifie('« Facile » : boîte 2, revu dans 2 jours', w.Store.suivi().chromatique.b === 2 && /à revoir dans 2 j/.test($('detailMorceau').querySelector('.ressenti').textContent));
    [...$('detailMorceau').querySelectorAll('.ressenti .btn')].find((b) => /Dur/.test(b.textContent)).click();
    verifie('« Dur » : retour en boîte 1, revu demain', w.Store.suivi().chromatique.b === 1);

    // Séance enchaînée : passages au tempo croissant, ressenti à la fin du morceau.
    let rappel = null;
    w.Tablature.jouer = (n, o) => { rappel = o; };
    w.AppGuitare.aller('programme');
    const item = w.Store.seanceProgramme().items.find((it) => !w.Store.suivi()[it.id]);
    [...pg.querySelectorAll('.liste-ligne')].find((x) => x.textContent.indexOf(w.Morceaux.get(item.id).titre) !== -1).querySelector('.btn').click();
    let d = $('detailMorceau');
    verifie('séance : passage 1/3 à 60 %, tempo réduit', /passage 1\/3 à 60 %/.test(d.textContent) &&
            d.textContent.indexOf('♩ = ' + Math.max(20, Math.round(w.Morceaux.get(item.id).tempo * 0.6))) !== -1);
    d.querySelector('[aria-label="Morceau suivant"]').click();
    verifie('séance : ⏭ → passage 2/3 à 80 %', /passage 2\/3 à 80 %/.test($('detailMorceau').textContent));
    $('detailMorceau').querySelector('[aria-label="Morceau suivant"]').click();
    await attendre(450);
    if (rappel && rappel.surFin) rappel.surFin();
    d = $('detailMorceau');
    verifie('séance : à la fin du dernier passage, « Comment s’est passé » ?', /Comment s’est passé/.test(d.textContent), d.querySelector('.suite-liste') && d.querySelector('.suite-liste').textContent);
    const bOk = [...d.querySelectorAll('.suite-liste .btn')].find((b) => /Ça va/.test(b.textContent));
    if (bOk) bOk.click();
    verifie('séance : « Ça va » noté, morceau marqué fait', w.Store.suivi()[item.id] && w.Store.suivi()[item.id].b === 1 &&
            /terminée/.test($('detailMorceau').textContent));
    w.AppGuitare.ouvrirMorceau('chromatique');
  }

  console.log('\n— Chansons (v1.18) —');
  w.AppGuitare.aller('morceaux');
  verifie('listes « grands classiques » et « hits récents » affichées',
          /grands classiques/.test($('listeMorceaux').textContent) && /Hits récents/.test($('listeMorceaux').textContent) &&
          /Mistral gagnant/.test($('listeMorceaux').textContent) && /Popcorn salé/.test($('listeMorceaux').textContent));
  w.AppGuitare.ouvrirMorceau('ch-mistral-gagnant');
  verifie('chanson : noms des accords au-dessus de la tablature', [...$('detailMorceau').querySelectorAll('.tab-accord')].slice(0, 4).map((t) => t.textContent).join(' ') === 'Am Dm G C');
  verifie('panneau « suivant » caché hors enchaînement (cadre vide v1.17)', fs.readFileSync(path.join(RACINE, 'styles.css'), 'utf8').includes('.suite-liste[hidden]'));
  verifie('chanson : capodastre réglé d’office sur la case du disque (3)', /Capodastre\s*−\s*case 3/.test($('detailMorceau').textContent));

  console.log('\n— Écran allumé —');
  {
    const demandes = [], relaches = [];
    Object.defineProperty(w.navigator, 'wakeLock', { configurable: true, value: { request: (t) => {
      demandes.push(t);
      return Promise.resolve({ release() { relaches.push(1); }, addEventListener() {} });
    } } });
    w.Store.reglage('ecranAllume', true);
    w.EcranAllume.appliquer();
    await attendre(5);
    verifie('navigateur : verrou d’écran demandé (Screen Wake Lock)', demandes.join() === 'screen' && w.EcranAllume.actif());
    w.AppGuitare.aller('reglages');
    verifie('réglage « Écran allumé » affiché sur Oui', $('regEcran').value === 'oui');
    $('regEcran').value = 'non'; $('regEcran').dispatchEvent(new w.Event('change'));
    verifie('réglage sur Non : verrou relâché, mémorisé', relaches.length === 1 && !w.EcranAllume.actif() && w.Store.reglages().ecranAllume === false);
    $('regEcran').value = 'oui'; $('regEcran').dispatchEvent(new w.Event('change'));
    await attendre(5);
    verifie('réglage sur Oui : verrou redemandé', demandes.length === 2 && w.EcranAllume.actif());
    // APK : le plugin natif est préféré au verrou web.
    const appels = [];
    w.Capacitor = { isNativePlatform: () => true, Plugins: { KeepAwake: {
      keepAwake: () => { appels.push('allume'); return Promise.resolve(); },
      allowSleep: () => { appels.push('veille'); return Promise.resolve(); } } } };
    w.Store.reglage('ecranAllume', false); w.EcranAllume.appliquer();
    w.Store.reglage('ecranAllume', true); w.EcranAllume.appliquer();
    verifie('APK : plugin natif KeepAwake appelé (veille, puis allumé)', appels.join() === 'veille,allume' && demandes.length === 2);
    delete w.Capacitor;
  }

  w.AppGuitare.aller('morceaux');
  {
    const titres = [...$('listeMorceaux').querySelectorAll('h3')].map((x) => x.textContent);
    // Après le bloc « Enchaîner / révision du jour », avant les niveaux.
    const iAcc = titres.findIndex((t) => /Travailler les accords/.test(t)), iNiv = titres.findIndex((t) => /^Niveau/.test(t));
    verifie('liste : « Travailler les accords » avant les niveaux', iAcc !== -1 && iAcc < iNiv, titres.slice(0, 5).join(' | '));
  }
  w.AppGuitare.ouvrirMorceau('acc-em-am');
  verifie('exercice d’accords : position des mains (Em, Am) et pas à pas par paliers',
          $('detailMorceau').querySelectorAll('.main-accord').length === 2 && /Palier 1 : balayé au pouce/.test($('detailMorceau').textContent));
  w.AppGuitare.ouvrirAccord('Am');
  verifie('fiche d’accord : les exercices qui l’utilisent', /S’entraîner avec cet accord/.test($('detailAccord').textContent) && /Mi mineur ↔ La mineur/.test($('detailAccord').textContent));

  console.log('\n— Entraînement —');
  w.AppGuitare.aller('entrainement');
  {
    const page = $('pageEntrainement');
    const txt = page.textContent;
    verifie('écran : les exercices du cours, par thème', /Balayages/.test(txt) && /saute-mouton/.test(txt) && /Pouce buté : 4 fois/.test(txt) && /Ve position : 0 1 0 1/.test(txt) && /Partir de la pince/.test(txt));
    verifie('états : NOUVEAU, à continuer, pas encore vu en cours', /NOUVEAU/.test(txt) && /à continuer/.test(txt) && /pas encore vu en cours/.test(txt));
    const total = w.Entrainement.tous().reduce((t, e) => t + w.Entrainement.cases(e), 0);
    verifie('compteur du jour à zéro', new RegExp('Aujourd’hui : 0 / ' + total).test(txt));
    const carte = [...page.querySelectorAll('.exercice')].find((c) => /saute-mouton/.test(c.textContent));
    verifie('saute-mouton : deux variantes (en regardant, yeux fermés)', carte.querySelectorAll('input[type=checkbox]').length === 2 && /yeux fermés/.test(carte.textContent));
    carte.querySelector('input').click();
    verifie('case cochée : compteur à 1 et mémorisée pour aujourd’hui',
            new RegExp('Aujourd’hui : 1 / ' + total).test($('pageEntrainement').textContent) && w.Store.entrainementJour()['saute-mouton'].join() === '0');
    const quiz = [...$('pageEntrainement').querySelectorAll('.exercice')].find((c) => /Les noms par cœur/.test(c.textContent));
    [...quiz.querySelectorAll('button')].find((b) => /Interroge-moi/.test(b.textContent)).click();
    [...quiz.querySelectorAll('button')].find((b) => /Réponse/.test(b.textContent)).click();
    verifie('quiz des noms d’accords : question puis réponse', /(Em|Cmaj7|G|D) = \?/.test(quiz.textContent) && /(Mi mineur|Do majeur 7|Sol majeur|Ré majeur)/.test(quiz.querySelector('.quiz-reponse').textContent));
    const ta = $('pageEntrainement').querySelector('textarea');
    ta.value = 'Mardi : retour du pouce'; ta.dispatchEvent(new w.Event('input'));
    verifie('notes de cours mémorisées', w.Store.notesCours() === 'Mardi : retour du pouce');
    const b = [...$('pageEntrainement').querySelectorAll('button')].find((x) => /Tablature : Ve position : 0 3 0 3/.test(x.textContent));
    b.click();
    verifie('bouton tablature : ouvre l’exercice en Ve position', /Ve position : 0 3 0 3/.test($('detailMorceau').querySelector('h2').textContent));
    w.Store.cocherEntrainement('saute-mouton', 0, false);
    w.AppGuitare.aller('accueil');
    verifie('accueil : rappel « Entraînement du jour »', /Entraînement du jour : 0 \//.test($('carteReprendre').textContent));
  }

  w.AppGuitare.ouvrirMorceau('carulli-andantino');
  {
    const leg = $('detailMorceau').querySelector('.partition .legende-doigts');
    verifie('légende p i m a au-dessus de la tablature (aussi en plein écran)', leg && /p.*pouce.*i.*index.*m.*majeur.*a.*annulaire/.test(leg.textContent) && /pincent en même temps/.test(leg.textContent));
    const lettres = [...$('detailMorceau').querySelectorAll('.tab-main')].map((x) => x.textContent);
    verifie('accord pouce + majeur : une étiquette « pm », plus de lettres superposées',
            lettres.includes('pm') && lettres.every((l) => /^[pima]+$/.test(l) && new Set(l).size === l.length));
  }

  console.log('\n— Pincement sur la partition —');
  w.Store.reglage('vuePartition', 'tablature');
  w.Store.reglage('zoomPartition', 1);
  w.AppGuitare.ouvrirMorceau('mary-agneau');
  {
    const zone = $('detailMorceau').querySelector('.partition svg.tab').closest('.partition > div:not(.pe-barre)') ||
                 $('detailMorceau').querySelector('.partition svg.tab').parentNode.parentNode;
    const toucher = (type, d) => {
      const ev = new w.Event(type, { bubbles: true, cancelable: true });
      const t = d == null ? [] : [{ clientX: 100 - d, clientY: 50 }, { clientX: 100 + d, clientY: 50 }];
      Object.defineProperty(ev, 'touches', { value: t });
      zone.dispatchEvent(ev);
    };
    toucher('touchstart', 40); toucher('touchmove', 60); toucher('touchmove', 80); toucher('touchend', null);
    verifie('pincement à deux doigts : écarter les doigts zoome (×2 → 200 %), mémorisé',
            w.Store.reglages().zoomPartition === 2, w.Store.reglages().zoomPartition);
    w.Store.reglage('zoomPartition', null);
  }

  console.log('\n— Bouton retour —');
  {
    const actif = () => [...w.document.querySelectorAll('.ecran.actif')].map((e) => e.id.replace('ecran-', '')).join();
    w.AppGuitare.aller('accueil', { retour: true });
    while (w.AppGuitare.retour()) { /* vide la pile */ }
    w.AppGuitare.aller('morceaux');
    w.AppGuitare.ouvrirMorceau('mary-agneau');
    w.AppGuitare.aller('metronome');
    verifie('retour : métronome → morceau', w.AppGuitare.retour() && actif() === 'morceau');
    verifie('retour : morceau → liste des morceaux', w.AppGuitare.retour() && actif() === 'morceaux');
    verifie('retour : liste → accueil', w.AppGuitare.retour() && actif() === 'accueil');
    verifie('retour à l’accueil : rien à défaire (l’APK demande alors de rappuyer pour quitter)', w.AppGuitare.retour() === false);
    w.AppGuitare.ouvrirMorceau('ode-joie');
    [...$('detailMorceau').querySelectorAll('.partition-barre button')].find((b) => /Plein écran/.test(b.textContent)).click();
    verifie('plein écran ouvert', !!$('detailMorceau').querySelector('.partition.plein-ecran'));
    verifie('retour : ferme d’abord le plein écran, reste sur le morceau',
            w.AppGuitare.retour() && !$('detailMorceau').querySelector('.partition.plein-ecran') && actif() === 'morceau');
    w.AppGuitare.aller('accords');
    w.AppGuitare.ouvrirAccord('Am');
    [...w.document.querySelectorAll('#ecran-accord .retour')][0].click();
    verifie('bouton « ‹ Accords » : dépile (le retour suivant ne ramène pas sur la fiche Am)',
            actif() === 'accords' && w.AppGuitare.retour() && actif() !== 'accord');
    // pupitre → « ‹ Quitter » → morceau : le retour suivant ne ramène pas au pupitre
    w.AppGuitare.ouvrirMorceau('ode-joie');
    w.AppGuitare.aller('pupitre');
    w.AppGuitare.aller('morceau');
    verifie('pupitre puis retour au morceau : le bouton retour ne renvoie pas au pupitre', w.AppGuitare.retour() && actif() !== 'pupitre');
  }

  w.AppGuitare.aller('morceaux');
  verifie('liste : rubrique « Chansons internationales »', /Chansons internationales/.test($('listeMorceaux').textContent) && /Knockin’ on Heaven’s Door/.test($('listeMorceaux').textContent));

  console.log('\n— Oreille —');
  w.AppGuitare.aller('oreille');
  w.AppGuitare.demarrerOreille('cordes');
  verifie('question posée', /Question 1 sur 10/.test($('oreilleJeu').textContent));
  verifie('six choix pour les six cordes', $('oreilleJeu').querySelectorAll('.choix-oreille button').length === 6);
  $('oreilleJeu').querySelector('.choix-oreille button').click();
  verifie('une réponse donne un retour immédiat',
          /✓|✗/.test($('oreilleJeu').textContent), $('oreilleJeu').textContent.slice(-60));

  console.log('\n— Métronome —');
  w.AppGuitare.aller('metronome');
  verifie('4 points de mesure par défaut', $('metroPoints').children.length === 4);
  $('metroMesure').value = '3';
  $('metroMesure').onchange();
  verifie('changer la mesure change les points', $('metroPoints').children.length === 3);

  console.log('\n— Mode télévision —');
  w.Store.reglage('modeTv', true);
  w.Tv.appliquer();
  verifie('classe tv posée sur <html>', w.document.documentElement.classList.contains('tv'));
  w.Store.reglage('modeTv', false);
  w.Tv.appliquer();
  verifie('classe tv retirée', !w.document.documentElement.classList.contains('tv'));

  console.log('\n— Diffusion —');
  verifie('bouton Cast masqué sans identifiant', $('btnCast').hidden === true);
  w.Store.reglage('castAppId', 'ABCD1234');
  verifie('identifiant valide reconnu', w.Cast.configure() === true);
  w.Store.reglage('castAppId', 'oups');
  verifie('identifiant invalide refusé', w.Cast.configure() === false);

  console.log('\n— Mise à jour automatique —');
  {
    const fs2 = require('fs'), path2 = require('path');
    const lire = (f) => fs2.readFileSync(path2.join(__dirname, '..', 'www', f), 'utf8');
    const html = lire('index.html');
    const version = JSON.parse(lire('version.json')).version;
    verifie('le dépôt à interroger est déclaré', /UPDATE_REPO = 'laurentsar\/guitare'/.test(html));
    verifie('la version affichée est celle de version.json',
            html.indexOf("APP_VERSION = '" + version + "'") !== -1, version);
    verifie('le cache du service worker suit la version',
            lire('sw.js').indexOf('guitare-v' + version) !== -1);
    // Comparer les BALISES, pas le texte : les commentaires du fichier citent
    // update-check.js bien avant la balise, et le test se trompait de position.
    verifie('l’installateur d’APK est chargé avant la bannière',
            html.indexOf('<script src="apk-update.js">') < html.indexOf('<script src="update-check.js">'));
  }

  console.log('\n— Mise à jour comme Recettes (v1.24) —');
  {
    let reponse = { tag_name: 'v9.9', body: '- Nouvelles chansons\n- Programme amélioré', html_url: 'https://x/rel',
                    assets: [{ name: 'guitare-9.9.apk', browser_download_url: 'https://x/guitare-9.9.apk' }] };
    const appels = [];
    w.fetch = (url) => { appels.push(url); return Promise.resolve({ ok: true, json: () => Promise.resolve(reponse) }); };
    w.localStorage.setItem('updPoll:laurentsar/guitare', String(Date.now()));   // pas de vérif auto au chargement
    w.UPDATE_REPO = 'laurentsar/guitare';
    charge('update-check.js');
    verifie('checkAppUpdate exposé pour le bouton des réglages', typeof w.checkAppUpdate === 'function');
    w.AppGuitare.aller('reglages');
    verifie('réglages : version installée affichée', $('majVersion').textContent === 'v1.0');
    $('btnVerifierMaj').click();
    await attendre(30);
    const ban = w.document.getElementById('update-banner');
    verifie('nouvelle release : bandeau avec version et nouveautés', !!ban && /Version 9\.9 prête/.test(ban.textContent) &&
            ban.querySelectorAll('.ub-notes li').length === 2 && /Nouvelles chansons/.test(ban.textContent));
    verifie('navigateur : « Mettre à jour » (recharge) plutôt qu’un APK', /Mettre à jour en v9\.9/.test(ban.querySelector('.ub-act').textContent));
    verifie('réglages : compte rendu « disponible »', /v9\.9 disponible/.test($('majEtat').textContent));
    verifie('API GitHub interrogée sur le bon dépôt', /api\.github\.com\/repos\/laurentsar\/guitare\/releases\/latest/.test(appels[0]));
    ban.querySelector('.ub-skip').click();
    verifie('« Plus tard » : bandeau fermé, version mémorisée', !w.document.getElementById('update-banner') &&
            w.localStorage.getItem('updDismiss:laurentsar/guitare') === '9.9');
    reponse = { tag_name: 'v1.0', assets: [] };
    $('btnVerifierMaj').click();
    await attendre(30);
    verifie('à jour : « Déjà à jour »', /Déjà à jour/.test($('majEtat').textContent));
    // API indisponible (quota) : repli sur le flux Atom.
    w.fetch = (url) => /api\.github/.test(url) ? Promise.resolve({ ok: false })
      : Promise.resolve({ ok: true, text: () => Promise.resolve('<feed xmlns="http://www.w3.org/2005/Atom"><entry><title>Ma Guitare v9.8</title><link rel="alternate" href="https://github.com/laurentsar/guitare/releases/tag/v9.8"/><content>Corrections</content></entry></feed>') });
    const r = await w.checkAppUpdate(true);
    verifie('repli Atom quand l’API refuse', r && r.latest === '9.8' && r.newer);
    const b2 = w.document.getElementById('update-banner');
    if (b2) b2.remove();
  }

  console.log('\n— Erreurs JS pendant le test —');
  verifie('aucune erreur', erreurs.length === 0, erreurs.join(' | '));

  console.log(`\n=== ${ok} réussis, ${ko} échoués ===`);
  process.exit(ko ? 1 : 0);
})();
