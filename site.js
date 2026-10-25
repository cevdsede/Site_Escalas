// Comportamento comum das páginas: app instalável, funcionamento offline e aviso de versão nova.
(function () {
  var script = document.currentScript;
  var base = script ? new URL(".", script.src).href : "./";

  // ---------- Instalar app ----------
  function setupInstall() {
    var btn = document.getElementById("install");
    if (!btn) return;
    var box = document.getElementById("installBox") || btn;
    var help = document.getElementById("installHelp");
    var evt = null;
    window.addEventListener("beforeinstallprompt", function (e) { e.preventDefault(); evt = e; });
    btn.addEventListener("click", function () {
      if (evt) { evt.prompt(); evt.userChoice.then(function () { evt = null; }); }
      else if (help) help.hidden = !help.hidden;
    });
    window.addEventListener("appinstalled", function () { box.hidden = true; if (help) help.hidden = true; });
    if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) box.hidden = true;
  }

  // ---------- Aviso de versão nova ----------
  function showUpdate(reg) {
    if (document.getElementById("updateBar")) return;
    var bar = document.createElement("div");
    bar.id = "updateBar";
    bar.className = "update-bar";
    bar.setAttribute("role", "status");
    var msg = document.createElement("span");
    msg.textContent = "Há uma versão nova do site.";
    var go = document.createElement("button");
    go.type = "button";
    go.textContent = "Atualizar";
    go.addEventListener("click", function () {
      var w = reg.waiting; // sempre a versão em espera mais recente
      if (!w) { location.reload(); return; }
      go.disabled = true;
      w.postMessage({ type: "SKIP_WAITING" });
    });
    var later = document.createElement("button");
    later.type = "button";
    later.className = "ghost";
    later.textContent = "Depois";
    later.addEventListener("click", function () { bar.remove(); });
    bar.appendChild(msg); bar.appendChild(go); bar.appendChild(later);
    document.body.appendChild(bar);
  }

  function setupWorker() {
    if (!("serviceWorker" in navigator)) return;
    var reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (reloaded) return;
      reloaded = true;
      location.reload();
    });
    navigator.serviceWorker.register(new URL("sw.js", base)).then(function (reg) {
      if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg);
      reg.addEventListener("updatefound", function () {
        var w = reg.installing;
        if (!w) return;
        w.addEventListener("statechange", function () {
          if (w.state === "installed" && navigator.serviceWorker.controller) showUpdate(reg);
        });
      });
      // procura versão nova ao voltar para a página e de tempos em tempos
      document.addEventListener("visibilitychange", function () { if (!document.hidden) reg.update().catch(function () {}); });
      setInterval(function () { reg.update().catch(function () {}); }, 30 * 60 * 1000);
    }).catch(function () {});
  }

  setupInstall();
  setupWorker();
})();
