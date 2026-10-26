# Wöchentlicher Botola-Pro-2-Video-Job (Liga 2)

Läuft jeden **Montag um 10:40 Uhr (Europe/Berlin)** als geplante Aufgabe in frischer Umgebung; alles Nötige (Code, Wappen in `Wappen/Botola2/`, Musik, Ergebnisliste) liegt in diesem Repo, Ordner `botola2-video/`. Der Botola-Pro-Job in `botola-video/` bleibt unberührt.

**Ziel:** Wurden im Fenster Spiele der **Botola Pro 2** (البطولة الاحترافية إنوي للقسم الثاني, 2. Liga Marokko) beendet, wird ein Video erzeugt und **sofort nach Erstellung** direkt über die Meta Graph API (Veröffentlicher `publisher/`, ohne Buffer) veröffentlicht (Reihenfolge, Nutzerwunsch 26.10.2026):
1. Facebook-Story (Video mit eingebranntem Text)
2. Facebook-Reel (Video)
3. Instagram-Story (Video mit eingebranntem Text)
4. Instagram-Reel (Video, zugleich im Feed)

Ohne Spiele passiert nichts.

Antworten auf Deutsch, knapp. Nichts erfinden: keine Ergebnisse, Namen oder Minuten ohne Quelle. Text im Video und in Beiträgen immer **Arabisch**.

---

## 0. Vorbereitung

1. Repo `wadiib1-ops/Images4SocialMedia` (öffentlich) muss in der Sitzung verfügbar sein. Sonst `mcp__claude-code-remote__add_repo` (owner `wadiib1-ops`, repo `Images4SocialMedia`, access `push`), `git clone --depth 1`, `register_repo_root`. Alle Pfade sind relativ zur Repo-Wurzel.
2. Kein Buffer. Veröffentlicht wird über `publisher/queue.json` und den Workflow `publish.yml` (Regeln in `CLAUDE-Routine.md`; Token `META_USER_TOKEN` nie ausgeben).
3. Prüfen: `ffmpeg -version` und `python3 -c "import PIL, numpy, scipy"`; fehlt Python-Seitiges: `python3 -m pip install --break-system-packages pillow numpy scipy`.
4. Zeit: `TZ=Europe/Berlin date`. **Lauf-Tag** = heutiges Berliner Datum, **Fenster** = jetzt minus 7 Tage bis jetzt (wöchentlicher Lauf; Spiele, die schon in `season_results.json` stehen, zählen nicht neu).
5. Doppelpost-Sperre: `cd botola2-video && python3 finalize.py check-posted <Lauf-Tag>`. Exit 0 = schon gepostet → **STOPP**, kurze Meldung.

## 1. Spiele recherchieren

Nur **Botola Pro 2 Inwi** (16 Vereine laut `botola2-video/season_results.json`; keine 1. Liga, Länderspiele, Frauen, Jugend, Amateure). Werkzeuge: WebSearch und WebFetch (Shell-Zugriff auf Webseiten ist gesperrt, nur GitHub erreichbar; bei 403 oder DNS-Fehlern die nächste Quelle nehmen).

- **Quellen:** pro Endergebnis **mindestens 2, höchstens 8 unabhängige Quellen**, die dasselbe Ergebnis zeigen (Nutzerwunsch 26.10.2026). **Zuerst abfragen:** https://www.eurosport.de/fussball/gnf-ii/zeitplan-kalender-ergebnisse.shtml (Endergebnisse, keine Torschützen). **Weitere Hauptquelle:** https://www.flashscore.de/fussball/marokko/botola-2/ergebnisse/ (Ergebnisse und aktuellste Tabelle). Weitere: fotmob.com, sport7.ma, elbotola.com, msport.ma, atlasscoop.com, analkhabar.com, ihata.ma, howatpress.net, snrt.ma, kooora.com, 365scores.com, mapsport.ma. Bei Widerspruch gilt die Mehrheit; bleiben weniger als 2 Quellen oder ist es unklar, das Spiel nicht aufnehmen. **Erst bei mindestens 2 übereinstimmenden Quellen wird gebaut und veröffentlicht; sonst nichts posten und später erneut prüfen (siehe „Wiederholung“ in den Regeln).**
- **Quellen ausgeschlossen (Nutzerwunsch 26.10.2026):** hesport.com und sofascore.com nicht verwenden. elbotola.com ist von Cloud-Umgebungen aus durch Cloudflare gesperrt (403) und deshalb nicht nutzbar.
- **Anstoßzeiten (Nutzerwunsch 26.10.2026):** bevorzugt marokkanische Seiten. Bei deutschen/französischen Seiten auf marokkanische Ortszeit umrechnen (seit 25.10.2026 Marokko UTC+0, Deutschland/Frankreich UTC+1, also minus 1 Stunde; zeitzonen.de/marokko.html). Seiten wie 365scores zeigen die Zeit des Geräts, nicht pauschal Marokko.
- **Torschützen:** nur mit vollem arabischem Namen (Vor- und Nachname) und Minute, wie in der Mehrheit der Quellen. Formate: `26'`, `90+2'`, Elfmeter `39' ض.ج`, Eigentor `12' عكسي`. Unsicheres weglassen. Sind nicht alle Torschützen des Tages sicher bekannt, zeigt das Video überall nur Minuten (gewollt).
- **Nicht beendete Spiele** der betroffenen Runde(n) mit `status` markieren: `live`, `postponed` (offiziell verlegt), `not_played`.
- **Nachtrag früherer Runden (Pflicht, besonders beim ersten Lauf):** Jede abgeschlossene Runde hat 8 Spiele. Fehlen in `botola2-video/season_results.json` beendete Spiele früherer Runden (Saison 2026-27 begann am 26.09.2026; Stand bei Einrichtung: Liste leer, Runden 1–4 fehlen), diese mit denselben Quellenregeln recherchieren und dort eintragen (`{"round":N,"home":..,"away":..,"score":[h,a]}`, kanonische Namen = erster Eintrag in `botola2-video/wappen_map.json`). Danach `python3 standings.py` mit der aktuellsten Tabelle von https://www.flashscore.de/fussball/marokko/botola-2/ergebnisse/  abgleichen: Spiele, Punkte und Tordifferenz je Verein müssen stimmen, sonst **STOPP** mit Angabe der Abweichung. Ein Spiel, das sich nicht belegen lässt, nicht raten: **STOPP** und melden.
- **Keine beendeten Spiele im Fenster:** **STOPP**. Nichts erzeugen, posten oder pushen; Meldung „Keine Botola-2-Spiele in den letzten 7 Tagen“.

## 2. day.json schreiben und Video bauen

Schema und Beispiel stehen im Kopf von `botola2-video/finalize.py` (die Vereinsnamen dort sind nur Beispiele aus Liga 1). Vereinsnamen werden über `botola2-video/wappen_map.json` vereinheitlicht. Sind Spiele aus mehreren Runden im Fenster, je Spiel `"round"` angeben.

```bash
cd botola2-video
python3 finalize.py build /tmp/day.json
```

`date` = Datum der meisten beendeten Spiele (nur Anzeige). Ergebnisse früherer Runden, die in `season_results.json` fehlen, vorher dort nachtragen (`{"round":N,"home":..,"away":..,"score":[h,a]}`, belegt) und dann bauen.

**STOPP** (nichts posten, Grund melden) bei:
- `FEHLER`, `KONFLIKT`, `ABBRUCH` in der Ausgabe, die sich nicht beheben lassen. Bei `KONFLIKT` beide Angaben neu prüfen, nie blind überschreiben.
- `WARNUNG: keine Tracks` (keine Musik in `Video/`; der Notbehelf wird nicht veröffentlicht).
- Ungeklärter Unterschied zwischen berechneter Tabelle und der Tabelle auf flashscore.de. Erlaubt nur, wenn dort ein laufendes Spiel mitgezählt wird.

**Video ansehen:** per ffmpeg Einzelbilder (ca. 1,5 s, Mitte der ersten Spielkarte, Tabelle bei Dauer minus 8 s) ausgeben und mit Read prüfen: Text nicht abgeschnitten, Wappen vorhanden (Initialen-Kreis = Wappen fehlt, melden), Tabelle mit 16 Zeilen. Auffälligkeiten beheben oder STOPP.

Ergebnis: `botola2-video/out/botola2-<Lauf-Tag>.mp4`, `out/caption.txt` (Instagram, arabisch, ohne Links, max. 5 Hashtags), `out/caption_fb.txt` (Facebook, max. 3 Hashtags), `out/summary.json`.

## 2b. Story-Video mit sichtbarem Text (Pflicht, Nutzerwunsch 13.10.2026)

Instagram zeigt den Begleittext von Stories nicht. Die Story bekommt deshalb den Text IM Video. Repo-Wurzel, nach Abschnitt 2:

```bash
python3 story_text.py --video botola2-video/out/botola2-$RUN.mp4 --out-video botola2-video/out/botola2-$RUN-story.mp4 \
  --out /tmp/st-$RUN.png --title "<kurzer arabischer Titel, z. B. القسم الثاني: نتائج الجولة N>" \
  --cta "<kurzer arabischer Call to Action>" --tags "#القسم_الثاني #البطولة_الاحترافية_2"
```

Ausgabe mit ffprobe prüfen (Breite/Höhe wie das Original, Audio vorhanden). Das Feed-Video `botola2-$RUN.mp4` bleibt unverändert. Die Story nutzt `botola2-$RUN-story.mp4`.

## 3. Video hochladen (Branch `video-out` = öffentliche URL)

GitHub Releases sind gesperrt; das Video liegt im Orphan-Branch `video-out`.

```bash
RUN=<Lauf-Tag>
git fetch origin video-out
rm -rf /tmp/vo && git worktree add /tmp/vo FETCH_HEAD -B video-out
cp botola2-video/out/botola2-$RUN.mp4 botola2-video/out/botola2-$RUN-story.mp4 /tmp/vo/
# eigene Videos älter als 14 Tage entfernen (botola-*, musik-* und andere Dateien nie anfassen)
cd /tmp/vo && for f in botola2-20*.mp4; do d=${f#botola2-}; d=${d%-story.mp4}; d=${d%.mp4}; [ "$d" \< "$(date -d '14 days ago' +%F)" ] && git rm -q "$f"; done
git add -A && git commit -q -m "Botola-2-Video $RUN"   # plus Attributionszeilen laut Systemvorgabe
git push origin video-out
URL="https://raw.githubusercontent.com/wadiib1-ops/Images4SocialMedia/video-out/botola2-$RUN.mp4"
curl -sIL "$URL" | grep -iE "^HTTP|content-length"
cd - && git worktree remove --force /tmp/vo
```

Push abgelehnt: neu holen, rebasen, einmal wiederholen. Die Abfrage muss mit HTTP 200 enden (einmal kurz warten und wiederholen).

## 4. Direkt veröffentlichen (ohne Buffer)

Konten: Facebook-Seite `476343148890228`, Instagram `17841410500657352` (siehe `CLAUDE-Routine.md`). Es werden vier Einträge an `publisher/queue.json` angehängt (vorhandene nie ändern), alle mit `status: "now"` ohne `publish_at`, gleiche `titel`, `quelle_url` (Hauptquelle) und `runde`; `id` eindeutig, z. B. `<Lauf-Tag>-botola2-fb-story`. Die Story erscheint zusammen mit den anderen Beiträgen, kein Abstand von 5 Minuten.

| Reihenfolge | `platform` / `type` | `video_url` | `caption` |
|---|---|---|---|
| 1. Facebook-Story | `facebook` / `story` | Raw-URL `botola2-$RUN-story.mp4` | leer (Text eingebrannt, Abschnitt 2b) |
| 2. Facebook-Reel | `facebook` / `reel` | Raw-URL `botola2-$RUN.mp4` | Inhalt `caption_fb.txt` (max. 3 Hashtags) |
| 3. Instagram-Story | `instagram` / `story` | Raw-URL `botola2-$RUN-story.mp4` | leer (Text eingebrannt, Abschnitt 2b) |
| 4. Instagram-Reel | `instagram` / `reel` | Raw-URL `botola2-$RUN.mp4` | Inhalt `caption.txt` (max. 5 Hashtags) |

Kein Link-Sticker. Vor dem Eintrag Hashtags per Python zählen (Wörter mit `#`; Facebook höchstens 3, Instagram höchstens 5, im Story-Video 2) und Raw-URLs per curl prüfen (HTTP 200). Dann `git add publisher/queue.json`, committen, `git push origin HEAD:main` (bei Ablehnung `git pull --rebase origin main`, einmal wiederholen). Direkt danach `publish.yml` per `actions_run_trigger` (ref main) starten und `publisher/log.jsonl` prüfen; Fehler per PushNotification melden. Schlägt ein Eintrag fehl, nicht blind neu anlegen, sondern melden.

## 5. Abschluss

```bash
cd botola2-video && python3 finalize.py mark-posted <Lauf-Tag> --note "<Anzahl Spiele, Zeit>"
cd .. && git add botola2-video/season_results.json botola2-video/posted_log.json
git commit -m "Botola-2-Wochenvideo <Lauf-Tag>: Ergebnisse und Log"   # plus Attributionszeilen laut Systemvorgabe
git push origin HEAD:main
```

Push abgelehnt: `git fetch origin main`, `git rebase FETCH_HEAD`, einmal erneut pushen.

**Bericht** (3–5 Zeilen, Deutsch): Anzahl Spiele, Veröffentlichungszeit, je Eintrag (Facebook-Story, Facebook-Reel, Instagram-Story, Instagram-Reel) Log-Status oder Fehlertext, Hashtag-Anzahl je Eintrag, Auffälligkeiten.

## Regeln

- Nur Botola Pro 2, nur Spiele mit Quellenbeleg, keine Quellen-Links in Bildunterschriften.
- Musik ist Pflicht (Nutzerwunsch 20.10.2026): ohne Track aus `Video/` wird nichts veröffentlicht.
- **Hashtags (Nutzerwunsch):** Facebook (Feed, Reel, Story) höchstens 3, Instagram (Feed, Reel, Story, auch eingebrannt im Story-Video) höchstens 5, pro Beitrag insgesamt. Alle Texte Arabisch.
- **Wiederholung:** Gibt es für ein Spiel noch keine 2 übereinstimmenden Quellen, nichts veröffentlichen und die Aufgabe später erneut ausführen (einmalig in ca. 2 Stunden per ScheduleWakeup/CronCreate, höchstens 3 Versuche; danach per PushNotification melden).
- Hintergrund Nachtblau/Gold (Unterscheidung zur grün-roten Botola Pro); nicht ändern.
- Den Botola-Pro-Job (`botola-video/`) nicht anfassen.
- Bei jedem STOPP: nichts posten, nichts pushen.
- Neue Wappen (z. B. nach Auf-/Abstieg): PNG in `Wappen/Botola2/` legen, in `botola2-video/wappen_map.json` und `season_results.json` (`teams`) Dateiname mit arabischem Namen (erster Eintrag) und Alternativschreibweisen eintragen. Neue Musik: MP3 in `Video/` (mehrere werden nach Datum durchgewechselt).
