/* Écran allumé pendant qu'on joue.
 *
 * Les deux mains sont sur la guitare : on ne peut pas toucher l'écran toutes
 * les trente secondes pour l'empêcher de s'éteindre au milieu d'un morceau.
 *
 *  - APK : plugin natif KeepAwake (ci/patch_keepawake.py), qui pose le drapeau
 *    Android FLAG_KEEP_SCREEN_ON sur la fenêtre. Il est déjà posé au
 *    démarrage ; ce fichier ne fait que le retirer si l'élève coupe l'option.
 *    Le drapeau ne vaut que tant que l'app est au premier plan : rangée ou
 *    téléphone verrouillé à la main, l'écran se comporte normalement.
 *  - Navigateur (PWA, casque Quest) : Screen Wake Lock API. Le navigateur
 *    relâche le verrou dès que la page est cachée ; on le redemande quand
 *    elle revient au premier plan.
 *  - Ni l'un ni l'autre (vieux navigateur) : rien, sans erreur.
 */
(function (global) {
  'use strict';

  var verrou = null;

  function plugin() {
    var cap = global.Capacitor;
    if (!cap || !cap.isNativePlatform || !cap.isNativePlatform()) return null;
    return (cap.Plugins && cap.Plugins.KeepAwake) || null;
  }

  function voulu() {
    var r = global.Store ? Store.reglages() : {};
    return r.ecranAllume !== false;
  }

  function demanderVerrou() {
    var nav = global.navigator;
    if (verrou || !nav || !nav.wakeLock || !nav.wakeLock.request) return;
    if (global.document && document.visibilityState === 'hidden') return;
    nav.wakeLock.request('screen').then(function (v) {
      verrou = v;
      v.addEventListener && v.addEventListener('release', function () { verrou = null; });
    }, function () { /* refusé (économie d'énergie, onglet caché) : tant pis */ });
  }

  function relacher() {
    if (verrou) { try { verrou.release(); } catch (e) { /* déjà relâché */ } verrou = null; }
  }

  function appliquer() {
    var p = plugin();
    if (p) {
      var f = voulu() ? p.keepAwake : p.allowSleep;
      if (f) Promise.resolve(f.call(p)).catch(function () {});
      return;
    }
    if (voulu()) demanderVerrou(); else relacher();
  }

  if (global.document) {
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible' && voulu() && !plugin()) demanderVerrou();
    });
    // Certains navigateurs n'accordent le verrou qu'après un geste de
    // l'utilisateur : on le redemande au premier toucher s'il manque.
    document.addEventListener('pointerdown', function () {
      if (!verrou && voulu() && !plugin()) demanderVerrou();
    }, true);
  }

  global.EcranAllume = { appliquer: appliquer, actif: function () { return !!verrou; } };
})(typeof window !== 'undefined' ? window : globalThis);
