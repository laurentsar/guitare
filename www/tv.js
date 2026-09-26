/* Mode télévision.
 *
 * La même app tourne sur téléphone et sur télé. Ce qui change sur une télé :
 * on est à trois mètres (donc tout doit être deux fois plus gros), on n'a pas
 * de doigt (donc tout doit être atteignable aux flèches), et il n'y a pas de
 * clavier (donc aucun écran ne doit exiger de saisie).
 *
 * La détection est automatique mais surchargeable dans les réglages : un
 * boîtier Android mal identifié laisserait sinon l'utilisateur coincé.
 */
(function (global) {
  'use strict';

  function detecte() {
    var ua = navigator.userAgent || '';
    // Le marqueur fiable est la fonctionnalité leanback annoncée par Android
    // TV dans l'UA ; « SmartTV » couvre les boîtiers tiers.
    if (/Android.*(TV|BRAVIA|AFT)|SmartTV|GoogleTV|CrKey/i.test(ua)) return true;
    if (/[?&]tv=1/.test(location.search)) return true;
    // Un écran large SANS pointeur fin : c'est une télé, pas une tablette.
    if (global.matchMedia && global.matchMedia('(pointer: none), (pointer: coarse)').matches &&
        global.innerWidth >= 1200 && !('ontouchstart' in global)) return true;
    return false;
  }

  function actif() {
    var choix = Store.reglages().modeTv;
    return choix == null ? detecte() : !!choix;
  }

  function appliquer() {
    var on = actif();
    document.documentElement.classList.toggle('tv', on);
    // dpad-nav.js s'installe tout seul au chargement (écouteur clavier global)
    // et ne gêne pas au doigt : rien à activer ici.
    return on;
  }

  global.Tv = { detecte: detecte, actif: actif, appliquer: appliquer };
})(typeof window !== 'undefined' ? window : globalThis);
