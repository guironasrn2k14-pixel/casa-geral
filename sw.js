// Service Worker do Jambalaya: abre mesmo com internet ruim e mantém o app instalável.
const VERSAO = 'jambalaya-v1';
const BASE = ['./', 'index.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(BASE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== VERSAO).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rede primeiro (sempre pega a versão nova); se estiver sem internet, usa o que foi guardado.
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.protocol.indexOf('http') !== 0 || /firebaseio\.com|firebasedatabase\.app/.test(u.host)) return;
  e.respondWith(
    fetch(r)
      .then(res => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copia = res.clone();
          caches.open(VERSAO).then(c => c.put(r, copia));
        }
        return res;
      })
      .catch(() =>
        caches.match(r).then(m => m || (r.mode === 'navigate' ? caches.match('index.html') : null) || Response.error())
      )
  );
});
