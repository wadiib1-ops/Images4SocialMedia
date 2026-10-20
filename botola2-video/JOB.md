# Wöchentlicher Botola-Pro-2-Video-Job (Liga 2)

Läuft jeden **Montag um 10:40 Uhr (Europe/Berlin)** als geplante Aufgabe in frischer Umgebung; alles Nötige (Code, Wappen in `Wappen/Botola2/`, Musik, Ergebnisliste) liegt in diesem Repo, Ordner `botola2-video/`. Der Botola-Pro-Job in `botola-video/` bleibt unberührt.

**Ziel:** Wurden im Fenster Spiele der **Botola Pro 2** (البطولة الاحترافية إنوي للقسم الثاني, 2. Liga Marokko) beendet, wird ein Video erzeugt und über **Buffer** eingeplant (Reihenfolge):
1. Facebook-Feed (Video)
2. Instagram-Feed (Reel)
3. Instagram-Story (Video)

Es gibt **keine Facebook-Story**. Ohne Spiele passiert nichts.

Antworten auf Deutsch, knapp. Nichts erfinden: keine Ergebnisse, Namen oder Minuten ohne Quelle. Text im Video und in Beiträgen immer **Arabisch**.

---

## 0. Vorbereitung

1. Repo `wadiib1-ops/Images4SocialMedia` (öffentlich) muss in der Sitzung verfügbar sein. Sonst `mcp__claude-code-remote__add_repo` (owner `wadiib1-ops`, repo `Images4SocialMedia`, access `push`), `git clone --depth 1`, `register_repo_root`. Alle Pfade sind relativ zur Repo-Wurzel.
2. Buffer-Tools laden: ToolSearch `select:mcp__Buffer__list_posts,mcp__Buffer__create_post`.
3. Prüfen: `ffmpeg -version` und `python3 -c "import PIL, numpy, scipy"`; fehlt Python-Seitiges: `python3 -m pip install --break-system-packages pillow numpy scipy`.
4. Zeit: `TZ=Europe/Berlin date`. **Lauf-Tag** = heutiges Berliner Datum, **Fenster** = jetzt minus 7 Tage bis jetzt (wöchentlicher Lauf; Spiele, die schon in `season_results.json` stehen, zählen nicht neu).
5. Doppelpost-Sperre: `cd botola2-video && python3 finalize.py check-posted <Lauf-Tag>`. Exit 0 = schon gepostet → **STOPP**, kurze Meldung.

## 1. Spiele recherchieren

Nur **Botola Pro 2 Inwi** (16 Vereine laut `botola2-video/season_results.json`; keine 1. Liga, Länderspiele, Frauen, Jugend, Amateure). Werkzeuge: WebSearch und WebFetch (Shell-Zugriff auf Webseiten ist gesperrt, nur GitHub erreichbar; bei 403 oder DNS-Fehlern die nächste Quelle nehmen).

- **Quellen:** pro Endergebnis **mindestens 5, höchstens 8 unabhängige Quellen**, **Hauptquellen (Nutzerwunsch 20.10.2026, immer zuerst lesen):** offizielle Tabelle des Verbands https://frmf.ma/fr/botola-pro/d2/classement und https://www.sofascore.com/de/football/tournament/morocco/botola-pro-2/10554 (Ergebnisse je Runde). Weitere: almountakhab.com/league-table-statistics/botola2, fotmob.com, hesport.com, sport7.ma, elbotola.com, msport.ma, atlasscoop.com, analkhabar.com, ihata.ma, howatpress.net, snrt.ma, kooora.com, 365scores.com, mapsport.ma. Bei Widerspruch gilt die Mehrheit; bleiben weniger als 5 Quellen oder ist es unklar, das Spiel nicht aufnehmen.
- **Torschützen:** nur mit vollem arabischem Namen (Vor- und Nachname) und Minute, wie in der Mehrheit der Quellen. Formate: `26'`, `90+2'`, Elfmeter `39' ض.ج`, Eigentor `12' عكسي`. Unsicheres weglassen. Sind nicht alle Torschützen des Tages sicher bekannt, zeigt das Video überall nur Minuten (gewollt).
- **Nicht beendete Spiele** der betroffenen Runde(n) mit `status` markieren: `live`, `postponed` (offiziell verlegt), `not_played`.
- **Nachtrag früherer Runden (Pflicht, besonders beim ersten Lauf):** Jede abgeschlossene Runde hat 8 Spiele. Fehlen in `botola2-video/season_results.json` beendete Spiele früherer Runden (Saison 2026-27 begann am 26.09.2026; Stand bei Einrichtung: Liste leer, Runden 1–4 fehlen), diese mit denselben Quellenregeln recherchieren und dort eintragen (`{"round":N,"home":..,"away":..,"score":[h,a]}`, kanonische Namen = erster Eintrag in `botola2-video/wappen_map.json`). Danach `python3 standings.py` mit der offiziellen Tabelle https://frmf.ma/fr/botola-pro/d2/classement (bei Nichterreichbarkeit sofascore) abgleichen: Spiele, Punkte und Tordifferenz je Verein müssen stimmen, sonst **STOPP** mit Angabe der Abweichung. Ein Spiel, das sich nicht belegen lässt, nicht raten: **STOPP** und melden.
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
- Ungeklärter Unterschied zwischen berechneter Tabelle und der Tabelle auf https://frmf.ma/fr/botola-pro/d2/classement bzw. sofascore. Erlaubt nur, wenn dort ein laufendes Spiel mitgezählt wird.

**Video ansehen:** per ffmpeg Einzelbilder (ca. 1,5 s, Mitte der ersten Spielkarte, Tabelle bei Dauer minus 8 s) ausgeben und mit Read prüfen: Text nicht abgeschnitten, Wappen vorhanden (Initialen-Kreis = Wappen fehlt, melden), Tabelle mit 16 Zeilen. Auffälligkeiten beheben oder STOPP.

Ergebnis: `botola2-video/out/botola2-<Lauf-Tag>.mp4`, `out/caption.txt` (arabisch, ohne Links), `out/summary.json`.

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

## 4. Über Buffer einplanen

Fest verwendete IDs (kein `list_channels`, `get_account`, `edit_post`, `delete_post`; nur bei „Organization not found“ oder unbekanntem Kanal einmal `get_account`/`list_channels` und im Bericht melden):

| Was | ID |
|---|---|
| Organisation „My organization“ (Europe/Berlin) | `6ac8f8ef5d2b1343a7943fde` |
| Facebook-Seite | `6ac8f9916a5c39ccb6620a50` |
| Instagram „moroccanfootballandfutsal“ | `6ac8f9b76a5c39ccb6620bc0` |

1. **Slot-Prüfung:** ein `list_posts` (organizationId, channelIds `["6ac8f9916a5c39ccb6620a50"]`, `dueAt` von jetzt bis jetzt plus 2 Tage, ISO mit Offset, `first` 100); Antwort per Python auswerten. Keine Minute belegen, die dort schon belegt ist.
2. **Zeiten** (Berliner Zeit, ISO mit Offset, in der Zukunft): Feed = jetzt plus 10 Minuten (ggf. auf freie Minute verschieben); Instagram-Story = 5 Minuten nach dem Feed.
3. **Drei `create_post`** mit `mode` `customScheduled`, `schedulingType` `automatic`, Asset `{"video":{"url":<Raw-URL aus Schritt 3>,"metadata":{"title":"<kurzer arabischer Titel>"}}}`:

   | Reihenfolge | Kanal | `metadata` | Text |
   |---|---|---|---|
   | 1. Facebook-Feed | Facebook | `facebook: {"type":"post"}` (nie `linkAttachment`) | Inhalt von `caption.txt` |
   | 2. Instagram-Reel | Instagram | `instagram: {"type":"reel","shouldShareToFeed":true}` | Inhalt von `caption.txt` |
   | 3. Instagram-Story | Instagram | `instagram: {"type":"story","shouldShareToFeed":false,"link":"https://facebook.com/476343148890228"}` | ohne Begleittext; Story-Video `botola2-$RUN-story.mp4` mit eingebranntem Text (Abschnitt 2b) |

   Lehnt Buffer den `link` der Story ab: einmal ohne `link` anlegen und melden.
4. **Fehler:** Schlägt der Facebook-Feed endgültig fehl, die anderen Einträge **nicht** anlegen. Eindeutige Fehler nicht unverändert wiederholen; bei unklarem Ausgang einmal `list_posts` prüfen. Free-Tarif: höchstens 10 geplante Einträge pro Kanal; bei voller Warteschlange oder getrenntem Kanal den betroffenen Eintrag weglassen und melden. Ist Buffer nicht erreichbar: **STOPP**.

## 5. Abschluss

```bash
cd botola2-video && python3 finalize.py mark-posted <Lauf-Tag> --note "<Anzahl Spiele, Zeit>"
cd .. && git add botola2-video/season_results.json botola2-video/posted_log.json
git commit -m "Botola-2-Wochenvideo <Lauf-Tag>: Ergebnisse und Log"   # plus Attributionszeilen laut Systemvorgabe
git push origin HEAD:main
```

Push abgelehnt: `git fetch origin main`, `git rebase FETCH_HEAD`, einmal erneut pushen.

**Bericht** (3–5 Zeilen, Deutsch): Anzahl Spiele, Veröffentlichungszeit, je Eintrag (Facebook-Feed, Instagram-Reel, Instagram-Story) Buffer-ID oder Fehlertext, Auffälligkeiten. Keine Facebook-Story-Zeilen.

## Regeln

- Nur Botola Pro 2, nur Spiele mit Quellenbeleg, keine Quellen-Links in Bildunterschriften.
- Musik ist Pflicht (Nutzerwunsch 20.10.2026): ohne Track aus `Video/` wird nichts veröffentlicht.
- Bildunterschrift: genau 5 arabische Hashtags zur Botola Pro 2 (fest in `finalize.py`), alle Texte Arabisch.
- Hintergrund Nachtblau/Gold (Unterscheidung zur grün-roten Botola Pro); nicht ändern.
- Den Botola-Pro-Job (`botola-video/`) nicht anfassen.
- Bei jedem STOPP: nichts posten, nichts pushen.
- Die bestehende Buffer-Automatik (stündliche Foto-Posts) nicht anfassen.
- Neue Wappen (z. B. nach Auf-/Abstieg): PNG in `Wappen/Botola2/` legen, in `botola2-video/wappen_map.json` und `season_results.json` (`teams`) Dateiname mit arabischem Namen (erster Eintrag) und Alternativschreibweisen eintragen. Neue Musik: MP3 in `Video/` (mehrere werden nach Datum durchgewechselt).
