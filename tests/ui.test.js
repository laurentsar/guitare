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
['theorie.js', 'audio.js', 'accords.js', 'illustrations.js', 'tablature.js', 'portee.js', 'manche.js', 'gammes.js', 'apk-update.js', 'repertoire.js', 'morceaux.js', 'lecons.js',
 'accordeur.js', 'oreille.js', 'store.js', 'dpad-nav.js', 'tv.js', 'cast.js', 'vr.js', 'app.js'].forEach(charge);

const $ = (id) => w.document.getElementById(id);
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
          $('listeMorceaux').querySelectorAll('.ligne-morceau').length === w.Morceaux.tous().length);
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
          $('listeMorceaux').querySelectorAll('.ligne-morceau').length === w.Morceaux.tous().length + 1);

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

  console.log('\n— Erreurs JS pendant le test —');
  verifie('aucune erreur', erreurs.length === 0, erreurs.join(' | '));

  console.log(`\n=== ${ok} réussis, ${ko} échoués ===`);
  process.exit(ko ? 1 : 0);
})();
