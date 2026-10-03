# Täglicher Botola-Video-Job

Läuft jeden Tag um **00:30 Uhr (Europe/Berlin)** als geplante Aufgabe. Der Lauf startet in einer frischen Umgebung:
Alles, was er braucht (Code, Wappen, Musik, Ergebnisliste), liegt in diesem Repo.

**Ziel:** Nur wenn in den letzten 24 Stunden Spiele der **Botola Pro (1. Liga Marokko)** beendet wurden, wird ein Video
erzeugt und über **Metricool** auf **Facebook** (Feed-Video + Story) und **Instagram** (Reel im Feed + Story) eingeplant.
Gibt es keine Spiele, passiert **nichts**.

Antworte dem Nutzer auf Deutsch, knapp. Erfinde nichts: keine Ergebnisse, Namen oder Minuten ohne Quelle.

---

## 0. Vorbereitung

1. Repo: `wadiib1-ops/Images4SocialMedia` (öffentlich). Liegt es nicht unter `/home/claude/images4socialmedia`, dann
   `mcp__claude-code-remote__add_repo` (owner `wadiib1-ops`, repo `Images4SocialMedia`, access `push`), klonen
   (`git clone --depth 1`) und `register_repo_root` aufrufen. Alle Pfade unten sind relativ zur Repo-Wurzel.
2. Metricool-Werkzeuge laden (ToolSearch): `select:mcp__Metricool_Social_Media_Management__getBrandSettings,mcp__Metricool_Social_Media_Management__createScheduledPost,mcp__Metricool_Social_Media_Management__getScheduledPosts`
3. Prüfen: `ffmpeg -version`, `python3 -c "import PIL, numpy, scipy"`. Fehlt etwas Python-Seitiges:
   `pip install --break-system-packages pillow numpy scipy`.
4. Zeit bestimmen: `TZ=Europe/Berlin date`. **Lauf-Tag** = heutiges Berliner Datum. **Fenster** = jetzt minus 24 Stunden bis jetzt.
5. Doppelpost-Sperre: `cd botola-video && python3 finalize.py check-posted <Lauf-Tag>`.
   Exit-Code 0 bedeutet: für diesen Lauf-Tag wurde schon gepostet → **STOPP**, kurze Meldung.

## 1. Spiele im Fenster recherchieren

Nur **Botola Pro Inwi** (nicht Länderspiele, nicht Botola 2, nicht Frauen/Jugend).

- Werkzeuge: WebSearch und WebFetch. Gute arabische Quellen: sportnador.com, hesport.com, elbotola.com, msport.ma, sport7.ma,
  almountakhab.com, 365scores.com, btolat.com, kooora.com, agadir24.info, radiomars.ma. Manche Seiten liefern 403 – dann die nächste nehmen.
  Der Shell-Zugriff auf Webseiten ist gesperrt, nur GitHub ist erreichbar.
- **Beendete Spiele:** Endergebnis muss in **mindestens 2 unabhängigen Quellen** stehen. Bei Widerspruch gilt die Mehrheit.
  Bleibt es unklar, das Spiel **nicht** als beendet aufnehmen.
- **Torschützen:** nur mit **vollem arabischem Namen (Vor- und Nachname)** und Minute, geschrieben wie in der Mehrheit der Quellen.
  Formate der Minute: `26'`, `90+2'`, Elfmeter `39' ض.ج`, Eigentor `12' عكسي`. Unsicheres weglassen.
  Sind nicht alle Torschützen des Tages sicher mit vollem Namen bekannt, zeigt das Video automatisch überall nur die Minuten.
  Das ist gewollt.
- **Nicht beendete / nicht gespielte Spiele** der Runde(n) der beendeten Spiele mit `status` markieren:
  `live` (läuft noch), `postponed` (offiziell verlegt), `not_played` (noch nicht ausgetragen).
- Sind im Fenster **keine** Botola-Pro-Spiele beendet worden (spielfreier Tag, Länderspielpause, Verlegungen):
  **STOPP. Nichts erzeugen, nichts posten, nichts pushen.** Kurze Meldung „Keine Spiele in den letzten 24 Stunden“.

## 2. day.json schreiben und Video bauen

Schema und Beispiel stehen im Kopf von `botola-video/finalize.py`. Vereinsnamen dürfen in gängigen Schreibweisen
(arabisch oder lateinisch) stehen, sie werden über `botola-video/wappen_map.json` vereinheitlicht.

```bash
cd botola-video
python3 finalize.py build /tmp/day.json
```

- `date` = Datum, an dem die meisten der beendeten Spiele stattfanden (nur für die Anzeige im Video).
- `FEHLER`, `KONFLIKT` oder `ABBRUCH` in der Ausgabe: Quellen erneut prüfen und beheben. Gelingt das nicht → **STOPP**, nichts posten,
  Grund melden. Bei `KONFLIKT` steht in `season_results.json` ein anderes Ergebnis als gemeldet: beide Angaben neu prüfen, nie blind überschreiben.
- Steht im Log `WARNUNG: keine Tracks`, ist keine Musik im Ordner `Video/` → **STOPP** und melden (der synthetische Notbehelf wird nicht veröffentlicht).
- **Tabelle gegenprüfen:** Die Tabelle wird aus `season_results.json` berechnet. Vergleiche die Punkte jedes Vereins mit einer externen Tabelle
  (btolat.com, 365scores.com, almountakhab.com). Unterschiede sind nur erlaubt, wenn dort ein laufendes Spiel mitgezählt wird.
  Fehlt ein Ergebnis einer früheren Runde, trage es in `season_results.json` nach (`{"round":N,"home":..,"away":..,"score":[h,a]}`), nachdem es in
  2 Quellen bestätigt ist, und baue neu. Bleibt eine Abweichung ungeklärt → **STOPP**.
- **Video ansehen:** Mit ffmpeg einzelne Bilder ausgeben (z. B. bei 1,5 s, in der Mitte der ersten Spielkarte, in der Tabelle bei ca. Dauer minus 8 s)
  und mit Read prüfen: Text nicht abgeschnitten, Wappen vorhanden (ein Initialen-Kreis bedeutet: Wappen fehlt, in der Meldung erwähnen),
  Tabelle mit 16 Zeilen. Auffälligkeiten beheben oder STOPP.

Ergebnis: `botola-video/out/botola-<Lauf-Tag>.mp4`, `botola-video/out/caption.txt` (arabische Bildunterschrift, ohne Links), `botola-video/out/summary.json`.

## 3. Video hochladen (Branch `video-out` = öffentliche URL)

GitHub Releases sind in dieser Umgebung gesperrt. Stattdessen liegt das Video im Orphan-Branch `video-out` (nur Videos, keine Code-Historie).

```bash
RUN=<Lauf-Tag>
git fetch origin video-out
rm -rf /tmp/vo && git worktree add /tmp/vo FETCH_HEAD -B video-out
cp botola-video/out/botola-$RUN.mp4 /tmp/vo/
# Videos älter als 7 Tage entfernen (Dateinamen botola-YYYY-MM-DD.mp4)
cd /tmp/vo && for f in botola-20*.mp4; do d=${f#botola-}; d=${d%.mp4}; [ "$d" \< "$(date -d '7 days ago' +%F)" ] && git rm -q "$f"; done
git rm -q --ignore-unmatch botola-test-*.mp4
git add -A && git commit -q -m "Tagesvideo $RUN"   # plus Attributionszeilen laut Systemvorgabe
git push origin video-out
URL="https://raw.githubusercontent.com/wadiib1-ops/Images4SocialMedia/video-out/botola-$RUN.mp4"
curl -sIL "$URL" | grep -iE "^HTTP|content-length"
cd - && git worktree remove --force /tmp/vo
```

Schlägt der Push wegen neuer Commits fehl: neu holen, rebasen, einmal wiederholen. Die Abfrage muss mit HTTP 200 enden (kurz warten und einmal wiederholen).
Getestet: Metricool übernimmt diese URL (Feed-Reel und Story, Entwurf-Test 2026-10-04 erfolgreich).

## 4. An Metricool übergeben

1. `getBrandSettings`: Es muss `id` = 7182798 sein, `networksData.facebookData` = `476343148890228` und `networksData.instagramData` = `moroccanfootballandfutsal`.
   Weicht etwas ab → **STOPP** (nichts posten), melden. Die Zeitzone für `publicationDate` kommt aus den Marken-Einstellungen.
2. **Veröffentlichungszeit:** **sofort nach dem Erstellen**: jetzt plus 10 Minuten (Berliner Zeit, `TZ=Europe/Berlin date`), also kurz nach 00:30 Uhr. Kein Warten auf eine Morgenzeit.
3. Zwei Beiträge mit `createScheduledPost` (`blogId` = `7182798`, `date` = ISO mit Offset, `autoPublish` true, `draft` false, `media` = `[URL]`):

   **A) Feed (Facebook-Video-Post + Instagram-Reel mit Anzeige im Feed)**, Text = Inhalt von `caption.txt`:
   ```json
   {"providers":[{"network":"facebook"},{"network":"instagram"}],
    "facebookData":{"type":"POST"},
    "instagramData":{"type":"REEL","showReelOnFeed":true}}
   ```
   **B) Story (Facebook und Instagram)**, **ohne Text**, 5 Minuten nach A (also jetzt plus 15 Minuten):
   ```json
   {"providers":[{"network":"facebook"},{"network":"instagram"}],
    "facebookData":{"type":"STORY"},
    "instagramData":{"type":"STORY"}}
   ```
   Restliche Felder wie in der Werkzeugbeschreibung (`publicationDate` mit `timezone`, `shortener` false, `smartLinkData` `{"ids":[]}`, `descendants` `[]`).
4. Danach `getScheduledPosts` für den Zeitraum aufrufen und prüfen, dass **beide** Beiträge angelegt sind.
5. Lehnt Metricool ab (Medienformat, Instagram-Konto ohne Business-Verknüpfung, …): höchstens **einmal** bei erkennbar vorübergehenden Fehlern wiederholen,
   sonst **STOPP** und die Fehlermeldung wörtlich melden. Keine anderen Parameter raten.

## 5. Abschluss

```bash
cd botola-video && python3 finalize.py mark-posted <Lauf-Tag> --note "<Anzahl Spiele, Zeit>"
cd .. && git add botola-video/season_results.json botola-video/posted_log.json
git commit -m "Botola-Tagesvideo <Lauf-Tag>: Ergebnisse und Log"   # plus Attributionszeilen laut Systemvorgabe
git push origin HEAD:main
```

Schlägt der Push wegen neuer Commits fehl: `git fetch origin main`, `git rebase FETCH_HEAD`, einmal erneut pushen.
Abschlussmeldung (3–5 Zeilen): wie viele Spiele, Veröffentlichungszeit, die `plannerUrl`s, Auffälligkeiten.

## Regeln

- Nur Botola Pro. Nur Spiele mit Quellenbeleg. Keine Quellen-Links in Bildunterschriften.
- Bei jedem STOPP: nichts posten, nichts pushen, nichts am Metricool-Konto ändern.
- Die bestehende Buffer-Automatik (stündliche Foto-Posts) nicht anfassen.
- Neue Wappen: PNG in `Wappen/` legen und in `botola-video/wappen_map.json` den Dateinamen mit arabischem Namen (erster Eintrag) und Alternativschreibweisen eintragen.
- Neue Musik: MP3 in `Video/` legen. Mehrere Dateien werden nach Datum durchgewechselt.
