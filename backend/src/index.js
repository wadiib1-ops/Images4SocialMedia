// Fortschritt-Dashboard: Backend auf Cloudflare Workers.
//
// - Jede Anfrage läuft zuerst durch diesen Worker (assets.run_worker_first). Ohne gültige Sitzung gibt es
//   nur die Anmeldeseite; alles andere (Dashboard, Protokoll, API) verlangt Passwort + Code aus der Authenticator-App.
// - Das Protokoll wird über einen GitHub-Token gelesen und geändert, der nur im Worker liegt (nie im Browser).
// - Jede Änderung schreibt einen Eintrag in die Änderungs-Historie (publisher/log_history.jsonl), im selben Commit.
//
// Erweiterungen (Benachrichtigungen, tägliche Fehlerberichte per E-Mail, Systemereignisse) kommen als neue
// Einträge in ROUTES und als scheduled()-Handler (Cron-Trigger in wrangler.toml) dazu.

import {
  SESSION_COOKIE, clearCookie, createSession, getCookie, readSession, safeEqual, sessionCookie, verifyPassword, verifyTotp,
} from "./auth.js";
import { GitHubError, github } from "./github.js";
import { appendJsonl, historyRecord, parseHistory, removeLines, validateSelection } from "./logops.js";

const REQUIRED = ["ADMIN_USER", "ADMIN_PASSWORD_HASH", "TOTP_SECRET", "SESSION_SECRET", "GITHUB_TOKEN", "GITHUB_REPO"];
const PUBLIC_PATHS = new Set(["/login", "/login.html", "/login.js", "/styles.css"]);
// Zum Vergleich, wenn der Benutzername falsch ist: Rechenzeit wie bei einer echten Prüfung.
const DUMMY_HASH = "pbkdf2-sha256$100000$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

const SECURITY_HEADERS = {
  "Content-Security-Policy": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "X-Robots-Tag": "noindex, nofollow",
};

function withHeaders(res, extra = {}) {
  const r = new Response(res.body, res);
  for (const [k, v] of Object.entries({ ...SECURITY_HEADERS, "Cache-Control": "no-store", ...extra })) r.headers.set(k, v);
  return r;
}
function json(data, status = 200, extra = {}) {
  return withHeaders(new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8" } }), extra);
}
const fail = (status, error, extra) => json({ error, ...extra }, status);

async function readJson(request) {
  if (!(request.headers.get("Content-Type") || "").includes("application/json")) return null;
  try { return await request.json(); } catch (e) { return null; }
}

// Schutz gegen Anfragen von fremden Seiten (zusätzlich zu SameSite=Strict).
function sameOrigin(request, url) {
  return request.headers.get("Origin") === url.origin;
}

// ---------------------------------------------------------------- Anmeldung
async function login(request, env, url) {
  if (!sameOrigin(request, url)) return fail(403, "Ungültige Herkunft.");
  const ip = request.headers.get("CF-Connecting-IP") || "unbekannt";
  if (env.LOGIN_LIMITER) {
    const { success } = await env.LOGIN_LIMITER.limit({ key: "login:" + ip });
    if (!success) return fail(429, "Zu viele Versuche. Bitte eine Minute warten.");
  }
  const body = await readJson(request);
  if (!body) return fail(400, "Ungültige Anfrage.");
  const userOk = safeEqual(String(body.user || "").trim().toLowerCase(), String(env.ADMIN_USER).trim().toLowerCase());
  const pwOk = await verifyPassword(String(body.password || ""), userOk ? env.ADMIN_PASSWORD_HASH : DUMMY_HASH);
  const codeOk = await verifyTotp(env.TOTP_SECRET, body.code);
  if (!(userOk && pwOk && codeOk)) {
    console.log(JSON.stringify({ ereignis: "anmeldung_fehlgeschlagen", ip }));
    return fail(401, "Anmeldung fehlgeschlagen. Benutzername, Passwort oder Code stimmt nicht.");
  }
  const { token, payload } = await createSession(env.SESSION_SECRET, env.ADMIN_USER);
  console.log(JSON.stringify({ ereignis: "anmeldung", benutzer: env.ADMIN_USER, ip }));
  return json({ ok: true, user: payload.u, exp: payload.exp }, 200, { "Set-Cookie": sessionCookie(token) });
}

function logout(request, url) {
  if (!sameOrigin(request, url)) return fail(403, "Ungültige Herkunft.");
  return json({ ok: true }, 200, { "Set-Cookie": clearCookie() });
}

// ---------------------------------------------------------------- Daten
async function getLog(env) {
  const gh = github(env);
  const head = await gh.head();
  const text = await gh.file(env.LOG_PATH, head.sha);
  if (text === null) return fail(404, "Protokoll nicht gefunden.");
  return withHeaders(new Response(text, { headers: { "Content-Type": "text/plain; charset=utf-8", "X-Log-Commit": head.sha } }));
}

async function getHistory(env) {
  const gh = github(env);
  const head = await gh.head();
  const text = await gh.file(env.HISTORY_PATH, head.sha);
  return json({ eintraege: parseHistory(text), commit: head.sha, repo: env.GITHUB_REPO });
}

async function deleteEntries(request, env, url, session) {
  if (!sameOrigin(request, url)) return fail(403, "Ungültige Herkunft.");
  const body = await readJson(request);
  if (!body) return fail(400, "Ungültige Anfrage.");
  const problem = validateSelection(body.entries);
  if (problem) return fail(400, problem);
  const reason = String(body.reason || "").trim().slice(0, 500);
  if (!reason) return fail(400, "Bitte einen Grund angeben. Er steht in der Änderungs-Historie.");

  const gh = github(env);
  // Während eines Veröffentlichungslaufs nicht ändern: der Lauf hängt Zeilen an und pusht danach.
  if (env.PUBLISH_WORKFLOW) {
    const active = await gh.activeRuns(env.PUBLISH_WORKFLOW);
    if (active > 0) return fail(423, "Gerade läuft eine Veröffentlichung. Bitte in ein bis zwei Minuten erneut versuchen.");
  }

  for (let attempt = 1; attempt <= 3; attempt++) {
    const head = await gh.head();
    const log = await gh.file(env.LOG_PATH, head.sha);
    if (log === null) return fail(404, "Protokoll nicht gefunden.");
    const { content, removed, missing } = removeLines(log, body.entries);
    if (missing.length) return fail(409, `${missing.length} der ausgewählten Einträge gibt es nicht mehr. Bitte neu laden.`, { missing: missing.length });
    const history = await gh.file(env.HISTORY_PATH, head.sha);
    const record = historyRecord({ user: session.u, reason, removed, baseSha: head.sha });
    const message = `Dashboard: ${removed.length} Protokolleintr${removed.length === 1 ? "ag" : "äge"} gelöscht\n\nVon: ${session.u}\nGrund: ${reason}\nHistorie: ${env.HISTORY_PATH} (${record.id})`;
    try {
      const sha = await gh.commit(head, { [env.LOG_PATH]: content, [env.HISTORY_PATH]: appendJsonl(history, record) }, message,
        { name: `Dashboard (${session.u})`, email: "dashboard@users.noreply.github.com" });
      console.log(JSON.stringify({ ereignis: "log_geloescht", benutzer: session.u, anzahl: removed.length, commit: sha }));
      return json({ ok: true, anzahl: removed.length, commit: sha, historie: { ...record, commit: sha } });
    } catch (e) {
      if (e instanceof GitHubError && e.status === 409 && attempt < 3) continue; // Branch hat sich bewegt: neu lesen
      throw e;
    }
  }
  return fail(409, "Das Protokoll wurde gleichzeitig geändert. Bitte erneut versuchen.");
}

// ---------------------------------------------------------------- Routen (nur mit Anmeldung)
const ROUTES = {
  "GET /api/me": (req, env, url, s) => json({ user: s.u, exp: s.exp, repo: env.GITHUB_REPO }),
  "GET /api/log": (req, env) => getLog(env),
  "GET /api/history": (req, env) => getHistory(env),
  "POST /api/log/delete": deleteEntries,
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      const missing = REQUIRED.filter((k) => !env[k]);
      if (missing.length) {
        return withHeaders(new Response(`Backend ist noch nicht eingerichtet. Fehlende Secrets: ${missing.join(", ")}`, { status: 503, headers: { "Content-Type": "text/plain; charset=utf-8" } }));
      }
      env = { LOG_PATH: "publisher/log.jsonl", HISTORY_PATH: "publisher/log_history.jsonl", ...env };

      if (path === "/api/login" && request.method === "POST") return await login(request, env, url);
      if (path === "/api/logout" && request.method === "POST") return logout(request, url);
      if (PUBLIC_PATHS.has(path) && (request.method === "GET" || request.method === "HEAD")) return withHeaders(await env.ASSETS.fetch(request));

      const session = await readSession(env.SESSION_SECRET, getCookie(request, SESSION_COOKIE));
      if (!session || !safeEqual(session.u, env.ADMIN_USER)) {
        if (path.startsWith("/api/")) return fail(401, "Nicht angemeldet.");
        const next = path + url.search;
        return withHeaders(new Response(null, { status: 302, headers: { Location: "/login?next=" + encodeURIComponent(next) } }));
      }

      const route = ROUTES[`${request.method} ${path}`];
      if (route) return await route(request, env, url, session);
      if (path.startsWith("/api/")) return fail(404, "Unbekannte Schnittstelle.");
      if (request.method !== "GET" && request.method !== "HEAD") return fail(405, "Nicht erlaubt.");
      return withHeaders(await env.ASSETS.fetch(request));
    } catch (e) {
      console.log(JSON.stringify({ ereignis: "fehler", pfad: path, meldung: String(e && e.message) }));
      const msg = e instanceof GitHubError ? `GitHub-Zugriff fehlgeschlagen: ${e.message}` : "Interner Fehler.";
      return fail(502, msg);
    }
  },
};
