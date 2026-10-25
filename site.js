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
    var hadController = !!navigator.serviceWorker.controller; // primeira instalação não precisa recarregar
    navigator.serviceWorker.addEventListener("controllerchange", function () {
      if (!hadController) { hadController = true; return; }
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

  // ---------- Excluir item do repertório (diálogo com PIN) ----------
  // Uso: SiteRep.excluir({ id, nome, apiUrl, pinRequired, onDone })
  window.SiteRep = {
    excluir: function (o) {
      var old = document.getElementById("delDialog");
      if (old) old.remove();
      var dlg = document.createElement("dialog");
      dlg.id = "delDialog";
      dlg.className = "dlg";
      dlg.setAttribute("aria-labelledby", "delTitle");
      var form = document.createElement("form");
      form.className = "dlg-form";

      var h = document.createElement("h2"); h.id = "delTitle"; h.textContent = "Excluir do repertório";
      var p = document.createElement("p"); p.textContent = "Excluir \u201C" + o.nome + "\u201D do repertório deste culto?";
      form.appendChild(h); form.appendChild(p);

      var pin = null;
      if (o.pinRequired) {
        var label = document.createElement("label"); label.textContent = "PIN";
        pin = document.createElement("input");
        pin.type = "password"; pin.autocomplete = "off"; pin.required = true;
        try { pin.value = sessionStorage.getItem("escala.pin") || ""; } catch (e) {}
        label.appendChild(pin);
        form.appendChild(label);
      }
      var msg = document.createElement("div"); msg.className = "dlg-msg"; msg.setAttribute("role", "status");
      var actions = document.createElement("div"); actions.className = "dlg-actions";
      var cancel = document.createElement("button"); cancel.type = "button"; cancel.className = "dlg-btn"; cancel.textContent = "Cancelar";
      var ok = document.createElement("button"); ok.type = "submit"; ok.className = "dlg-btn danger"; ok.textContent = "Excluir";
      actions.appendChild(cancel); actions.appendChild(ok);
      form.appendChild(msg); form.appendChild(actions);
      dlg.appendChild(form);
      document.body.appendChild(dlg);

      cancel.addEventListener("click", function () { dlg.close(); dlg.remove(); });
      dlg.addEventListener("close", function () { dlg.remove(); });
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        ok.disabled = true; msg.textContent = "Excluindo\u2026"; msg.className = "dlg-msg";
        var pinValue = pin ? pin.value : "";
        fetch(o.apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ acao: "excluir", id: o.id, pin: pinValue })
        }).then(function (r) {
          return r.json().catch(function () { return {}; }).then(function (j) {
            if (!r.ok) throw new Error(j.error || "Erro ao excluir.");
          });
        }).then(function () {
          try { if (pinValue) sessionStorage.setItem("escala.pin", pinValue); } catch (e) {}
          dlg.close();
          dlg.remove();
          if (o.onDone) o.onDone();
        }).catch(function (err) {
          msg.textContent = err && err.message && err.message !== "Failed to fetch" ? err.message : "Sem conexão. Tente de novo.";
          msg.className = "dlg-msg err";
          ok.disabled = false;
        });
      });
      dlg.showModal();
      if (pin) pin.focus(); else cancel.focus();
    }
  };

  setupInstall();
  setupWorker();
})();
