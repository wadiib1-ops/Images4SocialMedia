Anleitung für den Marokko-Fußball-Job

0. VORRANG
Lies zuerst vollständig die Datei CLAUDE-Routine.md im selben Repo (Branch main). Sie ersetzt CLAUDE.md für diese Routine. Bei Widerspruch gilt: CLAUDE-Routine.md vor dieser Datei. Beiträge werden ausschließlich über publisher/queue.json und den GitHub-Workflow publish.yml veröffentlicht, es gibt kein externes Planungswerkzeug. Hashtag-Limit (Abschnitt 10) und Zeitangaben in Berliner Zeit gelten immer.

1. AUFTRAG UND ABLAUF
Veröffentliche (Nutzerwunsch 27.10.2026, dauerhaft) bis zu 1 neue Meldung pro Lauf; gesucht wird von vorne an nur nach EINER Meldung auf Arabisch (Beitragstexte zusätzlich auf Französisch, Abschnitt 9) über AKTUELLE Nachrichten zu Fußball oder Futsal mit klarem Marokko-Bezug. Zulässig: Nationalmannschaft und Atlas Lions, Frauen- und Jugendteams, Spieler marokkanischer Herkunft und Diaspora, Botola Pro, marokkanische Klubs und Trainer, Auslandsprofis (auch Futsal), marokkanische Vereine in der CAF Champions League, im CAF Confederation Cup, in Frauen-Wettbewerben und in Futsal-Klubwettbewerben. Kein anderes Thema.
Pro Meldung entstehen VIER Einträge (Facebook-Reel und Instagram-Feed entfallen dauerhaft, Instagram-Feed seit 27.10.2026) in publisher/queue.json (Änderung 26.10.2026, Details in CLAUDE-Routine.md), immer in dieser Reihenfolge und mit derselben Veröffentlichungszeit:
 1. Facebook-Feed: Foto mit Seitenlogo und FACEBOOK-TEXT.
 2. (entfällt: kein Instagram-Feed mehr)
 3. (entfällt: kein Facebook-Reel mehr)
 4. Instagram-Reel: dasselbe Video mit INSTAGRAM-TEXT.
 5. Facebook-Story: Musik-Video mit Schlagzeile und Call to Action im Video, ohne Begleittext.
 6. Instagram-Story: dasselbe Story-Video, ohne Begleittext.
Ablauf eines Laufs:
 1. Dublettenprüfung (Abschnitt 7).
 2. Recherche, Video- und Fotosuche (Abschnitt 7 und 3).
 3. Fotos laden und prüfen, Videos bauen (Abschnitt 8), Texte schreiben (Abschnitt 6 und 9).
 4. Medien hosten und prüfen (Abschnitt 5 und 8).
 5. Einträge an publisher/queue.json anhängen, pushen (CLAUDE-Routine.md).
 6. Abschlussbericht auf Deutsch (Abschnitt 7).
GÜLTIG: Immer sofort veröffentlichen (status "now", ohne publish_at, danach publish.yml per workflow_dispatch starten), siehe CLAUDE-Routine.md; die folgenden Slot-Angaben gelten nicht mehr. Frühere Slot-Regel: Meldung 1 um xx:20, Meldung 2 um xx:00 der nächsten Stunde; bei nur einer Meldung belegt sie den ersten Slot. Liegt ein Slot weniger als 5 Minuten in der Zukunft, den nächsten freien Slot (:00, :20, :40) nehmen und gegen belegte Einträge der Warteschlange prüfen. publish_at mit Zeitzonen-Versatz schreiben (+01:00 im Winter, +02:00 im Sommer). Der Lauf endet nach dem Push; das Veröffentlichen übernimmt der Workflow.

2. KONTEN UND TECHNIK
 - Facebook-Seite "Football Marocain / كرة القدم المغربية", Seiten-ID 476343148890228, Seiten-URL https://facebook.com/476343148890228
 - Instagram-Konto "moroccanfootballandfutsal" (Business), ID 17841410500657352
 - Veröffentlichung: Workflow publish.yml (alle 15 Minuten) mit publisher/publish.py über die Meta Graph API. Das Geheimnis META_USER_TOKEN liegt in den Repo-Einstellungen; nie ausgeben oder speichern.
 - Uhrzeit: Shell: TZ=Europe/Berlin date -Iseconds
 - Eintragsformat: siehe CLAUDE-Routine.md.

3. HARTE REGELN (HABEN VORRANG)
A. Nur Nachrichten der letzten 32 Stunden (Nutzerwunsch 27.10.2026, dauerhaft; vorher 24 Stunden). Eine Meldung wird nie ein zweites Mal veröffentlicht, auch wenn sie noch im 32-Stunden-Fenster liegt (Dublettenprüfung, Abschnitt 7). Ein Beitrag berichtet nur über ein Ereignis oder eine Meldung, das oder die nachweislich in den letzten 32 Stunden passiert oder veröffentlicht wurde. Datum und Uhrzeit der Quelle prüfen. Ist das Datum nicht eindeutig oder älter, ist die Meldung unbrauchbar. Keine Evergreen-Themen, keine Geschichte, keine Trivia, keine Rückblicke. Gibt es keine frische Meldung, wird nichts veröffentlicht: lieber 0 oder 1 Meldung als eine veraltete.
B. Keine URL im Text der Beiträge, kein Link zur Quelle. Bilder und Videos immer als Medien, nie als Link-Vorschau.
C. Keine Quellenangabe in den Beiträgen. Weder "المصدر: ..." noch "Source : ..." noch ein Quellenname steht in Texten, Video-Titeln oder erzeugten Bildern. Die Quelle wird nur im Abschlussbericht und im Feld quelle_url der Warteschlange genannt.
D. Video vor Foto. Gibt es zur Meldung ein direktes Video (.mp4 oder .mov, zum Beispiel aus og:video), das nutzbar ist, bleibt es unverändert (Originalton, keine Musik) und wird für Feed-Video, Reels und Stories verwendet. Nicht verwendbar: YouTube-, Facebook-, Instagram-, X-Einbettungen, .m3u8-Playlists, Seiten-URLs, Videos mit fremden Wasserzeichen oder Senderlogos. Bevorzugt: Videos des Verbands (FRMF), von Vereinen oder frei lizenzierte (Wikimedia Commons, Pexels, Pixabay). Ohne plausible Datei-URL gilt die Fotosuche.
E. Foto ist Pflicht-Suche (ohne verwendbares Video). Kandidat 1 ist das Artikelfoto der Quellseite (og:image oder großes Artikelfoto), per WebFetch ermittelt. Einen zweiten Kandidaten erst suchen, wenn Kandidat 1 in der Shell nicht ladbar ist: das Artikelfoto einer zweiten Quelle zur selben Meldung, sonst ein frei lizenziertes Bild (Wikimedia Commons, Flickr, Pixabay, Pexels, Europeana). Höchstens 2 Kandidaten pro Meldung.
F. Kein Video und kein Foto: die Meldung wird nicht veröffentlicht, es wird kein Eintrag angelegt. Im Bericht nennen.
G. Schlägt der Facebook-Feed-Eintrag nach der Prüfung (Abschnitt 5) endgültig fehl, werden die übrigen drei Einträge dieser Meldung nicht angelegt.
H. Musik-Tracks im Ordner Video/ werden nie gelöscht oder verändert.

4. EINTRÄGE JE MELDUNG
 - Die vier Einträge je Meldung mit Typen und Texten stehen in CLAUDE-Routine.md (FB photo, IG reel, FB story, IG story). FACEBOOK-TEXT: arabisch + französisch, höchstens 3 Hashtags; INSTAGRAM-TEXT: arabisch + französisch, genau 5 Hashtags, unter 2200 Zeichen; Stories ohne Begleittext (Text im Video, Abschnitt 8); keine Quellenzeile.
Rückfälle (je Eintrag, nur wenn der Eintrag nicht anlegbar ist; das Scheitern von Reel oder Story stoppt den Facebook-Eintrag nicht):
 - Facebook-Foto: erst LOGO-URL, bei Fehler die Original-Foto-Adresse ohne Logo, dann Kandidat 2 mit Logo und ohne Logo (höchstens 4 Versuche). Alles fehlgeschlagen: Regel F.
 - Reel und Story: Video nicht baubar oder nicht hostbar: Eintrag weglassen und im Bericht melden.
Musste der Facebook-Eintrag ohne Logo auskommen, trägt das Video trotzdem das Logo (Abschnitt 8). Das Logo wird nie doppelt aufgesetzt.

5. BILD-URLS (CLOUDINARY, NUR FACEBOOK-FOTO)
Jedes Foto aus einer externen Quelle bekommt oben einen Streifen in der Randfarbe des Fotos (Cloudinary b_auto:border, wirkt wie transparent; echte Transparenz ist bei JPEG nicht möglich), dessen Höhe 22 % der Bildbreite beträgt (bei 1216 px Breite etwa 268 px); darin sitzt das runde Seitenlogo links oben (90 % der Streifenhöhe). Das Logo verdeckt dadurch nie einen Teil des Fotos (Nutzerwunsch 27.10.2026, dauerhaft; Logo doppelt so groß wie in der 11-%-Fassung; das Foto wird nie beschnitten und bleibt vollständig sichtbar). Den Streifen und das Logo setzt Cloudinary (Cloud-Name gc0qxb3y, Logo-Public-ID logo_wappen). Die URL wird nur gebaut und per curl -sIL auf HTTP 200 und image/jpeg geprüft.
Foto-URL kodieren (nur Sonderzeichen wie ? & = # und Leerzeichen, "https://", Host und Pfad bleiben lesbar):
 python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1], safe=':/%'))" "<Foto-URL>"
LOGO-URL:
 https://res.cloudinary.com/gc0qxb3y/image/fetch/$b_iw_mul_0.22/c_pad,w_iw,h_ih_add_$b,g_south,b_auto:border/l_logo_wappen/c_scale,h_$b_mul_0.9/fl_layer_apply,g_north_west,x_$b_mul_0.05,y_$b_mul_0.05/f_jpg,q_90/<kodierte Foto-URL>
Es ist immer dieselbe Foto-Adresse für alle URLs einer Meldung.

6. TEXTE
Texte umformulieren (Pflicht, vor dem Anlegen der Einträge): Zuerst aus den Fakten der Quelle einen arabischen Rohentwurf mit Titel und Body in eigenen Worten schreiben, dann umformulieren und daraus die Texte erstellen. Sprache: Modern Standard Arabic, leicht verständlich; Beitragstexte zusätzlich auf Französisch (Abschnitt 9).
 - FACEBOOK-TEXT | Facebook-Feed | Informativ, einladend, kurze Absätze mit Leerzeile, am Ende eine Frage an die Leser, danach 2 bis 3 Hashtags; keine Quellenzeile.
 - INSTAGRAM-TEXT | Instagram-Reel | Hook als erste Zeile, bildhafte Sprache, 3 bis 5 Emojis, am Ende genau 5 relevante Hashtags, keine Quellenzeile; anders formuliert als FACEBOOK-TEXT.
 - STORY-SCHLAGZEILE und CALL TO ACTION | im Story-Video | 8 bis 12 arabische Wörter mit den wichtigsten Fakten (Name, Ergebnis); nur Buchstaben, Ziffern und einfache Satzzeichen, keine Emojis, Hashtags, Kommas, Quelle oder URL; nur Arabisch. Der Call to Action wird jedes Mal neu formuliert, feste Sätze nicht wörtlich wiederholen.
 - REEL-ABSCHNITTE | im Reel-Video | 1 bis 4 arabische Abschnitte (Abschnitt 8).
Für alle gilt: keine Textübernahme aus Artikeln (nur eigene Formulierungen, Zitate unter 15 Wörtern und selten), keine erfundenen oder veränderten Fakten, Zahlen oder Zitate, keine politischen Aussagen, keine Beleidigungen von Spielern, Teams oder Fans, keine URLs, keine Quellenangaben, keine Länderflaggen-Emojis (auch keine Frankreich-Flagge).

7. DUBLETTENPRÜFUNG, RECHERCHE UND ABSCHLUSSBERICHT
Dublettenprüfung: Lies publisher/queue.json und die letzten Zeilen von publisher/log.jsonl. Schon veröffentlichte oder eingeplante Meldungen der letzten 7 Tage und der nächsten 3 Tage nach Thema vergleichen (titel und die ersten 70 Zeichen der caption). Wiederholung ist dieselbe Meldung, dasselbe Spiel, derselbe Spieler im selben Kontext oder dieselbe Aussage, auch mit anderem Wortlaut. Dann ein anderes Thema wählen. Der Veröffentlicher prüft zusätzlich selbst: gleiche quelle_url oder gleicher titel bei gleicher Plattform und gleichem Typ innerhalb von 24 Stunden wird abgelehnt. Die Prüfung muss ausgewertet sein, bevor ein Eintrag angelegt wird.
Recherche: WebSearch und WebFetch auf Arabisch, Französisch, Englisch und bei Spielen in Spanien auf Spanisch. Jede Suchanfrage enthält mindestens einen Marokko-Begriff (Marokko, Morocco, Maroc, المغرب, Marruecos) und bei Tagesnachrichten das heutige Datum oder "heute". Zuerst die Seiten der Quellenliste per WebFetch abrufen, weil dort die neuesten Meldungen mit Uhrzeit oben stehen. Nur Fakten, die in mindestens einer verlässlichen Quelle bestätigt sind und Regel A erfüllen; keine Gerüchte, keine unbestätigten Transfers. Pro Meldung Namen und URL der Quelle merken (Bericht und quelle_url), danach Videosuche (Regel D), dann Fotosuche (Regel E). Soziale Netzwerke (X, Facebook, Instagram) werden nicht abgerufen.
Suchreihenfolge mit Abbruch: Es wird der Reihe nach gesucht und nur so lange, bis 1 brauchbare Meldung gefunden ist; dann sofort aufhören. Brauchbar ist eine Meldung, wenn sie Regel A erfüllt, keine Dublette ist und eine Bildquelle hat (Video oder Artikelfoto). Obergrenze: höchstens 10 erfolgreiche Recherche-Abrufe pro Lauf (WebSearch und WebFetch auf Start- oder Übersichtsseiten zusammen; Abrufe einzelner Artikel zur Prüfung zählen nicht mit). Nicht erreichbare Seiten (DNS-Fehler, Timeout, 403, robots.txt-Sperre) zählen als Fehler, nicht als Abruf; nicht umgehen (keine Archive), sofort die nächste Seite nehmen. Sind 10 Seiten nacheinander fehlgeschlagen, per PushNotification melden: "Quellenseiten nicht erreichbar (Netzwerkfreigabe prüfen)". Eine frische Meldung ohne Bildquelle zählt nicht als gefunden; die Suche läuft weiter.
QUELLENLISTE (15 Seiten, jeweils per WebFetch auf genau diese Adresse):
 1. https://www.elbotola.com
 2. https://www.hesport.com
 3. https://www.kooora.com
 4. https://www.hespress.com
 5. https://ar.sport.le360.ma
 6. https://www.lesiteinfo.com/category/sport
 7. https://www.moroccoworldnews.com/sports/
 8. https://alyaoum24.com/news/sport
 9. https://ar.hibapress.com/section-22.html
10. https://kifache.com/category/%d8%b1%d9%8a%d8%a7%d8%b6%d8%a9/
11. https://www.almountakhab.com
12. https://www.lematin.ma
13. https://snrtnews.com
14. https://al3omk.com
15. https://www.yabiladi.com
Reihenfolge: Startnummer = (Stunde des Laufs in Europe/Berlin modulo 15) + 1. Von dort geht die Liste zyklisch weiter (nach 15 kommt 1). Datum und Uhrzeit im Einzelartikel prüfen (Regel A).
Zusatz-Recherche per WebSearch (nur solange noch keine brauchbare Meldung vorliegt, höchstens 2 bis 3 Suchen, zählt zur Obergrenze): (i) Auslandsprofis, zum Beispiel "لاعب مغربي يسجل", "Marocains à l'étranger ce week-end", "Moroccan players abroad", sowie Namen aktueller Nationalspieler und -spielerinnen (Hakimi, Brahim Díaz, Bounou, Ziyech, Amrabat, En-Nesyri, Saibari, Ounahi, Mazraoui, Ezzalzouli, Aguerd, Zabiri, Akhomach, Lbrahimi, Ghizlane Chebbak, Fatima Tagnaout, Ibtissam Jraidi, Sanaa Mssoudy, Anissa Lahmari) und Futsal-Spieler im Ausland; (ii) CAF-Klubwettbewerbe mit marokkanischen Vereinen (Wydad, Raja, AS FAR, RS Berkane, FUS Rabat, Maghreb de Fès, Olympic Safi, Hassania Agadir, Difaâ El Jadida u. a.), arabisch "دوري أبطال إفريقيا" und "كأس الكونفدرالية", französisch "Ligue des champions CAF", englisch "CAF Champions League". Themenbereiche: Nationalteam, Botola, Auslandsprofis, CAF-Klubwettbewerbe, Futsal, Frauen, Jugend. Ist ein Bereich in den letzten Posts stark vertreten (etwa 3 der letzten 5 Feed-Posts), eine weitere Meldung aus diesem Bereich überspringen.
Bestätigung und Bildquelle zu einer schon gefundenen Meldung (zählt nicht zur Obergrenze): Vereinsseiten (rajaclubathletic.ma, wac.ma, as-far.ma, rsb.ma, fus.ma, frmf.ma, cafonline.com) und Ergebnisdienste (flashscore.de, sofascore.com, transfermarkt.de).
Findet sich nichts Neues, wird nichts angelegt, und es gibt keine Benachrichtigung.
Abschlussbericht (deutsch, kurz, Zeiten in Berliner Zeit):
 - Je Meldung eine Zeile: Datum und Uhrzeit der Quelle, Quellenname (nur im Bericht), Themenbereich.
 - Video oder Foto (URL, Maße), Logo ja oder nein, geplante Veröffentlichungszeit, Musik-Track (Dateiname) und Startpunkt, ob der Push nach video-out klappte.
 - Nach dem Lauf des Workflows: Status der vier Einträge aus publisher/log.jsonl (veröffentlicht oder Fehlertext).
 - Fehlgeschlagene oder nicht angelegte Einträge mit Grund; oder dass mangels frischer Meldungen nichts angelegt wurde.
 - Bestätigung, dass alle Texte zweisprachig (AR+FR) vor dem Anlegen fertig waren.
 - Verbrauch: Anzahl Recherche-Abrufe, Fehlschläge, nach welcher Seite gestoppt, Liste der abgerufenen Seiten mit Ergebnis.

8. MUSIK-VIDEO
Ziel: Reel und Story einer Meldung sind kurze Videos mit Hintergrundmusik aus dem Ordner Video/ dieses Repos. Das Foto der Meldung ist die Bildquelle.
 1. Gilt nur für Meldungen mit Foto. Bei einem direkten Quell-Video (Regel D) bleibt es unverändert, im Bericht "Quell-Video, keine Musik".
 2. Foto laden: curl -sL -m 30 -A "Mozilla/5.0" -o /tmp/foto.img -w "%{http_code}" "<ORIGINAL-Foto-URL>" und mit Pillow prüfen (Image.open(...).verify()). Gelingt das nicht, zuerst den zweiten Kandidaten, sonst Regel F. Nichts anderes versuchen.
 3. Werkzeuge: Pillow ist im System defekt, deshalb eine Python-Umgebung bauen: python3 -m venv /tmp/venv && /tmp/venv/bin/pip install -q pillow arabic-reshaper python-bidi. story_text.py mit /tmp/venv/bin/python starten. ffmpeg ist vorhanden. Das Logo liegt unter botola-video/assets/logo.png.
 4. Musik abwechselnd wählen: Liste = sortierte Dateien Video/*.mp3 (neue Dateien kommen automatisch dazu). Index = (Tag des Jahres + laufende Nummer der Meldung im Lauf) modulo Anzahl der Dateien (Tag des Jahres: 10#$(date +%j)). Startpunkt im Track: ein Vielfaches von 8 Sekunden zwischen 0 und (Tracklänge minus 20 Sekunden), Länge per ffprobe.
 5. STORY-VIDEO MIT EFFEKT (Nutzerwunsch 27.10.2026, dauerhaft, für Instagram-Reel sowie Facebook- und Instagram-Story): 1080x1920, 12 Sekunden, 25 fps, H.264 + AAC, yuv420p. Foto zentriert (Breite 1000 px) auf unscharfem Hintergrund desselben Fotos, rundes Seitenlogo oben links, roter Fortschrittsbalken unten (füllt sich bis Sekunde 12), Ton mit Ein- und Ausblendung. Der Start-Effekt läuft NUR in den ersten 2 Sekunden und stoppt dann: weißer Blitz (0,35 s), Punch-In-Zoom (Foto startet bei etwa 135 % und fällt in rund 0,5 s auf Normalgröße), RGB-Glitch (Farbversatz in den ersten 0,5 s und kurz zu Beginn jeder Sekunde), Beat-Puls (Foto +4,5 % und Hintergrund-Aufblitzen alle 0,5 s) und Vignette. Ab Sekunde 2 steht das Bild ruhig. Das Foto bleibt am Ende vollständig sichtbar.
 ffmpeg -y -loglevel error -loop 1 -framerate 25 -t 12 -i /tmp/foto.img -i botola-video/assets/logo.png -ss $START -i "$TRACK" -f lavfi -i "color=c=0xC1272D:s=1080x24:r=25:d=12" -filter_complex "[0:v]split[a][b];[a]scale=1080:1920:force_original_aspect_ratio=increase,boxblur=40,crop=1080:1920,eq=brightness='-0.08+0.10*lt(t,2)*pow(abs(sin(PI*t*2)),12)':eval=frame[bg];[b]scale=w='1000*(1+0.35*exp(-7*t)+0.045*lt(t,2)*pow(abs(sin(PI*t*2)),12))':h=-2:eval=frame[fg];[bg][fg]overlay=x='(W-w)/2':y='(H-h)/2':eval=frame[v0];[1:v]scale=151:-1[lg];[v0][lg]overlay=43:250[v1];[v1][3:v]overlay=x='-1080+1080*t/12':y=1896[v4];[v4]rgbashift=rh=-14:bh=14:enable='lt(t,2)*(lt(mod(t,1),0.1)+lt(t,0.5))',vignette=PI/4:enable='lt(t,2)',fade=t=in:st=0:d=0.35:color=white,format=yuv420p[v];[2:a]atrim=0:12,afade=t=in:d=0.8,afade=t=out:st=10:d=2,loudnorm=I=-14:TP=-1.5:LRA=7[a]" -map "[v]" -map "[a]" -t 12 -c:v libx264 -preset veryfast -crf 23 -c:a aac -b:a 128k -movflags +faststart story.mp4
 Ist das Foto sehr hoch (Hochformat), statt der Breite 1000 px die Höhe auf höchstens 1400 px begrenzen (scale=-2:1400 mit demselben Faktor-Ausdruck für h), damit es vollständig sichtbar bleibt. Ausgabe mit ffprobe prüfen (1080x1920, 12 s, Audio vorhanden). Fehler: einmal wiederholen, danach Reel und Story der Meldung weglassen und melden.
 6. STORY-VIDEO-MIT-TEXT (für Facebook- und Instagram-Story): zwei transparente PNGs mit story_text.py (Layout nicht ändern, ohne --tags): /tmp/venv/bin/python story_text.py --out /tmp/t1.png --title "<STORY-SCHLAGZEILE>" und /tmp/venv/bin/python story_text.py --out /tmp/t2.png --title "<STORY-SCHLAGZEILE>" --cta "<CALL TO ACTION>" (kein --video). Dann: ffmpeg -y -i story.mp4 -loop 1 -framerate 25 -t 12 -i /tmp/t1.png -loop 1 -framerate 25 -t 12 -i /tmp/t2.png -filter_complex "[1:v]format=rgba,fade=t=in:st=0.5:d=0.4:alpha=1[p1];[2:v]format=rgba,fade=t=in:st=6:d=0.4:alpha=1[p2];[0:v][p1]overlay=0:0:enable='lt(t,6)'[o1];[o1][p2]overlay=0:0:enable='gte(t,6)',format=yuv420p[v]" -map "[v]" -map 0:a -c:v libx264 -preset veryfast -crf 23 -c:a copy -movflags +faststart story-text.mp4 (Schlagzeile blendet bei 0,5 s ein, der Call to Action kommt ab Sekunde 6).
 7. REEL-VIDEO-MIT-TEXT (Instagram-Reel): Der Reel-Text läuft im Video mit. Gibt die Meldung genug Text her, wird er in 2 bis 4 Abschnitte geteilt (Abschnitt 1 = Schlagzeile, danach je 1 bis 2 kurze arabische Sätze mit den Fakten, je höchstens ca. 150 Zeichen), die gleichmäßig verteilt über die 12 Sekunden erscheinen (Abschnitt 1 ab 0,5 s). Gibt sie wenig her, steht ein einziger Abschnitt die ganze Dauer. Je Abschnitt ein transparentes PNG: /tmp/venv/bin/python story_text.py --out /tmp/rp<k>.png --title "<Abschnitt>" (ohne --cta und --tags). Dann ein ffmpeg-Aufruf auf story.mp4 (mit dem Effekt aus Schritt 5) mit je einem Overlay pro PNG, jedes mit Einblendung (fade=t=in:st=<Start>:d=0.4:alpha=1) und enable='between(t,<Start>,<Ende>)' (Ende des letzten Abschnitts = 12), zum Beispiel bei drei Abschnitten:
 ffmpeg -y -i story.mp4 -loop 1 -framerate 25 -t 12 -i /tmp/rp1.png -loop 1 -framerate 25 -t 12 -i /tmp/rp2.png -loop 1 -framerate 25 -t 12 -i /tmp/rp3.png -filter_complex "[1:v]format=rgba,fade=t=in:st=0.5:d=0.4:alpha=1[a1];[2:v]format=rgba,fade=t=in:st=4:d=0.4:alpha=1[a2];[3:v]format=rgba,fade=t=in:st=8:d=0.4:alpha=1[a3];[0:v][a1]overlay=0:0:enable='between(t,0,4)'[o1];[o1][a2]overlay=0:0:enable='between(t,4,8)'[o2];[o2][a3]overlay=0:0:enable='between(t,8,12)',format=yuv420p[v]" -map "[v]" -map 0:a -c:v libx264 -preset veryfast -crf 23 -c:a copy -movflags +faststart reel-text.mp4
 8. Hosting: Branch video-out dieses Repos (öffentliche Raw-URLs): git fetch origin video-out; rm -rf /tmp/vo && git worktree add /tmp/vo FETCH_HEAD -B video-out; Dateien als musik-<JJJJMMTT-HHMM>-<n>-story-text.mp4 und musik-<JJJJMMTT-HHMM>-<n>-reel-text.mp4 hineinkopieren; add, commit (Autor noreply), git push origin video-out (bei Ablehnung neu holen, rebasen, einmal wiederholen; der Push muss gelingen); Worktree entfernen. URL: https://raw.githubusercontent.com/wadiib1-ops/Images4SocialMedia/video-out/<Dateiname>. Vorher per curl -sIL prüfen, dass HTTP 200 kommt (bis zu 30 Sekunden warten, einmal wiederholen). Das Aufräumen alter Videos (nach über 2 Tagen) übernimmt der Workflow delete-videos.yml. Videos nie sofort löschen, sie werden zum Veröffentlichungszeitpunkt abgerufen.
 9. Reel und Story erhalten pro Meldung dieselbe Musik. Im Bericht je Meldung Track und Startpunkt nennen.

9. ZWEISPRACHIGE TEXTE ARABISCH + FRANZÖSISCH
 1. Geltungsbereich: FACEBOOK-TEXT und INSTAGRAM-TEXT. NICHT zweisprachig: Schlagzeile und Call to Action im Video, Reel-Abschnitte im Video (nur Arabisch), Video-Titel, altText, Hashtags.
 2. Aufbau: zuerst der vollständige arabische Text, dann eine Leerzeile, dann die französische Fassung. Hashtags stehen nur EINMAL ganz am Ende, nicht doppelt. Hook, Emojis, Frage am Ende gelten in beiden Sprachen; die Emojis müssen nicht verdoppelt werden.
 3. Die französische Fassung ist eine sinngemäße, natürliche Übersetzung bzw. Umformulierung des arabischen Texts (modernes, leicht verständliches Französisch, keine wörtliche Übersetzung, keine Übernahme aus französischen Artikeln). Gleiche Fakten, Namen, Zahlen und Ergebnisse, nichts hinzuerfinden. Marokkanische Namen und Klubs in gebräuchlicher französischer Schreibweise (Wydad, Raja, FAR, Hakimi, Lions de l'Atlas). Die Frage am Ende des Facebook-Texts auch auf Französisch.
 4. Länge: Der Instagram-Text bleibt unter 2200 Zeichen insgesamt, sonst die französische Fassung kürzen.
 5. Alle Regeln gelten auch für den französischen Text: keine URL, keine Quellenangabe, keine Flaggen-Emojis, keine politischen Aussagen, keine Beleidigungen. FACEBOOK-TEXT und INSTAGRAM-TEXT müssen sich auch in der französischen Fassung unterscheiden.

10. HASHTAG-LIMIT
Facebook (Feed, Reel, Story) höchstens 3 Hashtags, Instagram (Feed, Reel, Story) höchstens 5 Hashtags, pro Beitrag insgesamt, auch im Video eingeblendete. Das Limit gilt vor allen anderen Hashtag-Angaben. Der Veröffentlicher lehnt Einträge mit zu vielen Hashtags in der caption ab.
