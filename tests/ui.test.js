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
['theorie.js', 'audio.js', 'accords.js', 'illustrations.js', 'tablature.js', 'portee.js', 'manche.js', 'gammes.js', 'apk-update.js', 'repertoire.js', 'chansons.js', 'morceaux.js', 'entrainement.js', 'ecoute.js', 'programme.js', 'lecons.js',
 'oreille.js', 'store.js', 'ecran.js', 'dpad-nav.js', 'tv.js', 'cast.js', 'vr.js', 'app.js'].forEach(charge);

const $ = (id) => w.document.getElementById(id);
// Les exercices d'entraînement s'ouvrent depuis leur écran, pas depuis la liste.
const listables = () => w.Morceaux.tous().filter((p) => p.categorie !== 'entrainement' && !p.versionDe).length;
// Knockin' et House of the Rising Sun figurent aussi dans le Top 20 : deux lignes chacun.
const DOUBLONS_TOP = 2;
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
  ['parcours', 'accords', 'metronome', 'morceaux', 'oreille', 'gammes', 'reglages', 'accueil'].forEach((nom) => {
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
  verifie('plus d’accordeur : ni écran, ni onglet, ni raccourci', !$('ecran-accordeur') && !w.document.querySelector('[data-aller="accordeur"]'));
  w.AppGuitare.ouvrirLecon('accorder');
  const ref = [...$('detailLecon').querySelectorAll('button')].find((b) => /Jouer les six cordes/.test(b.textContent));
  verifie('leçon « Accorder à l’oreille » : cordes de référence (six boutons + les six à la suite)', !!ref && $('detailLecon').querySelectorAll('.cordes-etat button').length === 6);
  ref.click();

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
          $('listeMorceaux').querySelectorAll('.ligne-morceau').length === listables() + DOUBLONS_TOP);
  w.AppGuitare.ouvrirMorceau('ch-hey-jude');
  {
    const d = $('detailMorceau');
    const ecouter = [...d.querySelectorAll('button')].find((b) => /▶ Écouter/.test(b.textContent));
    const desc = [...d.querySelectorAll(':scope > p')].find((x) => /Grille d’accords de la chanson/.test(x.textContent));
    verifie('« ▶ Écouter » en haut de la fiche, avant la description et la tablature', ecouter && desc &&
            (ecouter.compareDocumentPosition(desc) & w.Node.DOCUMENT_POSITION_FOLLOWING) && (ecouter.compareDocumentPosition(d.querySelector('.tab-ligne')) & w.Node.DOCUMENT_POSITION_FOLLOWING));
  }
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
          $('listeMorceaux').querySelectorAll('.ligne-morceau').length === listables() + DOUBLONS_TOP + 1);

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
    verifie('pas à pas : « Partie 1 — mesures 1 à 4 » règle la section et 60 %', /Partie 1 — mesures 1 à 4/.test(etapes[3].textContent) && /Jusqu’à la mesure\s*−\s*4 \/ 8/.test(txt) && /♩ = 48/.test(txt), txt.match(/♩ = \d+/));
    w.Tablature.arreter();
    // Répétitions comptées : 3 tours, puis « Étape réussie, la suivante ».
    {
      let fin = null; const jouerAvant = w.Tablature.jouer;
      w.Tablature.jouer = (pp, o) => { fin = o.surFin; };
      bloc.querySelectorAll('.etape')[3].querySelector('button').click();
      const cpt = () => $('detailMorceau').querySelector('.compteur-tours');
      verifie('répétitions : « Tour 1 / 3 · mesures 1 à 4 · 60 % »', cpt() && !cpt().hidden && /Tour 1 \/ 3 · mesures 1 à 4 · 60 %/.test(cpt().textContent), cpt() && cpt().textContent);
      fin(); fin();
      verifie('répétitions : le tour avance à chaque boucle (tour 3 / 3)', /Tour 3 \/ 3/.test(cpt().textContent) && !/Étape réussie/.test(cpt().textContent), cpt().textContent);
      fin();
      verifie('répétitions : au 3e tour, proposition de valider l’étape', /✓ Tour 3 \/ 3 fait/.test(cpt().textContent) && /Étape réussie, la suivante/.test(cpt().textContent), cpt().textContent);
      [...cpt().querySelectorAll('button')].find((x) => /Étape réussie/.test(x.textContent)).click();
      verifie('étape validée depuis le compteur : cochée dans le pas à pas, compteur caché', w.Store.etapesFaites('mary-agneau').indexOf(3) !== -1 && cpt().hidden &&
              $('detailMorceau').querySelectorAll('.etapes-morceau .etape')[3].classList.contains('faite'));
      w.Store.marquerEtape('mary-agneau', 3, false);
      w.Tablature.jouer = jouerAvant; w.Tablature.arreter();
    }
    bloc.querySelectorAll('.etape')[0].querySelector('input').click();
    verifie('pas à pas : étape cochée, mémorisée, la suivante mise en avant',
            /1 \/ 8/.test(bloc.querySelector('summary').textContent) && w.Store.etapesFaites('mary-agneau').join() === '0' &&
            bloc.querySelectorAll('.etape')[1].classList.contains('prochaine'));
    w.Store.marquerEtape('mary-agneau', 0, false);
  }

  // « 🎯 Apprendre » : directement les parties, enchaînées seules après 3 tours.
  {
    ['carulli-andantino'].forEach((id) => (w.Store.etapesFaites(id).forEach((k) => w.Store.marquerEtape(id, k, false))));
    let fin = null, de = null; const jouerAvant = w.Tablature.jouer;
    w.Tablature.jouer = (pp, o) => { fin = o.surFin; de = o.de; };
    w.AppGuitare.ouvrirMorceau('carulli-andantino');
    const bA = [...$('detailMorceau').querySelectorAll('.actions button')].find((x) => /🎯 Apprendre/.test(x.textContent));
    verifie('« 🎯 Apprendre » à côté de « Écouter »', !!bA);
    bA.click();
    const cpt = () => $('detailMorceau').querySelector('.compteur-tours').textContent;
    const choix = (re) => [...$('detailMorceau').querySelectorAll('.compteur-tours button')].find((x) => re.test(x.textContent)).click();
    verifie('Apprendre : choix automatique ou manuel, rien ne joue encore', /⚡ Automatique/.test(cpt()) && /✋ Manuel/.test(cpt()) && fin === null, cpt());
    const part = () => $('detailMorceau').querySelector('.partition');
    const ct = () => $('detailMorceau').querySelector('.compteur-tours');
    verifie('Apprendre : en plein écran, le choix fixé sous la barre du plein écran', part().classList.contains('plein-ecran') && part().contains(ct()) && ct().classList.contains('en-pe'));
    choix(/Automatique/);
    {
      const z = $('detailMorceau').querySelector('.partition').querySelectorAll('svg.tab, .systeme');
      const visibles = [...z].filter((l) => !l.hidden && !l.closest('[hidden]'));
      // Les lignes visibles sont les premières, et couvrent juste les mesures 1 à 4.
      const k = visibles.length, rangs = visibles.map((l) => [...z].indexOf(l));
      verifie('Apprendre : seules les lignes de la partie 1 (mesures 1 à 4) restent affichées', k >= 1 && k <= 4 && k < z.length && rangs.every((r, i) => r === i),
              k + ' lignes visibles sur ' + z.length);
    }
    verifie('Apprendre : démarre tout de suite sur la partie 1, une seule ligne (1 / 7 · partie 1 · tour 1 / 3)', /🎯 1 \/ 7 · Partie 1 · mesures 1 à 4 · tour 1 \/ 3/.test(cpt()) && de === 0, cpt());
    fin(); fin(); fin();
    verifie('après 3 tours : partie 1 cochée, la partie 2 démarre seule', /🎯 2 \/ 7 · Partie 2 · mesures 5 à 8 · tour 1 \/ 3/.test(cpt()) && de === 4 * w.Tablature.noiresParMesure(w.Morceaux.get('carulli-andantino')) &&
            w.Store.etapesFaites('carulli-andantino').length === 1, cpt());
    fin(); fin(); fin();
    verifie('puis l’enchaînement 1 + 2 (mesures 1 à 8, 70 %)', /🎯 3 \/ 7 · Enchaîne.* · mesures 1 à 8 · tour 1 \/ 3/.test(cpt()) && /♩ = /.test($('detailMorceau').textContent), cpt());
    [...$('detailMorceau').querySelectorAll('.compteur-tours button')].find((x) => /Suivante/.test(x.textContent)).click();
    verifie('« ⏭ Suivante » : passe sans cocher', /🎯 4 \/ 7/.test(cpt()) && w.Store.etapesFaites('carulli-andantino').length === 2, cpt());
    verifie('en plein écran, la ligne d’apprentissage suit (tour, Encore, Suivante)', part().contains(ct()) && /🎯 4 \/ 7/.test(ct().textContent));
    part().querySelector('[aria-label="Quitter le plein écran"]').click();
    verifie('plein écran fermé : la ligne d’apprentissage revient sur la page', !part().classList.contains('plein-ecran') && !part().contains(ct()) && !ct().classList.contains('en-pe') && /🎯 4 \/ 7/.test(ct().textContent));
    bA.click();
    verifie('« ■ Arrêter d’apprendre » : le parcours s’arrête', $('detailMorceau').querySelector('.compteur-tours').hidden && /🎯 Apprendre/.test(bA.textContent));
    verifie('arrêt : toutes les lignes réapparaissent', [...$('detailMorceau').querySelector('.partition').querySelectorAll('svg.tab, .systeme')].every((l) => !l.hidden));
    part().querySelector('[aria-label="Apprendre par parties"]').click();
    verifie('le bouton 🎯 de la barre du plein écran propose aussi le choix', part().classList.contains('plein-ecran') && /⚡ Automatique/.test(cpt()), cpt());
    choix(/Automatique/);
    verifie('relancer : reprend à la première étape pas faite (l’enchaînement 1 + 2)', /🎯 3 \/ 7/.test(cpt()), cpt());
    for (let i = 0; i < 5 * 3; i++) fin();
    verifie('toutes les étapes faites : « Toutes les parties sont apprises », proposition de monter en vitesse', /Toutes les parties sont apprises/.test(cpt()) &&
            [...$('detailMorceau').querySelectorAll('.compteur-tours button')].some((x) => /Monter en vitesse/.test(x.textContent)), cpt());
    w.Store.etapesFaites('carulli-andantino').forEach((k) => w.Store.marquerEtape('carulli-andantino', k, false));
    // Manuel : la boucle continue au-delà de 3 tours ; c'est l'élève qui passe.
    w.AppGuitare.ouvrirMorceau('carulli-andantino');
    const bA2 = [...$('detailMorceau').querySelectorAll('.actions button')].find((x) => /🎯 Apprendre/.test(x.textContent));
    bA2.click(); choix(/Manuel/);
    verifie('manuel : partie 1, objectif 3, « Précédente » grisée', /🎯 1 \/ 7 · Partie 1 · mesures 1 à 4 · tour 1 · objectif 3/.test(cpt()) &&
            [...$('detailMorceau').querySelectorAll('.compteur-tours button')].find((x) => /Précédente/.test(x.textContent)).disabled, cpt());
    fin(); fin(); fin(); fin();
    verifie('manuel : après 4 tours, toujours la partie 1 (tour 5, objectif atteint), rien n’est coché tout seul', /🎯 1 \/ 7 · Partie 1 · .*tour 5 · ✓ objectif atteint/.test(cpt()) &&
            w.Store.etapesFaites('carulli-andantino').length === 0, cpt());
    choix(/Réussie, la suivante/);
    verifie('manuel : « Réussie, la suivante » coche et lance la partie 2', /🎯 2 \/ 7 · Partie 2/.test(cpt()) && w.Store.etapesFaites('carulli-andantino').length === 1, cpt());
    choix(/Précédente/);
    verifie('manuel : « Précédente » revient à la partie 1', /🎯 1 \/ 7 · Partie 1/.test(cpt()), cpt());
    choix(/Passer/);
    verifie('manuel : « Passer » va à la partie 2 sans cocher de plus', /🎯 2 \/ 7/.test(cpt()) && w.Store.etapesFaites('carulli-andantino').length === 1, cpt());
    w.Store.etapesFaites('carulli-andantino').forEach((k) => w.Store.marquerEtape('carulli-andantino', k, false));
    w.Tablature.jouer = jouerAvant; w.Tablature.arreter();
  }

  // « 🎯 Apprendre » au micro, sans tempo : rien ne joue, le micro écoute la partie.
  {
    w.Store.etapesFaites('mary-agneau').forEach((k) => w.Store.marquerEtape('mary-agneau', k, false));
    let joue = 0; const jouerAvant = w.Tablature.jouer; w.Tablature.jouer = () => { joue++; };
    const vrai = w.Ecoute.demarrer, vraiArret = w.Ecoute.arreter, vraiEnMarche = w.Ecoute.enMarche;
    let entendre = null, ouvert = false;
    w.Ecoute.demarrer = (surNote) => { entendre = surNote; ouvert = true; return Promise.resolve(true); };
    w.Ecoute.arreter = () => { ouvert = false; }; w.Ecoute.enMarche = () => ouvert;
    w.AppGuitare.ouvrirMorceau('mary-agneau');
    [...$('detailMorceau').querySelectorAll('.actions button')].find((x) => /🎯 Apprendre/.test(x.textContent)).click();
    const ct = () => $('detailMorceau').querySelector('.compteur-tours');
    const bMic = [...ct().querySelectorAll('button')].find((x) => /Au micro, sans tempo/.test(x.textContent));
    verifie('Apprendre : 3e choix « 🎤 Au micro, sans tempo »', !!bMic);
    bMic.click();
    verifie('au micro : rien ne joue, le micro écoute la partie 1, la note à jouer annoncée', joue === 0 && ouvert && /🎤 🎯 1 \/ 3 · Partie 1 · mesures 1 à 4 · tour 1 \/ 3/.test(ct().textContent) && /Joue : /.test(ct().textContent), ct().textContent);
    const mary = w.Morceaux.get('mary-agneau'), pm = w.Tablature.noiresParMesure(mary);
    const partie1 = [...new Set(mary.notes.filter((n) => n.temps < 4 * pm).map((n) => n.temps))].map((t) => mary.notes.find((n) => n.temps === t).midi);
    partie1.forEach((m) => entendre(m));
    verifie('au micro : partie jouée sans faute → tour compté (tour 2 / 3)', /tour 2 \/ 3/.test(ct().textContent) && /sans faute : tour compté/.test(ct().textContent), ct().textContent);
    entendre(partie1[0] + 1); entendre(partie1[0]); entendre(partie1[1] + 1); partie1.slice(1).forEach((m) => entendre(m));
    verifie('au micro : deux fautes → le tour ne compte pas, on recommence', /tour 2 \/ 3/.test(ct().textContent) && /2 fautes : ce tour ne compte pas/.test(ct().textContent), ct().textContent);
    partie1.forEach((m) => entendre(m)); partie1.forEach((m) => entendre(m));
    verifie('au micro : 3 tours comptés → partie 1 cochée, la partie 2 écoutée', /🎯 2 \/ 3 · Partie 2 · mesures 5 à 8 · tour 1 \/ 3/.test(ct().textContent) &&
            w.Store.etapesFaites('mary-agneau').length === 1 && ouvert && joue === 0, ct().textContent);
    [...$('detailMorceau').querySelectorAll('.actions button')].find((x) => /Arrêter d’apprendre/.test(x.textContent)).click();
    verifie('arrêter : le micro se ferme', !ouvert);
    w.Store.etapesFaites('mary-agneau').forEach((k) => w.Store.marquerEtape('mary-agneau', k, false));
    w.Ecoute.demarrer = vrai; w.Ecoute.arreter = vraiArret; w.Ecoute.enMarche = vraiEnMarche;
    w.Tablature.jouer = jouerAvant;
    const part = $('detailMorceau').querySelector('.partition');
    if (part.classList.contains('plein-ecran')) part.querySelector('[aria-label="Quitter le plein écran"]').click();
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
    verifie('aides éteintes par défaut : ni mains, ni guide, ni légende ; le pas à pas replié en un bandeau',
            !d.querySelector('.mains-morceau') && d.querySelector('.etapes-morceau') && !d.querySelector('.etapes-morceau').open && !d.querySelector('.guide-mains') &&
            ![...d.querySelectorAll('summary')].some((x) => /Comment lire/.test(x.textContent)));
    verifie('la tablature est dessinée en entier', d.querySelectorAll('.tab-note').length === w.Morceaux.get('zombie').notes.length);
    // Aides éteintes : les boutons du pas à pas font apparaître ce qu'ils montrent.
    w.AppGuitare.ouvrirMorceau('acc-am-e');
    let pa = $('detailMorceau').querySelector('.etapes-morceau');
    [...pa.querySelectorAll('.etape')].find((x) => /Apprends les 2 accords/.test(x.textContent)).querySelector('button').click();
    const mm = $('detailMorceau').querySelector('.mains-morceau');
    verifie('aides éteintes : « Voir les accords » du pas à pas affiche la position des mains (La m, Mi)', !!mm && mm.open && /Am/.test(mm.textContent) && /E/.test(mm.textContent));
    [...pa.querySelectorAll('.etape')].find((x) => /Passe d’un accord/.test(x.textContent)).querySelector('button').click();
    verifie('« Voir les passages » : le même bloc, sans doublon', $('detailMorceau').querySelectorAll('.mains-morceau').length === 1);
    w.AppGuitare.ouvrirMorceau('mary-agneau');
    pa = $('detailMorceau').querySelector('.etapes-morceau');
    [...pa.querySelectorAll('.etape')].find((x) => /Place chaque note/.test(x.textContent)).querySelector('button').click();
    verifie('aides éteintes : « Note par note » du pas à pas affiche le guide des mains', !!$('detailMorceau').querySelector('.guide-mains') && $('detailMorceau').querySelector('.guide-mains').isConnected);
    w.AppGuitare.ouvrirMorceau('zombie');
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
    // Assez de morceaux joués : la révision n'est faite que d'eux.
    const j2 = {}; ids.slice(10, 17).forEach((id, k) => { j2[id] = { n: 1, t: jadis + k * 1000 }; });
    w.localStorage.setItem('guitare:joues', JSON.stringify(j2));
    w.Store.sauverRevision(null);
    w.AppGuitare.aller('accueil'); w.AppGuitare.aller('morceaux');
    const rev2 = w.Store.revision();
    verifie('révision du jour : que des morceaux déjà joués quand il y en a assez', rev2 && rev2.ids.length === 5 && rev2.ids.every((id) => j2[id]), rev2 && rev2.ids.join(','));
    w.localStorage.setItem('guitare:joues', JSON.stringify(j));

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

  console.log('\n— Longues tablatures sur téléphone (v1.29) —');
  {
    w.AppGuitare.ouvrirMorceau('ch-knockin');
    const d = $('detailMorceau');
    const nums = [...d.querySelectorAll('.tab-num')].map((t) => +t.textContent);
    verifie('numéro de mesure en début de chaque ligne', nums.length > 4 && nums[0] === 1 && nums.every((n, i) => i === 0 || n > nums[i - 1]), nums.slice(0, 6).join(','));
    const rep = [...d.querySelectorAll('.reperes .btn')].map((b) => b.textContent);
    verifie('« Aller à » : un bouton par section de la chanson', rep.length === w.Morceaux.get('ch-knockin').sections.length, rep.join(' | '));
    w.AppGuitare.ouvrirMorceau('carulli-valse-1');
    const rep2 = [...$('detailMorceau').querySelectorAll('.reperes .btn')].map((b) => b.textContent);
    verifie('pièce sans sections : un repère toutes les 8 mesures', rep2[0] === 'Mes. 1' && (rep2.length < 2 || rep2[1] === 'Mes. 9'), rep2.join(' | '));
    w.AppGuitare.ouvrirMorceau('ch-knockin');
    const pg = $('detailMorceau').querySelector('.pages-partition');
    verifie('boutons « ⬆ » et « ⬇ Suite » pour une tablature sur plusieurs écrans', !!pg && /Suite/.test(pg.textContent) &&
            pg.querySelectorAll('[aria-label="Écran suivant de la tablature"], [aria-label="Écran précédent de la tablature"]').length === 2);
    verifie('« Suite » cliquable sans erreur', (() => { try { pg.querySelector('.btn.primaire').click(); return true; } catch (e) { return false; } })());
    const vue = w.Store.reglages().vuePartition;
    w.Store.reglage('vuePartition', null);
    const lw = w.innerWidth;
    Object.defineProperty(w, 'innerWidth', { value: 390, configurable: true });
    w.AppGuitare.ouvrirMorceau('ode-joie');
    verifie('téléphone, vue jamais choisie : tablature seule', $('detailMorceau').querySelectorAll('.portee-note').length === 0 &&
            $('detailMorceau').querySelectorAll('.tab-note').length > 0);
    Object.defineProperty(w, 'innerWidth', { value: lw, configurable: true });
    w.AppGuitare.ouvrirMorceau('ode-joie');
    verifie('grand écran : portée et tablature', $('detailMorceau').querySelectorAll('.portee-note').length > 0);
    w.Store.reglage('vuePartition', vue);
  }

  console.log('\n— Rubriques dépliantes (v1.29) —');
  {
    w.AppGuitare.aller('morceaux');
    const rub = [...$('listeMorceaux').querySelectorAll('details.rubrique-morceaux')];
    verifie('Morceaux : chaque rubrique est un menu dépliant', rub.length >= 10 && $('listeMorceaux').querySelectorAll('h3').length === rub.length, rub.length);
    verifie('rubriques fermées par défaut', rub.every((d) => !d.open));
    verifie('nombre de morceaux affiché dans le titre', rub.some((d) => /🎸 Travailler les accords/.test(d.textContent) && +d.querySelector('.rubrique-nb').textContent > 5));
    const acc = rub.find((d) => /Travailler les accords/.test(d.querySelector('summary').textContent));
    acc.open = true; acc.dispatchEvent(new w.Event('toggle'));
    w.AppGuitare.ouvrirMorceau('acc-em-am'); w.AppGuitare.aller('morceaux');
    const ouvertes = [...$('listeMorceaux').querySelectorAll('details.rubrique-morceaux')].filter((d) => d.open).map((d) => d.querySelector('h3').textContent);
    verifie('une rubrique ouverte le reste en revenant d’un morceau', ouvertes.length === 1 && /Travailler les accords/.test(ouvertes[0]), ouvertes.join(','));
    [...$('listeMorceaux').querySelectorAll('.rangement button')].find((b) => b.dataset.rangement === 'artiste').click();
    const titresA = [...$('listeMorceaux').querySelectorAll('details.rubrique-morceaux h3')].map((x) => x.textContent);
    verifie('rangement par artiste : une rubrique par artiste, triées', titresA.includes('🎤 Nirvana') && titresA.includes('🎤 F. Sor') && titresA.includes('🎤 Traditionnel') &&
            titresA.indexOf('🎤 Bob Marley') < titresA.indexOf('🎤 Nirvana'), titresA.slice(0, 8).join(' | '));
    const nirvana = [...$('listeMorceaux').querySelectorAll('details.rubrique-morceaux')].find((d) => d.querySelector('h3').textContent === '🎤 Nirvana');
    verifie('Nirvana : ses 5 chansons, sans version longue', nirvana && nirvana.querySelectorAll('.ligne-morceau').length === 5);
    const cran = [...$('listeMorceaux').querySelectorAll('details.rubrique-morceaux')].find((d) => d.querySelector('h3').textContent === '🎤 The Cranberries');
    verifie('« The » ignoré pour le tri, Zombie avec les Cranberries', cran && /Zombie/.test(cran.textContent) && titresA.indexOf('🎤 The Cranberries') < titresA.indexOf('🎤 Deep Purple'));
    verifie('« Leonard Cohen » rangé à L, pas à « onard »', titresA.indexOf('🎤 Leonard Cohen') > titresA.indexOf('🎤 L. van Beethoven') && titresA.indexOf('🎤 Leonard Cohen') < titresA.indexOf('🎤 Louane'));
    verifie('rangement par artiste : sans les versions simplifiées', !/version simplifiée/.test($('listeMorceaux').textContent));
    verifie('rangement mémorisé', w.Store.reglages().rangementMorceaux === 'artiste');
    [...$('listeMorceaux').querySelectorAll('.rangement button')].find((b) => b.dataset.rangement === 'difficulte').click();
    const titresD = [...$('listeMorceaux').querySelectorAll('details.rubrique-morceaux h3')].map((x) => x.textContent).filter((t) => /^📊/.test(t));
    verifie('rangement par difficulté : 6 niveaux, du plus simple au plus exigeant', titresD.length === 6 && /1 · Premiers sons/.test(titresD[0]) && /6 · Expert/.test(titresD[5]), titresD.join(' | '));
    verifie('rangement par difficulté : sans les versions simplifiées', !/version simplifiée/.test($('listeMorceaux').textContent));
    const n1 = [...$('listeMorceaux').querySelectorAll('details.rubrique-morceaux')].find((d) => /1 · Premiers sons/.test(d.querySelector('h3').textContent));
    verifie('niveau 1 : les cordes à vide au pouce', /Les basses au pouce/.test(n1.textContent) && !/Blackbird/.test(n1.textContent));
    w.AppGuitare.ouvrirMorceau('ch-blackbird');
    verifie('fiche : niveau de difficulté et ses raisons', /📊 Difficulté 6\/6 · Expert — .*barrés/.test($('detailMorceau').querySelector('.difficulte').textContent), $('detailMorceau').querySelector('.difficulte') && $('detailMorceau').querySelector('.difficulte').textContent);
    w.AppGuitare.aller('morceaux');
    [...$('listeMorceaux').querySelectorAll('.rangement button')].find((b) => b.dataset.rangement === 'rubrique').click();
    verifie('retour au rangement par rubrique', [...$('listeMorceaux').querySelectorAll('h3')].some((x) => /Travailler les accords/.test(x.textContent)));
    verifie('le bouton « Mon programme » reste visible hors des rubriques', /Mon programme progressif/.test($('listeMorceaux').firstChild.textContent));
  }

  console.log('\n— Pouce seul (v1.25) —');
  w.AppGuitare.aller('morceaux');
  {
    const titres = [...$('listeMorceaux').querySelectorAll('h3')].map((x) => x.textContent);
    const iP = titres.indexOf('👍 Pouce seul — cordes à vide');
    verifie('Morceaux : section « Pouce seul — cordes à vide » juste après les accords', iP > 0 && /accords/.test(titres[iP - 1]), titres.join(' | '));
    verifie('puis « Pouce + main gauche » juste après', titres[iP + 1] === '👍✋ Pouce + main gauche');
    verifie('section pouce : rythme, pom-tcha, contretemps, petit morceau listés', ['Le pouce en rythme', 'Pom-tcha à vide', 'Le contretemps (reggae)', 'Petit morceau à vide']
      .every((t) => $('listeMorceaux').textContent.indexOf(t) !== -1));
    verifie('Morceaux : section « 📱 TikTok » avec le riff La – Ré', titres.indexOf('📱 TikTok') > iP && /Le riff La – Ré/.test($('listeMorceaux').textContent) &&
            /Bella Ciao sur une corde/.test($('listeMorceaux').textContent) && /Bella Ciao — version facile/.test($('listeMorceaux').textContent) &&
            /Vu sur TikTok — grilles d’accords/.test($('listeMorceaux').textContent) && /Smoke on the Water/.test($('listeMorceaux').textContent) &&
            /Arpège La – Do♯m – Fa♯m – Ré/.test($('listeMorceaux').textContent) && /Arpège La m7 – Fa/.test($('listeMorceaux').textContent));
    const titresT = [...$('listeMorceaux').querySelectorAll('h3')].map((x) => x.textContent).filter((t) => /Top 20/.test(t));
    verifie('Top 20 : 4 rubriques par niveau', titresT.length === 4 && /Débutant/.test(titresT[0]) && /Avancé/.test(titresT[3]), titresT.join(' | '));
    const top1 = [...$('listeMorceaux').querySelectorAll('details.rubrique-morceaux')].find((d) => /Débutant/.test(d.querySelector('h3').textContent));
    verifie('Top 20 débutant : Knockin’ (déjà dans l’app), Wonderwall, Le vent nous portera…', /Knockin/.test(top1.textContent) && /Wonderwall/.test(top1.textContent) && /Le vent nous portera/.test(top1.textContent));
    const rubS = [...$('listeMorceaux').querySelectorAll('details.rubrique-morceaux')].find((d) => /🪶 Versions simplifiées/.test(d.querySelector('h3').textContent));
    verifie('Morceaux : rubrique « 🪶 Versions simplifiées », avec le niveau avant → après', rubS && rubS.querySelectorAll('.ligne-morceau').length >= 25 &&
            /\d → \d\/6 · ✋ −\d+ %/.test(rubS.textContent), rubS && rubS.querySelectorAll('.ligne-morceau').length);
    w.AppGuitare.ouvrirMorceau('brahms-valse-3');
    const bSimple = $('detailMorceau').querySelector('.version-simple');
    verifie('fiche d’une pièce : bouton « Version simplifiée »', bSimple && /Version simplifiée/.test(bSimple.textContent));
    bSimple.click();
    verifie('version simplifiée ouverte, toute en première position, avec retour à l’original',
            /version simplifiée/.test($('detailMorceau').querySelector('h2').textContent) && /Version originale/.test($('detailMorceau').querySelector('.version-simple').textContent) &&
            [...$('detailMorceau').querySelectorAll('.tab-note text, .tab-note')].length > 0 && /Mutopia/.test($('detailMorceau').textContent) &&
            /✋ Mouvements des doigts : \d+ au lieu de \d+ — \d+ doigts posés \(\d+\), aucun déplacement de la main/.test($('detailMorceau').textContent));
    w.AppGuitare.aller('morceaux');
    verifie('versions longues absentes de la liste', !/version longue/.test($('listeMorceaux').textContent));
    w.AppGuitare.ouvrirMorceau('ch-final-countdown');
    const bL = $('detailMorceau').querySelector('.version-autre');
    verifie('fiche courte : bouton « Version longue »', !!bL && /Version longue/.test(bL.textContent));
    bL.click();
    verifie('version longue ouverte, avec retour à la courte', /version longue/.test($('detailMorceau').querySelector('h2').textContent) &&
            /Version courte/.test($('detailMorceau').querySelector('.version-autre').textContent));
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
    verifie('programme : séance du jour au palier 1', /Séance du jour/.test(pg.textContent) && /Palier 1 — Premiers sons/.test(pg.textContent));
    verifie('programme : échauffement puis morceaux nouveaux, 3 passages 60 → 80 → 100 %',
            /Échauffement/.test(pg.textContent) && /Nouveau/.test(pg.textContent) && /60 → 80 → 100 %/.test(pg.textContent));
    verifie('programme : 6 paliers (les niveaux de difficulté), seul le premier ouvert', pg.querySelectorAll('details.palier').length === 6 &&
            pg.querySelectorAll('details.palier.ferme').length === 5);

    // Morceau déjà joué : proposé « à continuer », avec l'étape suivante du pas à pas.
    {
      const jouesAvant = w.localStorage.getItem('guitare:joues');
      const id = w.Programme.paliers(w.Morceaux.tous())[2].ids.filter((x) => w.Morceaux.get(x).chanson)[0];
      w.localStorage.setItem('guitare:joues', JSON.stringify({ [id]: { n: 2, t: Date.now() - 86400000 } }));
      w.Store.marquerEtape(id, 0, true); w.Store.marquerEtape(id, 1, true);
      w.localStorage.removeItem('guitare:seance');
      w.AppGuitare.aller('programme');
      const ligne = [...pg.querySelectorAll('.liste-ligne')].find((l) => l.textContent.includes(w.Morceaux.get(id).titre));
      verifie('programme : morceau déjà joué proposé « à continuer », avant les nouveautés', !!ligne && /Déjà commencé, à continuer/.test(ligne.textContent) &&
              !/Nouveau/.test([...pg.querySelectorAll('.liste-ligne')].slice(0, [...pg.querySelectorAll('.liste-ligne')].indexOf(ligne)).map((l) => l.textContent).join('')));
      verifie('programme : étape suivante du pas à pas affichée', !!ligne && /Pas à pas : étape 3\/\d+/.test(ligne.textContent), ligne && ligne.textContent);
      w.Store.marquerEtape(id, 0, false); w.Store.marquerEtape(id, 1, false);
      if (jouesAvant) w.localStorage.setItem('guitare:joues', jouesAvant); else w.localStorage.removeItem('guitare:joues');
      w.localStorage.removeItem('guitare:seance');
      w.AppGuitare.aller('programme');
    }

    // ♥ depuis la fiche d'un morceau.
    w.AppGuitare.ouvrirMorceau('pouce-ch-santiano');
    const bAime = $('detailMorceau').querySelector('.ressenti .aime');
    verifie('fiche morceau : bouton « ♡ J’aime »', !!bAime && /♡ J’aime/.test(bAime.textContent));
    bAime.click();
    verifie('♥ enregistré et bouton allumé', w.Store.aime('pouce-ch-santiano') && /♥ J’aime/.test($('detailMorceau').querySelector('.ressenti .aime').textContent));
    w.AppGuitare.aller('morceaux');
    verifie('liste Morceaux : rubrique « ♥ Mes favoris »', /♥ Mes favoris/.test($('listeMorceaux').textContent) && /♥ Santiano au pouce/.test($('listeMorceaux').textContent));
    w.AppGuitare.aller('programme');
    verifie('programme : le favori du palier 2 proposé en défi lent', /Défi ♥/.test(pg.textContent) && /50 → 60 → 70 %/.test(pg.textContent));
    verifie('programme : chemin vers le favori affiché', /♥ Santiano au pouce/.test(pg.textContent) && /encore 4 morceau\(x\) à acquérir/.test(pg.textContent));

    // Ressenti → boîte de Leitner.
    w.AppGuitare.ouvrirMorceau('chromatique');
    [...$('detailMorceau').querySelectorAll('.ressenti .btn')].find((b) => /Facile/.test(b.textContent)).click();
    verifie('« Facile » : boîte 2, revu dans 2 jours', w.Store.suivi().chromatique.b === 2 && /à revoir dans 2 j/.test($('detailMorceau').querySelector('.ressenti').textContent));
    [...$('detailMorceau').querySelectorAll('.ressenti .btn')].find((b) => /Dur/.test(b.textContent)).click();
    verifie('« Dur » : retour en boîte 1, revu demain', w.Store.suivi().chromatique.b === 1);

    // Ressenti « dur » répété au palier le plus haut : la séance consolide en dessous.
    {
      const suiviAvant = w.localStorage.getItem('guitare:suivi'), resAvant = w.localStorage.getItem('guitare:ressentis');
      const pal = w.Programme.paliers(w.Morceaux.tous());
      const s = {}; pal[0].ids.slice(0, 4).forEach((id) => { s[id] = { b: 3, t: Date.now() - 86400000 * 2, n: 2 }; });
      w.localStorage.setItem('guitare:suivi', JSON.stringify(s));
      w.localStorage.setItem('guitare:ressentis', JSON.stringify(pal[1].ids.slice(0, 2).map((id) => ({ id, note: 'dur', t: Date.now() }))));
      w.AppGuitare.aller('programme');
      verifie('ressenti difficile : la séance consolide au palier inférieur', /consolide au palier 1/.test($('pageProgramme').textContent) && /Palier 1 —/.test($('pageProgramme').textContent),
              ($('pageProgramme').querySelector('.consolide') || {}).textContent);
      if (suiviAvant) w.localStorage.setItem('guitare:suivi', suiviAvant); else w.localStorage.removeItem('guitare:suivi');
      if (resAvant) w.localStorage.setItem('guitare:ressentis', resAvant); else w.localStorage.removeItem('guitare:ressentis');
      w.localStorage.removeItem('guitare:seance');
    }
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
  {
    const css = fs.readFileSync(path.join(RACINE, 'styles.css'), 'utf8');
    verifie('plein écran : le bandeau d’enchaînement colle sous la barre, sans trou (v1.26)', /\.partition\.plein-ecran \.bandeau-liste \{ position: sticky; top: 0;/.test(css));
    verifie('téléphone en paysage : mise en page resserrée', /@media \(orientation: landscape\) and \(max-height: 520px\)/.test(css));
  }
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
    verifie('écran : le travail récurrent du cours, par thème', /Travail récurrent/.test(txt) && /Balayages/.test(txt) && /Pouce buté : 4 fois/.test(txt) && /Ve position : 0 1 0 1/.test(txt) && /Partir de la pince/.test(txt) &&
            /Riff en La n° 2/.test(txt) && /devant une glace/.test(txt));
    verifie('états : NOUVEAU, à continuer, pas encore vu en cours', /NOUVEAU/.test(txt) && /à continuer/.test(txt) && /pas encore vu en cours/.test(txt));
    verifie('semaines précédentes : révision facultative, à part', /Révision : les semaines précédentes/.test(txt) && /📅 semaines précédentes/.test(txt) && /♩ = 40/.test(txt));
    verifie('idées de l’app : groupe à part, marqué, hors du compte du jour', /Pour aller plus loin/.test(txt) && /idée de l’app/.test(txt) &&
            w.Entrainement.tous().every((e) => e.etat !== 'idee'));
    const total = w.Entrainement.tous().reduce((t, e) => t + w.Entrainement.cases(e), 0);
    verifie('compteur du jour à zéro', new RegExp('Aujourd’hui : 0 / ' + total).test(txt));
    const carte = [...page.querySelectorAll('.exercice')].find((c) => /Pouce buté : 4 fois/.test(c.textContent));
    verifie('pouce buté : deux variantes (en regardant, yeux fermés)', carte.querySelectorAll('input[type=checkbox]').length === 2 && /yeux fermés/.test(carte.textContent));
    const caseAvant = carte.querySelector('input');
    caseAvant.focus();
    caseAvant.click();
    verifie('cocher ne reconstruit pas la page : même carte, la case garde la sélection', carte.isConnected && w.document.activeElement === caseAvant);
    verifie('case cochée : compteur à 1 et mémorisée pour aujourd’hui',
            new RegExp('Aujourd’hui : 1 / ' + total).test($('pageEntrainement').textContent) && w.Store.entrainementJour()['pouce-bute-4'].join() === '0');
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
    // Tempos du cours : métronome et boîte à rythmes lancés sur place.
    {
      const riff = [...$('pageEntrainement').querySelectorAll('.exercice')].find((c) => /Riff en La n° 1/.test(c.textContent));
      verifie('riff n° 1 : boutons métronome et boîte à rythmes (rock groove) à 55', /Boîte à rythmes \(rock groove\)/.test(riff.textContent) && /♩ 55/.test(riff.textContent));
      const lignes = riff.querySelectorAll('.tempos-ligne');
      lignes[1].querySelector('button').click();
      verifie('boîte à rythmes lancée : son rock, tempo 55, sur place', $('metroSon').value === 'rock' && $('metroSlider').value === '55' && /Travail récurrent/.test($('pageEntrainement').textContent));
      const riff2 = [...$('pageEntrainement').querySelectorAll('.exercice')].find((c) => /Riff en La n° 1/.test(c.textContent));
      if (w.Audio5.metronomeActif()) {
        verifie('le tempo qui joue devient un bouton stop', /■ 55/.test(riff2.querySelectorAll('.tempos-ligne')[1].textContent));
        riff2.querySelectorAll('.tempos-ligne')[1].querySelector('button').click();
        verifie('stop : la boîte à rythmes s’arrête', !w.Audio5.metronomeActif());
      }
      const pb = [...$('pageEntrainement').querySelectorAll('.exercice')].find((c) => /Pouce buté : 4 fois/.test(c.textContent));
      verifie('pouce buté : métronome de 40 à 60', ['♩ 40', '♩ 45', '♩ 50', '♩ 55', '♩ 60'].every((x) => pb.textContent.includes(x)));
      const vol = $('metroVolume');
      vol.value = '3.2'; vol.dispatchEvent(new w.Event('input'));
      verifie('volume du métronome et de la boîte à rythmes : mémorisé', w.Store.reglages().volumeMetro === 3.2 && w.Audio5.volumeMetronome() === 3.2, w.Store.reglages().volumeMetro);
      w.Store.reglage('volumeMetro', null); w.Audio5.volumeMetronome(2.5);
      verifie('lien vers l’écran Métronome et boîte à rythmes', [...$('pageEntrainement').querySelectorAll('button')].some((x) => /Métronome et boîte à rythmes/.test(x.textContent)));
      $('metroSon').value = 'clic';
    }
    // Interrupteur « 🎤 Micro » : seulement sur les morceaux qu'on joue, pas sur le travail ni les exercices.
    {
      const micro = () => [...$('detailMorceau').querySelectorAll('.actions button')].find((x) => /🎤 Micro/.test(x.textContent));
      verifie('travail : pas de micro sur les exercices', ![...$('pageEntrainement').querySelectorAll('button')].some((x) => /🎤/.test(x.textContent)));
      w.AppGuitare.ouvrirMorceau('ent-riff-la-2');
      const exo = !!micro();
      w.AppGuitare.ouvrirMorceau('ch-come-as-you-are');
      const grille = !!micro();
      w.AppGuitare.ouvrirMorceau('au-clair');
      verifie('« 🎤 Micro » sur un morceau joué note à note et sur une grille d’accords, pas sur un exercice', !!micro() && !exo && grille, [exo, grille].join());
      micro().click();
      const pan = $('detailMorceau').querySelector('.ecoute-panneau');
      // Pas de micro dans jsdom : l'app le dit clairement, sans planter.
      verifie('micro absent : l’app explique qu’il n’y a pas de micro, l’interrupteur reste éteint', pan && !pan.hidden && /accès au micro/.test(pan.textContent) &&
              micro().getAttribute('aria-pressed') === 'false', pan && pan.textContent);
      // Un faux micro qui « joue ».
      const vrai = w.Ecoute.demarrer, vraiArret = w.Ecoute.arreter;
      let jouer = null, ouvert = false;
      w.Ecoute.demarrer = (surNote) => { jouer = surNote; ouvert = true; return Promise.resolve(true); };
      w.Ecoute.arreter = () => { ouvert = false; };
      w.Ecoute.enMarche = () => ouvert;
      w.AppGuitare.ouvrirMorceau('au-clair');
      micro().click();
      const pan2 = () => $('detailMorceau').querySelector('.ecoute-panneau');
      const notesM = w.Morceaux.get('au-clair').notes, temps = [...new Set(notesM.map((n) => n.temps))];
      const zoomVal = () => $('detailMorceau').querySelector('.zoom-val').textContent;
      verifie('micro allumé : la tablature passe à 200 %, sans toucher au zoom habituel', zoomVal() === '200 %' && w.Store.reglages().zoomPartition == null, zoomVal());
      [...$('detailMorceau').querySelectorAll('button')].find((x) => x.getAttribute('aria-label') === 'Zoomer').click();
      const zp = pan2().querySelector('.ecoute-zoom');
      verifie('panneau d’écoute : son propre zoom 🔍− / % / 🔍+', !!zp && /230 %/.test(zp.textContent) && zp.querySelectorAll('button').length === 3, zp && zp.textContent);
      zp.querySelector('[aria-label="Dézoomer"]').click();
      verifie('🔍− du panneau : la tablature revient à 200 % (zoom micro mémorisé)', /200 %/.test(pan2().querySelector('.ecoute-zoom').textContent) && w.Store.reglages().zoomMicro === 2);
      pan2().querySelector('.ecoute-zoom [aria-label="Zoomer"]').click();
      verifie('zoom pendant l’écoute : mémorisé à part (zoom micro)', zoomVal() === '230 %' && w.Store.reglages().zoomMicro === 2.3 && w.Store.reglages().zoomPartition == null, zoomVal());
      verifie('micro allumé : interrupteur enfoncé, première note du morceau annoncée', ouvert && micro().getAttribute('aria-pressed') === 'true' &&
              /Micro allumé/.test(micro().textContent) && new RegExp('note 1 / ' + temps.length).test(pan2().textContent), pan2().textContent.slice(0, 120));
      jouer(notesM[0].midi + 1);
      verifie('fausse note : signalée, on attend la bonne', /J’entends .*, il faut /.test(pan2().textContent));
      temps.forEach((t) => jouer(notesM.find((n) => n.temps === t).midi));
      const fin = pan2().textContent;
      verifie('fin du morceau : score et faute de la mesure 1, le micro RESTE allumé', new RegExp((temps.length - 1) + ' / ' + temps.length + ' notes justes du premier coup').test(fin) &&
              /Mesure 1 : /.test(fin) && ouvert && /reste allumé/.test(fin), fin.slice(0, 160));
      verifie('fin du morceau : « 💡 Mes recommandations », avec la mesure 1 à retravailler', /Mes recommandations/.test(fin) && /mesure 1/.test(fin) &&
              !![...pan2().querySelectorAll('button')].find((x) => /Mesure.* en boucle à 60 %/.test(x.textContent)), fin.slice(-300));
      verifie('le score du tour est retenu pour le prochain', w.Store.scoreEcoute('au-clair') === Math.round((temps.length - 1) / temps.length * 100));
      jouer(notesM[temps.length > 1 ? 1 : 0].midi + 2);
      const encoreFin = /notes justes du premier coup/.test(pan2().textContent);
      jouer(notesM[0].midi);
      verifie('micro toujours allumé : une autre note ne fait rien, la première note relance un tour', encoreFin && new RegExp('note 2 / ' + temps.length).test(pan2().textContent), pan2().textContent.slice(0, 120));
      [...pan2().querySelectorAll('button')].find((x) => /Éteindre/.test(x.textContent)).click();
      verifie('« Éteindre le micro » : micro fermé, interrupteur relevé', !ouvert && micro().getAttribute('aria-pressed') === 'false' && pan2().hidden);
      verifie('micro éteint : le zoom habituel revient', zoomVal() === 'Ajusté', zoomVal());
      w.Store.reglage('zoomMicro', null);
      // Tour suivant, fini : le bouton de la recommandation règle la boucle et éteint le micro.
      micro().click();
      jouer(notesM[0].midi + 1);
      temps.forEach((tt) => jouer(notesM.find((n) => n.temps === tt).midi));
      const finB = pan2().textContent;
      verifie('2e tour : la comparaison avec le tour précédent', /même score|Même score|progresses|contre/i.test(finB), finB.slice(-300));
      let lance = null; const jouerAvant = w.Tablature.jouer; w.Tablature.jouer = (pp, o) => { lance = o; };
      [...pan2().querySelectorAll('button')].find((x) => /Mesure.* en boucle à 60 %/.test(x.textContent)).click();
      verifie('bouton de la recommandation : micro éteint, mesure 1 en boucle lancée à 60 %', !ouvert && lance && lance.de === 0 &&
              /60 %/.test($('detailMorceau').textContent), lance && JSON.stringify({ de: lance.de, a: lance.a }));
      w.Tablature.jouer = jouerAvant; w.Tablature.arreter();
      // Mode accords : une grille (Come As You Are), le micro reconnaît l'accord gratté.
      let optsAccords = null;
      w.Ecoute.demarrer = (surNote, surMesure, surErreur, attendus, opts) => { jouer = surNote; ouvert = true; optsAccords = opts; return Promise.resolve(true); };
      w.Store.reglage('zoomMicro', null);
      w.AppGuitare.ouvrirMorceau('ch-come-as-you-are');
      micro().click();
      verifie('grille : le micro passe en mode accords (un modèle par accord de la chanson)', ouvert && optsAccords && Object.keys(optsAccords.accords).sort().join() === 'Am,C,D,Em,G',
              optsAccords && Object.keys(optsAccords.accords).join());
      verifie('grille : « Gratte : Mi mineur (Em) — mesure 1 », compteur en accords', /Gratte : Mi mineur \(Em\) — mesure 1/.test(pan2().textContent) && /accord 1 \//.test(pan2().textContent), pan2().textContent.slice(0, 140));
      jouer('Em'); jouer('Em');
      verifie('grille : Mi m juste, le regratter ne fait rien, on attend Ré', /Juste : Mi mineur/.test(pan2().textContent) && /Gratte : Ré majeur \(D\)/.test(pan2().textContent), pan2().textContent.slice(0, 160));
      jouer('G');
      verifie('grille : un coup de Sol au lieu de Ré = un doute, pas une faute', /On dirait Sol majeur/.test(pan2().textContent) && /accord 2 \//.test(pan2().textContent));
      jouer('G');
      verifie('grille : deux coups de Sol = faute signalée, on attend toujours Ré', /J’entends Sol majeur \(G\), il faut Ré majeur \(D\)/.test(pan2().textContent), pan2().textContent.slice(0, 200));
      const etapesG = new w.Ecoute.SuiviAccords(w.Morceaux.get('ch-come-as-you-are').notes).etapes.map((e) => e[0].accord);
      etapesG.slice(1).forEach((a) => jouer(a));
      const finG = pan2().textContent;
      verifie('grille : fin du morceau, score en accords, faute et recommandations par accord', new RegExp((etapesG.length - 1) + ' / ' + etapesG.length + ' accords justes du premier coup').test(finG) &&
              /Mesure 2 : Sol majeur \(G\) au lieu de Ré majeur \(D\)/.test(finG) && /Mes recommandations/.test(finG) && /au lieu de Ré majeur/.test(finG), finG.slice(0, 260));
      [...pan2().querySelectorAll('button')].find((x) => /Éteindre/.test(x.textContent)).click();
      w.Ecoute.demarrer = vrai; w.Ecoute.arreter = vraiArret; w.Ecoute.enMarche = () => false;
      w.AppGuitare.aller('entrainement');
    }
    // Révision quotidienne : série, bouton qui enchaîne les tablatures, rappels.
    verifie('travail : série de jours d’affilée affichée', /1 jour d’affilée/.test($('pageEntrainement').textContent));
    const bRev = [...$('pageEntrainement').querySelectorAll('button')].find((x) => /Réviser ce qui reste/.test(x.textContent));
    verifie('travail : bouton « Réviser ce qui reste », tablatures à la suite', !!bRev && /tablatures à la suite/.test(bRev.textContent));
    w.AppGuitare.aller('accueil');
    const acc = $('carteReprendre').textContent;
    verifie('accueil : le travail de Françoise d’abord, avant la leçon', /D’abord : le travail de Françoise/.test(acc) &&
            acc.indexOf('travail de Françoise') < acc.indexOf('Ensuite : la leçon suivante') && /1 jour d’affilée/.test(acc), acc.slice(0, 160));
    w.AppGuitare.aller('programme');
    verifie('séance du jour : rappel du travail de Françoise en tête', /D’abord : le travail de Françoise/.test($('pageProgramme').textContent));
    w.AppGuitare.aller('entrainement');
    let lancee = null;
    const avantJouer = w.Tablature.jouer; w.Tablature.jouer = () => {};
    [...$('pageEntrainement').querySelectorAll('button')].find((x) => /Réviser ce qui reste/.test(x.textContent)).click();
    lancee = $('detailMorceau').querySelector('h2') && $('detailMorceau').querySelector('h2').textContent;
    verifie('réviser : ouvre la première tablature du travail (pouce buté non coché en entier)', /Pouce buté : 4 fois/.test(lancee || ''), lancee);
    w.Tablature.jouer = avantJouer;
    w.Store.cocherEntrainement('pouce-bute-4', 0, false);
    w.AppGuitare.aller('accueil');
    verifie('accueil : rappel « Travail du jour »', /Travail du jour : 0 \//.test($('carteReprendre').textContent));
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
    // API indisponible (quota) : repli sur le version.json de GitHub Pages
    // (le flux Atom de github.com est bloqué par CORS dans un navigateur).
    let urlRepli = '';
    w.fetch = (url) => /api\.github/.test(url) ? Promise.resolve({ ok: false })
      : (urlRepli = url, Promise.resolve({ ok: true, json: () => Promise.resolve({ version: '9.8' }) }));
    const r = await w.checkAppUpdate(true);
    verifie('repli sur GitHub Pages quand l’API refuse', r && r.latest === '9.8' && r.newer && /^https:\/\/laurentsar\.github\.io\/guitare\/version\.json/.test(urlRepli), urlRepli);
    const bApk = w.document.getElementById('update-banner');
    verifie('repli : bandeau proposé quand même', !!bApk);
    const b2 = w.document.getElementById('update-banner');
    if (b2) b2.remove();
  }

  console.log('\n— Erreurs JS pendant le test —');
  verifie('aucune erreur', erreurs.length === 0, erreurs.join(' | '));

  console.log(`\n=== ${ok} réussis, ${ko} échoués ===`);
  process.exit(ko ? 1 : 0);
})();
