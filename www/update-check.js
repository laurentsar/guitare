/*
 * update-check.js — vérification et installation des mises à jour (même
 * principe que Recettes) : dernière release via l'API GitHub (repli sur le
 * flux Atom /releases.atom, sans quota), bandeau avec les nouveautés, puis
 * « Installer » qui télécharge l'APK et ouvre l'installeur Android (plugin
 * natif UpdatePlugin, via apk-update.js).
 * Dans le navigateur (PWA), « Mettre à jour » recharge simplement la page :
 * le service worker sert la nouvelle version dès qu'elle est en ligne.
 *
 * Config (dans index.html, avant ce script) :
 *   window.UPDATE_REPO = 'laurentsar/<repo>';
 *   window.APP_VERSION = '1.2';
 *
 * Expose window.checkAppUpdate(force) pour le bouton des réglages.
 * Anti-spam : 1 requête / 6 h. Échec réseau silencieux.
 */
(function () {
  'use strict';
  var REPO = window.UPDATE_REPO;
  var CURRENT = window.APP_VERSION;
  if (!REPO || !CURRENT) return;

  var POLL_INTERVAL = 6 * 3600 * 1000;
  var KEY_POLL    = 'updPoll:'  + REPO;
  var KEY_DISMISS = 'updDismiss:' + REPO;
  var NOM_APK = REPO.split('/')[1];

  function ls(get, k, v) {
    try { return get ? localStorage.getItem(k) : localStorage.setItem(k, v); }
    catch (e) { return null; }
  }

  // Compare deux versions "a.b.c" → >0 si va plus récente que vb.
  function cmp(va, vb) {
    var a = String(va).replace(/^v/, '').split('.');
    var b = String(vb).replace(/^v/, '').split('.');
    for (var i = 0; i < Math.max(a.length, b.length); i++) {
      var d = (parseInt(a[i], 10) || 0) - (parseInt(b[i], 10) || 0);
      if (d) return d;
    }
    return 0;
  }

  function natif() {
    var cap = window.Capacitor;
    return !!(cap && cap.isNativePlatform && cap.isNativePlatform());
  }

  // Extrait « 1.23 » du lien de release (…/releases/tag/v1.23) ou du titre
  // (« Ma Guitare v1.23 » : le titre Atom est le nom de la release, pas le tag).
  function versionOf(entry) {
    var linkEl = entry.querySelector('link[rel="alternate"]') || entry.querySelector('link');
    var href = linkEl ? (linkEl.getAttribute('href') || '') : '';
    var titleEl = entry.querySelector('title');
    var sources = [href.split('/tag/')[1] || '', titleEl ? titleEl.textContent : ''];
    for (var i = 0; i < sources.length; i++) {
      var m = String(sources[i]).match(/v?(\d+(?:\.\d+)+)/);
      if (m) return m[1];
    }
    return null;
  }

  // Dernière release via l'API GitHub : tag exact + vrai lien de l'APK.
  // Cache-buster (_) : un service worker ne doit pas servir une réponse périmée.
  function fromApi() {
    return fetch('https://api.github.com/repos/' + REPO + '/releases/latest?_=' + Date.now(), {
      headers: { Accept: 'application/vnd.github+json' }
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (d) {
        if (!d || !d.tag_name) return null;
        var m = String(d.tag_name).match(/v?(\d+(?:\.\d+)+)/);
        if (!m) return null;
        var apk = (d.assets || []).filter(function (a) { return /\.apk$/i.test(a.name || ''); })[0];
        return { latest: m[1], apkUrl: apk ? apk.browser_download_url : '', notes: d.body || '', pageUrl: d.html_url || '' };
      });
  }
  // Repli : flux Atom des releases (pas de quota d'API).
  function fromAtom() {
    return fetch('https://github.com/' + REPO + '/releases.atom?_=' + Date.now(), {
      headers: { Accept: 'application/atom+xml, text/xml, */*' }
    })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (xml) {
        if (!xml) return null;
        var doc = new DOMParser().parseFromString(xml, 'text/xml');
        var entry = doc.querySelector('entry');
        var latest = entry && versionOf(entry);
        if (!latest) return null;
        var contentEl = entry.querySelector('content');
        return { latest: latest, apkUrl: '', notes: contentEl ? (contentEl.textContent || '').trim() : '', pageUrl: '' };
      });
  }

  /* Vérifie la dernière release. force = ignore l'anti-spam et le « Plus tard ».
     Résout { latest, newer } ou null si la vérification a échoué. */
  function check(force) {
    return fromApi().catch(function () { return null; })
      .then(function (rel) { return rel || fromAtom(); })
      .then(function (rel) {
        if (!rel) return null;
        var latest = rel.latest;
        var pageUrl = rel.pageUrl || ('https://github.com/' + REPO + '/releases/tag/v' + latest);
        var apkUrl = rel.apkUrl || ('https://github.com/' + REPO + '/releases/download/v' + latest + '/' + NOM_APK + '-' + latest + '.apk');
        ls(false, KEY_POLL, Date.now());
        var newer = cmp(latest, CURRENT) > 0;
        if (newer && (force || ls(true, KEY_DISMISS) !== latest)) showBanner(latest, apkUrl, pageUrl, rel.notes);
        return { latest: latest, newer: newer };
      });
  }

  // apk-update.js (chargé avant) fournit l'installation native ; sans elle,
  // on retombe sur le téléchargement de l'APK dans le navigateur.
  if (typeof window.installApkUpdate !== 'function') {
    window.installApkUpdate = function (apkUrl, btn, onFail) {
      window.open(apkUrl, '_blank');
      if (onFail) onFail();
    };
  }
  window.checkAppUpdate = check;

  var last = parseInt(ls(true, KEY_POLL), 10) || 0;
  if (Date.now() - last >= POLL_INTERVAL) check(false).catch(function () {});

  function parseNoteItems(txt) {
    if (!txt) return [];
    var div = document.createElement('div');
    div.innerHTML = txt;
    var items = [];
    div.querySelectorAll('li').forEach(function (li) {
      var t = (li.textContent || '').trim();
      if (t) items.push(t);
    });
    if (!items.length) {
      // Markdown d'une release (« - point ») ou texte brut.
      items = (div.textContent || '').split(/\n|;/)
        .map(function (s) { return s.replace(/^\s*[-*•]\s*/, '').trim(); })
        .filter(function (s) { return s && !/^#/.test(s); });
    }
    return items.slice(0, 5);
  }

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  // PWA : le service worker récupère la nouvelle version au rechargement.
  function recharger() {
    var sw = navigator.serviceWorker;
    var fin = function () { location.reload(); };
    if (!sw || !sw.getRegistration) return fin();
    sw.getRegistration().then(function (reg) {
      return reg ? reg.update() : null;
    }).then(fin, fin);
  }

  function showBanner(version, apkUrl, pageUrl, notes) {
    if (document.getElementById('update-banner')) return;

    var css = document.createElement('style');
    css.textContent =
      '#update-banner{position:fixed;left:10px;right:10px;bottom:10px;z-index:99999;' +
      'border-radius:16px;background:#1a2332;color:#e5e7eb;' +
      'box-shadow:0 8px 32px rgba(0,0,0,.5);' +
      'font:14px/1.45 system-ui,-apple-system,Roboto,sans-serif;' +
      'max-width:520px;margin:0 auto;overflow:hidden;border:1px solid rgba(255,255,255,.08)}' +
      '#update-banner .ub-head{display:flex;align-items:center;gap:12px;padding:13px 14px 11px}' +
      '#update-banner .ub-icon{font-size:1.5em;flex:none;line-height:1}' +
      '#update-banner .ub-txt{flex:1;min-width:0}' +
      '#update-banner .ub-title{font-weight:700;font-size:1em;color:#fff}' +
      '#update-banner .ub-sub{color:#9ca3af;font-size:.8em;margin-top:2px}' +
      '#update-banner .ub-notes{padding:9px 14px;border-top:1px solid rgba(255,255,255,.07);' +
      'max-height:110px;overflow-y:auto}' +
      '#update-banner .ub-notes ul{margin:0;padding-left:16px}' +
      '#update-banner .ub-notes li{color:#d1d5db;font-size:.82em;line-height:1.5;margin:1px 0}' +
      '#update-banner .ub-actions{display:flex;gap:8px;padding:10px 14px 13px;' +
      'border-top:1px solid rgba(255,255,255,.07)}' +
      '#update-banner .ub-act{flex:1;text-align:center;background:#22c55e;color:#05210e;' +
      'font-weight:800;font-size:.9em;padding:10px 12px;border-radius:10px;' +
      'border:0;cursor:pointer;text-decoration:none;display:inline-block}' +
      '#update-banner .ub-skip{flex:none;background:transparent;color:#9ca3af;font-size:.85em;' +
      'border:1px solid rgba(255,255,255,.12);padding:10px 14px;border-radius:10px;cursor:pointer}';
    document.head.appendChild(css);

    var items = parseNoteItems(notes);
    var notesBlock = items.length
      ? '<div class="ub-notes"><ul>' +
        items.map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') +
        '</ul></div>'
      : '';

    var apk = natif();
    var b = document.createElement('div');
    b.id = 'update-banner';
    b.innerHTML =
      '<div class="ub-head">' +
        '<span class="ub-icon">🎸</span>' +
        '<div class="ub-txt">' +
          '<div class="ub-title">Mise à jour disponible</div>' +
          '<div class="ub-sub">Version ' + esc(version) + ' prête · installée : ' + esc(CURRENT) + '</div>' +
        '</div>' +
      '</div>' +
      notesBlock +
      '<div class="ub-actions">' +
        '<button class="ub-act">' + (apk ? '⬇ Installer v' : '🔄 Mettre à jour en v') + esc(version) + '</button>' +
        '<button class="ub-skip">Plus tard</button>' +
      '</div>';

    (document.body || document.documentElement).appendChild(b);

    b.querySelector('.ub-skip').onclick = function () {
      ls(false, KEY_DISMISS, version); b.remove();
    };

    var act = b.querySelector('.ub-act');
    act.onclick = function () {
      if (!apk) { act.textContent = '⏳ Mise à jour…'; recharger(); return; }
      act.disabled = true; act.textContent = '⏳ Téléchargement…';
      window.installApkUpdate(apkUrl, act, function () {
        act.disabled = false; act.textContent = '⬇ Installer v' + version;
      });
    };
  }
})();
