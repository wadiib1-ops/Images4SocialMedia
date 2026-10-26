# Täglicher Botola-Video-Job

Läuft täglich um **00:30 Uhr (Europe/Berlin)** als geplante Aufgabe in frischer Umgebung; alles Nötige (Code, Wappen, Musik, Ergebnisliste) liegt in diesem Repo.

**Ziel:** Wurden in den letzten 24 Stunden Spiele der **Botola Pro** (1. Liga Marokko) beendet, wird ein Video erzeugt und direkt über die Meta Graph API (Veröffentlicher `publisher/`, ohne Buffer) veröffentlicht (Reihenfolge):
1. Facebook-Feed (Video)
2. Instagram-Feed (Reel)
3. Instagram-Story (Video)

Es gibt **keine Facebook-Story**. Ohne Spiele passiert nichts.

Antworten auf Deutsch, knapp. Nichts erfinden: keine Ergebnisse, Namen oder Minuten ohne Quelle. Text im Video und in Beiträgen immer **Arabisch**.

---

## 0. Vorbereitung

1. Repo `wadiib1-ops/Images4SocialMedia` (öffentlich) muss in der Sitzung verfügbar sein. Sonst `mcp__claude-code-remote__add_repo` (owner `wadiib1-ops`, repo `Images4SocialMedia`, access `push`), `git clone --depth 1`, `register_repo_root`. Alle Pfade sind relativ zur Repo-Wurzel.
2. Kein Buffer. Veröffentlicht wird über `publisher/queue.json` und den Workflow `publish.yml` (Regeln in `CLAUDE-Routine.md`; Token `META_USER_TOKEN` nie ausgeben).
3. Prüfen: `ffmpeg -version` und `python3 -c "import PIL, numpy, scipy"`; fehlt Python-Seitiges: `python3 -m pip install --break-system-packages pillow numpy scipy`.
4. Zeit: `TZ=Europe/Berlin date`. **Lauf-Tag** = heutiges Berliner Datum, **Fenster** = jetzt minus 24 Stunden bis jetzt.
5. Doppelpost-Sperre: `cd botola-video && python3 finalize.py check-posted <Lauf-Tag>`. Exit 0 = schon gepostet → **STOPP**, kurze Meldung.

## 1. Spiele recherchieren

Nur **Botola Pro Inwi** (keine Länderspiele, Botola 2, Frauen, Jugend). Werkzeuge: WebSearch und WebFetch (Shell-Zugriff auf Webseiten ist gesperrt, nur GitHub erreichbar; bei 403 oder DNS-Fehlern die nächste Quelle nehmen).

- **Quellen:** pro Endergebnis **mindestens 2, höchstens 8 unabhängige Quellen**, die dasselbe Ergebnis zeigen. Zuerst abfragen: https://www.eurosport.de/fussball/championnat-national-botola/zeitplan-kalender-ergebnisse.shtml (liefert Endergebnisse, keine Torschützen); danach bevorzugt https://www.sofascore.com/ und https://www.fotmob.com/de. Weitere: sportnador.com, hesport.com, elbotola.com, msport.ma, sport7.ma, almountakhab.com, 365scores.com, btolat.com, kooora.com, mapsport.ma. Bei Widerspruch gilt die Mehrheit; bleiben weniger als 2 Quellen oder ist es unklar, das Spiel nicht aufnehmen.
- **Torschützen:** nur mit vollem arabischem Namen (Vor- und Nachname) und Minute, wie in der Mehrheit der Quellen. Formate: `26'`, `90+2'`, Elfmeter `39' ض.ج`, Eigentor `12' عكسي`. Unsicheres weglassen. Sind nicht alle Torschützen des Tages sicher bekannt, zeigt das Video überall nur Minuten (gewollt).
- **Nicht beendete Spiele** der betroffenen Runde(n) mit `status` markieren: `live`, `postponed` (offiziell verlegt), `not_played`.
- **Keine beendeten Spiele im Fenster:** **STOPP**. Nichts erzeugen, posten oder pushen; Meldung „Keine Spiele in den letzten 24 Stunden“.

## 2. day.json schreiben und Video bauen

Schema und Beispiel stehen im Kopf von `botola-video/finalize.py`. Vereinsnamen werden über `botola-video/wappen_map.json` vereinheitlicht.

```bash
cd botola-video
python3 finalize.py build /tmp/day.json
```

`date` = Datum der meisten beendeten Spiele (nur Anzeige). Ergebnisse früherer Runden, die in `season_results.json` fehlen, vorher dort nachtragen (`{"round":N,"home":..,"away":..,"score":[h,a]}`, belegt) und dann bauen.

**STOPP** (nichts posten, Grund melden) bei:
- `FEHLER`, `KONFLIKT`, `ABBRUCH` in der Ausgabe, die sich nicht beheben lassen. Bei `KONFLIKT` beide Angaben neu prüfen, nie blind überschreiben.
- `WARNUNG: keine Tracks` (keine Musik in `Video/`; der Notbehelf wird nicht veröffentlicht).
- Ungeklärter Unterschied zwischen berechneter Tabelle und einer externen Tabelle (sofascore, fotmob, btolat, 365scores, almountakhab). Erlaubt nur, wenn dort ein laufendes Spiel mitgezählt wird.

**Video ansehen:** per ffmpeg Einzelbilder (ca. 1,5 s, Mitte der ersten Spielkarte, Tabelle bei Dauer minus 8 s) ausgeben und mit Read prüfen: Text nicht abgeschnitten, Wappen vorhanden (Initialen-Kreis = Wappen fehlt, melden), Tabelle mit 16 Zeilen. Auffälligkeiten beheben oder STOPP.

Ergebnis: `botola-video/out/botola-<Lauf-Tag>.mp4`, `out/caption.txt` (Instagram, arabisch, ohne Links, max. 5 Hashtags), `out/caption_fb.txt` (Facebook, max. 3 Hashtags), `out/summary.json`.

## 2b. Story-Video mit sichtbarem Text (Pflicht, Nutzerwunsch 13.10.2026)

Instagram zeigt den Begleittext von Stories nicht. Die Story bekommt deshalb den Text IM Video. Repo-Wurzel, nach Abschnitt 2:

```bash
python3 story_text.py --video botola-video/out/botola-$RUN.mp4 --out-video botola-video/out/botola-$RUN-story.mp4 \
  --out /tmp/st-$RUN.png --title "<kurzer arabischer Titel, z. B. نتائج الجولة N>" \
  --cta "<kurzer arabischer Call to Action>" --tags "#البطولة_المغربية #الدوري_المغربي"
```

Ausgabe mit ffprobe prüfen (Breite/Höhe wie das Original, Audio vorhanden). Das Feed-Video `botola-$RUN.mp4` bleibt unverändert. Die Story nutzt `botola-$RUN-story.mp4`.

## 3. Video hochladen (Branch `video-out` = öffentliche URL)

GitHub Releases sind gesperrt; das Video liegt im Orphan-Branch `video-out`.

```bash
RUN=<Lauf-Tag>
git fetch origin video-out
rm -rf /tmp/vo && git worktree add /tmp/vo FETCH_HEAD -B video-out
cp botola-video/out/botola-$RUN.mp4 botola-video/out/botola-$RUN-story.mp4 /tmp/vo/
# Videos älter als 7 Tage entfernen
cd /tmp/vo && for f in botola-20*.mp4; do d=${f#botola-}; d=${d%.mp4}; [ "$d" \< "$(date -d '7 days ago' +%F)" ] && git rm -q "$f"; done
git rm -q --ignore-unmatch botola-test-*.mp4
git add -A && git commit -q -m "Tagesvideo $RUN"   # plus Attributionszeilen laut Systemvorgabe
git push origin video-out
URL="https://raw.githubusercontent.com/wadiib1-ops/Images4SocialMedia/video-out/botola-$RUN.mp4"
curl -sIL "$URL" | grep -iE "^HTTP|content-length"
cd - && git worktree remove --force /tmp/vo
```

Push abgelehnt: neu holen, rebasen, einmal wiederholen. Die Abfrage muss mit HTTP 200 enden (einmal kurz warten und wiederholen).

## 4. Direkt veröffentlichen (ohne Buffer)

Konten: Facebook-Seite `476343148890228`, Instagram `17841410500657352` (siehe `CLAUDE-Routine.md`). Es werden drei Einträge an `publisher/queue.json` angehängt (vorhandene nie ändern), alle mit `status: "now"` ohne `publish_at`, gleiche `titel`, `quelle_url` (Hauptquelle) und `runde`; `id` eindeutig, z. B. `<Lauf-Tag>-botola-fb-feed`:

| Reihenfolge | `platform` / `type` | `video_url` | `caption` |
|---|---|---|---|
| 1. Facebook-Feed | `facebook` / `video` | Raw-URL `botola-$RUN.mp4` | Inhalt `caption_fb.txt` (max. 3 Hashtags) |
| 2. Instagram-Reel | `instagram` / `reel` | Raw-URL `botola-$RUN.mp4` | Inhalt `caption.txt` (max. 5 Hashtags) |
| 3. Instagram-Story | `instagram` / `story` | Raw-URL `botola-$RUN-story.mp4` | leer (Text ist eingebrannt, Abschnitt 2b) |

Keine Facebook-Story, kein Link-Sticker. Vor dem Eintrag Raw-URLs per curl prüfen (HTTP 200). Dann `git add publisher/queue.json`, committen, `git push origin HEAD:main` (bei Ablehnung `git pull --rebase origin main`, einmal wiederholen). Direkt danach `publish.yml` per `actions_run_trigger` (ref main) starten und `publisher/log.jsonl` prüfen; Fehler per PushNotification melden. Schlägt der Facebook-Feed fehl, nicht blind neu anlegen, sondern melden.

## 5. Abschluss

```bash
cd botola-video && python3 finalize.py mark-posted <Lauf-Tag> --note "<Anzahl Spiele, Zeit>"
cd .. && git add botola-video/season_results.json botola-video/posted_log.json
git commit -m "Botola-Tagesvideo <Lauf-Tag>: Ergebnisse und Log"   # plus Attributionszeilen laut Systemvorgabe
git push origin HEAD:main
```

Push abgelehnt: `git fetch origin main`, `git rebase FETCH_HEAD`, einmal erneut pushen.

**Bericht** (3–5 Zeilen, Deutsch): Anzahl Spiele, Veröffentlichungszeit, je Eintrag (Facebook-Feed, Instagram-Reel, Instagram-Story) Log-Status oder Fehlertext, Auffälligkeiten. Keine Facebook-Story-Zeilen.

## Regeln

- **Hashtags:** Facebook (Feed, Reel, Story) höchstens 3, Instagram (Feed, Reel, Story, auch eingebrannt im Story-Video) höchstens 5.
- Nur Botola Pro, nur Spiele mit Quellenbeleg, keine Quellen-Links in Bildunterschriften.
- Bei jedem STOPP: nichts posten, nichts pushen.
- Neue Wappen: PNG in `Wappen/` legen, in `botola-video/wappen_map.json` Dateiname mit arabischem Namen (erster Eintrag) und Alternativschreibweisen eintragen. Neue Musik: MP3 in `Video/` (mehrere werden nach Datum durchgewechselt).
- Hashtag-Limit (Nutzerwunsch): Facebook (Feed, Reel, Story) höchstens 3 Hashtags, Instagram (Feed, Reel, Story) höchstens 5 Hashtags, pro Beitrag insgesamt, auch im Video eingeblendete.
