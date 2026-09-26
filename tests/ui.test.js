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
['theorie.js', 'audio.js', 'accords.js', 'illustrations.js', 'tablature.js', 'morceaux.js', 'lecons.js',
 'accordeur.js', 'oreille.js', 'store.js', 'dpad-nav.js', 'tv.js', 'cast.js', 'app.js'].forEach(charge);

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
  ['parcours', 'accords', 'accordeur', 'metronome', 'morceaux', 'oreille', 'reglages', 'accueil'].forEach((nom) => {
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

  console.log('\n— Morceaux —');
  w.AppGuitare.aller('morceaux');
  verifie('tous les morceaux sont listés',
          $('listeMorceaux').querySelectorAll('.ligne-morceau').length === w.Morceaux.tous().length);
  w.AppGuitare.ouvrirMorceau('ode-joie');
  const notesTab = $('detailMorceau').querySelectorAll('.tab-note');
  verifie('la tablature contient toutes les notes',
          notesTab.length === w.Morceaux.get('ode-joie').notes.length, 'n=' + notesTab.length);
  verifie('le morceau affiche son tempo', /♩ = 88/.test($('detailMorceau').textContent));
  verifie('la légende de lecture est disponible, repliée',
          $('detailMorceau').querySelector('details') && $('detailMorceau').querySelector('details svg.schema'));

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

  console.log('\n— Erreurs JS pendant le test —');
  verifie('aucune erreur', erreurs.length === 0, erreurs.join(' | '));

  console.log(`\n=== ${ok} réussis, ${ko} échoués ===`);
  process.exit(ko ? 1 : 0);
})();
