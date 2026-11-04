/* Programme progressif : quels morceaux travailler, dans quel ordre, et quand
 * les revoir.
 *
 * Trois idées, rien de plus :
 *  - des paliers, les six niveaux de difficulté d'exécution. Un palier s'ouvre quand on a
 *    acquis quelques morceaux du précédent : on ne saute pas aux barrés avant
 *    de savoir changer d'accord ;
 *  - la répétition espacée (boîtes de Leitner) : après chaque morceau, on dit
 *    si c'était dur, correct ou facile. Dur → on le revoit demain ; facile →
 *    on l'espace de plus en plus (1, 2, 4, 8, 16 jours) ;
 *  - les morceaux aimés (♥) passent devant, à palier égal, et un favori du
 *    palier suivant peut être tenté en « défi », lentement.
 *
 * Module pur : il reçoit les morceaux, le suivi et les favoris, et rend des
 * listes d'identifiants. L'enregistrement est dans store.js, l'écran dans
 * app.js.
 */
(function (global) {
  'use strict';

  var JOUR = 86400000;
  // Jours avant de revoir un morceau, selon sa boîte (0 = jamais noté).
  var INTERVALLES = [0, 1, 2, 4, 8, 16];
  var ACQUIS = 3;      // boîte à partir de laquelle un morceau compte comme acquis
  var MAITRISE = 5;

  /* Les paliers suivent les six niveaux de difficulté d'exécution
   * (difficulte(), plus bas) : ce que demandent les notes, pas la vitesse. */
  function palierDe(p) { return difficulte(p).niveau - 1; }

  // Ordre dans un palier : technique d'abord, puis du plus simple au plus dur.
  function cleTri(p) {
    var rang = p.categorie === 'entrainement' || (/^pouce/.test(p.categorie || '') && !p.chanson) ? 0 : p.categorie === 'accords' ? 1 : 2;
    return rang * 1000 + difficulte(p).score * 10;
  }

  function paliers(tous) {
    var out = NIVEAUX_DIFF.map(function (x, k) { return { num: k + 1, nom: x.nom, but: x.but.charAt(0).toUpperCase() + x.but.slice(1) + '.', ids: [] }; });
    // Les versions longues se travaillent depuis la fiche de la courte.
    var tries = tous.filter(function (p) { return !p.versionDe; }).sort(function (a, b) { return cleTri(a) - cleTri(b); });
    tries.forEach(function (p) { out[palierDe(p)].ids.push(p.id); });
    return out;
  }

  function seuil(palier) { return Math.min(4, Math.ceil(palier.ids.length * 0.4)); }

  function acquis(e) { return !!e && e.b >= ACQUIS; }

  /* Note une séance sur un morceau. `note` : 'dur' | 'moyen' | 'facile'. */
  function noter(e, note, maintenant) {
    var b = (e && e.b) || 0;
    if (note === 'dur') b = 1;
    else if (note === 'facile') b = Math.min(MAITRISE, b + 2);
    else b = Math.min(MAITRISE, b + 1);
    return { b: b, t: maintenant, n: ((e && e.n) || 0) + 1, note: note };
  }

  function prochaine(e) { return e.t + INTERVALLES[e.b] * JOUR; }
  // Une marge de quelques heures : joué hier soir, revu ce matin, ça compte.
  function aRevoir(e, maintenant) { return !!e && e.b > 0 && prochaine(e) - 6 * 3600000 <= maintenant; }
  function joursAvant(e, maintenant) { return Math.max(0, Math.round((prochaine(e) - maintenant) / JOUR)); }

  /* Où en est chaque palier : morceaux acquis, ouvert ou non. */
  function etat(pals, suivi) {
    var ouvert = true;
    return pals.map(function (p) {
      var n = p.ids.filter(function (id) { return acquis(suivi[id]); }).length;
      var s = seuil(p);
      var r = { num: p.num, nom: p.nom, but: p.but, ids: p.ids, acquis: n, seuil: s, ouvert: ouvert,
                commences: p.ids.filter(function (id) { return suivi[id]; }).length };
      ouvert = ouvert && n >= s;
      return r;
    });
  }

  // Combien de passages, et à quel tempo, selon la boîte.
  function passages(e, defi) {
    if (defi) return [50, 60, 70];
    var b = (e && e.b) || 0;
    if (b === 0) return [60, 80, 100];
    if (b === 1) return [70, 90, 100];
    if (b === 2) return [80, 100];
    return [100];
  }

  /* La séance du jour : un échauffement technique, les révisions dues (♥
   * d'abord), puis un ou deux morceaux nouveaux — moins si beaucoup sont en
   * cours : mieux vaut consolider que s'éparpiller. */
  function seance(tous, suivi, aimes, maintenant) {
    var parId = {};
    tous.forEach(function (p) { parId[p.id] = p; });
    var pals = paliers(tous);
    var et = etat(pals, suivi);
    var ouverts = et.filter(function (p) { return p.ouvert; });
    var courant = ouverts[ouverts.length - 1];
    var palierId = {};
    pals.forEach(function (p, k) { p.ids.forEach(function (id) { palierId[id] = k; }); });
    var aime = function (id) { return aimes.indexOf(id) !== -1; };
    var disponibles = [];
    ouverts.forEach(function (p) { disponibles = disponibles.concat(p.ids); });

    var items = [];
    var pris = {};
    function ajoute(id, raison, defi) {
      if (pris[id]) return;
      pris[id] = true;
      items.push({ id: id, raison: raison, passages: passages(suivi[id], defi) });
    }

    // Révisions dues : favoris d'abord, puis les plus en retard.
    var dus = Object.keys(suivi).filter(function (id) { return parId[id] && aRevoir(suivi[id], maintenant); })
      .sort(function (a, b) {
        return (aime(b) - aime(a)) || (prochaine(suivi[a]) - prochaine(suivi[b]));
      });

    // Échauffement : un exercice d'accords ou de technique, dû si possible,
    // sinon le moins avancé des paliers ouverts.
    var technique = function (id) { var p = parId[id]; return !p.chanson && ['accords', 'entrainement', 'pouce', 'pouce-main'].indexOf(p.categorie) !== -1; };
    var ech = dus.filter(technique)[0] ||
      disponibles.filter(technique).filter(function (id) { return !acquis(suivi[id]); })
        .sort(function (a, b) { return ((suivi[a] && suivi[a].b) || 0) - ((suivi[b] && suivi[b].b) || 0); })[0];
    if (ech) ajoute(ech, 'echauffement');

    dus.forEach(function (id) { if (items.length < 4) ajoute(id, 'revision'); });

    var enCours = Object.keys(suivi).filter(function (id) { return parId[id] && suivi[id].b > 0 && suivi[id].b < ACQUIS; }).length;
    var nNeufs = enCours >= 6 ? 0 : enCours >= 3 ? 1 : 2;
    // La technique a déjà son échauffement : les nouveautés sont de la musique.
    var neufs = disponibles.filter(function (id) { return !suivi[id] && !pris[id] && !technique(id); })
      .sort(function (a, b) { return (aime(b) - aime(a)) || (palierId[a] - palierId[b]); });
    neufs.slice(0, nNeufs).forEach(function (id) { if (items.length < 5) ajoute(id, aime(id) ? 'favori' : 'nouveau'); });

    // Un favori du palier suivant, en défi, si aucun favori n'est déjà au menu.
    var suivant = et[courant.num];
    if (suivant && !items.some(function (x) { return aime(x.id); })) {
      var defi = suivant.ids.filter(function (id) { return aime(id) && !acquis(suivi[id]); })[0];
      if (defi) ajoute(defi, 'defi', !suivi[defi]);
    }

    return { palier: courant, paliers: et, items: items, enCours: enCours };
  }

  /* Difficulté d'exécution : ce que demandent les notes elles-mêmes, pas la
   * vitesse (le tempo se règle). Hauteur sur le manche, changements de
   * position, écart de la main, barrés, accords à connaître et à enchaîner,
   * notes pincées ensemble (deux voix), doigts de la main droite, auriculaire,
   * et densité du rythme comptée en temps (croches, doubles croches). */
  var NIVEAUX_DIFF = [
    { max: 1,   nom: 'Premiers sons', but: 'cordes à vide ou une note à la fois, sans main gauche ou presque' },
    { max: 2.8, nom: 'Débutant', but: 'mélodies en première position, premiers accords ouverts' },
    { max: 4.7, nom: 'Premiers accords', but: 'accords ouverts enchaînés, basse et accord, arpèges simples' },
    { max: 6, nom: 'Intermédiaire', but: 'plus d’accords, notes pincées ensemble, premiers déplacements' },
    { max: 8, nom: 'Avancé', but: 'barrés, deux voix, la main monte sur le manche' },
    { max: 99,  nom: 'Expert', but: 'haut du manche, changements de position fréquents, écarts' }
  ];
  function criteres(p) {
    var parT = {}, temps = [];
    p.notes.forEach(function (n) { if (!parT[n.temps]) { parT[n.temps] = []; temps.push(n.temps); } parT[n.temps].push(n); });
    temps.sort(function (a, b) { return a - b; });
    var duree = p.notes.reduce(function (m, n) { return Math.max(m, n.temps + (n.duree || 1)); }, 0) || 1;
    var parMesure = p.signature ? p.signature[0] * 4 / p.signature[1] : 4;
    var mesures = Math.max(1, Math.round(duree / parMesure));
    var k = { maxFr: 0, ecart: 0, dep: 0, appuyes: 0, ensemble: 0, doigtsG: {}, doigtsD: {}, chg: 0 };
    var pos = null, prec = null;
    temps.forEach(function (t) {
      var g = parT[t], f = g.filter(function (n) { return n.frette > 0; });
      g.forEach(function (n) { k.doigtsD[n.main] = 1; if (n.frette > k.maxFr) k.maxFr = n.frette; });
      if (g.length > 1 && !g.every(function (n) { return n.main === 'p'; })) k.ensemble++;
      if (g[0].accord && g[0].accord !== prec) { k.chg++; prec = g[0].accord; }
      if (!f.length) return;
      k.appuyes++;
      f.forEach(function (n) { if (n.doigt) k.doigtsG[n.doigt] = 1; });
      var lo = Math.min.apply(null, f.map(function (n) { return n.frette; })), hi = Math.max.apply(null, f.map(function (n) { return n.frette; }));
      if (hi - lo > k.ecart) k.ecart = hi - lo;
      // En première position, l'auriculaire atteint la case 5 sans bouger la main.
      var ps = hi <= 5 ? 1 : lo;
      if (pos !== null && Math.abs(ps - pos) >= 3) k.dep++;
      pos = ps;
    });
    var acc = (p.mains && p.mains.gauche) || [];
    return { maxFr: k.maxFr, ecart: k.ecart, depPct: k.appuyes ? k.dep / k.appuyes * 100 : 0,
             barres: acc.filter(function (a) { return a.barre; }).length, nbAcc: acc.length, chgMes: k.chg / mesures,
             ensPct: temps.length ? k.ensemble / temps.length * 100 : 0, densite: temps.length / duree,
             doigtsD: Object.keys(k.doigtsD).length, doigtsG: Object.keys(k.doigtsG).length, mainG: k.appuyes > 0 };
  }
  function difficulte(p) {
    if (p._difficulte) return p._difficulte;
    var k = criteres(p), s = 0, r = [];
    var h = !k.mainG ? 0 : k.maxFr <= 3 ? 1 : k.maxFr <= 5 ? 1.8 : k.maxFr <= 7 ? 2.5 : k.maxFr <= 10 ? 3.2 : 3.8;
    s += h; if (k.maxFr >= 5) r.push('jusqu’à la case ' + k.maxFr);
    var dp = Math.min(2, k.depPct * 0.2); s += dp; if (dp >= 1) r.push('changements de position');
    if (k.ecart >= 4) { s += 1.2; r.push('écart de ' + (k.ecart + 1) + ' cases'); } else if (k.ecart === 3) s += 0.6;
    if (k.barres) { s += Math.min(3, k.barres * 1.3); r.push(k.barres + ' barré' + (k.barres > 1 ? 's' : '')); }
    s += Math.min(1.5, k.nbAcc * 0.15); if (k.nbAcc >= 6) r.push(k.nbAcc + ' accords');
    s += Math.min(1, k.chgMes * 0.5);
    s += k.ensPct / 100 * 2.5; if (k.ensPct >= 35) r.push('notes pincées ensemble');
    s += (k.doigtsD - 1) * 0.35;
    s += k.doigtsG >= 4 ? 0.6 : k.doigtsG === 3 ? 0.3 : 0;
    s += Math.max(0, Math.min(1, (k.densite - 1) * 0.6)); if (k.densite >= 2.5) r.push('rythme serré');
    if (!r.length) r.push(!k.mainG ? 'cordes à vide' : k.nbAcc ? k.nbAcc + ' accords ouverts' : 'première position');
    var niveau = 1;
    while (niveau < NIVEAUX_DIFF.length && s > NIVEAUX_DIFF[niveau - 1].max) niveau++;
    p._difficulte = { score: Math.round(s * 100) / 100, niveau: niveau, raisons: r };
    return p._difficulte;
  }

  global.Programme = {
    NIVEAUX_DIFF: NIVEAUX_DIFF, difficulte: difficulte,
    INTERVALLES: INTERVALLES, ACQUIS: ACQUIS, MAITRISE: MAITRISE,
    palierDe: palierDe, paliers: paliers, etat: etat,
    noter: noter, aRevoir: aRevoir, joursAvant: joursAvant, acquis: acquis,
    passages: passages, seance: seance
  };
})(typeof window !== 'undefined' ? window : globalThis);
