// Service worker: deixa o site abrir sem internet.
// Com internet, as páginas vêm sempre da rede (versão mais nova); sem internet, vêm do cache.
// A escala e a lista de músicas ficam salvas no aparelho pelas próprias páginas (localStorage).
// Mude o número de CACHE a cada publicação para os aparelhos mostrarem o aviso de versão nova.
var CACHE = "escala-v13";
var SHELL = [
  "./",
  "index.html",
  "escala/",
  "escala/index.html",
  "musicas/biblioteca-musicas.html",
  "musicas/repertorio.html",
  "logo%20louvor.png",
  "manifest.webmanifest",
  "theme.css",
  "theme.js",
  "site.js",
  "passos-de-fe.json",
  "icons/icon-192.png",
  "icons/icon-512.png"
];
var CDN = ["fonts.googleapis.com", "fonts.gstatic.com", "cdnjs.cloudflare.com"];
var WAIT_MS = 4000; // rede lenta: depois disso usa o que está salvo

self.addEventListener("install", function (e) {
  // não ativa sozinho: a página mostra "Atualizar" e pede para ativar
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return Promise.all(SHELL.map(function (u) {
        return c.add(new URL(u, self.registration.scope)).catch(function () {});
      }));
    })
  );
});

self.addEventListener("message", function (e) {
  if (e.data && e.data.type === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

function saved(cache, req) {
  return cache.match(req, { ignoreSearch: true });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  var sameOrigin = url.origin === self.location.origin;
  if (!sameOrigin && CDN.indexOf(url.hostname) < 0) return; // planilha e banco de músicas sempre vão direto à rede

  e.respondWith(caches.open(CACHE).then(function (cache) {
    // arquivos do site: sempre confere com o servidor (o cache do navegador do GitHub Pages dura 10 minutos)
    var net = (sameOrigin ? fetch(req, { cache: "no-cache" }) : fetch(req)).then(function (res) {
      if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
      return res;
    });
    net.catch(function () {}); // evita erro solto quando está sem internet

    if (!sameOrigin) {
      // fontes e ícones: usa o salvo na hora e atualiza em segundo plano
      return saved(cache, req).then(function (hit) { return hit || net.catch(function () { return Response.error(); }); });
    }

    // páginas e arquivos do site: rede primeiro, cache se estiver sem internet ou muito lento
    var fallback = function () {
      return saved(cache, req).then(function (hit) {
        if (hit) return hit;
        if (req.mode === "navigate") return saved(cache, new URL("escala/index.html", self.registration.scope));
        return Response.error();
      });
    };
    var slow = new Promise(function (resolve) { setTimeout(function () { resolve(null); }, WAIT_MS); })
      .then(function () { return saved(cache, req); });
    return Promise.race([net.catch(fallback), slow.then(function (hit) { return hit || net.catch(fallback); })]);
  }));
});
