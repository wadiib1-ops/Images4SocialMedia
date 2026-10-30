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
Fotos tragen das Logo nicht mehr auf dem Bild, sondern in einem Streifen in der Randfarbe des Fotos (Höhe 15,4 % der Bildbreite; das Foto bleibt vollständig sichtbar) oben links über dem Foto (LOGO-URL in PROMPT.md Abschnitt 5). Das gilt für das Facebook-Foto in jedem Lauf; Videos bleiben unverändert.

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
Das Logo ist überall 30 % kleiner: im Facebook-Foto sind Streifen (jetzt 15,4 % der Bildbreite, `$b_iw_mul_0.154`) und Logo (weiter 90 % der Streifenhöhe) 30 % kleiner, in allen Videos `scale=106:-1` statt 151. Position bleibt.

## Sachliche Schlussfrage (verbindlich, dauerhaft, Nutzerwunsch 28.10.2026)
Die Frage an die Leser im arabischen Text jedes Beitrags (Facebook-Text und, falls vorhanden, Instagram-Text) ist immer sachlich formuliert, nicht emotional: keine Gefühlswörter, keine Ausrufe, keine Emojis in der Frage. Beispiel: "Wie bewertet ihr die Leistung des Teams?" statt "Glaubt ihr an den Titel?!". Gilt für alle künftigen Läufe.

## Textabschnitte 1 Sekunde kürzer (verbindlich, dauerhaft, Nutzerwunsch 29.10.2026; gilt für Instagram-Reel, Facebook-Story und Instagram-Story)
Jeder im Video eingeblendete Textabschnitt steht 1 Sekunde kürzer: statt 3,5 s je Abschnitt 2,5 s; bei der Lesezeit-Regel "1,5 s + 0,5 s × Wortzahl" ein Mindestwert von 2,5 s statt 3,5 s (Call to Action der Story mindestens 4 s statt 5 s). Videolänge D = Summe der Abschnittszeiten (bzw. Anzahl Abschnitte x 2,5), Mindestlänge 12 s und Obergrenzen (20 s bzw. 30 s) bleiben unverändert. Diese Regel ersetzt die jeweiligen Zeitangaben in den Abschnitten "Langer Text im Video" und "Lesezeit der Textabschnitte".

## Zufällige Musikwahl (verbindlich, dauerhaft, Nutzerwunsch 29.10.2026)
Der Musik-Track wird in jedem Lauf zufällig aus allen Dateien `Video/*.mp3` gewählt (`RANDOM % Anzahl`). Das ersetzt die Index-Regel in PROMPT.md Abschnitt 8 Schritt 4 (Startpunkt im Track bleibt ein Vielfaches von 8 Sekunden).

## Textabschnitte 0,5 Sekunden länger, keine Obergrenze (verbindlich, dauerhaft, Nutzerwunsch 29.10.2026; gilt für Instagram-Reel, Facebook-Story und Instagram-Story)
Jeder im Video eingeblendete Textabschnitt steht 0,5 Sekunden länger, also der Abstand zwischen allen aufeinanderfolgenden Abschnitten (vom ersten zum zweiten, zum dritten usw.): statt 2,5 s je Abschnitt 3,0 s; bei der Lesezeit-Regel "1,5 s + 0,5 s × Wortzahl" ein Mindestwert von 3,0 s (Call to Action der Story mindestens 4,5 s). Videolänge D = Summe der Abschnittszeiten (bzw. Anzahl Abschnitte x 3,0, erster Abschnitt ab 0,5 s, Ende des letzten = Videoende), Mindestlänge 12 s. Die Obergrenzen (20 s bzw. 30 s) entfallen vollständig: das Video wird so lang wie nötig. Diese Regel ersetzt die Zeitangaben in den Abschnitten "Langer Text im Video", "Lesezeit der Textabschnitte" und "Textabschnitte 1 Sekunde kürzer".

## Vollständige Dublettenprüfung (verbindlich, dauerhaft, Nutzerwunsch 30.10.2026)
Vor dem Bauen von Medien und vor dem Anlegen von Einträgen wird jeder Kandidat per Stichwortsuche gegen die KOMPLETTE `publisher/queue.json` (alle Einträge, nicht nur die letzten) und `publisher/log.jsonl` geprüft: Teamnamen, Spielernamen, Gegner, Ergebnis und Wettbewerb, jeweils auf Arabisch, Französisch und Englisch (zum Beispiel `grep -i` oder Python über `titel` und `caption`). Ein Treffer zum selben Spiel, Spieler im selben Kontext oder derselben Aussage (auch mit anderer Quelle, anderem Titel oder Wortlaut) in den letzten 7 Tagen macht den Kandidaten zur Dublette: verwerfen, nächste Meldung suchen. Nie nur eine alphabetisch sortierte oder abgeschnittene Titelliste ansehen. Im Bericht die verwendeten Suchbegriffe nennen. Anlass: Am 30.10.2026 wurde das Spiel Marokko U15 gegen Venezuela (4:3) zweimal veröffentlicht.

## Formate je Kanal (verbindlich, dauerhaft, Nutzerwunsch 30.10.2026)
- Facebook-Feed: Hochformat 4:5 (1080x1350, Empfehlung), quadratisch 1:1 (1080x1080) oder Querformat/Link-Vorschau 1,91:1 (1200x630). Bild (JPG, PNG) oder Video (MP4, MOV; empfohlen 15-30 s, max. 4 GB).
- Facebook-Story und Facebook-Reel: 9:16, 1080x1920 (bis 1440x2560). Story höchstens 60 s (in 15-s-Clips geteilt), Reel 15-90 s. Safe Zones: wichtige Texte und Logos nicht ganz am oberen und unteren Rand (UI-Elemente).
- Instagram-Feed: 4:5 (1080x1350, Empfehlung), 3:4 (1080x1440), 1:1 (1080x1080) oder 1,91:1 (1080x566). Foto oder Video (MP4/MOV, H.264, höchstens 60 s).
- Instagram-Story: 9:16, 1080x1920, insgesamt höchstens 60 s, in Abschnitten von höchstens 15 s.
- Instagram-Reel: 9:16, 1080x1920, 15-90 s. Cover ebenfalls 9:16 (oder 1:1 fürs Raster).
- Gilt für alle Medien dieser Routine (Meldungen und Botola-Vorschau). Bestehende Videos mit abweichendem Format (z. B. Vorschau-Video 9:16 und 38,5 s im Facebook-Feed) bei neuen Läufen entsprechend anpassen.

## Formate je Plattform (verbindlich, dauerhaft, Nutzerwunsch 30.10.2026; gilt für alle künftigen Läufe)
- **Facebook-Feed:** Hochformat 4:5 (1080 × 1350 px, Empfehlung), quadratisch 1:1 (1080 × 1080) oder Querformat/Link-Vorschau 1,91:1 (1200 × 630). Bilder JPG/PNG, Videos MP4/MOV, empfohlen 15–30 s, max. 4 GB.
- **Facebook-Story und Facebook-Reel:** 9:16, 1080 × 1920 px (bis 1440 × 2560). Story max. 60 s (in 15-s-Clips), Reel 15–90 s. Safe Zones: Text und Logos nicht ganz am oberen/unteren Rand (UI-Elemente der App).
- **Instagram-Feed:** 4:5 (1080 × 1350, Empfehlung), 3:4 (1080 × 1440), 1:1 (1080 × 1080) oder 1,91:1 (1080 × 566). Fotos oder Videos (MP4/MOV, H.264, max. 60 s).
- **Instagram-Story:** 9:16, 1080 × 1920 px, bis 60 s insgesamt, Abschnitte je max. 15 s.
- **Instagram-Reel:** 9:16, 1080 × 1920 px, 15–90 s. Reel-Cover ebenfalls 9:16 (oder 1:1 für das Raster).
- Beim Bauen jedes Mediums Format und Länge mit ffprobe prüfen. Passt ein Medium nicht (zum Beispiel ein 9:16-Video im Facebook-Feed, wo 4:5 empfohlen ist), vor dem Veröffentlichen ins passende Format umsetzen.

## Plattform-Formate (verbindlich, dauerhaft, Nutzerwunsch 30.10.2026; gilt für alle künftigen Läufe)
Bild- und Videoformate richten sich nach diesen Vorgaben (bei Widerspruch zu älteren Angaben in PROMPT.md gelten diese):
1. Facebook-Feed: Hochformat 4:5 (1080 x 1350 px, Empfehlung), quadratisch 1:1 (1080 x 1080 px) oder Querformat/Link-Vorschau 1,91:1 (1200 x 630 px). Medien: Bilder (JPG, PNG) oder Videos (MP4, MOV; empfohlen 15 bis 30 s, max. 4 GB).
2. Facebook-Stories und -Reels: 9:16 Vollbild, 1080 x 1920 px (bis 1440 x 2560 px). Stories max. 60 s (in 15-s-Clips aufgeteilt), Reels 15 bis 90 s. Safe Zones: wichtige Texte oder Logos nicht ganz am oberen oder unteren Rand, dort liegen UI-Elemente der Apps.
3. Instagram-Feed: 4:5 (1080 x 1350 px, Empfehlung), 3:4 (1080 x 1440 px), 1:1 (1080 x 1080 px) oder 1,91:1 (1080 x 566 px). Fotos oder Videos (MP4/MOV, H.264, max. 60 s).
4. Instagram-Stories: 9:16, 1080 x 1920 px, bis 60 s insgesamt, in Abschnitten von höchstens 15 s.
5. Instagram-Reels: 9:16, 1080 x 1920 px, 15 bis 90 s. Das Reel-Cover im Format 9:16 (oder 1:1 für das Raster).

## Neues Logo (verbindlich, dauerhaft, Nutzerwunsch 30.10.2026)
Das Logo ist jetzt "MAROC KORA NEWS / أخبار الكرة المغربية" (rund, grün/rot, Fallrückzieher). Es ersetzt das alte Logo überall: `botola-video/assets/logo.png`, `botola2-video/assets/logo.png`, `add_logo.py` (Datei `images/logo-neu.png` ist dieselbe Vorlage). Das alte Logo nie mehr verwenden. Die LOGO-URL in PROMPT.md lädt das neue Logo direkt von `images/logo-neu.png` (main) per Cloudinary `l_fetch`, am 30.10.2026 getestet; das alte Cloudinary-Asset `logo_wappen` wird nicht mehr verwendet und im Cloudinary-Konto ist nichts zu tun. `images/logo-neu.png` darf deshalb nie gelöscht oder umbenannt werden.
