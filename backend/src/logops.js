// Reine Funktionen für Änderungen an publisher/log.jsonl und an der Änderungs-Historie.

export const MAX_DELETE = 500;

export function berlinTime(date = new Date()) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("de-DE", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  }).formatToParts(date).map((x) => [x.type, x.value]));
  return `${p.day}.${p.month}.${p.year} ${p.hour}:${p.minute}:${p.second}`;
}

// Prüft die Anfrage des Dashboards: [{ line: <Zeilenindex ab 0>, text: <exakte Zeile> }, …]
export function validateSelection(entries) {
  if (!Array.isArray(entries) || !entries.length) return "Keine Einträge ausgewählt.";
  if (entries.length > MAX_DELETE) return `Höchstens ${MAX_DELETE} Einträge auf einmal.`;
  for (const e of entries) {
    if (!e || !Number.isInteger(e.line) || e.line < 0 || typeof e.text !== "string" || !e.text.trim()) return "Ungültige Auswahl.";
  }
  return null;
}

// Entfernt die ausgewählten Zeilen. Eine Zeile wird an ihrer bisherigen Position gesucht und, falls sich
// die Datei inzwischen verschoben hat, an anderer Stelle mit genau gleichem Inhalt.
export function removeLines(content, entries) {
  const lines = content.split("\n");
  const taken = new Set();
  const removed = [];
  const missing = [];
  for (const e of entries) {
    let idx = -1;
    if (lines[e.line] === e.text && !taken.has(e.line)) idx = e.line;
    else idx = lines.findIndex((l, i) => l === e.text && !taken.has(i));
    if (idx < 0) { missing.push(e); continue; }
    taken.add(idx);
    removed.push({ zeile: idx + 1, text: lines[idx] });
  }
  const next = lines.filter((_, i) => !taken.has(i)).join("\n");
  removed.sort((a, b) => a.zeile - b.zeile);
  return { content: next, removed, missing };
}

export function historyRecord({ user, reason, removed, baseSha, now = new Date() }) {
  return {
    id: crypto.randomUUID(),
    zeit: berlinTime(now),
    zeit_utc: now.toISOString(),
    benutzer: user,
    aktion: "gelöscht",
    datei: "publisher/log.jsonl",
    grund: reason || "",
    anzahl: removed.length,
    basis_commit: baseSha,
    eintraege: removed.map((r) => {
      let eintrag;
      try { eintrag = JSON.parse(r.text); } catch (e) { eintrag = null; }
      return { zeile: r.zeile, eintrag, text: r.text };
    }),
  };
}

export function appendJsonl(existing, record) {
  const base = existing || "";
  return base + (base && !base.endsWith("\n") ? "\n" : "") + JSON.stringify(record) + "\n";
}

export function parseHistory(text) {
  const out = [];
  for (const line of (text || "").split("\n")) {
    if (!line.trim()) continue;
    try { out.push(JSON.parse(line)); } catch (e) { /* defekte Zeile überspringen */ }
  }
  return out.reverse(); // neueste zuerst
}
