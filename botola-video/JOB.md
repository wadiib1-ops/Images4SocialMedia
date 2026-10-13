# Täglicher Botola-Video-Job

Läuft täglich um **00:30 Uhr (Europe/Berlin)** als geplante Aufgabe in frischer Umgebung; alles Nötige (Code, Wappen, Musik, Ergebnisliste) liegt in diesem Repo.

**Ziel:** Wurden in den letzten 24 Stunden Spiele der **Botola Pro** (1. Liga Marokko) beendet, wird ein Video erzeugt und über **Buffer** eingeplant (Reihenfolge):
1. Facebook-Feed (Video)
2. Instagram-Feed (Reel)
3. Instagram-Story (Video)

Es gibt **keine Facebook-Story**. Metricool wird nicht verwendet. Ohne Spiele passiert nichts.

Antworten auf Deutsch, knapp. Nichts erfinden: keine Ergebnisse, Namen oder Minuten ohne Quelle. Text im Video und in Beiträgen immer **Arabisch**.

---

## 0. Vorbereitung

1. Repo `wadiib1-ops/Images4SocialMedia` (öffentlich) muss in der Sitzung verfügbar sein. Sonst `mcp__claude-code-remote__add_repo` (owner `wadiib1-ops`, repo `Images4SocialMedia`, access `push`), `git clone --depth 1`, `register_repo_root`. Alle Pfade sind relativ zur Repo-Wurzel.
2. Buffer-Tools laden: ToolSearch `select:mcp__Buffer__list_posts,mcp__Buffer__create_post`.
3. Prüfen: `ffmpeg -version` und `python3 -c "import PIL, numpy, scipy"`; fehlt Python-Seitiges: `python3 -m pip install --break-system-packages pillow numpy scipy`.
4. Zeit: `TZ=Europe/Berlin date`. **Lauf-Tag** = heutiges Berliner Datum, **Fenster** = jetzt minus 24 Stunden bis jetzt.
5. Doppelpost-Sperre: `cd botola-video && python3 finalize.py check-posted <Lauf-Tag>`. Exit 0 = schon gepostet → **STOPP**, kurze Meldung.

## 1. Spiele recherchieren

Nur **Botola Pro Inwi** (keine Länderspiele, Botola 2, Frauen, Jugend). Werkzeuge: WebSearch und WebFetch (Shell-Zugriff auf Webseiten ist gesperrt, nur GitHub erreichbar; bei 403 oder DNS-Fehlern die nächste Quelle nehmen).

- **Quellen:** pro Endergebnis **mindestens 5, höchstens 8 unabhängige Quellen**, bevorzugt https://www.sofascore.com/ und https://www.fotmob.com/de. Weitere: sportnador.com, hesport.com, elbotola.com, msport.ma, sport7.ma, almountakhab.com, 365scores.com, btolat.com, kooora.com, mapsport.ma. Bei Widerspruch gilt die Mehrheit; bleiben weniger als 5 Quellen oder ist es unklar, das Spiel nicht aufnehmen.
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

Ergebnis: `botola-video/out/botola-<Lauf-Tag>.mp4`, `out/caption.txt` (arabisch, ohne Links), `out/summary.json`.

## 3. Video hochladen (Branch `video-out` = öffentliche URL)

GitHub Releases sind gesperrt; das Video liegt im Orphan-Branch `video-out`.

```bash
RUN=<Lauf-Tag>
git fetch origin video-out
rm -rf /tmp/vo && git worktree add /tmp/vo FETCH_HEAD -B video-out
cp botola-video/out/botola-$RUN.mp4 /tmp/vo/
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
   | 3. Instagram-Story | Instagram | `instagram: {"type":"story","shouldShareToFeed":false,"link":"https://facebook.com/476343148890228"}` | ohne Text |

   Lehnt Buffer den `link` der Story ab: einmal ohne `link` anlegen und melden.
4. **Fehler:** Schlägt der Facebook-Feed endgültig fehl, die anderen Einträge **nicht** anlegen. Eindeutige Fehler nicht unverändert wiederholen; bei unklarem Ausgang einmal `list_posts` prüfen. Free-Tarif: höchstens 10 geplante Einträge pro Kanal; bei voller Warteschlange oder getrenntem Kanal den betroffenen Eintrag weglassen und melden. Ist Buffer nicht erreichbar: **STOPP**.

## 5. Abschluss

```bash
cd botola-video && python3 finalize.py mark-posted <Lauf-Tag> --note "<Anzahl Spiele, Zeit>"
cd .. && git add botola-video/season_results.json botola-video/posted_log.json
git commit -m "Botola-Tagesvideo <Lauf-Tag>: Ergebnisse und Log"   # plus Attributionszeilen laut Systemvorgabe
git push origin HEAD:main
```

Push abgelehnt: `git fetch origin main`, `git rebase FETCH_HEAD`, einmal erneut pushen.

**Bericht** (3–5 Zeilen, Deutsch): Anzahl Spiele, Veröffentlichungszeit, je Eintrag (Facebook-Feed, Instagram-Reel, Instagram-Story) Buffer-ID oder Fehlertext, Auffälligkeiten. Keine Facebook-Story-Zeilen.

## Regeln

- Nur Botola Pro, nur Spiele mit Quellenbeleg, keine Quellen-Links in Bildunterschriften.
- Bei jedem STOPP: nichts posten, nichts pushen.
- Die bestehende Buffer-Automatik (stündliche Foto-Posts) nicht anfassen.
- Neue Wappen: PNG in `Wappen/` legen, in `botola-video/wappen_map.json` Dateiname mit arabischem Namen (erster Eintrag) und Alternativschreibweisen eintragen. Neue Musik: MP3 in `Video/` (mehrere werden nach Datum durchgewechselt).
