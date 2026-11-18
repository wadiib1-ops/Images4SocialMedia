/*
 * Projektfortschritt-Dashboard
 *
 * Aufbau (bewusst erweiterbar):
 *   1. Konfiguration   – Datenquellen, Aktualisierungsintervall
 *   2. Daten           – Laden und Normalisieren von publisher/log.jsonl zu "Ereignissen"
 *   3. Zustand         – Filter, gespeichert im Browser
 *   4. Auswertung      – reine Funktionen über die gefilterten Ereignisse
 *   5. Ansichten       – jede Karte ist ein Eintrag in VIEWS (render(ctx) -> HTML / DOM)
 *   6. Neue Einträge   – Erkennung beim Neuladen; Anknüpfungspunkt für spätere Benachrichtigungen
 *
 * Spätere Ausbaustufen (Löschen mit Anmeldung, Änderungs-Historie, E-Mail-Berichte,
 * Systemereignisse) docken an EVENT_KINDS, VIEWS und onNewEntries() an.
 */
(function () {
  "use strict";

  // ---------------------------------------------------------------- 1. Konfiguration
  const REPO_RAW = "https://raw.githubusercontent.com/wadiib1-ops/images4socialmedia/main/publisher/log.jsonl";
  const params = new URLSearchParams(location.search);
  // Mit Backend (Anmeldung): nur /api/log. Ohne Backend (lokal, statisch): ?src=…, dann die Datei im selben Repo,
  // dann raw.githubusercontent. Welcher Fall vorliegt, entscheidet detectAdmin() beim Start.
  let SOURCES = [params.get("src"), "../publisher/log.jsonl", REPO_RAW].filter(Boolean);
  const API = { me: "/api/me", log: "/api/log", history: "/api/history", del: "/api/log/delete", logout: "/api/logout" };
  const REFRESH_MS = 2 * 60 * 1000;
  const TZ = "Europe/Berlin";
  const STORE_KEY = "fortschritt-dashboard";

  // Ereignisarten. Neue Arten (z. B. "geloescht", "bearbeitet", "systemfehler") hier ergänzen.
  const EVENT_KINDS = {
    ok:   { label: "Veröffentlicht",  icon: "✓", cls: "ok" },
    fail: { label: "Fehlgeschlagen",  icon: "✕", cls: "fail" },
    skip: { label: "Übersprungen",    icon: "↷", cls: "skip" },
    run:  { label: "Lauf",            icon: "•", cls: "run" },
    other:{ label: "Sonstiges",       icon: "·", cls: "run" },
  };
  const PLATFORMS = {
    facebook:  { label: "Facebook",  short: "FB", color: "var(--fb)" },
    instagram: { label: "Instagram", short: "IG", color: "var(--ig)" },
  };
  const FORMAT_LABELS = { feed: "Feed", reel: "Reel", story: "Story", photo: "Foto" };
  const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

  // ---------------------------------------------------------------- Hilfen
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtInt = (n) => Math.round(n).toLocaleString("de-DE");
  const fmtPct = (n) => (isFinite(n) ? n.toLocaleString("de-DE", { maximumFractionDigits: 1 }) + " %" : "–");
  const pad = (n) => String(n).padStart(2, "0");
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  function store(key, val) {
    try {
      const all = JSON.parse(localStorage.getItem(STORE_KEY) || "{}");
      if (val === undefined) return all[key];
      all[key] = val;
      localStorage.setItem(STORE_KEY, JSON.stringify(all));
    } catch (e) { /* Speicher nicht verfügbar: Standardwerte gelten */ }
    return undefined;
  }

  // Tagesschlüssel "YYYY-MM-DD" in Berliner Zeit
  function berlinDayKey(date) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  }
  function addDays(dayKey, n) {
    const [y, m, d] = dayKey.split("-").map(Number);
    const t = new Date(Date.UTC(y, m - 1, d + n));
    return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
  }
  function weekdayIdx(dayKey) {
    const [y, m, d] = dayKey.split("-").map(Number);
    return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Mo = 0
  }
  const dayLabel = (k) => `${k.slice(8, 10)}.${k.slice(5, 7)}.`;
  const dayLabelLong = (k) => `${WEEKDAYS[weekdayIdx(k)]}, ${k.slice(8, 10)}.${k.slice(5, 7)}.${k.slice(0, 4)}`;

  // ---------------------------------------------------------------- 2. Daten
  async function loadLog() {
    let lastErr;
    for (const src of SOURCES) {
      try {
        const url = src + (src.includes("?") ? "&" : "?") + "ts=" + Date.now();
        const res = await fetch(url, { cache: "no-store", credentials: "same-origin" });
        if (res.status === 401 && state.admin) { toLogin(); throw new Error("nicht angemeldet"); }
        if (!res.ok) throw new Error("HTTP " + res.status);
        const text = await res.text();
        if (!text.trim().startsWith("{")) throw new Error("keine JSONL-Daten");
        return { text, src };
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error("keine Quelle erreichbar");
  }

  function parseLog(text) {
    const events = [];
    text.split("\n").forEach((line, i) => {
      if (!line.trim()) return;
      let r;
      try { r = JSON.parse(line); } catch (e) { return; }
      events.push(normalize(r, i));
    });
    return events;
  }

  function normalize(r, line) {
    // zeit: "18.11.2026 09:55:11" (Berliner Ortszeit)
    const m = /^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2})(?::(\d{2}))?/.exec(r.zeit || "");
    const day = m ? `${m[3]}-${m[2]}-${m[1]}` : "";
    const hour = m ? Number(m[4]) : 0;
    const time = m ? `${m[4]}:${m[5]}` : "";
    const sortKey = m ? `${day} ${m[4]}:${m[5]}:${m[6] || "00"}` : "";

    let kind = "other";
    if (r.aktion === "veröffentlicht" && r.ergebnis === "erfolg") kind = "ok";
    else if (r.aktion === "fehlgeschlagen") kind = "fail";
    else if (r.aktion === "übersprungen") kind = "skip";
    else if (r.aktion === "lauf") kind = "run";
    else if (r.ergebnis === "fehler") kind = "fail";

    // Beitrag: "<Meldung>-(fb|ig)-<format>[-rN]"
    const b = r.beitrag || "";
    const bm = /^(.*)-(fb|ig)-([a-z]+)(?:-r\d+)?$/.exec(b);
    const meldung = bm ? bm[1] : b;
    const format = bm ? bm[3] : "";
    const platform = r.plattform || (bm ? (bm[2] === "fb" ? "facebook" : "instagram") : "");
    const checked = kind === "run" ? Number((/(\d+)\s+Einträge/.exec(r.details || "") || [])[1] || 0) : 0;

    return { line, raw: r, day, hour, time, sortKey, kind, beitrag: b, meldung, format, platform, details: r.details || "", checked, test: /^test-/.test(b) };
  }

  // Fehlermeldungen zu lesbaren Gruppen zusammenfassen
  function errorCategory(ev) {
    const d = ev.details;
    if (/^Quelle bereits/.test(d)) return "Doppelt: Quelle bereits veröffentlicht";
    if (/^Titel bereits/.test(d)) return "Doppelt: Titel bereits veröffentlicht";
    if (/^Runde .* bereits/.test(d)) return "Doppelt: Runde bereits veröffentlicht";
    if (/Instagram-Verarbeitung dauert/.test(d)) return "Instagram-Verarbeitung dauert zu lange";
    if (/Instagram-Verarbeitung: ERROR/.test(d)) return "Instagram-Verarbeitung fehlgeschlagen";
    const j = d.indexOf("{");
    if (j >= 0) {
      try {
        const o = JSON.parse(d.slice(j));
        const e = o.error || o.debug_info || {};
        const t = e.error_user_title || e.message || e.type;
        if (t) return t.length > 70 ? t.slice(0, 68) + "…" : t;
      } catch (e) {
        const mm = /"error_user_title":"([^"]+)"/.exec(d) || /"message":"([^"]+)"/.exec(d);
        if (mm) { try { return JSON.parse('"' + mm[1] + '"'); } catch (e2) { return mm[1]; } }
      }
    }
    return d.replace(/\d{4}-\d{2}-\d{2}T[\d:.+]+/g, "…").replace(/\d{6,}/g, "…").slice(0, 70) || "Unbekannter Fehler";
  }

  // ---------------------------------------------------------------- 3. Zustand
  const state = {
    events: [],
    src: "",
    loadedAt: null,
    range: store("range") || "7",
    platform: store("platform") ?? "",
    selectedDay: null,
    table: { kind: "", q: "", limit: 100 },
    newLines: new Set(),
    lines: [],            // Rohzeilen von log.jsonl (für das Löschen)
    admin: null,          // { user, exp, repo } wenn über das Backend angemeldet
    selected: new Map(),  // Zeilenindex -> Rohzeile
    history: null,        // Änderungs-Historie vom Backend
  };

  function today() { return berlinDayKey(new Date()); }

  function rangeDays() {
    const end = today();
    if (state.range === "all") {
      const first = state.events.find((e) => e.day)?.day || end;
      return { start: first, end };
    }
    return { start: addDays(end, -(Number(state.range) - 1)), end };
  }
  function prevRange() {
    if (state.range === "all") return null;
    const n = Number(state.range);
    const { start } = rangeDays();
    return { start: addDays(start, -n), end: addDays(start, -1) };
  }
  function daysBetween(start, end) {
    const out = [];
    for (let k = start; k <= end; k = addDays(k, 1)) out.push(k);
    return out;
  }
  const inRange = (e, r) => e.day >= r.start && e.day <= r.end;
  const matchPlatform = (e) => !state.platform || e.platform === state.platform || e.kind === "run";

  // ---------------------------------------------------------------- 4. Auswertung
  function summarize(events) {
    const s = { ok: 0, fail: 0, skip: 0, run: 0, checked: 0, meldungen: new Set() };
    for (const e of events) {
      if (e.kind in s) s[e.kind]++;
      if (e.kind === "run") s.checked += e.checked;
      if (e.kind === "ok" && e.meldung) s.meldungen.add(e.meldung);
    }
    s.rate = s.ok + s.fail ? (s.ok / (s.ok + s.fail)) * 100 : NaN;
    return s;
  }

  function niceMax(v) {
    if (v <= 4) return 4;
    const p = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
    return 10 * p;
  }

  // ---------------------------------------------------------------- Tooltip
  const tip = $("#tooltip");
  function tipRows(title, rows) {
    return `<b>${esc(title)}</b>` + rows.map((r) =>
      `<div class="tt-row"><span>${r.color ? `<span class="sw" style="background:${r.color}"></span>` : ""}${esc(r.label)}</span><span>${esc(r.value)}</span></div>`).join("");
  }
  function showTip(html, x, y) {
    tip.innerHTML = html;
    tip.classList.add("show");
    const w = tip.offsetWidth, h = tip.offsetHeight;
    let left = x + 14, top = y + 14;
    if (left + w > innerWidth - 8) left = x - w - 14;
    if (top + h > innerHeight - 8) top = y - h - 14;
    tip.style.left = Math.max(8, left) + "px";
    tip.style.top = Math.max(8, top) + "px";
  }
  function hideTip() { tip.classList.remove("show"); }
  document.addEventListener("pointermove", (ev) => {
    const t = ev.target.closest && ev.target.closest("[data-tip]");
    if (t) showTip(TIPS.get(t.getAttribute("data-tip")) || "", ev.clientX, ev.clientY);
    else hideTip();
  });
  document.addEventListener("scroll", hideTip, { passive: true });
  const TIPS = new Map();
  let tipSeq = 0;
  function tipId(html) { const id = "t" + (++tipSeq); TIPS.set(id, html); return id; }

  // ---------------------------------------------------------------- Zahlen animiert hochzählen
  function countUp(el) {
    const target = Number(el.dataset.count);
    const dec = Number(el.dataset.dec || 0);
    const suffix = el.dataset.suffix || "";
    const fmt = (v) => v.toLocaleString("de-DE", { minimumFractionDigits: dec, maximumFractionDigits: dec }) + suffix;
    if (!isFinite(target)) { el.textContent = "–"; return; }
    if (reduceMotion) { el.textContent = fmt(target); return; }
    const t0 = performance.now(), dur = 900;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  // ---------------------------------------------------------------- SVG-Bausteine
  // Balken mit abgerundetem oberen Ende, unten an der Grundlinie verankert
  function barPath(x, y, w, h, r) {
    if (h <= 0) return "";
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }

  /**
   * Gestapelte Säulen über Zeit-Buckets.
   * buckets: [{ key, label, tipTitle, values: { serie: n } }]
   * series:  [{ key, label, color }]
   */
  function stackedColumns(el, { buckets, series, height = 240, selectable = false, selected = null, onSelect = null }) {
    const W = Math.max(280, el.clientWidth || 600);
    const H = height, m = { l: 34, r: 6, t: 10, b: 26 };
    const pw = W - m.l - m.r, ph = H - m.t - m.b;
    const n = buckets.length || 1;
    const band = pw / n;
    const bw = Math.max(2, Math.min(26, band * 0.68));
    const totals = buckets.map((b) => series.reduce((s, se) => s + (b.values[se.key] || 0), 0));
    const max = niceMax(Math.max(1, ...totals));
    const y = (v) => m.t + ph - (v / max) * ph;
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Säulendiagramm">`;
    const ticks = [4, 5, 3, 2].find((t) => Number.isInteger(max / t)) || 4;
    for (let i = 0; i <= ticks; i++) {
      const v = (max / ticks) * i, yy = y(v);
      svg += `<line class="${i ? "gridline" : "baseline"}" x1="${m.l}" x2="${W - m.r}" y1="${yy}" y2="${yy}"/>`;
      svg += `<text class="axis-text" x="${m.l - 6}" y="${yy + 4}" text-anchor="end">${fmtInt(v)}</text>`;
    }
    const labelEvery = Math.max(1, Math.ceil(n / Math.max(1, pw / 46)));
    buckets.forEach((b, i) => {
      const cx = m.l + band * i + band / 2;
      const x = cx - bw / 2;
      if (selectable && selected === b.key) svg += `<rect class="sel-band" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ph}" rx="6"/>`;
      let acc = 0;
      const nonZero = series.filter((se) => (b.values[se.key] || 0) > 0);
      series.forEach((se) => {
        const v = b.values[se.key] || 0;
        if (!v) return;
        const isTop = se === nonZero[nonZero.length - 1];
        const y0 = y(acc), y1 = y(acc + v);
        const gap = acc > 0 ? 2 : 0; // 2px Oberflächen-Abstand zwischen Segmenten
        const h = Math.max(0, y0 - y1 - gap);
        svg += isTop
          ? `<path class="grow-y" style="--d:${i * 18}" d="${barPath(x, y1, bw, h, 4)}" fill="${se.color}"/>`
          : `<rect class="grow-y" style="--d:${i * 18}" x="${x}" y="${y1}" width="${bw}" height="${h}" fill="${se.color}"/>`;
        acc += v;
      });
      if ((n - 1 - i) % labelEvery === 0) { // vom neuesten Tag aus beschriften
        svg += `<text class="axis-text" x="${cx}" y="${H - 8}" text-anchor="middle">${esc(b.label)}</text>`;
      }
      const rows = series.map((se) => ({ label: se.label, value: fmtInt(b.values[se.key] || 0), color: se.color }));
      if (series.length > 1) rows.push({ label: "Gesamt", value: fmtInt(totals[i]) });
      const id = tipId(tipRows(b.tipTitle || b.label, rows) + (selectable ? `<div class="card-note" style="margin-top:4px">Klicken für Tagesdetails</div>` : ""));
      svg += `<rect class="hit" data-tip="${id}" data-key="${esc(b.key)}" x="${m.l + band * i}" y="${m.t}" width="${band}" height="${ph + m.b}"/>`;
    });
    svg += `</svg>`;
    el.innerHTML = svg;
    if (selectable && onSelect) {
      el.querySelectorAll(".hit").forEach((h) => h.addEventListener("click", () => onSelect(h.getAttribute("data-key"))));
    }
  }

  function legend(series) {
    return `<div class="legend">${series.map((s) => `<span><i class="sw" style="background:${s.color}"></i>${esc(s.label)}</span>`).join("")}</div>`;
  }

  function sparkline(values, color) {
    const W = 84, H = 28, n = values.length;
    if (n < 2) return "";
    const max = Math.max(1, ...values);
    const pts = values.map((v, i) => `${(i / (n - 1)) * W},${H - 2 - (v / max) * (H - 4)}`).join(" ");
    const len = W * 3;
    return `<svg class="spark" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"
        style="stroke-dasharray:${len};stroke-dashoffset:${reduceMotion ? 0 : len};animation:${reduceMotion ? "none" : "dash 1.2s .2s ease forwards"}"/>
    </svg>`;
  }
  const dashStyle = document.createElement("style");
  dashStyle.textContent = "@keyframes dash{to{stroke-dashoffset:0}}";
  document.head.appendChild(dashStyle);

  // ---------------------------------------------------------------- 5. Ansichten
  // Jede Ansicht: { id, span, render(ctx, el) }. Neue Karten einfach anhängen.
  const VIEWS = [
    { id: "trend", span: 8, render: viewTrend },
    { id: "day", span: 4, render: viewDay },
    { id: "issues", span: 12, render: viewIssueTrend },
    { id: "formats", span: 5, render: viewFormats },
    { id: "heatmap", span: 7, render: viewHeatmap },
    { id: "errors", span: 12, render: viewErrors },
    { id: "log", span: 12, render: viewLog },
    { id: "history", span: 12, render: viewHistory, admin: true },
  ];
  const visibleViews = () => VIEWS.filter((v) => !v.admin || state.admin);

  function activeSeries() {
    return Object.entries(PLATFORMS)
      .filter(([k]) => !state.platform || state.platform === k)
      .map(([k, p]) => ({ key: k, label: p.label, color: p.color }));
  }

  function buildCtx() {
    const r = rangeDays();
    const all = state.events.filter(matchPlatform);
    const cur = all.filter((e) => inRange(e, r));
    const pr = prevRange();
    const prev = pr ? all.filter((e) => inRange(e, pr)) : null;
    return { range: r, prevRange: pr, all, cur, prev, s: summarize(cur), ps: prev ? summarize(prev) : null, series: activeSeries() };
  }

  function rangeLabel() {
    return { "1": "heute", "7": "letzte 7 Tage", "30": "letzte 30 Tage", all: "gesamter Zeitraum" }[state.range];
  }
  function deltaHtml(cur, prev, invert = false) {
    if (prev == null) return "";
    const d = cur - prev;
    if (!d) return `<span>±0 ggü. Vorperiode</span>`;
    const good = invert ? d < 0 : d > 0;
    return `<span class="${good ? "delta-up" : "delta-down"}">${d > 0 ? "▲ +" : "▼ "}${fmtInt(d)}</span> ggü. Vorperiode`;
  }

  function renderKpis(ctx) {
    const { s, ps } = ctx;
    const last14 = daysBetween(addDays(today(), -13), today());
    const okByDay = new Map(last14.map((d) => [d, 0]));
    ctx.all.forEach((e) => { if (e.kind === "ok" && okByDay.has(e.day)) okByDay.set(e.day, okByDay.get(e.day) + 1); });
    const tiles = [
      { label: "Veröffentlicht", value: s.ok, foot: deltaHtml(s.ok, ps?.ok), extra: sparkline([...okByDay.values()], "var(--accent)") },
      { label: "Meldungen", value: s.meldungen.size, foot: ps ? deltaHtml(s.meldungen.size, ps.meldungen.size) : "verschiedene Meldungen" },
      { label: "Erfolgsquote", value: s.rate, dec: 1, suffix: " %", foot: "", meter: s.rate },
      { label: `<i style="color:var(--crit);font-style:normal">✕</i> Fehlgeschlagen`, value: s.fail, foot: deltaHtml(s.fail, ps?.fail, true) },
      { label: `<i style="color:var(--warn);font-style:normal">↷</i> Übersprungen`, value: s.skip, foot: "meist doppelte Beiträge" },
      { label: "Läufe", value: s.run, foot: s.run ? `Ø ${fmtInt(s.checked / s.run)} Einträge geprüft` : "" },
    ];
    return `<section class="kpis">${tiles.map((t, i) => `
      <div class="card kpi" style="--i:${i}">
        ${t.extra || ""}
        <div class="kpi-label">${t.label}</div>
        <div class="kpi-value" data-count="${t.value}" data-dec="${t.dec || 0}" data-suffix="${t.suffix || ""}">0</div>
        ${t.meter != null ? `<div class="meter"><span style="width:${isFinite(t.meter) ? t.meter : 0}%"></span></div>` : ""}
        <div class="kpi-foot">${t.foot || ""}</div>
      </div>`).join("")}</section>`;
  }

  function viewTrend(ctx, el) {
    const hourly = state.range === "1";
    let buckets;
    if (hourly) {
      buckets = Array.from({ length: 24 }, (_, h) => ({ key: String(h), label: pad(h), tipTitle: `${pad(h)}:00–${pad(h)}:59 Uhr`, values: {} }));
      ctx.cur.forEach((e) => { if (e.kind === "ok") { const b = buckets[e.hour]; b.values[e.platform] = (b.values[e.platform] || 0) + 1; } });
    } else {
      const days = daysBetween(ctx.range.start, ctx.range.end);
      const idx = new Map(days.map((d, i) => [d, i]));
      buckets = days.map((d) => ({ key: d, label: dayLabel(d), tipTitle: dayLabelLong(d), values: {} }));
      ctx.cur.forEach((e) => { if (e.kind === "ok" && idx.has(e.day)) { const b = buckets[idx.get(e.day)]; b.values[e.platform] = (b.values[e.platform] || 0) + 1; } });
    }
    el.innerHTML = `<div class="card-head"><h2>${hourly ? "Veröffentlichungen heute nach Stunde" : "Veröffentlichungen pro Tag"}</h2>${ctx.series.length > 1 ? legend(ctx.series) : ""}</div><div class="chart" id="cTrend"></div>`;
    stackedColumns($("#cTrend", el), {
      buckets, series: ctx.series, height: 290, selectable: !hourly, selected: state.selectedDay,
      onSelect: (d) => { state.selectedDay = d; renderAll(false); },
    });
  }

  function viewIssueTrend(ctx, el) {
    const days = daysBetween(ctx.range.start, ctx.range.end);
    const hourly = state.range === "1";
    const series = [
      { key: "fail", label: "Fehlgeschlagen", color: "var(--crit)" },
      { key: "skip", label: "Übersprungen", color: "var(--warn)" },
    ];
    let buckets;
    if (hourly) {
      buckets = Array.from({ length: 24 }, (_, h) => ({ key: String(h), label: pad(h), tipTitle: `${pad(h)}:00 Uhr`, values: {} }));
      ctx.cur.forEach((e) => { if (e.kind === "fail" || e.kind === "skip") buckets[e.hour].values[e.kind] = (buckets[e.hour].values[e.kind] || 0) + 1; });
    } else {
      const idx = new Map(days.map((d, i) => [d, i]));
      buckets = days.map((d) => ({ key: d, label: dayLabel(d), tipTitle: dayLabelLong(d), values: {} }));
      ctx.cur.forEach((e) => { if ((e.kind === "fail" || e.kind === "skip") && idx.has(e.day)) { const b = buckets[idx.get(e.day)]; b.values[e.kind] = (b.values[e.kind] || 0) + 1; } });
    }
    el.innerHTML = `<div class="card-head"><h2>Probleme pro ${hourly ? "Stunde" : "Tag"}</h2>
      <div class="legend"><span><i class="sw" style="background:var(--crit)"></i>✕ Fehlgeschlagen</span><span><i class="sw" style="background:var(--warn)"></i>↷ Übersprungen</span></div></div>
      <div class="chart" id="cIssues"></div>`;
    stackedColumns($("#cIssues", el), { buckets, series, height: 150, selectable: !hourly, selected: state.selectedDay, onSelect: (d) => { state.selectedDay = d; renderAll(false); } });
  }

  function viewDay(ctx, el) {
    const days = [...new Set(state.events.map((e) => e.day).filter(Boolean))].sort();
    const day = state.selectedDay || days[days.length - 1] || today();
    const evs = state.events.filter((e) => e.day === day && matchPlatform(e) && e.beitrag);
    const groups = new Map();
    for (const e of evs) {
      if (!groups.has(e.meldung)) groups.set(e.meldung, { id: e.meldung, first: e.time, items: new Map() });
      const g = groups.get(e.meldung);
      if (e.time < g.first) g.first = e.time;
      const key = `${e.platform}|${e.format}`;
      const prevKind = g.items.get(key);
      if (prevKind !== "ok") g.items.set(key, e.kind); // Erfolg gewinnt gegenüber früheren Fehlern
    }
    const list = [...groups.values()].sort((a, b) => b.first.localeCompare(a.first));
    const s = summarize(state.events.filter((e) => e.day === day && matchPlatform(e)));
    el.innerHTML = `<div class="card-head"><h2>Tagesfortschritt</h2>
        <input type="date" id="dayPick" value="${day}" min="${days[0] || ""}" max="${days[days.length - 1] || ""}" aria-label="Tag wählen"></div>
      <div class="day-sum"><span><b>${dayLabelLong(day)}</b></span><span><b>${s.meldungen.size}</b> Meldungen</span><span><b>${s.ok}</b> Beiträge</span><span><b>${s.fail}</b> Fehler</span><span><b>${s.run}</b> Läufe</span></div>
      <div class="day-list">${list.length ? list.map((g, i) => `
        <div class="day-item" style="--i:${Math.min(i, 20)}">
          <div class="day-time">${esc(g.first)}</div>
          <div><div class="day-id">${esc(g.id)}</div><div class="chips">${[...g.items.entries()].sort().map(([k, kind]) => {
            const [pl, fm] = k.split("|"); const K = EVENT_KINDS[kind] || EVENT_KINDS.other; const P = PLATFORMS[pl];
            return `<span class="chip st-${K.cls}" title="${esc(K.label)}"><span class="pdot" style="background:${P ? P.color : "var(--muted)"}"></span>${esc(P ? P.short : pl)} ${esc(FORMAT_LABELS[fm] || fm)} <i>${K.icon}</i></span>`;
          }).join("")}</div></div>
        </div>`).join("") : `<div class="empty">Keine Beiträge an diesem Tag.</div>`}</div>`;
    $("#dayPick", el).addEventListener("change", (ev) => { if (ev.target.value) { state.selectedDay = ev.target.value; renderAll(false); } });
  }

  function viewFormats(ctx, el) {
    const counts = {};
    ctx.cur.forEach((e) => { if (e.kind === "ok" && e.format) { counts[e.format] = counts[e.format] || {}; counts[e.format][e.platform] = (counts[e.format][e.platform] || 0) + 1; } });
    const rows = Object.entries(counts).map(([f, v]) => ({ f, v, total: Object.values(v).reduce((a, b) => a + b, 0) })).sort((a, b) => b.total - a.total);
    const max = Math.max(1, ...rows.map((r) => r.total));
    el.innerHTML = `<div class="card-head"><h2>Formate</h2>${ctx.series.length > 1 ? legend(ctx.series) : ""}</div>
      ${rows.length ? `<div class="hbars">${rows.map((r, i) => `
        <div class="hbar-row"><span class="hbar-label">${esc(FORMAT_LABELS[r.f] || r.f)}</span>
          <div class="hbar-track grow-x" style="--d:${i * 80};width:${(r.total / max) * 100}%">${ctx.series.filter((s) => r.v[s.key]).map((s) =>
            `<span data-tip="${tipId(tipRows(`${FORMAT_LABELS[r.f] || r.f} · ${s.label}`, [{ label: "Veröffentlicht", value: fmtInt(r.v[s.key]), color: s.color }]))}" style="flex:${r.v[s.key]};background:${s.color}"></span>`).join("")}</div>
          <span class="hbar-val">${fmtInt(r.total)}</span></div>`).join("")}</div>` : `<div class="empty">Keine Veröffentlichungen im Zeitraum.</div>`}`;
  }

  function viewHeatmap(ctx, el) {
    const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
    ctx.cur.forEach((e) => { if (e.kind === "ok" && e.day) grid[weekdayIdx(e.day)][e.hour]++; });
    const max = Math.max(1, ...grid.flat());
    const step = (v) => (v === 0 ? 0 : Math.min(5, 1 + Math.floor((v / max) * 4.999)));
    el.innerHTML = `<div class="card-head"><h2>Aktivität nach Wochentag und Uhrzeit</h2><span class="card-note">Veröffentlichungen, Berliner Zeit</span></div><div class="chart" id="cHeat"></div>
      <div class="legend" style="margin-top:8px"><span>weniger</span>${[0, 1, 2, 3, 4, 5].map((i) => `<i class="sw" style="background:var(--seq-${i})"></i>`).join("")}<span>mehr</span></div>`;
    const c = $("#cHeat", el);
    const W = Math.max(300, c.clientWidth || 600), m = { l: 26, t: 4, b: 18 };
    const cw = (W - m.l) / 24, ch = Math.min(26, Math.max(14, cw));
    const H = m.t + ch * 7 + m.b;
    let svg = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Heatmap Wochentag und Stunde">`;
    WEEKDAYS.forEach((d, r) => { svg += `<text class="axis-text" x="0" y="${m.t + r * ch + ch / 2 + 4}">${d}</text>`; });
    for (let h = 0; h < 24; h += cw < 22 ? 3 : 2) svg += `<text class="axis-text" x="${m.l + h * cw + cw / 2}" y="${H - 4}" text-anchor="middle">${pad(h)}</text>`;
    grid.forEach((row, r) => row.forEach((v, h) => {
      const id = tipId(tipRows(`${WEEKDAYS[r]}, ${pad(h)}:00–${pad(h)}:59`, [{ label: "Veröffentlicht", value: fmtInt(v) }]));
      svg += `<rect class="fade" style="--d:${(r * 24 + h) * 4}" data-tip="${id}" x="${m.l + h * cw + 1}" y="${m.t + r * ch + 1}" width="${cw - 2}" height="${ch - 2}" rx="3" fill="var(--seq-${step(v)})"/>`;
    }));
    c.innerHTML = svg + "</svg>";
  }

  function viewErrors(ctx, el) {
    const errs = ctx.cur.filter((e) => e.kind === "fail" || e.kind === "skip");
    const cats = new Map();
    errs.forEach((e) => {
      const c = errorCategory(e);
      if (!cats.has(c)) cats.set(c, { c, fail: 0, skip: 0, last: e });
      const o = cats.get(c); o[e.kind]++; if (e.sortKey > o.last.sortKey) o.last = e;
    });
    const rows = [...cats.values()].sort((a, b) => (b.fail + b.skip) - (a.fail + a.skip));
    const max = Math.max(1, ...rows.map((r) => r.fail + r.skip));
    const latest = errs.filter((e) => e.kind === "fail").sort((a, b) => b.sortKey.localeCompare(a.sortKey)).slice(0, 6);
    el.innerHTML = `<div class="card-head"><h2>Fehleranalyse</h2><span class="card-note">${fmtInt(errs.length)} Probleme · ${rangeLabel()}</span></div>
      ${rows.length ? `<div class="grid" style="gap:20px">
        <div class="span-7"><div class="hbars">${rows.slice(0, 10).map((r, i) => `
          <div class="hbar-row"><span class="hbar-label" title="${esc(r.c)}">${esc(r.c)}</span>
            <div class="hbar-track grow-x" style="--d:${i * 60};width:${((r.fail + r.skip) / max) * 100}%">
              ${r.fail ? `<span data-tip="${tipId(tipRows(r.c, [{ label: "✕ Fehlgeschlagen", value: r.fail, color: "var(--crit)" }]))}" style="flex:${r.fail};background:var(--crit)"></span>` : ""}
              ${r.skip ? `<span data-tip="${tipId(tipRows(r.c, [{ label: "↷ Übersprungen", value: r.skip, color: "var(--warn)" }]))}" style="flex:${r.skip};background:var(--warn)"></span>` : ""}
            </div><span class="hbar-val">${r.fail + r.skip}</span></div>`).join("")}</div></div>
        <div class="span-5"><div class="card-note" style="margin-bottom:6px">Letzte Fehlschläge</div>
          ${latest.length ? `<table><tbody>${latest.map((e) => `<tr><td class="time">${dayLabel(e.day)} ${esc(e.time)}</td><td><div>${esc(e.beitrag)}</div><div class="card-note">${esc(errorCategory(e))}</div></td></tr>`).join("")}</tbody></table>` : `<div class="empty">Keine Fehlschläge im Zeitraum.</div>`}
        </div></div>` : `<div class="empty">✓ Keine Fehler im Zeitraum.</div>`}`;
  }

  function viewLog(ctx, el) {
    const t = state.table;
    const q = t.q.trim().toLowerCase();
    const admin = !!state.admin;
    const rows = ctx.cur.filter((e) => (!t.kind || e.kind === t.kind) && (!q || (e.beitrag + " " + e.details).toLowerCase().includes(q)))
      .sort((a, b) => b.line - a.line);
    const shown = rows.slice(0, t.limit);
    const nSel = state.selected.size;
    const allShownSel = shown.length > 0 && shown.every((e) => state.selected.has(e.line));
    el.innerHTML = `<div class="card-head"><h2>Protokoll</h2><span class="card-note">${fmtInt(rows.length)} Einträge · ${rangeLabel()}</span></div>
      <div class="table-tools">
        <select id="tKind" aria-label="Ereignisart"><option value="">alle Ereignisse</option>${Object.entries(EVENT_KINDS).filter(([k]) => k !== "other").map(([k, v]) => `<option value="${k}" ${t.kind === k ? "selected" : ""}>${v.label}</option>`).join("")}</select>
        <input id="tQ" type="search" placeholder="Beitrag oder Details suchen" value="${esc(t.q)}">
      </div>
      ${admin ? `<div class="sel-bar">
        <span class="grow">${nSel ? `<b>${fmtInt(nSel)}</b> ausgewählt` : "Einträge zum Löschen auswählen"}</span>
        <button class="icon-btn" id="tSelAll" ${rows.length ? "" : "disabled"}>Alle ${fmtInt(rows.length)} Treffer wählen</button>
        <button class="icon-btn" id="tSelNone" ${nSel ? "" : "disabled"}>Auswahl aufheben</button>
        <button class="btn-danger" id="tDelete" ${nSel ? "" : "disabled"}>Ausgewählte löschen</button>
      </div>` : ""}
      <div class="table-scroll"><table>
        <thead><tr>${admin ? `<th class="sel-col"><input type="checkbox" id="tSelShown" aria-label="Angezeigte Einträge wählen" ${allShownSel ? "checked" : ""}></th>` : ""}<th>Zeit</th><th>Ereignis</th><th>Beitrag</th><th>Plattform</th><th>Details</th></tr></thead>
        <tbody>${shown.length ? shown.map((e) => { const K = EVENT_KINDS[e.kind]; const sel = state.selected.has(e.line); return `<tr class="${state.newLines.has(e.line) ? "is-new" : ""} ${sel ? "is-sel" : ""}">
          ${admin ? `<td class="sel-col"><input type="checkbox" data-line="${e.line}" aria-label="Eintrag wählen" ${sel ? "checked" : ""}></td>` : ""}
          <td class="time">${dayLabel(e.day)} ${esc(e.time)}</td>
          <td><span class="badge ${K.cls}"><i>${K.icon}</i>${K.label}</span></td>
          <td>${esc(e.beitrag || "–")}</td>
          <td>${esc(PLATFORMS[e.platform]?.label || "–")}</td>
          <td class="details">${esc(e.kind === "fail" || e.kind === "skip" ? errorCategory(e) : e.details)}</td></tr>`; }).join("") : `<tr><td colspan="${admin ? 6 : 5}" class="empty">Keine Einträge.</td></tr>`}</tbody>
      </table></div>
      ${rows.length > t.limit ? `<button class="icon-btn more" id="tMore">${fmtInt(Math.min(100, rows.length - t.limit))} weitere anzeigen</button>` : ""}`;
    const redraw = () => viewLog(buildCtx(), el);
    $("#tKind", el).addEventListener("change", (ev) => { t.kind = ev.target.value; t.limit = 100; redraw(); });
    const qi = $("#tQ", el);
    let timer;
    qi.addEventListener("input", () => { clearTimeout(timer); timer = setTimeout(() => { t.q = qi.value; t.limit = 100; redraw(); const n = $("#tQ", el); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200); });
    $("#tMore", el)?.addEventListener("click", () => { t.limit += 100; redraw(); });
    if (!admin) return;
    const pick = (e, on) => { if (on) state.selected.set(e.line, state.lines[e.line]); else state.selected.delete(e.line); };
    el.querySelector("tbody").addEventListener("change", (ev) => {
      const cb = ev.target.closest("input[data-line]"); if (!cb) return;
      const e = shown.find((x) => x.line === Number(cb.dataset.line)); if (e) pick(e, cb.checked);
      redraw();
    });
    $("#tSelShown", el).addEventListener("change", (ev) => { shown.forEach((e) => pick(e, ev.target.checked)); redraw(); });
    $("#tSelAll", el).addEventListener("click", () => { rows.forEach((e) => pick(e, true)); redraw(); });
    $("#tSelNone", el).addEventListener("click", () => { state.selected.clear(); redraw(); });
    $("#tDelete", el).addEventListener("click", openDeleteDialog);
  }

  // Änderungs-Historie: jede Löschung mit Zeit, Benutzer, Grund und den vollständigen gelöschten Zeilen.
  function viewHistory(ctx, el) {
    const h = state.history;
    const repo = state.admin?.repo || "";
    const head = `<div class="card-head"><h2>Änderungs-Historie</h2><span class="card-note">${h ? `${fmtInt(h.length)} Änderungen · <a href="https://github.com/${esc(repo)}/commits/main/publisher/log_history.jsonl" target="_blank" rel="noopener">Verlauf auf GitHub</a>` : ""}</span></div>`;
    if (!h) {
      el.innerHTML = head + `<div class="state" style="padding:24px"><div class="spinner"></div>Historie wird geladen …</div>`;
      loadHistory().then(() => viewHistory(buildCtx(), el)).catch((e) => { el.innerHTML = head + `<div class="empty">Historie konnte nicht geladen werden (${esc(e.message)}).</div>`; });
      return;
    }
    el.innerHTML = head + (h.length ? `<div class="hist">${h.slice(0, 200).map((r, i) => `
      <div class="hist-item" style="--i:${Math.min(i, 10)}">
        <div class="hist-head"><b>✕ ${fmtInt(r.anzahl || 0)} ${r.anzahl === 1 ? "Eintrag" : "Einträge"} gelöscht</b>
          <span>${esc(r.zeit)}</span><span class="card-note">von ${esc(r.benutzer)}</span>
</div>
        <div class="hist-reason">Grund: ${esc(r.grund || "–")}</div>
        <details><summary>Gelöschte Einträge anzeigen</summary>
          ${(r.eintraege || []).map((x) => `<pre>Zeile ${fmtInt(x.zeile)}: ${esc(x.text)}</pre>`).join("")}
        </details>
      </div>`).join("")}</div>` : `<div class="empty">Noch keine Änderungen.</div>`);
  }

  async function loadHistory() {
    const res = await fetch(API.history, { cache: "no-store", credentials: "same-origin" });
    if (res.status === 401) { toLogin(); throw new Error("nicht angemeldet"); }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "HTTP " + res.status);
    state.history = data.eintraege || [];
  }

  // ---------------------------------------------------------------- Rendern
  let lastWidth = 0;
  function renderAll(full = true) {
    TIPS.clear();
    const ctx = buildCtx();
    const app = $("#app");
    if (full || !app.querySelector(".kpis")) {
      app.innerHTML = renderKpis(ctx) + `<div class="grid">${visibleViews().map((v, i) => `<section class="card span-${v.span}" style="--i:${i + 2}" id="v-${v.id}"></section>`).join("")}</div>`;
      app.querySelectorAll("[data-count]").forEach(countUp);
      visibleViews().forEach((v) => v.render(ctx, $("#v-" + v.id)));
    } else {
      // Teil-Aktualisierung (z. B. Tag gewählt): Karten ohne Einblend-Animation neu zeichnen
      ["trend", "issues", "day"].forEach((id) => { const v = VIEWS.find((x) => x.id === id); const el = $("#v-" + id); el.style.animation = "none"; v.render(ctx, el); });
    }
    lastWidth = app.clientWidth;
    $("#stand").textContent = state.loadedAt ? state.loadedAt.toLocaleString("de-DE", { timeZone: TZ, dateStyle: "short", timeStyle: "short" }) : "–";
    $("#srcInfo").textContent = `${fmtInt(state.events.length)} Protokolleinträge · Quelle: ${state.admin ? "GitHub (angemeldet)" : state.src.startsWith("http") ? "GitHub" : state.src}`;
  }

  window.addEventListener("resize", () => {
    clearTimeout(window.__rz);
    window.__rz = setTimeout(() => {
      if (!state.events.length || Math.abs($("#app").clientWidth - lastWidth) <= 20) return;
      renderAll(false);
      const v = VIEWS.find((x) => x.id === "heatmap");
      v.render(buildCtx(), $("#v-heatmap"));
    }, 200);
  });

  // ---------------------------------------------------------------- Filter-Bedienung
  function bindSeg(id, key) {
    const seg = $(id);
    const sync = () => seg.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.v === state[key])));
    seg.addEventListener("click", (ev) => {
      const b = ev.target.closest("button"); if (!b) return;
      state[key] = b.dataset.v; store(key, state[key]); sync();
      state.table.limit = 100;
      renderAll(true);
    });
    sync();
  }

  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t); else document.documentElement.removeAttribute("data-theme");
  }
  const currentTheme = () => document.documentElement.getAttribute("data-theme") || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  const syncThemeBtn = () => { $("#btnTheme").textContent = currentTheme() === "dark" ? "☀ Hell" : "☾ Dunkel"; };
  $("#btnTheme").addEventListener("click", () => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    applyTheme(next); store("theme", next); syncThemeBtn();
  });
  applyTheme(store("theme"));
  syncThemeBtn();

  // ---------------------------------------------------------------- 6. Neue Einträge
  // Anknüpfungspunkt für spätere Benachrichtigungen (Browser, E-Mail): erhält die neuen Ereignisse.
  function onNewEntries(newEvents, { sinceLastVisit }) {
    const relevant = newEvents.filter((e) => e.kind !== "run");
    if (!relevant.length) return;
    const ok = relevant.filter((e) => e.kind === "ok").length;
    const fail = relevant.filter((e) => e.kind === "fail").length;
    const parts = [];
    if (ok) parts.push(`${fmtInt(ok)} neu veröffentlicht`);
    if (fail) parts.push(`${fmtInt(fail)} fehlgeschlagen`);
    const rest = relevant.length - ok - fail;
    if (rest) parts.push(`${fmtInt(rest)} übersprungen`);
    $("#bannerText").innerHTML = `<b>${sinceLastVisit ? "Seit deinem letzten Besuch" : "Neu"}:</b> ${parts.join(", ")}`;
    $("#banner").classList.add("show");
  }
  $("#bannerOk").addEventListener("click", () => {
    $("#banner").classList.remove("show");
    state.newLines.clear();
    store("seenLines", state.events.length);
    const el = $("#v-log"); if (el) viewLog(buildCtx(), el);
  });

  async function refresh(initial, force) {
    const live = $("#live");
    try {
      const { text, src } = await loadLog();
      const events = parseLog(text);
      state.lines = text.split("\n");
      for (const [line, raw] of state.selected) if (state.lines[line] !== raw) state.selected.delete(line);
      const before = initial ? Number(store("seenLines") || 0) : state.events.length;
      const changed = initial || force || events.length !== state.events.length;
      state.events = events;
      state.src = src;
      state.loadedAt = new Date();
      live.classList.remove("off");
      $("#liveText").textContent = "Live";
      if (before && events.length > before) {
        const fresh = events.slice(before);
        fresh.forEach((e) => state.newLines.add(e.line));
        onNewEntries(fresh, { sinceLastVisit: initial });
      }
      if (initial && !before) store("seenLines", events.length);
      if (changed) renderAll(true);
      else $("#stand").textContent = state.loadedAt.toLocaleString("de-DE", { timeZone: TZ, dateStyle: "short", timeStyle: "short" });
    } catch (e) {
      live.classList.add("off");
      $("#liveText").textContent = "offline";
      if (initial) $("#app").innerHTML = `<div class="state">Das Protokoll konnte nicht geladen werden (${esc(e.message)}).<br>Bitte später erneut versuchen.</div>`;
    }
  }

  // ---------------------------------------------------------------- 7. Verwaltung (nur mit Backend-Anmeldung)
  function toLogin() {
    location.replace("/login?next=" + encodeURIComponent(location.pathname + location.search));
  }

  // Wird die Seite vom Backend ausgeliefert, liefert /api/me den angemeldeten Benutzer.
  // Auf einer statischen Seite (lokal) gibt es /api/me nicht: dann nur Anzeige, keine Verwaltung.
  async function detectAdmin() {
    if (params.get("src")) return;
    try {
      const res = await fetch(API.me, { cache: "no-store", credentials: "same-origin" });
      if (res.status === 401) { toLogin(); return new Promise(() => {}); }
      if (!res.ok || !(res.headers.get("Content-Type") || "").includes("json")) return;
      state.admin = await res.json();
      SOURCES = [API.log];
      const chip = document.createElement("span");
      chip.className = "user-chip";
      chip.innerHTML = `👤 ${esc(state.admin.user)}`;
      const out = document.createElement("button");
      out.className = "icon-btn"; out.id = "btnLogout"; out.textContent = "Abmelden";
      out.addEventListener("click", async () => {
        try { await fetch(API.logout, { method: "POST", credentials: "same-origin" }); } catch (e) { /* trotzdem weiter */ }
        location.replace("/login");
      });
      $(".filters").append(chip, out);
      // Sitzung läuft ab: rechtzeitig zur Anmeldung
      const ms = state.admin.exp * 1000 - Date.now();
      if (ms > 0) setTimeout(toLogin, Math.min(ms, 2147483647));
    } catch (e) { /* kein Backend erreichbar: statischer Modus */ }
  }

  function toast(msg) {
    document.querySelectorAll(".toast").forEach((t) => t.remove());
    const t = document.createElement("div");
    t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 6000);
  }

  function openDeleteDialog() {
    const sel = [...state.selected.entries()].sort((a, b) => a[0] - b[0]);
    if (!sel.length) return;
    const byLine = new Map(state.events.map((e) => [e.line, e]));
    const dlg = document.createElement("dialog");
    dlg.className = "modal";
    dlg.innerHTML = `<form method="dialog">
      <h2>${fmtInt(sel.length)} ${sel.length === 1 ? "Eintrag" : "Einträge"} löschen?</h2>
      <div class="card-note">Die Zeilen werden aus publisher/log.jsonl entfernt (ein Commit im Repo). Sie bleiben vollständig in der Änderungs-Historie erhalten.</div>
      <div class="modal-list">${sel.slice(0, 50).map(([line]) => { const e = byLine.get(line); return `<div>${e ? `${dayLabel(e.day)} ${esc(e.time)} · ${esc(EVENT_KINDS[e.kind].label)} · ${esc(e.beitrag || e.details)}` : "Zeile " + (line + 1)}</div>`; }).join("")}${sel.length > 50 ? `<div>… und ${fmtInt(sel.length - 50)} weitere</div>` : ""}</div>
      <label class="card-note" for="delReason">Grund (steht in der Historie)</label>
      <textarea id="delReason" maxlength="500" required placeholder="z. B. Testeinträge entfernen"></textarea>
      <div class="login-error" id="delErr" role="alert"></div>
      <div class="modal-actions"><button class="icon-btn" value="cancel" formnovalidate>Abbrechen</button><button class="btn-danger" id="delGo" value="ok">Endgültig löschen</button></div>
    </form>`;
    document.body.appendChild(dlg);
    dlg.addEventListener("close", () => dlg.remove());
    const go = $("#delGo", dlg);
    $("#delReason", dlg).addEventListener("input", () => { $("#delErr", dlg).textContent = ""; });
    go.addEventListener("click", async (ev) => {
      ev.preventDefault();
      const reason = $("#delReason", dlg).value.trim();
      if (!reason) { $("#delErr", dlg).textContent = "Bitte einen Grund angeben."; return; }
      go.disabled = true; go.textContent = "Lösche …";
      try {
        const res = await fetch(API.del, {
          method: "POST", credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason, entries: sel.map(([line, text]) => ({ line, text })) }),
        });
        if (res.status === 401) { toLogin(); return; }
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "HTTP " + res.status);
        state.selected.clear();
        state.history = null;
        store("seenLines", Math.max(0, Number(store("seenLines") || 0) - data.anzahl));
        dlg.close();
        toast(`${fmtInt(data.anzahl)} ${data.anzahl === 1 ? "Eintrag" : "Einträge"} gelöscht und in der Historie vermerkt.`);
        await refresh(false, true);
      } catch (e) {
        $("#delErr", dlg).textContent = e.message;
        go.disabled = false; go.textContent = "Endgültig löschen";
      }
    });
    dlg.showModal();
  }

  bindSeg("#fRange", "range");
  bindSeg("#fPlat", "platform");
  $("#btnRefresh").addEventListener("click", () => { state.history = null; refresh(false, true); });
  detectAdmin().then(() => refresh(true));
  setInterval(() => { if (!document.hidden) refresh(false); }, REFRESH_MS);
})();
