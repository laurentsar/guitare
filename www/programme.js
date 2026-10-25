/* Programme progressif : quels morceaux travailler, dans quel ordre, et quand
 * les revoir.
 *
 * Trois idées, rien de plus :
 *  - des paliers, du plus simple au plus dur. Un palier s'ouvre quand on a
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

  var PALIERS = [
    { nom: 'Premiers pas', but: 'Cordes à vide, premières notes, deux accords de base.' },
    { nom: 'Premiers accords', but: 'Changer d’accord en rythme, petites mélodies, chansons à trois ou quatre accords.' },
    { nom: 'Chansons sans barré', but: 'Plus d’accords par chanson, des septièmes, des tempos plus vifs.' },
    { nom: 'Premières pièces', but: 'Lire une pièce à deux voix : la basse au pouce, la mélodie aux doigts.' },
    { nom: 'Barrés et power chords', but: 'Le Fa barré, les accords qui se déplacent sur le manche, le rock.' },
    { nom: 'Répertoire', but: 'Des pièces plus longues, plus de positions sur le manche.' },
    { nom: 'Études', but: 'Les études de Carcassi, Mertz, Giuliani : la technique en musique.' }
  ];

  /* Difficulté d'une grille d'accords : un point par accord différent, trois
   * par barré, deux si la main monte au-delà de la case 4, un si c'est vif. */
  function difficulteChanson(p) {
    var g = (p.mains && p.mains.gauche) || [];
    var barres = g.filter(function (a) { return a.barre; }).length;
    var haut = (p.notes || []).some(function (n) { return n.frette > 4; });
    return g.length + 3 * barres + (haut ? 2 : 0) + (p.tempo > 105 ? 1 : 0);
  }

  function palierDe(p) {
    if (p.chanson) {
      var g = (p.mains && p.mains.gauche) || [];
      var d = difficulteChanson(p);
      if (g.some(function (a) { return a.barre; }) || (p.notes || []).some(function (n) { return n.frette > 4; })) return 4;
      return d <= 4 ? 1 : 2;
    }
    if (p.categorie === 'accords') return [0, 0, 1, 2, 4][p.niveau] != null ? [0, 0, 1, 2, 4][p.niveau] : 4;
    var n = p.niveau || 1;
    if (n <= 1) return 0;
    if (n === 2) return 1;
    if (n === 3) return 3;
    if (n === 4) return 5;
    return 6;
  }

  // Ordre dans un palier : technique d'abord, puis du plus simple au plus dur.
  function cleTri(p) {
    var rang = p.categorie === 'entrainement' || (p.categorie === 'pouce' && !p.chanson) ? 0 : p.categorie === 'accords' ? 1 : p.chanson ? 3 : 2;
    var d = p.chanson ? difficulteChanson(p) : (p.niveau || 1) * 10;
    return rang * 1000 + d;
  }

  function paliers(tous) {
    var out = PALIERS.map(function (x, k) { return { num: k + 1, nom: x.nom, but: x.but, ids: [] }; });
    var tries = tous.slice().sort(function (a, b) { return cleTri(a) - cleTri(b); });
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
    var technique = function (id) { var p = parId[id]; return !p.chanson && ['accords', 'entrainement', 'pouce'].indexOf(p.categorie) !== -1; };
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

  global.Programme = {
    PALIERS: PALIERS, INTERVALLES: INTERVALLES, ACQUIS: ACQUIS, MAITRISE: MAITRISE,
    difficulteChanson: difficulteChanson, palierDe: palierDe, paliers: paliers, etat: etat,
    noter: noter, aRevoir: aRevoir, joursAvant: joursAvant, acquis: acquis,
    passages: passages, seance: seance
  };
})(typeof window !== 'undefined' ? window : globalThis);
