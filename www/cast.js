/* Chromecast : envoyer l'affichage sur la télé.
 *
 * Deux façons d'afficher sur un téléviseur, et elles ne se remplacent pas :
 *   - installer cette APK sur la TV (mode TV, voir tv.js) : rien à configurer,
 *     mais il faut une télé Android ;
 *   - caster depuis le téléphone, qui reste la télécommande : c'est ce fichier,
 *     et ça marche sur n'importe quelle clé Chromecast ou télé compatible.
 *
 * CE QU'IL FAUT SAVOIR : Google n'autorise pas une page quelconque comme
 * récepteur. Il faut enregistrer un « récepteur personnalisé » sur la Cast
 * Developer Console (compte Google, 5 $ une fois), qui rend un identifiant
 * d'application de huit caractères. On le colle dans les réglages, et le
 * bouton Cast apparaît. Le récepteur lui-même est la page receiver/ de ce
 * dépôt, publiée sur GitHub Pages (HTTPS obligatoire, Google refuse http).
 *
 * Sans identifiant, ce module ne charge même pas le SDK : pas de bouton mort,
 * pas de requête inutile.
 */
(function (global) {
  'use strict';

  var NAMESPACE = 'urn:x-cast:com.laurent.guitare';
  var session = null, dispo = false, sdkDemande = false;
  var surEtat = null;

  function appId() { return (Store.reglages().castAppId || '').trim().toUpperCase(); }
  function configure() { return /^[0-9A-F]{8}$/.test(appId()); }

  function chargerSdk() {
    if (sdkDemande || !configure()) return;
    sdkDemande = true;
    // Le SDK appelle ce callback global quand il est prêt : il doit exister
    // AVANT que le script soit chargé, sinon l'initialisation est perdue.
    global.__onGCastApiAvailable = function (ok) {
      if (!ok) { etat('indisponible'); return; }
      var ctx = cast.framework.CastContext.getInstance();
      ctx.setOptions({
        receiverApplicationId: appId(),
        autoJoinPolicy: chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
      });
      ctx.addEventListener(cast.framework.CastContextEventType.SESSION_STATE_CHANGED, function (e) {
        session = ctx.getCurrentSession();
        etat(session ? 'connecte' : 'pret');
      });
      dispo = true;
      etat('pret');
    };
    var s = document.createElement('script');
    s.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
    s.onerror = function () { etat('indisponible'); };
    document.head.appendChild(s);
  }

  function etat(e) { if (surEtat) surEtat(e); }

  function ecouter(fn) { surEtat = fn; }

  function connecter() {
    if (!dispo) { chargerSdk(); return Promise.resolve(false); }
    return cast.framework.CastContext.getInstance().requestSession().then(function () {
      session = cast.framework.CastContext.getInstance().getCurrentSession();
      return true;
    }).catch(function () { return false; });
  }

  function connecte() { return !!session; }

  // Envoi d'un écran à afficher. Le récepteur ne reçoit que des DONNÉES
  // (quel accord, quelle tablature, quel tempo) et dessine lui-même : envoyer
  // du HTML ferait du récepteur une faille, et le rendu serait illisible sur
  // une télé de toute façon.
  function envoyer(message) {
    if (!session) return false;
    try {
      session.sendMessage(NAMESPACE, message);
      return true;
    } catch (e) { return false; }
  }

  function afficherAccord(id) {
    var a = Accords.get(id);
    if (!a) return false;
    return envoyer({ type: 'accord', accord: a });
  }
  function afficherMorceau(piece, indexNote) {
    return envoyer({ type: 'morceau', piece: { titre: piece.titre, notes: piece.notes, signature: piece.signature }, index: indexNote });
  }
  function afficherMetronome(tempo, temps, parMesure) {
    return envoyer({ type: 'metronome', tempo: tempo, temps: temps, parMesure: parMesure });
  }
  function afficherAccordeur(mesure) {
    return envoyer({ type: 'accordeur', mesure: mesure });
  }

  global.Cast = {
    configure: configure, chargerSdk: chargerSdk, connecter: connecter, connecte: connecte,
    ecouter: ecouter, envoyer: envoyer, NAMESPACE: NAMESPACE,
    afficherAccord: afficherAccord, afficherMorceau: afficherMorceau,
    afficherMetronome: afficherMetronome, afficherAccordeur: afficherAccordeur
  };
})(typeof window !== 'undefined' ? window : globalThis);
