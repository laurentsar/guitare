/* Service worker : l'app doit fonctionner sans réseau.
 *
 * Tout tient dans ces fichiers (aucune ressource distante, aucun son
 * téléchargé) : on met tout en cache au premier chargement, et on sert depuis
 * le réseau en priorité, le cache dès qu'il n'y a plus de réseau. Le nom du
 * cache porte la version : l'ancien est effacé à l'activation.
 */
const CACHE = 'guitare-v1.24';
const FICHIERS = [
  './', './index.html', './styles.css', './app.js',
  './theorie.js', './audio.js', './accords.js', './illustrations.js', './tablature.js', './portee.js', './manche.js', './gammes.js', './vr.js', './repertoire.js', './chansons.js', './morceaux.js', './entrainement.js', './programme.js',
  './lecons.js', './accordeur.js', './oreille.js', './store.js', './ecran.js', './dpad-nav.js',
  './tv.js', './cast.js', './autobackup.js', './update-check.js', './apk-update.js',
  './manifest.webmanifest', './version.json', './recepteur.html'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FICHIERS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((noms) =>
    Promise.all(noms.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
  ).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const local = new URL(e.request.url).origin === location.origin;
  // Nos fichiers : réseau d'abord (comme Recettes) — une mise à jour publiée
  // est visible au prochain chargement, sans attendre un nouveau service
  // worker ; le cache prend le relais hors ligne. Le reste (SDK Cast…) passe
  // tel quel, sans cache : un SDK périmé casserait la diffusion.
  if (!local) return;
  e.respondWith(
    fetch(e.request).then((rep) => {
      if (rep.ok && rep.type === 'basic') {
        const copie = rep.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copie));
      }
      return rep;
    }).catch(() => caches.match(e.request).then((r) =>
      r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
