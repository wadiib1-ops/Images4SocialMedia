# Botola-Vorschau-Job (kommender Spieltag)

Läuft bei JEDER Ausführung (auch dem geplanten Prompt "Instagram-Story 5 Minuten nach dem Feed ..."): Zuerst wird immer nach den Begegnungen
des kommenden Spieltags gesucht (Abschnitt 1), nie nur in der Queue nach einem fertigen Feed-Video. Daraus entsteht ein Vorschau-Video
der **Botola Pro Inwi** mit den Begegnungen und den **marokkanischen Anstoßzeiten** (Ortszeit Marokko, wie in den Quellen). Design und Musik wie beim Tagesvideo.
Veröffentlicht wird NICHT mehr über Buffer, sondern über `publisher/queue.json` und `publish.yml` (CLAUDE-Routine.md): je 1x Facebook-Feed (Video, höchstens 3 Hashtags),
Instagram-Reel (höchstens 5), Facebook-Story und Instagram-Story (Text im Video, Begleittext leer). Kein Instagram-Feed. Ist die Vorschau der Runde schon gepostet oder der Spielplan nicht veröffentlicht, passiert nichts (kurze Meldung).

Antworte dem Nutzer auf Deutsch, knapp. Erfinde nichts: keine Termine, Uhrzeiten oder Paarungen ohne Quelle.

## 0. Vorbereitung

1. Repo `wadiib1-ops/Images4SocialMedia` unter `/home/claude/images4socialmedia`. Fehlt es: `mcp__claude-code-remote__add_repo`
   (owner `wadiib1-ops`, repo `Images4SocialMedia`, access `push`), `git clone --depth 1` (großzügiges Timeout) und `register_repo_root`.
2. Kein Buffer. Pillow ist im System defekt: venv wie in PROMPT.md Abschnitt 8 (pillow numpy scipy arabic-reshaper python-bidi).
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
- **Zeitpunkt:** Gepostet wird, wenn (a) der Spielplan veröffentlicht ist und (b) das erste Spiel der Runde N noch nicht angepfiffen ist
  (Nutzerwunsch 30.10.2026: bei jedem Lauf suchen, kein 72-Stunden-Limit mehr). Sonst **STOPP** mit kurzer Meldung (z. B. „Spielplan Runde N noch nicht veröffentlicht“ oder
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
- Ergebnis: `out/botola-vorschau-rundeN.mp4`, `out/caption-vorschau.txt` (Instagram, 5 Hashtags), `out/caption-vorschau-fb.txt` (Facebook, 3 Hashtags), `out/summary-vorschau.json`.

## 3. Video hochladen (Branch `video-out`)

Wie beim Tagesvideo (JOB.md Abschnitt 3), Dateiname `botola-vorschau-rundeN.mp4`. Vorschau-Videos älter als 3 Runden
(`botola-vorschau-runde*.mp4` mit kleinerer Nummer als N-2) mit `git rm` entfernen. Commit „Vorschauvideo Runde N“ plus Attributionszeilen.
URL: `https://raw.githubusercontent.com/wadiib1-ops/Images4SocialMedia/video-out/botola-vorschau-rundeN.mp4`, muss HTTP 200 liefern.

## 4. Über die Queue einplanen (statt Buffer)

Vier Einträge an `publisher/queue.json` anhängen (Format und Ablauf: CLAUDE-Routine.md), `status: "now"`, `titel` = Schlagzeile der Vorschau, `quelle_url` = eine Spielplan-Quelle, zusätzlich `runde`:
- Facebook-Feed (`video`, Text `out/caption-vorschau-fb.txt`, 3 Hashtags), Instagram-Reel (Text `out/caption-vorschau.txt`, 5 Hashtags).
- Facebook-Story und Instagram-Story: Story-Video mit eingebranntem Text (`python3 story_text.py --video <Vorschau-Video> --out-video <Story-Video> --out /tmp/st.png --title "<kurzer arabischer Titel>" --cta "<CTA>" --tags "<3 Hashtags>"`, Repo-Wurzel), `caption` leer.
- Schlägt der Facebook-Feed endgültig fehl, die anderen Einträge nicht anlegen. Nach dem Push `publish.yml` per workflow_dispatch starten, `publisher/log.jsonl` prüfen.

## 5. Abschluss

```bash
cd botola-video && python3 preview.py mark N --note "<Anzahl Spiele>, Feed <HH:MM>, Story <HH:MM>"
cd .. && git add botola-video/preview_log.json botola-video/fixtures/rundeN.json botola-video/wappen_map.json
git commit -m "Botola-Vorschau Runde N"   # plus Attributionszeilen laut Systemvorgabe
git push origin HEAD:main
```

Push-Konflikt: `git fetch origin main`, `git rebase FETCH_HEAD`, einmal erneut pushen.
Abschlussmeldung (3–5 Zeilen): Runde, Anzahl Spiele, Zeitraum, Veröffentlichungszeiten, je Eintrag Buffer-ID oder Fehlertext, Quellen, Auffälligkeiten.

## Regeln

- Nur Botola Pro. Keine Quellen-Links in Bildunterschriften. Bei jedem STOPP: nichts posten, nichts pushen.
- `season_results.json` wird von diesem Job **nicht** verändert (das macht der Tagesvideo-Job).
- Den Tagesvideo-Job nicht anfassen.
- Hashtag-Limit (Nutzerwunsch): Facebook (Feed, Reel, Story) höchstens 3 Hashtags, Instagram (Feed, Reel, Story) höchstens 5 Hashtags, pro Beitrag insgesamt, auch im Video eingeblendete.
