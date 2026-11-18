# Projektfortschritt-Dashboard

Statische Seite (HTML, CSS, JavaScript ohne Abhängigkeiten), die `publisher/log.jsonl` auswertet.

## Öffnen

- **Mit Anmeldung (empfohlen):** über das Backend in `backend/` (Cloudflare Worker). Nur dort gibt es Löschen und Änderungs-Historie. Einrichtung: `backend/README.md`.
- **GitHub Pages:** (sollte abgeschaltet werden, sobald das Backend läuft) In den Repo-Einstellungen unter *Pages* den Branch `main` (Ordner `/`) aktivieren, dann `https://<benutzer>.github.io/<repo>/dashboard/` öffnen.
- **Lokal:** im Repo-Ordner `python3 -m http.server` starten und `http://localhost:8000/dashboard/` öffnen.
- **Als einzelne Datei:** `dashboard/index.html` direkt öffnen. Dann wird das Protokoll von `raw.githubusercontent.com` geladen.

Über das Backend kommt das Protokoll von `/api/log`. Ohne Backend wird die Datenquelle in dieser Reihenfolge versucht: `?src=<url>`, `../publisher/log.jsonl`, raw.githubusercontent.com.
Die Seite lädt alle 2 Minuten neu und markiert neue Einträge seit dem letzten Besuch.

## Inhalt

- Kennzahlen mit Vergleich zur Vorperiode: Veröffentlicht, Meldungen, Erfolgsquote, Fehlgeschlagen, Übersprungen, Läufe
- Veröffentlichungen pro Tag (bei „Heute“ pro Stunde), nach Plattform gestapelt; Klick auf einen Tag öffnet den Tagesfortschritt
- Tagesfortschritt: jede Meldung mit ihren Beiträgen (FB/IG, Format, Status)
- Probleme pro Tag, Formate, Aktivität nach Wochentag und Uhrzeit, Fehleranalyse nach Ursache
- Durchsuchbares Protokoll

Filter: Zeitraum (Heute, 7 Tage, 30 Tage, Alles) und Plattform. Hell- und Dunkelmodus.

## Erweitern

`app.js` ist in Abschnitte gegliedert. Neue Ereignisarten kommen in `EVENT_KINDS`, neue Karten in `VIEWS`,
Benachrichtigungen docken an `onNewEntries()` an. Die Verwaltung (Auswahl, Löschen, Historie) steht im Abschnitt 7 von `app.js`.
Geplante Ausbaustufen: Benachrichtigungen, tägliche Fehlerberichte per E-Mail, Systemereignisse.
