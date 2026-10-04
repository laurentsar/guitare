/* Progression et réglages, en local.
 *
 * Tout tient dans localStorage : l'app fonctionne sans compte et sans réseau.
 * La sauvegarde vers Home Assistant (autobackup.js) copie ces mêmes clés, donc
 * il n'y a rien de spécial à faire ici pour être sauvegardé — sauf ne pas
 * inventer de clés hors du préfixe « guitare: ».
 */
(function (global) {
  'use strict';

  var P = 'guitare:';

  function lire(cle, defaut) {
    try {
      var v = localStorage.getItem(P + cle);
      return v == null ? defaut : JSON.parse(v);
    } catch (e) { return defaut; }
  }
  function ecrire(cle, val) {
    try { localStorage.setItem(P + cle, JSON.stringify(val)); } catch (e) { /* mode privé */ }
    return val;
  }

  var REGLAGES_DEFAUT = {
    tempo: 70,
    volume: 0.9,
    timbre: 'nylon',
    gaucher: false,
    modeTv: null,        // null = détection automatique
    modeCasque: null,    // casque VR : null = détection automatique (vr.js)
    castAppId: '',       // récepteur Chromecast personnalisé, voir cast.js
    objectifMinutes: 15,
    vuePartition: 'deux',  // 'portee' | 'tablature' | 'deux'
    instrument: 'Prodipe Primera 4/4',
    decompte: true,        // une mesure de clics avant de jouer un morceau
    clicLecture: false     // métronome pendant la lecture
  };

  function reglages() {
    var r = lire('reglages', {});
    var out = {};
    Object.keys(REGLAGES_DEFAUT).forEach(function (k) {
      out[k] = (k in r) ? r[k] : REGLAGES_DEFAUT[k];
    });
    return out;
  }
  function reglage(cle, valeur) {
    var r = reglages();
    r[cle] = valeur;
    ecrire('reglages', r);
    return r;
  }

  function progression() {
    return lire('progression', { lecons: [], minutes: 0, jours: {}, records: {} });
  }

  function jourCourant() {
    var d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function marquerLecon(id, fait) {
    var p = progression();
    var i = p.lecons.indexOf(id);
    if (fait && i === -1) p.lecons.push(id);
    if (!fait && i !== -1) p.lecons.splice(i, 1);
    ecrire('progression', p);
    return p;
  }

  // Minutes de pratique du jour. Appelé par un compteur qui ne tourne que
  // quand un exercice est ouvert : compter le temps passé dans les menus
  // gonflerait le chiffre et lui ferait perdre tout intérêt.
  function ajouterSecondes(s) {
    var p = progression();
    var j = jourCourant();
    p.jours[j] = (p.jours[j] || 0) + s;
    p.minutes = Math.round(Object.keys(p.jours).reduce(function (t, k) { return t + p.jours[k]; }, 0) / 60);
    ecrire('progression', p);
    return p;
  }

  // Série : nombre de jours consécutifs, en terminant aujourd'hui ou hier —
  // s'arrêter net parce qu'on n'a pas encore joué AUJOURD'HUI serait
  // décourageant à 9 h du matin.
  function serie() {
    var p = progression();
    var jours = p.jours || {};
    var d = new Date();
    var compte = 0;
    var cle = function (dt) {
      return dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    };
    if (!jours[cle(d)]) d.setDate(d.getDate() - 1);
    while (jours[cle(d)]) { compte++; d.setDate(d.getDate() - 1); }
    return compte;
  }

  function minutesDuJour() {
    var p = progression();
    return Math.round((p.jours[jourCourant()] || 0) / 60);
  }

  // Records de changements d'accords (exercice « changements »).
  function record(paire, valeur) {
    var p = progression();
    p.records = p.records || {};
    if (valeur == null) return p.records[paire] || 0;
    if (valeur > (p.records[paire] || 0)) { p.records[paire] = valeur; ecrire('progression', p); }
    return p.records[paire];
  }

  /* Tablatures écrites par l'élève (éditeur) ou collées depuis le web. Même
   * forme qu'un morceau intégré : le lecteur ne fait pas la différence. */
  function tablatures() { return lire('tablatures', []); }
  function tablature(id) {
    return tablatures().filter(function (t) { return t.id === id; })[0] || null;
  }
  function sauverTablature(piece) {
    var liste = tablatures().filter(function (t) { return t.id !== piece.id; });
    liste.push(piece);
    ecrire('tablatures', liste);
    return piece;
  }
  function supprimerTablature(id) {
    ecrire('tablatures', tablatures().filter(function (t) { return t.id !== id; }));
  }

  // Étapes « apprendre pas à pas » cochées, par morceau : { id: [0, 2, …] }.
  function etapesFaites(id) { return (lire('etapes', {})[id] || []).slice(); }
  function marquerEtape(id, k, fait) {
    var t = lire('etapes', {});
    var l = (t[id] || []).filter(function (x) { return x !== k; });
    if (fait) l.push(k);
    t[id] = l.sort(function (a, b) { return a - b; });
    ecrire('etapes', t);
    return t[id];
  }

  global.Store = {
    etapesFaites: etapesFaites, marquerEtape: marquerEtape,
    tablatures: tablatures, tablature: tablature,
    sauverTablature: sauverTablature, supprimerTablature: supprimerTablature,
    reglages: reglages, reglage: reglage,
    progression: progression, marquerLecon: marquerLecon,
    ajouterSecondes: ajouterSecondes, serie: serie, minutesDuJour: minutesDuJour,
    record: record, jourCourant: jourCourant
  };
})(typeof window !== 'undefined' ? window : globalThis);
