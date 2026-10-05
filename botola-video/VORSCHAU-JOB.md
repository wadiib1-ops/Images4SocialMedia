# Botola-Vorschau-Job (kommender Spieltag)

Läuft täglich als geplante Aufgabe in einer frischen Umgebung. Er erzeugt **einmal pro Runde** ein Vorschau-Video mit den
Begegnungen der nächsten Runde der **Botola Pro Inwi**. Design und Musik sind dieselben wie beim Tagesvideo. Das Video wird über **Metricool**
auf Facebook (Feed-Video + Story) und Instagram (Reel im Feed + Story) eingeplant. Gibt es nichts zu tun, passiert **nichts**.

Antworte dem Nutzer auf Deutsch, knapp. Erfinde nichts: keine Termine, Uhrzeiten oder Paarungen ohne Quelle.

## 0. Vorbereitung

1. Repo `wadiib1-ops/Images4SocialMedia` unter `/home/claude/images4socialmedia`. Fehlt es: `mcp__claude-code-remote__add_repo`
   (owner `wadiib1-ops`, repo `Images4SocialMedia`, access `push`), `git clone --depth 1` (großzügiges Timeout) und `register_repo_root`.
2. Metricool-Werkzeuge laden (ToolSearch): `select:mcp__Metricool_Social_Media_Management__getBrandSettings,mcp__Metricool_Social_Media_Management__createScheduledPost,mcp__Metricool_Social_Media_Management__getScheduledPosts`
3. Prüfen: `ffmpeg -version`, `python3 -c "import PIL, numpy, scipy"`; fehlt etwas: `pip install --break-system-packages pillow numpy scipy`.
4. Zeit: `TZ=Europe/Berlin date`.

## 1. Welche Runde ist dran?

- Nächste Runde N = höchste Runde in `botola-video/season_results.json` plus 1. Ist diese Runde laut Quellen schon komplett gespielt,
  gilt die folgende. Nachholspiele früherer Runden zählen nicht.
- `cd botola-video && python3 preview.py check N`. Exit-Code 0 → Vorschau schon gepostet → **STOPP** mit kurzer Meldung.
- Offiziellen Spielplan der Runde N recherchieren (WebSearch, WebFetch). Gute Quellen: hesport.com, sportnador.com, aljareeda.net,
  elbotola.com, almountakhab.com, radiomars.ma, alaoual.com, kooora.com, lnfp.ma. Suchbegriffe z. B. „برنامج الجولة N البطولة الاحترافية“.
  Bei 403 oder 404 die nächste Quelle nehmen.
- **Jede Paarung mit Datum und Uhrzeit muss in mindestens 2 unabhängigen Quellen stehen.** Bei Widerspruch gilt die Mehrheit.
  Maschinelle Übersetzungen verfälschen Vereinsnamen; daher die arabischen Originalnamen abfragen.
- **Zeitpunkt:** Gepostet wird nur, wenn (a) der Spielplan veröffentlicht ist, (b) das erste Spiel der Runde N in höchstens 3 Tagen
  (72 Stunden) beginnt und noch nicht angepfiffen ist, und (c) kein Spiel der Runde N-1 mehr nach dem jetzigen Zeitpunkt angesetzt ist
  (verlegte Nachholspiele ausgenommen). Sonst **STOPP** mit kurzer Meldung (z. B. „Spielplan Runde N noch nicht veröffentlicht“ oder
  „Runde N beginnt erst am …“).
- Fehlen Paarungen (nur Teil der Runde bestätigt): nur bestätigte Spiele aufnehmen, wenn es mindestens 6 sind, sonst **STOPP**.

## 2. Video bauen

`botola-video/fixtures/rundeN.json` schreiben (Beispiel: `fixtures/runde3.json`):

```json
{"round": N, "date_range": "من 8 إلى 11 أكتوبر 2026",
 "question": "💬 من سيفوز في قمة المغرب الفاسي والرجاء؟ شاركونا توقعاتكم في التعليقات",
 "matches": [{"date": "2026-10-08", "time": "16:00", "home": "اتحاد تواركة", "away": "نهضة بركان"}]}
```

- Uhrzeiten in Ortszeit Marokko (wie in den Quellen). Monatsnamen marokkanisch (يناير فبراير مارس أبريل ماي يونيو يوليوز غشت شتنبر أكتوبر نونبر دجنبر).
- `question` optional: eine Frage zum Topspiel der Runde, nur wenn eine Quelle das Spiel als Topspiel („قمة“, „ديربي“) bezeichnet.
- Vereinsnamen werden über `wappen_map.json` vereinheitlicht. `FEHLER: unbekannter Verein` → Schreibweise prüfen, Alias ergänzen.

```bash
cd botola-video && python3 preview.py build fixtures/rundeN.json
```

- `WARNUNG: keine Tracks` → **STOPP** (Musik fehlt in `Video/`).
- Prüfbilder: `ffmpeg -ss <t> -i out/botola-vorschau-rundeN.mp4 -frames:v 1 f.jpg` bei 1,5 s, 4,5 s, im Übersichtsbild (Dauer minus 6 s);
  mit Read prüfen: Text nicht abgeschnitten, Wappen statt Initialen-Kreis, „المركز X · Y نقاط“ richtig herum, alle Spiele in der Übersicht.
- Ergebnis: `out/botola-vorschau-rundeN.mp4`, `out/caption-vorschau.txt`, `out/summary-vorschau.json`.

## 3. Video hochladen (Branch `video-out`)

Wie beim Tagesvideo (JOB.md Abschnitt 3), Dateiname `botola-vorschau-rundeN.mp4`. Vorschau-Videos älter als 3 Runden
(`botola-vorschau-runde*.mp4` mit kleinerer Nummer als N-2) mit `git rm` entfernen. Commit „Vorschauvideo Runde N“ plus Attributionszeilen.
URL: `https://raw.githubusercontent.com/wadiib1-ops/Images4SocialMedia/video-out/botola-vorschau-rundeN.mp4`, muss HTTP 200 liefern.

## 4. An Metricool übergeben

Genau wie JOB.md Abschnitt 4 (Markenprüfung 7182798 / 476343148890228 / moroccanfootballandfutsal, Zeitzone aus getBrandSettings):
- **A) Feed** jetzt plus 10 Minuten: providers facebook + instagram, `facebookData {"type":"POST"}`,
  `instagramData {"type":"REEL","showReelOnFeed":true}`, Text = `out/caption-vorschau.txt`.
- **B) Story** 5 Minuten nach A, **ohne Text**: `facebookData {"type":"STORY"}`, `instagramData {"type":"STORY"}`.
- Danach `getScheduledPosts` prüfen. Ablehnung: höchstens einmal bei vorübergehendem Fehler wiederholen, sonst STOPP mit wörtlicher Fehlermeldung.
- Getestet am 05.10.2026 (Runde 3): beide Beiträge angenommen.

## 5. Abschluss

```bash
cd botola-video && python3 preview.py mark N --note "<Anzahl Spiele>, Feed <HH:MM>, Story <HH:MM>"
cd .. && git add botola-video/preview_log.json botola-video/fixtures/rundeN.json botola-video/wappen_map.json
git commit -m "Botola-Vorschau Runde N"   # plus Attributionszeilen laut Systemvorgabe
git push origin HEAD:main
```

Push-Konflikt: `git fetch origin main`, `git rebase FETCH_HEAD`, einmal erneut pushen.
Abschlussmeldung (3–5 Zeilen): Runde, Anzahl Spiele, Zeitraum, Veröffentlichungszeiten, die `plannerUrl`s, Quellen, Auffälligkeiten.

## Regeln

- Nur Botola Pro. Keine Quellen-Links in Bildunterschriften. Bei jedem STOPP: nichts posten, nichts pushen.
- `season_results.json` wird von diesem Job **nicht** verändert (das macht der Tagesvideo-Job).
- Die Buffer-Automatik und den Tagesvideo-Job nicht anfassen.
