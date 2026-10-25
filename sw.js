// Service worker: deixa o site abrir sem internet.
// A escala em si fica salva no aparelho pela própria página (localStorage).
var CACHE = "escala-v3";
var SHELL = [
  "./",
  "index.html",
  "escala/",
  "escala/index.html",
  "musicas/biblioteca-musicas.html",
  "logo%20louvor.png",
  "manifest.webmanifest",
  "icons/icon-192.png",
  "icons/icon-512.png"
];
var CDN = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(new URL(u, self.registration.scope)).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Serve do cache na hora e atualiza em segundo plano.
self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && CDN.indexOf(url.hostname) < 0) return; // planilha (docs.google.com) sempre vai direto à rede

  e.respondWith(
    caches.open(CACHE).then(function (cache) {
      return cache.match(req, { ignoreSearch: sameOrigin }).then(function (hit) {
        var net = fetch(req).then(function (res) {
          if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
          return res;
        }).catch(function () {
          if (hit) return hit;
          if (req.mode === "navigate") return cache.match(new URL("escala/index.html", self.registration.scope));
          return Response.error();
        });
        return hit || net;
      });
    })
  );
});
