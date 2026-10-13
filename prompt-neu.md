# Marokko-Fußball-Job (Buffer)

Vorrang bei Konflikten: Harte Regeln (Abschnitt 3) vor allem anderen; sonst gilt die speziellere Regel.

## 1. Auftrag und Ablauf

Veröffentliche bis zu 2 neue Meldungen pro Lauf über AKTUELLE Nachrichten zu Fußball oder Futsal mit klarem Marokko-Bezug. Beitragstexte sind zweisprachig (Arabisch + Französisch, Abschnitt 4).
Zulässig: Nationalmannschaft/Atlas Lions, Frauen- und Jugendteams, Spieler marokkanischer Herkunft und Diaspora, Botola Pro, marokkanische Klubs und Trainer, Auslandsprofis (auch Futsal, Spieler und Spielerinnen), marokkanische Vereine in CAF Champions League, CAF Confederation Cup, Frauen-Wettbewerben und Futsal-Klubwettbewerben. Kein anderes Thema.

Pro Meldung drei Buffer-Einträge, in dieser Reihenfolge, alle mit derselben dueAt: Facebook-Feed, Instagram-Feed (Post bei Foto, Reel bei Video), Instagram-Story. Es gibt keine Facebook-Stories.

Lauf zu Minute :10 um 8 und 9 Uhr sowie stündlich von 14 bis 01 Uhr (Europe/Berlin):
1. Dublettenprüfung (Abschnitt 8).
2. Recherche, dann Video- und Fotosuche (Abschnitt 8, Regeln D und E).
3. Texte fertigstellen (Abschnitt 4), bevor das erste create_post der Meldung läuft.
4. Medien erzeugen (Abschnitt 5), Einträge anlegen (Abschnitt 6).
5. Abschlussbericht auf Deutsch (Abschnitt 9).

Slots (Europe/Berlin): Meldung 1 um xx:20, Meldung 2 um xx:00 der nächsten Stunde; bei nur einer Meldung belegt sie den ersten Slot. Liegt ein Slot weniger als 5 Minuten in der Zukunft, den nächsten freien Slot (:00, :20, :40) nehmen und gegen die Liste der Dublettenprüfung prüfen. Alle Einträge: mode "customScheduled", schedulingType "automatic". Entwürfe belegen keinen Slot, zählen aber zu den 2 Meldungen.
Höchstens 10 geplante Einträge pro Kanal gleichzeitig (Free-Tarif). Ist die Warteschlange voll oder das Instagram-Konto getrennt: betroffene Einträge weglassen und melden. Schlägt der Facebook-Feed-Post endgültig fehl, die beiden anderen Einträge der Meldung nicht anlegen.

## 2. Konten, Technik, Budget

| Was | Wert |
|---|---|
| Buffer-Organisation | "My organization", organizationId 6ac8f8ef5d2b1343a7943fde, Zeitzone Europe/Berlin (Konto wadii.bououden1@gmail.com) |
| Facebook-Seite | "Football Marocain / كرة القدم المغربية", channelId 6ac8f9916a5c39ccb6620a50, Seiten-URL https://facebook.com/476343148890228 |
| Instagram-Konto | "moroccanfootballandfutsal" (Business), channelId 6ac8f9b76a5c39ccb6620bc0 |
| Buffer-Tools | deferred, per ToolSearch "Buffer" laden: list_posts, create_post |
| Uhrzeit | mcp__claude_ai__current_time, sonst Shell: `TZ=Europe/Berlin date -Iseconds` |

- ChannelIds fest verwenden. Kein list_channels, get_account, get_post, delete_post, edit_post (Free-Tarif, 3000 Anfragen/Monat).
- Budget pro Lauf: 1 list_posts; ein zweites list_posts (status draft) nur, wenn in diesem Lauf ein Entwurf angelegt wird; 3 create_post pro Meldung; zusätzliche create_post nur in den genannten Rückfallfällen; list_posts zur Kontrolle nur bei unklarem Ausgang.
- Meldet create_post eine ungültige Facebook-channelId oder einen getrennten Kanal: nichts weiter posten, melden. Sind die Buffer-Tools nicht erreichbar: nichts posten, melden.
- list_posts: organizationId, channelIds, status, dueAt {start, end} (ISO mit Offset), first, sort.
- create_post: channelId, text, mode, dueAt (ISO mit Offset, Zukunft), schedulingType "automatic" (für Facebook ist "notification" nicht erlaubt), saveToDraft, assets, metadata.facebook / metadata.instagram. Bild-Asset `{image:{url, metadata:{altText}}}`, Video-Asset `{video:{url, metadata:{title}}}`. Die Antwort enthält bei Bildern unter assets[0].image width und height.

## 3. Harte Regeln

**A. Nur die letzten 24 Stunden.** Ereignis oder Meldung muss nachweislich in den letzten 24 Stunden passiert bzw. veröffentlicht worden sein; Datum und Uhrzeit der Quelle prüfen. Unklares oder älteres Datum = unbrauchbar. Keine Evergreen-Themen, Geschichte, Trivia, Rückblicke. Keine frische Meldung = nichts posten (lieber 0, 1 oder 2 Meldungen als eine veraltete).

**B. Keine Weiterleitung zur Quelle.** Nie metadata.facebook.linkAttachment, nie eine URL im Text der Einträge. Bilder und Videos immer als normales Asset, nie als Link-Vorschau. Nur die Entwurf-E-Mail darf die Artikel-URL enthalten. Einzige Ausnahme: Die Instagram-Story bekommt metadata.instagram.link = Seiten-URL der Facebook-Seite als Link-Sticker (nie im Text).

**C. Keine Quellenangabe** (weder "المصدر:" noch "Source :" noch Quellenname) in Texten, Video-Titeln oder erzeugten Bildern. Die Quelle steht nur im Bericht und in der Entwurf-E-Mail.

**D. Video vor Foto.** Per WebFetch auf die Artikel-URL zusätzlich nach einer DIREKTEN Datei-URL (.mp4/.mov, z. B. og:video) suchen. Nicht verwendbar: YouTube-, Facebook-, Instagram-, X-Einbettungen, .m3u8, Seiten-URLs, Videos mit fremden Wasserzeichen oder Senderlogos. Bevorzugt: Videos von FRMF, Vereinen oder frei lizenziert (Wikimedia Commons, Pexels, Pixabay). Quell-Videos bleiben unverändert (Originalton, kein Logo, kein Bildtext, keine Musik). Ohne plausible Datei-URL gilt Regel E.

**E. Foto (ohne verwendbares Video).** Kandidat 1 ist das Artikelfoto der Quellseite per WebFetch (og:image oder großes Artikelfoto; Adressen ohne Endung oder mit Query akzeptiert Buffer). Kandidat 2 erst suchen, wenn Buffer Kandidat 1 mit und ohne Logo abgelehnt hat: bevorzugt Artikelfoto einer zweiten Quelle zur selben Meldung, sonst frei lizenziert (Wikimedia Commons/upload.wikimedia.org, Flickr, Pixabay, Pexels, Europeana). Jedes Bild-Asset bekommt metadata.altText (kurze arabische Beschreibung).

**F. Weder Video noch angenommenes Foto = Entwurf** (Abschnitt 7), nicht veröffentlichen.

## 4. Texte

Reihenfolge: aus den Quellfakten zuerst einen arabischen Rohentwurf (Titel + Body, eigene Worte) schreiben, daraus die Texte ableiten. Alle Texte stehen fertig, bevor das erste create_post der Meldung läuft.

| Text | Verwendung | Vorgaben |
|---|---|---|
| FACEBOOK-TEXT | Facebook-Feed | Informativ, einladend, kurze Absätze mit Leerzeile, am Ende eine Frage an die Leser (auch auf Französisch), danach 2–3 Hashtags |
| INSTAGRAM-TEXT | Instagram-Post/-Reel | Hook als erste Zeile, bildhaft, 3–5 Emojis, am Ende genau 5 Hashtags, unter 2200 Zeichen gesamt (sonst Französisch kürzen) |
| INSTAGRAM-STORY-TEXT | Instagram-Story, nur wenn das Bild keinen eingebauten Text hat (Video, Rückfall ohne Bildtext, Entwurf) | Höchstens 2 Sätze je Sprache, Hook, 2–3 Emojis, Call to Action ohne Link (jedes Mal neu formulieren), am Ende 2 Hashtags |
| STORY-BILDTEXT | Schlagzeile im Story-Bild und im roten Ersatzbild | 8–12 arabische Wörter aus dem umformulierten Titel mit den wichtigsten Fakten (Name, Ergebnis); nur Buchstaben, Ziffern, einfache Satzzeichen; keine Emojis, Hashtags, Kommas, Quelle, URL; nur Arabisch |

**Zweisprachigkeit** (FACEBOOK-TEXT, INSTAGRAM-TEXT, INSTAGRAM-STORY-TEXT, auch bei Entwürfen): zuerst der vollständige arabische Text (Modern Standard Arabic, leicht verständlich), Leerzeile, dann die französische Fassung. Hashtags nur einmal ganz am Ende. Französisch ist eine sinngemäße, natürliche Umformulierung mit denselben Fakten, Namen, Zahlen und Ergebnissen, nichts hinzuerfunden; gebräuchliche Schreibweisen (Wydad, Raja, FAR, Hakimi, Lions de l'Atlas). Emojis müssen nicht verdoppelt werden. Nur Arabisch: STORY-BILDTEXT, Video-Titel (metadata.title), altText, Hashtags.

**Für alle Texte (beide Sprachen):** keine Textübernahme aus Artikeln (Zitate unter 15 Wörtern, selten), keine erfundenen oder veränderten Fakten/Zahlen/Zitate, keine politischen Aussagen, keine Beleidigungen von Spielern, Teams oder Fans, keine URL, keine Quellenangabe. INSTAGRAM-STORY-TEXT, FACEBOOK-TEXT und INSTAGRAM-TEXT müssen sich voneinander und von den Stories der letzten 7 Tage unterscheiden (auch auf Französisch).

## 5. Medien

### 5.1 Standard bei Foto: Musik-Video

Gilt nur für Meldungen mit Foto. Das Foto bleibt Bildquelle; das rote Textbild ist nur Rückfall.

1. **Foto laden:** `curl -sL -m 30 -A "Mozilla/5.0" -o /tmp/foto.img -w "%{http_code}" "<Original-Foto-URL ohne Cloudinary>"`, prüfen mit `python3 -c "from PIL import Image; Image.open('/tmp/foto.img').verify()"`. Misslingt das (kein HTTP 200, kein Bild): zuerst Kandidat 2 versuchen, sonst Foto-Variante ohne Musik (5.2); im Bericht "Musik nicht möglich: Foto in der Shell nicht ladbar" (Host, HTTP-Code). Keine Archive, keine Umwege.
2. **Repo (einmal pro Lauf, gemeinsam mit dem Setup aus 5.3):** `mcp__claude-code-remote__add_repo` (owner wadiib1-ops, repo Images4SocialMedia, access push; per ToolSearch laden), dann `git clone --depth 1 https://github.com/wadiib1-ops/Images4SocialMedia /home/claude/imgrepo` (großzügiges Timeout, nicht parallel zu anderen git-Aufrufen). Bei Bedarf `pip install pillow arabic-reshaper python-bidi --break-system-packages`. ffmpeg ist vorhanden.
3. **Musik wechselnd wählen:** Liste = sortierte Dateien `Video/*.mp3`. Index = (Tag des Jahres `10#$(date +%j)` + laufende Nummer der Meldung im Lauf) modulo Anzahl der Dateien. Startpunkt: Vielfaches von 8 s zwischen 0 und (Tracklänge − 20 s), Länge per ffprobe.
4. **Zwei Videos je Meldung** (12 s, 25 fps, H.264 + AAC, yuv420p): Foto zentriert auf unscharfem Hintergrund desselben Fotos, rundes Logo (`botola-video/assets/logo.png`) oben links, Ton mit Ein-/Ausblendung. Keine Schlagzeile im Bild, keine Quellenangabe.
   STORY-VIDEO 1080x1920 (Instagram-Reel und Instagram-Story):
   ```
   ffmpeg -y -loglevel error -loop 1 -framerate 25 -t 12 -i /tmp/foto.img -i imgrepo/botola-video/assets/logo.png -ss $START -i "$TRACK" -filter_complex "[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,boxblur=40,crop=1080:1920[bg];[b]scale=1080:-2[fg];[bg][fg]overlay=(W-w)/2:(H-h)/2[v0];[1:v]scale=151:-1[lg];[v0][lg]overlay=43:250,format=yuv420p[v];[2:a]atrim=0:12,afade=t=in:d=0.8,afade=t=out:st=10:d=2,loudnorm=I=-14:TP=-1.5:LRA=7[a]" -map "[v]" -map "[a]" -t 12 -c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 128k -movflags +faststart story.mp4
   ```
   FEED-VIDEO 1080x1350 (Facebook-Feed): gleicher Befehl mit scale=1080:1350, crop=1080:1350, Logo bei x=32,y=40 (151 px breit), Ausgabe feed.mp4. Bei Hochformat-Foto das Vordergrundbild mit `scale=-2:1350` bzw. `scale=-2:1920` statt `scale=1080:-2` einpassen.
   Vor dem Hochladen mit ffprobe prüfen (Breite, Höhe, Dauer 12 s, Audio vorhanden). Fehler: einmal wiederholen, danach Foto-Variante ohne Musik (5.2) und melden.
5. **Hosting** (Branch `video-out`, öffentliche Raw-URLs): `git fetch origin video-out; rm -rf /tmp/vo && git worktree add /tmp/vo FETCH_HEAD -B video-out`; Dateien `musik-<JJJJMMTT-HHMM>-<n>-feed.mp4` und `...-story.mp4` hineinkopieren; `musik-*.mp4` mit Datum im Namen älter als 3 Tage per `git rm` entfernen (`botola-*.mp4` nie anfassen); add, commit, `git push origin video-out` (bei Ablehnung neu holen, rebasen, einmal wiederholen; Push muss gelingen); Worktree entfernen. URL: `https://raw.githubusercontent.com/wadiib1-ops/Images4SocialMedia/video-out/<Dateiname>`; vorher per `curl -sIL` HTTP 200 prüfen (bis 30 s warten, einmal wiederholen). Videos nie sofort löschen (Buffer ruft sie zur Veröffentlichung ab).

### 5.2 Foto-Variante ohne Musik (Cloudinary, Rückfall)

Nichts herunterladen und nicht per curl prüfen (die Shell erreicht Cloudinary und Fremdseiten nicht; Ausnahmen: raw.githubusercontent.com und der Foto-Ladeversuch in 5.1); nur URLs bauen. Cloud-Name `gc0qxb3y`, Logo-Public-ID `logo_wappen` (rundes Seitenlogo oben links, 14 % der Breite). Immer dieselbe Foto-Adresse für alle URLs einer Meldung.

Kodierung:
- Foto-URL (nur Sonderzeichen wie ? & = # und Leerzeichen; "https://", Host, Pfad bleiben lesbar):
  `python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=':/%'))" "<Foto-URL>"`
- STORY-BILDTEXT doppelt prozentkodiert (Leerzeichen → %2520, Kommas → %252C):
  `python3 -c "import urllib.parse,sys; print(urllib.parse.quote(urllib.parse.quote(sys.argv[1],safe=''),safe=''))" "<STORY-BILDTEXT>"`

URLs (`F` = kodierte Foto-URL):
- **LOGO-URL** (Facebook-Feed; Instagram-Feed bei Seitenverhältnis 0.8–1.91):
  `https://res.cloudinary.com/gc0qxb3y/image/fetch/l_logo_wappen/c_scale,fl_relative,w_0.14/fl_layer_apply,g_north_west,x_0.025,y_0.025/f_jpg,q_90/F`
- **STORY-URL mit Schlagzeile** (Instagram-Story, 1080x1920):
  `https://res.cloudinary.com/gc0qxb3y/image/fetch/c_pad,w_1080,h_1920,b_auto:predominant/l_logo_wappen/c_scale,fl_relative,w_0.14/fl_layer_apply,g_north_west,x_0.04,y_0.13/l_text:Arial_72_bold_text_align_center:<STORY-BILDTEXT doppelt kodiert>,co_white,b_rgb:000000B3,w_960,c_fit/fl_layer_apply,g_south,y_220/f_jpg/F`
- **STORY-URL ohne Bildtext** (nur Rückfall):
  `https://res.cloudinary.com/gc0qxb3y/image/fetch/c_pad,w_1080,h_1920,b_auto:predominant/l_logo_wappen/c_scale,fl_relative,w_0.14/fl_layer_apply,g_north_west,x_0.04,y_0.13/f_jpg/F`
- **INSTAGRAM-URL** (Instagram-Feed bei unpassendem Seitenverhältnis, 1080x1350):
  `https://res.cloudinary.com/gc0qxb3y/image/fetch/c_pad,w_1080,h_1350,b_auto:predominant/l_logo_wappen/c_scale,fl_relative,w_0.14/fl_layer_apply,g_north_west,x_0.03,y_0.03/f_jpg/F`

Hinweise: STORY- und INSTAGRAM-URL füllen zuerst auf das Zielformat auf (Hintergrund = Hauptfarbe des Fotos, nie `b_blurred`) und setzen dann das Logo; bei Stories 13 % von oben (Instagram-Oberfläche verdeckt sonst das Logo), beim 4:5-Format 3 %. Die Schlagzeile steht als weißer Text auf dunklem Streifen im unteren Drittel (arabisch, verbunden, rechts nach links). Nimmt Buffer die LOGO-URL an, liefert create_post die Maße des Originalfotos.

### 5.3 Rotes Textbild (letzter Rückfall)

STORY-BILDTEXT als Titel im Bild, erzeugt mit `make_post_image.py` (Repo wadiib1-ops/Images4SocialMedia): FEED-Bild 1080x1350 (Instagram-Feed), STORY-Bild 1080x1920 (nur Instagram-Story). Erst erzeugen, wenn zum ersten Mal im Lauf gebraucht; Repo-Setup wie 5.1 Schritt 2 (einmal pro Lauf).
1. Im Repo-Verzeichnis: `python3 make_post_image.py --title "<STORY-BILDTEXT>" --fmt feed --out images/<JJJJMMTT-HHMM>-<n>-feed.jpg --tag "<2–3 Hashtags>"`, analog `--fmt story` mit `...-story.jpg` (n = laufende Nummer der Meldung). Thema "rot" ist Standard.
2. Dateien in `images/` mit Datum im Namen älter als 3 Tage per `git rm` entfernen (außer .gitkeep), `__pycache__` löschen, dann `git add images; git -c user.name=Claude -c user.email=noreply@anthropic.com commit -m "Bilder <Datum/Uhrzeit>"; git push origin HEAD:main`. Der Push muss gelingen. Bilder nie sofort löschen.
3. URL: `https://raw.githubusercontent.com/wadiib1-ops/Images4SocialMedia/main/images/<Dateiname>`; vor create_post per `curl -sI` HTTP 200 und image/jpeg prüfen (bis 30 s warten, einmal wiederholen).

Funktioniert Repo, Bildgenerierung, Push oder Raw-URL nicht: melden, keine nicht pushbaren lokalen Commits erzeugen, letzter Ersatz sind die Hintergrundbilder aus Abschnitt 7 (FACEBOOK-HINTERGRUNDBILD für die Story mit Story-Text, INSTAGRAM-HINTERGRUNDBILD für den Instagram-Feed). Beim roten Textbild im Instagram-Post besteht der Text nur aus den 5 Hashtags des INSTAGRAM-TEXTS.

## 6. Einträge und Rückfall

Alle drei Einträge einer Meldung verwenden dasselbe Foto bzw. Video.

| Eintrag | metadata | Foto (Standard: Musik-Video) | Video (Quell-Video) | Text |
|---|---|---|---|---|
| Facebook-Feed | facebook {type:"post"}, kein linkAttachment | FEED-VIDEO, metadata.title = kurzer arabischer Titel | Quell-Video, metadata.title | FACEBOOK-TEXT |
| Instagram-Feed | instagram {type:"reel", shouldShareToFeed:true}; bei Foto-Rückfall type "post" | STORY-VIDEO als Reel | Quell-Video als Reel | INSTAGRAM-TEXT |
| Instagram-Story | instagram {type:"story", shouldShareToFeed:false, link:"https://facebook.com/476343148890228"} | STORY-VIDEO | Quell-Video | INSTAGRAM-STORY-TEXT (Video hat keinen eingebauten Text) |

Lehnt Buffer den link ab, den Eintrag einmal ohne link anlegen und melden. Story mit Schlagzeile im Bild (STORY-URL mit Bildtext, rotes STORY-Bild): create_post ohne Text, Hashtags und Call to Action. Im Bericht angeben: "ohne Text (Schlagzeile im Bild)" oder "mit Text (Grund)".

**Rückfall je Eintrag.** Der nächste Versuch läuft nur, wenn der Eintrag nachweislich nicht angelegt wurde. Eine eindeutige Buffer-Fehlermeldung (z. B. ungültiges Bild) ist der Nachweis. Nur bei unklarem Ausgang (Zeitüberschreitung, Abbruch, Antwort ohne Ergebnis) vorher einmal per list_posts kontrollieren. Nichts blind wiederholen. Bei Stufenwechsel im Bericht "Video abgelehnt, Foto ohne Musik" o. Ä. mit Fehlertext nennen.

| Eintrag | Stufen | Max. create_post |
|---|---|---|
| Facebook-Feed (Foto) | 1 Musik-Video → 2 Foto-LOGO-URL → 3 Foto ohne Logo ("Logo-URL abgelehnt, Foto ohne Logo") → 4 Kandidat 2 mit Logo, dann ohne Logo → 5 Entwurf (Regel F). Das Musik-Video zählt als einer der 4 Versuche; ohne Musik-Video (5.1 misslungen) beginnt es bei Stufe 2 und es bleiben 4 Foto-Versuche. | 4 insgesamt, Musik-Video eingerechnet |
| Facebook-Feed (Quell-Video) | 1 Video → 2 Foto Kandidat 1 (LOGO-URL) → 3 Foto Kandidat 2 (LOGO-URL) → 4 Entwurf | 3 |
| Instagram-Feed | 1 Musik-Video/Quell-Video als Reel → 2 Foto: LOGO-URL (Seitenverhältnis 0.8–1.91) oder INSTAGRAM-URL, Typ "post" → 3 rotes FEED-Bild (auch wenn Buffer die LOGO-URL ablehnt; Abschnitt 5.3) | 2 insgesamt |
| Instagram-Story | 1 Musik-Video/Quell-Video → 2 STORY-URL mit Bildtext (ohne Text) → 3 STORY-URL ohne Bildtext (mit Text) → 4 Facebook-Foto-Adresse (LOGO-URL oder Original, mit Text) → 5 rotes STORY-Bild (ohne Text). Ohne Foto-Kandidat: sonst rotes Bild, sonst melden | 4 insgesamt (Stufen überspringen, wenn die Grenze erreicht ist) |

Musste der Facebook-Feed-Post ohne Logo auskommen, nehmen Instagram-Story und Instagram-Post ebenfalls die Original-Foto-Adresse ohne Logo (keine STORY-/INSTAGRAM-URL, kein Auffüllen, kein Bildtext); die Story hat dann keinen eingebauten Text und bekommt INSTAGRAM-STORY-TEXT. Passt das Seitenverhältnis für Instagram dann nicht, gilt das rote FEED-Bild. Das Logo wird nie doppelt aufgesetzt; kein Logo bekommen Videos, rote Textbilder, Hintergrundbilder und eigene Bilder des Nutzers.
Schlägt der Facebook-Feed als Video UND als Foto endgültig fehl: die anderen beiden Einträge nicht anlegen.

## 7. Entwürfe und E-Mail

**Entwurf (Regel F):** Gibt es weder Video noch ein von Buffer beim Facebook-Feed-Post angenommenes Foto, alle drei Einträge als Entwurf anlegen: create_post mit saveToDraft true, schedulingType "automatic", ohne mode und dueAt. Platzhalter:
- Facebook-Feed (facebook {type:"post"}): FACEBOOK-HINTERGRUNDBILD `https://buffer-media-uploads.s3.amazonaws.com/6abe4bd3b65e767df7d8a7aa/6abe70be373dc9c8caa71852`, altText "خلفية بشعار صفحة كرة القدم المغربية", Text FACEBOOK-TEXT
- Instagram-Feed (instagram {type:"post", shouldShareToFeed:true}): INSTAGRAM-HINTERGRUNDBILD `https://buffer-media-uploads.s3.amazonaws.com/6abe4bd3b65e767df7d8a7aa/6abe740e1ddf79fd5052fda7`, Text INSTAGRAM-TEXT
- Instagram-Story (instagram {type:"story", shouldShareToFeed:false, link:Seiten-URL}): FACEBOOK-HINTERGRUNDBILD, Text INSTAGRAM-STORY-TEXT

Schlägt ein Entwurf fehl (z. B. Entwurf-Limit): nicht wiederholen, melden.

**E-Mail:** Sobald ein Lauf mindestens einen Entwurf angelegt hat, genau eine E-Mail nur an wadiibououden1@gmail.com über das verbundene Gmail-Konto rawrawr819@gmail.com (so gewollt). Betreff: "Football Marocain: <Anzahl> Entwurf/Entwürfe warten auf dein Foto". Deutscher Klartext, je Meldung: arabische Schlagzeile, ein deutscher Satz zum Inhalt, Quellenname und Artikel-URL, Hinweis "In Buffer (publish.buffer.com) Foto oder Video einsetzen und freigeben". Werkzeug: ToolSearch "select:mcp__Gmail__send_message", Felder to, subject, body. Nicht verfügbar oder Senden fehlgeschlagen: nichts auf anderem Weg senden, kein Werkzeug erfinden, im Bericht "E-Mail nicht gesendet (Grund)".

## 8. Dublettenprüfung und Recherche

**Dublettenprüfung.** Ein list_posts mit channelIds [6ac8f9916a5c39ccb6620a50], ohne Statusfilter, dueAt von 7 Tagen zurück bis 3 Tage voraus, sort dueAt desc, first 100. Ein zweiter Aufruf mit status ["draft"] nur einmal vor dem ersten Entwurf. Die Antwort ist groß und landet in einer Datei: per Python/jq auswerten (dueAt und erste 70 Zeichen des Textes je Post; nach Thema vergleichen, der Text ist arabisch). Dublette = dieselbe Meldung, dasselbe Spiel, derselbe Spieler im selben Kontext oder dieselbe Aussage, auch mit anderem Wortlaut; dann anderes Thema wählen. Dubletten werden an den Feed-Posts erkannt, eine Story ist Dublette, wenn ihr Feed-Post es ist. Aus derselben Liste den Slot gegen Belegung prüfen.

**Recherche.** WebSearch und WebFetch auf Arabisch, Französisch, Englisch, bei Spielen in Spanien auf Spanisch. Jede Suchanfrage enthält einen Marokko-Begriff in der Anfragesprache (Marokko, Morocco, Maroc, المغرب, Marruecos) und bei Tagesnachrichten das heutige Datum oder "heute" ("aujourd'hui", "اليوم", "hoy"). Die Region der Websuche lässt sich nur über Suchbegriffe und allowed_domains steuern. Nur Fakten aus mindestens einer verlässlichen Quelle, die Regel A erfüllen; keine Gerüchte, unbestätigten Transfers, erfundenen Zahlen oder Zitate. Pro Meldung Quellenname und URL merken, danach Videosuche (D), dann Fotosuche (E). Soziale Netzwerke (X, Facebook, Instagram) nicht abrufen. Seiten mit 403 oder robots.txt-Sperre nicht umgehen (kein curl, keine Archive).

**Suchreihenfolge mit Abbruch** (hat Vorrang vor allen anderen Mengenangaben): der Reihe nach suchen und aufhören, sobald 2 brauchbare Meldungen vorliegen. Brauchbar = Regel A erfüllt, keine Dublette, Bildquelle vorhanden (Video oder Artikelfoto); eine frische Meldung ohne Bildquelle zählt nicht, die Suche läuft weiter.
1. Kernseiten per WebFetch: elbotola.com, hesport.com, kooora.com (neueste Meldungen mit Uhrzeit oben).
2. Zusatz-Recherche (höchstens 2–3 Suchen):
   - Auslandsprofis, z. B. "لاعب مغربي يسجل", "المغاربة في أوروبا", "Marocains à l'étranger ce week-end", "Moroccan players abroad", sowie Namen aktueller Nationalspieler/-innen (Hakimi, Brahim Díaz, Bounou, Ziyech, Amrabat, En-Nesyri, Saibari, Ounahi, Mazraoui, Ezzalzouli, Aguerd, Zabiri, Akhomach, Lbrahimi, Ghizlane Chebbak, Fatima Tagnaout, Ibtissam Jraidi, Sanaa Mssoudy, Anissa Lahmari) und Futsal-Spieler im Ausland (Spanien, Italien, Portugal).
   - CAF-Klubwettbewerbe mit marokkanischen Vereinen (Wydad, Raja, AS FAR, RS Berkane, FUS Rabat, Maghreb de Fès, Olympic Safi, Hassania Agadir, Difaâ El Jadida u. a., soweit beteiligt): "دوري أبطال إفريقيا", "كأس الكونفدرالية", "Ligue des champions CAF", "Coupe de la Confédération CAF", "CAF Champions League", "CAF Confederation Cup".
3. Quellen-Rotation: WebSearch mit allowed_domains auf 2–4 Seiten der Liste oder WebFetch auf Startseite/Sportsektion. Der Startpunkt in der Liste richtet sich nach der Stunde des Laufs.
   - Arabisch: arryadia.snrt.ma, mountakhab.net, assabah.ma, alyoum24.com/sport, ahdath.info, chouftv.ma, goal.com/ar, radiomars.ma, chadafm.ma
   - Französisch: sport.le360.ma, lematin.ma/sport, medias24.com, snrtnews.com/fr/sport, 2m.ma/fr/news/sport, lopinion.ma (Sport), lionsdelatlas.ma, afrik-foot.com/maroc, foot-africa.com/fr/maroc
   - Offiziell: frmf.ma, lnfp.ma, lnfd.ma, cafonline.com
   - Auslandsprofis/Futsal: dmsport.be, 11lions.nl, futsalplanet.com, uafaac.com; für Auslandsprofis zusätzlich Marca, AS, L'Équipe, Foot Mercato
   - Nur zur Ergebnisbestätigung und als Bildquelle zu einer schon gefundenen Meldung: Vereinsseiten (rajaclubathletic.ma, wac.ma, as-far.ma, rsb.ma, fus.ma, mas.ma, husa.ma, irtt.ma, ocsafi.ma, mcoujda.ma), Ergebnisdienste (transfermarkt.de, flashscore.de, sofascore.com); beinsports.com nur über gezielte Suche mit Marokko-Begriff

**Obergrenze:** höchstens 10 Recherche-Abrufe pro Lauf (WebSearch und WebFetch auf Start-/Übersichtsseiten; Einzelartikel zur Prüfung von Datum, Foto, Video zählen nicht). Danach mit dem Gefundenen weitermachen. Ein Entwurf entsteht nur, wenn nach Suchende (2 Treffer oder Obergrenze) weniger als 2 Meldungen mit Bildquelle vorliegen; dann wird die beste frische Meldung ohne Bild als Entwurf angelegt. Findet sich nichts Neues, wird nichts gepostet.

**Themenmix:** Bereiche sind Nationalteam, Botola, Auslandsprofis, CAF-Klubwettbewerbe, Futsal, Frauen, Jugend. Ist ein Bereich in den letzten Posts stark vertreten (etwa 3 der letzten 5 Feed-Posts), weitere Meldungen daraus überspringen. Die beiden Meldungen eines Laufs behandeln verschiedene Themen.

## 9. Abschlussbericht (deutsch, kurz)

- Je veröffentlichte Meldung eine Zeile: Datum/Uhrzeit der Quelle, Quellenname (nur hier), Themenbereich.
- Medium: Video oder Foto (Datei-URL bzw. Foto-Adresse mit Maßen), Logo ja/nein, je Eintrag welche URL/Stufe Buffer annahm (Musik-Video, LOGO-URL, STORY-URL, INSTAGRAM-URL, rotes Bild, Hintergrundbild; Rückfälle mit Fehlertext), Bild-Push und video-out-Push erfolgreich ja/nein, Musik-Track (Dateiname) und Startpunkt bzw. "Quell-Video, keine Musik" / "Musik nicht möglich (Grund)".
- Instagram-Story: "ohne Text (Schlagzeile im Bild)" oder "mit Text (Grund)"; Link-Sticker angenommen ja/nein.
- Entwürfe mit Schlagzeile und Quelle; E-Mail gesendet oder warum nicht; oder "mangels frischer Meldungen nichts gepostet"; aufgetretene Probleme.
- Bestätigung, dass alle Texte (zweisprachig AR+FR) vor dem ersten create_post der Meldung fertig waren.
- Verbrauch, z. B.: "Verbrauch: 4 Recherche-Abrufe (3 Kernseiten, 1 Zusatzsuche), gestoppt nach hesport.com; Buffer: 1 list_posts, 6 create_post".
