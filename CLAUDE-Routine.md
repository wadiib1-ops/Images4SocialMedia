# CLAUDE-Routine.md (nur für den Marokko-Fußball-Job)

Diese Datei gilt innerhalb der Routine anstelle von CLAUDE.md. Die bestehende CLAUDE.md bleibt unverändert. Wo PROMPT.md und diese Datei sich widersprechen, gilt diese Datei.

## Grundsatz
Ich (Claude) lege die Beiträge in `publisher/queue.json` ab. Der GitHub-Workflow `.github/workflows/publish.yml` (alle 15 Minuten) veröffentlicht fällige Einträge mit `publisher/publish.py` über die Meta Graph API. Es wird kein externes Planungswerkzeug benutzt. Inhalte, Texte, Bilder, Musik-Video, Quellenregeln, 24-Stunden-Regel und Sprachen stehen in PROMPT.md.

## Konten
- Facebook-Seite: 476343148890228
- Instagram-Konto: 17841410500657352
- Zugang: Das Geheimnis `META_USER_TOKEN` liegt in den GitHub-Repo-Settings und wird nur vom Workflow gelesen. Das Token nie ausgeben, nie in Dateien, Logs oder Chat schreiben.

## Pro Meldung sechs Einträge, gleiche Zeit (Reihenfolge einhalten; Änderung 26.10.2026)
1. Facebook-Feed: `platform: "facebook"`, `type: "photo"` (`image_url` = LOGO-URL nach PROMPT.md Abschnitt 5) oder `"video"` (`video_url`, bei Quell-Video). Text FACEBOOK-TEXT (AR+FR, höchstens 3 Hashtags).
2. Instagram-Feed: `platform: "instagram"`, `type: "photo"` mit derselben `image_url` (LOGO-URL; wenn Cloudinary die Quelle nicht laden kann, Foto mit aufgesetztem Logo in `images/` ablegen). Text INSTAGRAM-TEXT (AR+FR, genau 5 Hashtags). Bei Quell-Video entfällt dieser Eintrag.
3. Facebook-Reel: `platform: "facebook"`, `type: "reel"`, `video_url` = `musik-<Zeit>-<n>-reel-text.mp4`. Text FACEBOOK-TEXT (höchstens 3 Hashtags).
4. Instagram-Reel: `platform: "instagram"`, `type: "reel"`, gleiche `video_url`. Text INSTAGRAM-TEXT (genau 5 Hashtags). (Der Instagram-Feed ist das Foto aus Punkt 2, deshalb `reel` statt `feed`.)
5. Facebook-Story: `platform: "facebook"`, `type: "story"`, `video_url` = `musik-<Zeit>-<n>-story-text.mp4`, `caption` leer.
6. Instagram-Story: `platform: "instagram"`, `type: "story"`, gleiche `video_url`, `caption` leer. Einen Link-Sticker gibt die API nicht her, er entfällt.
Alle sechs tragen dieselbe `quelle_url`, denselben `titel` und dieselbe Zeit. Hinweis: `publish.py` (Facebook-Reel und -Story, Instagram-Foto) wurde am 26.10.2026 ergänzt; nach dem ersten Lauf das Log auf Fehler prüfen und melden.

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
- Im automatischen Lauf bekommen die Einträge `status: "scheduled"` mit `publish_at` nach den Slots aus PROMPT.md. Nach dem Push der Einträge ist der Lauf zu Ende: NICHT auf die Uhrzeit warten, nicht pollen. Das Veröffentlichen übernimmt der Workflow.
- Mehrere Einträge einer Meldung (sechs Einträge) tragen dieselbe `quelle_url`; `publish.py` wertet sie nicht als Dubletten.

## Parallele Arbeitsweise (verbindlich, um Zeit zu sparen)
1. Gleich zu Beginn in EINEM Schritt parallel: Python-Umgebung im Hintergrund bauen (`python3 -m venv /tmp/venv && /tmp/venv/bin/pip install -q pillow arabic-reshaper python-bidi`, weil das System-Pillow defekt ist), `git fetch origin main video-out` und die Dublettenprüfung gegen `publisher/queue.json`/`log.jsonl`.
2. Recherche: 3 bis 4 Quellseiten der Quellenliste gleichzeitig abrufen (ein Block mit mehreren WebFetch-Aufrufen), danach die Einzelartikel der Kandidaten gleichzeitig (Datum, Fakten, Foto, Video). Abbruch, sobald 2 brauchbare Meldungen vorliegen.
3. Foto-Ladeprüfung und Foto-Ansicht beider Meldungen gleichzeitig.
4. Videos beider Meldungen gleichzeitig bauen (ffmpeg-Aufrufe als parallele Hintergrundprozesse mit `&` und `wait`): STORY-VIDEO, Story-Text-Video, Reel-Text-Video. Ein Vorschaubild je Video genügt.
5. Texte (FACEBOOK-TEXT, INSTAGRAM-TEXT, je AR+FR) für beide Meldungen schreiben, während die Videos rendern.
6. Push nach `video-out`, Medien-URL-Prüfung (curl) und Cloudinary-Prüfung gleichzeitig; danach ein einziger Push von `queue.json` nach `main`.
7. Unabhängige Tool-Aufrufe immer im selben Block absetzen.
