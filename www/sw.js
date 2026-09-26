/* Service worker : l'app doit fonctionner sans réseau.
 *
 * Tout tient dans ces fichiers (aucune ressource distante, aucun son
 * téléchargé) : on met tout en cache au premier chargement, et on sert depuis
 * le cache en priorité. Le nom du cache porte la version — le changer est ce
 * qui déclenche la mise à jour chez l'utilisateur.
 */
const CACHE = 'guitare-v1.2';
const FICHIERS = [
  './', './index.html', './styles.css', './app.js',
  './theorie.js', './audio.js', './accords.js', './illustrations.js', './tablature.js', './morceaux.js',
  './lecons.js', './accordeur.js', './oreille.js', './store.js', './dpad-nav.js',
  './tv.js', './cast.js', './autobackup.js', './update-check.js',
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
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((rep) => {
      // On ne met en cache que nos propres fichiers : le SDK Cast de Google
      // n'a rien à faire ici, et son cache périmé casserait la diffusion.
      if (rep.ok && new URL(e.request.url).origin === location.origin) {
        const copie = rep.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copie));
      }
      return rep;
    }).catch(() => caches.match('./index.html')))
  );
});
