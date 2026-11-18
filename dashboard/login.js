// Anmeldeseite: sendet Benutzername, Passwort und Code an das Backend und leitet danach weiter.
(function () {
  "use strict";
  try {
    const t = JSON.parse(localStorage.getItem("fortschritt-dashboard") || "{}").theme;
    if (t) document.documentElement.setAttribute("data-theme", t);
  } catch (e) { /* ohne gespeichertes Farbschema */ }

  const form = document.getElementById("loginForm");
  const err = document.getElementById("err");
  const btn = document.getElementById("submit");
  const next = new URLSearchParams(location.search).get("next") || "/";
  // Nur Ziele auf dieser Seite zulassen
  const target = /^\/(?![\/\\])/.test(next) ? next : "/";

  fetch("/api/me", { credentials: "same-origin" }).then((r) => { if (r.ok) location.replace(target); }).catch(() => {});

  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    err.textContent = "";
    btn.disabled = true;
    btn.textContent = "Prüfe …";
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user: document.getElementById("user").value,
          password: document.getElementById("password").value,
          code: document.getElementById("code").value,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) { location.replace(target); return; }
      err.textContent = data.error || "Anmeldung fehlgeschlagen.";
      document.getElementById("code").value = "";
      document.getElementById("code").focus();
    } catch (e) {
      err.textContent = "Keine Verbindung zum Server.";
    }
    btn.disabled = false;
    btn.textContent = "Anmelden";
  });
})();
