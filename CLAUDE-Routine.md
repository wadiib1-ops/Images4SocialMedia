# CLAUDE-Routine.md (nur für den Marokko-Fußball-Job)

Diese Datei gilt innerhalb der Routine anstelle von CLAUDE.md. Die bestehende CLAUDE.md bleibt unverändert. Wo PROMPT.md und diese Datei sich widersprechen, gilt diese Datei.

## Grundsatz
Ich (Claude) lege die Beiträge in `publisher/queue.json` ab. Der GitHub-Workflow `.github/workflows/publish.yml` (alle 15 Minuten) veröffentlicht fällige Einträge mit `publisher/publish.py` über die Meta Graph API. Es wird kein externes Planungswerkzeug benutzt. Inhalte, Texte, Bilder, Musik-Video, Quellenregeln, 32-Stunden-Regel und Sprachen stehen in PROMPT.md.

## Konten
- Facebook-Seite: 476343148890228
- Instagram-Konto: 17841410500657352
- Zugang: Das Geheimnis `META_USER_TOKEN` liegt in den GitHub-Repo-Settings und wird nur vom Workflow gelesen. Das Token nie ausgeben, nie in Dateien, Logs oder Chat schreiben.

## Pro Meldung vier Einträge, gleiche Zeit (Reihenfolge einhalten; Änderungen: Facebook-Reel entfällt dauerhaft seit 26.10.2026, Instagram-Feed entfällt dauerhaft seit 27.10.2026)
1. Facebook-Feed: `platform: "facebook"`, `type: "photo"` (`image_url` = LOGO-URL nach PROMPT.md Abschnitt 5) oder `"video"` (`video_url`, bei Quell-Video). Text FACEBOOK-TEXT (AR+FR, höchstens 3 Hashtags).
2. (entfällt) Es wird KEIN Instagram-Feed (Foto) mehr erstellt (Nutzerwunsch 27.10.2026, dauerhaft, für alle künftigen Läufe). Das Foto dient nur noch dem Facebook-Feed und als Bildquelle für die Videos.
3. (entfällt) Es wird KEIN Facebook-Reel mehr erstellt.
4. Instagram-Reel: `platform: "instagram"`, `type: "reel"`, gleiche `video_url`. Text INSTAGRAM-TEXT (genau 5 Hashtags).
5. Facebook-Story: `platform: "facebook"`, `type: "story"`, `video_url` = `musik-<Zeit>-<n>-story-text.mp4`, `caption` leer.
6. Instagram-Story: `platform: "instagram"`, `type: "story"`, gleiche `video_url`, `caption` leer. Einen Link-Sticker gibt die API nicht her, er entfällt.
Alle vier tragen dieselbe `quelle_url`, denselben `titel` und dieselbe Zeit. Hinweis: `publish.py` (Facebook-Reel und -Story, Instagram-Foto) wurde am 26.10.2026 ergänzt; nach dem ersten Lauf das Log auf Fehler prüfen und melden.

## Format eines Eintrags in publisher/queue.json
```json
{
  "id": "20261025-1200-fb-feed",
  "platform": "facebook",
  "type": "photo",
  "image_url": "https://raw.githubusercontent.com/wadiib1-ops/Images4SocialMedia/main/images/<Datei>.jpg",
  "caption": "Text mit höchstens 3 Hashtags",
  "status": "scheduled",
  "publish_at": "2026-10-25T12:00:00+00:00",
  "titel": "<Schlagzeile>",
  "quelle_url": "<Quelle>"
}
```
- `status`: `scheduled` (zu `publish_at` veröffentlichen, mit Zeitzone) oder `now` (beim nächsten Lauf). Nie `published` oder `failed` selbst setzen.
- `id` eindeutig, `caption` leer lassen bei Stories.
- `titel` und `quelle_url` immer setzen (Doppelschutz 24 h), bei Botola zusätzlich `runde`.
- Medien-URLs: Bilder aus `main/images/`, Videos aus Branch `video-out` (Raw-URLs wie in PROMPT.md), vor dem Eintrag per curl prüfen (HTTP 200).
- Videos erst nach über 2 Tagen löschen (das Aufräumen übernimmt der Workflow `delete-videos.yml` auf `video-out`), Bilder in `images/` nach über 3 Tagen, weil sie zum Veröffentlichungszeitpunkt abgerufen werden.

## Ablauf am Ende des Laufs
1. Medien wie in PROMPT.md erzeugen und pushen (images/ auf main, Videos auf video-out).
2. Neue Einträge an `publisher/queue.json` anhängen (vorhandene Einträge nie ändern oder löschen).
3. `git add publisher/queue.json`, committen, `git push origin HEAD:main` (bei Ablehnung `git pull --rebase origin main` und einmal wiederholen). Der Push muss gelingen.
4. Keine Meldung = nichts anlegen.
5. Den Status prüfen: `publisher/log.jsonl` am Ende lesen. Fehlgeschlagene Einträge (`status: failed`, Feld `error`) im Bericht nennen. Nicht stillschweigend neu anlegen.

## Hashtag-Limit (verbindlich)
Facebook höchstens 3, Instagram höchstens 5 Hashtags pro Beitrag, im Text und im Video zusammen. Der Veröffentlicher lehnt Einträge mit zu vielen Hashtags ab.

## Token-Ablauf
Die Erinnerung eine Woche vor Ablauf des `META_USER_TOKEN` übernimmt eine eigene Routine des Nutzers. Im Lauf und im Bericht NICHT darauf hinweisen. Nur wenn das Veröffentlichen mit einem Token-Fehler scheitert, den Fehler melden.

## Musik und Dateien im Ordner Video/ (nie löschen)
Dateien im Ordner `Video/` auf `main` (die Musik-Tracks `.mp3` und alle anderen Dateien) werden NIE gelöscht, umbenannt oder verändert, von keiner Routine und keinem Workflow. Aufgeräumt werden nur die erzeugten Videos `musik-<Zeit>-<n>-….mp4` auf dem Branch `video-out` (nach über 2 Tagen).

## Benachrichtigung
Meldungen an den Besitzer gehen per PushNotification, keine E-Mails und keine Gmail-Werkzeuge. In Dateien dieses Repos stehen keine E-Mail-Adressen (das Repo ist öffentlich).

## Zeitangaben
Uhrzeiten gegenüber dem Nutzer (Chat, Bericht, Benachrichtigung) immer in Berliner Zeit (Europe/Berlin) nennen, nie in UTC. In `queue.json` bleibt `publish_at` technisch mit Zeitzonen-Versatz (zum Beispiel `+01:00` im Winter, `+02:00` im Sommer), keine UTC-Angabe im Text.

## Arbeitsweise
Antworten auf Deutsch, knapp. Keine Zusatzaktionen außer den oben genannten Schritten.

## Start und Zeitplan
- Läuft die Routine automatisch, beginnt die Bearbeitung SOFORT, wenn die konfigurierte Zeit kommt. Keine Vorlaufzeit, kein Warten.
- Schreibt der Nutzer im Chat "starte jetzt" (oder Ähnliches): sofort loslegen, ohne Wartezeiten. Alle Einträge bekommen `status: "now"` (kein `publish_at`), und nach dem Push startet der Workflow `publish.yml` sofort per workflow_dispatch (GitHub-Tool `actions_run_trigger`, ref main), statt auf den 15-Minuten-Takt zu warten. Dann das Ergebnis in `publisher/log.jsonl` prüfen.
- Manueller Start (verbindlich, dauerhaft): Wird die Routine vom Nutzer von Hand gestartet (Button/„Jetzt ausführen“, Chat-Aufforderung, Prompt ohne Zeitplan-Kennzeichnung „[SCHEDULED TASK …]“), werden die gefundenen Ergebnisse sofort nach Fertigstellung veröffentlicht: Einträge mit `status: "now"` (ohne `publish_at`), nach dem Push `publish.yml` per workflow_dispatch starten und das Ergebnis in `publisher/log.jsonl` prüfen. Keine Slots, kein Warten. Das gilt für alle künftigen manuellen Starts.
- SOFORT VERÖFFENTLICHEN (verbindlich, dauerhaft, gilt für JEDEN Lauf, auch den automatisch geplanten; Nutzerwunsch 26.10.2026, muss nie wieder gesagt werden): Alle Einträge (Feed, Reel, Stories) bekommen `status: "now"` ohne `publish_at`. Keine Slots, kein Warten auf :00/:20/:40. Direkt nach dem Push von `queue.json` den Workflow `publish.yml` per workflow_dispatch starten (GitHub-Tool `actions_run_trigger`, ref main), weil der 15-Minuten-Takt von GitHub unzuverlässig ausgeführt wird. Danach `publisher/log.jsonl` auf `main` prüfen; Fehler per PushNotification melden. Fälligen Rückstand in der Queue (scheduled mit vergangenem `publish_at`) löst derselbe Workflow-Start mit aus. Dieser Punkt ersetzt alle Slot-Angaben in PROMPT.md.
- Mehrere Einträge einer Meldung (vier Einträge) tragen dieselbe `quelle_url`; `publish.py` wertet sie nicht als Dubletten.

## Parallele Arbeitsweise (verbindlich, um Zeit zu sparen)
1. Gleich zu Beginn in EINEM Schritt parallel: Python-Umgebung im Hintergrund bauen (`python3 -m venv /tmp/venv && /tmp/venv/bin/pip install -q pillow arabic-reshaper python-bidi`, weil das System-Pillow defekt ist), `git fetch origin main video-out` und die Dublettenprüfung gegen `publisher/queue.json`/`log.jsonl`.
2. Recherche: 3 bis 4 Quellseiten der Quellenliste gleichzeitig abrufen (ein Block mit mehreren WebFetch-Aufrufen), danach die Einzelartikel der Kandidaten gleichzeitig (Datum, Fakten, Foto, Video). Abbruch, sobald 1 brauchbare Meldung vorliegt (pro Lauf wird nur nach einer Meldung gesucht, Nutzerwunsch 27.10.2026, dauerhaft).
3. Foto-Ladeprüfung und Foto-Ansicht der Meldung.
4. Videos der Meldung gleichzeitig bauen (ffmpeg-Aufrufe als parallele Hintergrundprozesse mit `&` und `wait`): STORY-VIDEO, Story-Text-Video, Reel-Text-Video. Ein Vorschaubild je Video genügt.
5. Texte (FACEBOOK-TEXT, INSTAGRAM-TEXT, je AR+FR) für die Meldung schreiben, während die Videos rendern.
6. Push nach `video-out`, Medien-URL-Prüfung (curl) und Cloudinary-Prüfung gleichzeitig; danach ein einziger Push von `queue.json` nach `main`.
7. Unabhängige Tool-Aufrufe immer im selben Block absetzen.

## Logo-Streifen (verbindlich, dauerhaft, Nutzerwunsch 27.10.2026)
Fotos tragen das Logo nicht mehr auf dem Bild, sondern in einem Streifen in der Randfarbe des Fotos (Höhe 22 % der Bildbreite; das Foto bleibt vollständig sichtbar) oben links über dem Foto (LOGO-URL in PROMPT.md Abschnitt 5). Das gilt für das Facebook-Foto in jedem Lauf; Videos bleiben unverändert.

## Video-Effekt (verbindlich, dauerhaft, Nutzerwunsch 27.10.2026)
Instagram-Reel, Facebook-Story und Instagram-Story erhalten das Effekt-Video nach PROMPT.md Abschnitt 8 Schritt 5 bis 7: Start-Effekt (Blitz, Punch-In-Zoom, RGB-Glitch, Beat-Puls, Vignette) nur in den ersten 2 Sekunden, danach ruhiges Bild; Text mit Einblendung, roter Fortschrittsbalken unten. Quell-Videos (Regel D) bleiben unverändert.

## Langer Text im Video (verbindlich, dauerhaft, Nutzerwunsch 27.10.2026; ersetzt PROMPT.md Abschnitt 6 STORY-SCHLAGZEILE/CALL TO ACTION/REEL-ABSCHNITTE und Abschnitt 8 Schritt 6 und 7)
- Instagram-Reel, Facebook-Story und Instagram-Story zeigen im Video den identischen langen Text des Facebook-Feed-Beitrags, nur den ARABISCHEN Teil (ohne französischen Teil, ohne Hashtags). Kein Kurztext, keine Schlagzeile und kein Call to Action mehr als eigene Einblendung. Der Wortlaut wird nicht gekürzt oder verändert.
- Der Text wird in gleichmäßige Abschnitte geteilt (je Satz oder Satzgruppe, höchstens ca. 15 Wörter bzw. 150 Zeichen), die nacheinander über die gesamte Videolänge erscheinen (erster Abschnitt ab 0,5 s, jeder mit Einblendung `fade=t=in:st=<Start>:d=0.4:alpha=1`, Ende des letzten = Videoende). Je Abschnitt ein PNG mit `story_text.py --out /tmp/rp<k>.png --title "<Abschnitt>"` (ohne --cta und --tags).
- Videolänge D (Sekunden) = Anzahl Abschnitte x 3,5, mindestens 12, höchstens 20 (Grenze der Facebook-Story). Überschreitet der Text bei 20 s die Lesbarkeit (mehr als ca. 6 Abschnitte), die Abschnitte entsprechend größer (mehr Wörter) schneiden, nicht über 20 s hinaus verlängern.
- In den ffmpeg-Aufrufen (PROMPT.md Abschnitt 8 Schritt 5 und 7) alle `12` durch D ersetzen (`-t D`, `d=D`, Balken `1080*t/D`, Ton `atrim=0:D`, `afade ... st=D-2`, Startpunkt im Track: Tracklänge minus D minus 8 s als Obergrenze). Reel, FB-Story und IG-Story nutzen dieselbe Datei `musik-<Zeit>-<n>-reel-text.mp4` bzw. `...-story-text.mp4` (beide dürfen identisch gebaut werden). Ansonsten bleibt das Effekt-Video unverändert.
- Weiterhin: Hashtag-Limit, keine URL, keine Quellenangabe, Begleittext der Stories leer.

## Nur arabische Texte (verbindlich, dauerhaft, Nutzerwunsch 27.10.2026; ersetzt PROMPT.md Abschnitt 9 und alle Hinweise auf "AR+FR" bzw. "zweisprachig")
FACEBOOK-TEXT und INSTAGRAM-TEXT werden nur noch auf Arabisch geschrieben, ohne französische Fassung. Alle übrigen Regeln (Hashtag-Limit 3 bzw. 5, Hashtags einmal am Ende, Frage am Ende des Facebook-Texts, Instagram unter 2200 Zeichen, keine URL, keine Quelle, keine Flaggen-Emojis, FB- und IG-Text unterschiedlich formuliert) bleiben. Im Bericht entfällt die Bestätigung "zweisprachig"; stattdessen: "Texte arabisch fertig".

## Reel-Titelbild (verbindlich, dauerhaft, Nutzerwunsch 27.10.2026)
Der Instagram-Reel-Eintrag bekommt zusätzlich das Feld `cover_url` (Vorschaubild, das vor dem Start des Reels zu sehen ist). Cover = Standbild aus dem fertigen Reel-Video bei Sekunde 4 (Text, Logo und Foto sichtbar; 1080x1920): `ffmpeg -y -loglevel error -ss 4 -i reel-text.mp4 -frames:v 1 -q:v 2 /tmp/cover.jpg`. Datei als `images/cover-<JJJJMMTT-HHMM>-<n>.jpg` auf `main` pushen (zusammen mit dem Push von queue.json) und per curl auf HTTP 200 prüfen; `cover_url` = `https://raw.githubusercontent.com/wadiib1-ops/Images4SocialMedia/main/images/cover-<JJJJMMTT-HHMM>-<n>.jpg`. Nur beim `ig-reel`-Eintrag; `publish.py` reicht es als `cover_url` an die Meta-API weiter. Aufräumen wie bei anderen Bildern in `images/` (nach über 3 Tagen).

## Lesezeit der Textabschnitte (verbindlich, dauerhaft, Nutzerwunsch 27.10.2026; ersetzt die frühere Regel "+1 Sekunde")
Die Anzeigedauer jedes Textabschnitts im Video (Reel-Abschnitte, Story-Schlagzeile, Call to Action) richtet sich nach der Wortzahl, damit alles lesbar ist (PROMPT.md Abschnitt 8 Schritt 5 bis 7 entsprechend anpassen):
- Zeit je Abschnitt = 1,5 s + 0,5 s × Wortzahl, mindestens 3,5 s; der Call to Action der Story mindestens 5 s.
- Abschnitte höchstens ca. 12 Wörter (statt 150 Zeichen); lange Meldungen in mehr, aber kürzere Abschnitte teilen.
- Videolänge D = Summe der Abschnittszeiten + 1 s, höchstens 30 s. Reicht D nicht, die unwichtigsten Abschnitte weglassen (die Schlagzeile bleibt immer).
- Abschnitt 1 erscheint ab 0,5 s, jeder weitere direkt nach dem vorigen (Einblendung 0,4 s, `enable='between(t,Start,Ende)'`, Ende des letzten = D). Story: Schlagzeile ab 0,5 s, Call to Action danach; D mindestens 12 s.
- In allen ffmpeg-Aufrufen 12 durch D ersetzen (`-t`, Farbbalken `d=`, Fortschrittsbalken `t/D`, `atrim=0:D`, `afade out st=D-2`); story.mp4 wird mit D gebaut. Startpunkt im Track: höchstens Tracklänge minus D minus 8 Sekunden.

## Logo 30 % kleiner (verbindlich, dauerhaft, Nutzerwunsch 27.10.2026, gilt für alle Beitragsarten)
Das Logo ist überall 30 % kleiner: im Facebook-Foto 63 % statt 90 % der Streifenhöhe (`h_$b_mul_0.63`), in allen Videos (Reel, Facebook- und Instagram-Story) `scale=106:-1` statt 151. Streifenhöhe und Position bleiben.
