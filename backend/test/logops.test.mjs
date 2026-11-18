import assert from "node:assert/strict";
import test from "node:test";
import { appendJsonl, berlinTime, historyRecord, parseHistory, removeLines, validateSelection } from "../src/logops.js";

const L = ['{"a":1}', '{"a":2}', '{"a":3}', '{"a":2}', ""].join("\n");

test("Zeilen an ihrer Position entfernen", () => {
  const r = removeLines(L, [{ line: 1, text: '{"a":2}' }]);
  assert.equal(r.content, ['{"a":1}', '{"a":3}', '{"a":2}', ""].join("\n"));
  assert.deepEqual(r.removed, [{ zeile: 2, text: '{"a":2}' }]);
  assert.equal(r.missing.length, 0);
});

test("verschobene Zeile wird am neuen Ort gefunden, fehlende gemeldet", () => {
  const r = removeLines(L, [{ line: 0, text: '{"a":3}' }, { line: 0, text: '{"a":9}' }]);
  assert.equal(r.removed[0].zeile, 3);
  assert.equal(r.missing.length, 1);
});

test("doppelte Zeilen werden nur einmal pro Auswahl entfernt", () => {
  const r = removeLines(L, [{ line: 1, text: '{"a":2}' }, { line: 1, text: '{"a":2}' }]);
  assert.deepEqual(r.removed.map((x) => x.zeile), [2, 4]);
  assert.equal(r.content, ['{"a":1}', '{"a":3}', ""].join("\n"));
});

test("Auswahl wird geprüft", () => {
  assert.ok(validateSelection([]));
  assert.ok(validateSelection([{ line: -1, text: "x" }]));
  assert.ok(validateSelection(Array.from({ length: 501 }, (_, i) => ({ line: i, text: "x" }))));
  assert.equal(validateSelection([{ line: 0, text: "x" }]), null);
});

test("Historie: Eintrag anhängen und lesen", () => {
  const rec = historyRecord({ user: "wadii", reason: "Test", removed: [{ zeile: 2, text: '{"a":2}' }], baseSha: "abc", now: new Date("2026-11-18T12:00:00Z") });
  assert.equal(rec.zeit, "18.11.2026 13:00:00");
  assert.deepEqual(rec.eintraege[0].eintrag, { a: 2 });
  const text = appendJsonl(appendJsonl(null, { n: 1 }), rec);
  const h = parseHistory(text);
  assert.equal(h.length, 2);
  assert.equal(h[0].benutzer, "wadii");
});

test("Berliner Zeit im Sommer", () => {
  assert.equal(berlinTime(new Date("2026-07-01T10:00:00Z")), "01.07.2026 12:00:00");
});
