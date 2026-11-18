# Dashboard-Backend (Anmeldung und Verwaltung)

Ein kleiner Cloudflare Worker (kostenloser Tarif reicht), der

- das Dashboard aus `dashboard/` **nur nach Anmeldung** ausliefert (Benutzername, Passwort und 6-stelliger Code aus einer Authenticator-App),
- `publisher/log.jsonl` über einen GitHub-Token liest, der nur im Worker liegt,
- ausgewählte Protokolleinträge löscht und jede Löschung in `publisher/log_history.jsonl` festhält (Zeit, Benutzer, Grund, vollständige gelöschte Zeilen), beides in einem Commit.

## Sicherheit

| Maßnahme | Umsetzung |
|---|---|
| Kein Zugriff ohne Anmeldung | Jede Anfrage läuft zuerst durch den Worker (`run_worker_first`), auch HTML, JS und CSS. Offen sind nur `/login`, `login.js` und `styles.css`. |
| Passwort | PBKDF2-SHA256 mit 100 000 Durchläufen und Salt; im Worker liegt nur der Hash. |
| Zweiter Faktor | TOTP (RFC 6238), wie bei Google- oder Microsoft-Authenticator. |
| Sitzung | HMAC-signiertes Cookie `__Host-…`, `HttpOnly`, `Secure`, `SameSite=Strict`, 12 Stunden gültig. |
| Fremde Seiten | Schreibende Anfragen nur mit passendem `Origin`; strenge Content-Security-Policy, kein Einbetten (`frame-ancestors 'none'`). |
| Raten | Höchstens 5 Anmeldeversuche pro Minute und IP; immer dieselbe Fehlermeldung. |
| GitHub-Token | Fein granuliert, nur dieses Repo, nie im Browser. |
| Gleichzeitige Veröffentlichung | Während `publish.yml` läuft, wird nichts gelöscht; ändert sich `main` während des Löschens, wird neu gelesen. |

**Grenze:** Das Repo ist öffentlich (Meta lädt Bilder und Videos über Raw-Links). `log.jsonl` bleibt deshalb auf GitHub lesbar. Die Anmeldung schützt das Dashboard und alle Änderungen. GitHub Pages sollte abgeschaltet werden, sobald der Worker läuft.

## Einrichtung (einmalig, etwa 15 Minuten)

Voraussetzung: Node.js 20 oder neuer auf deinem Rechner.

1. **Cloudflare-Konto** anlegen (kostenlos): https://dash.cloudflare.com/sign-up
2. **GitHub-Token** erstellen: GitHub → Settings → Developer settings → Personal access tokens → *Fine-grained tokens* → *Generate new token*
   - Repository access: *Only select repositories* → `Images4SocialMedia`
   - Permissions: **Contents: Read and write**, **Actions: Read-only** (Metadata: Read-only kommt automatisch)
   - Ablaufdatum nach Wunsch (bei Ablauf neuen Token mit `npx wrangler secret put GITHUB_TOKEN` setzen)
3. Im Repo-Ordner:
   ```bash
   cd backend
   npm ci
   npx wrangler login        # öffnet den Browser, bei Cloudflare anmelden
   npx wrangler deploy       # erste Bereitstellung, zeigt die Adresse *.workers.dev
   npm run setup             # Benutzername, Passwort, GitHub-Token -> verschlüsselte Secrets bei Cloudflare
   ```
   `npm run setup` zeigt am Ende einen Schlüssel für die Authenticator-App. In der App „Schlüssel manuell eingeben“ wählen.
4. Die Adresse aus Schritt 3 öffnen (z. B. `https://fortschritt-dashboard.<dein-name>.workers.dev`) und anmelden.
5. **GitHub Pages abschalten:** Repo → Settings → Pages → *Source* auf „None“ bzw. *Unpublish site*.

### Automatisch bereitstellen (optional)

Der Workflow `.github/workflows/deploy-dashboard.yml` stellt nach jeder Änderung an `backend/` oder `dashboard/` auf `main` neu bereit. Dafür in GitHub → Settings → Secrets and variables → Actions zwei Secrets anlegen:

- `CLOUDFLARE_API_TOKEN`: Cloudflare → My Profile → API Tokens → *Create Token* → Vorlage „Edit Cloudflare Workers“
- `CLOUDFLARE_ACCOUNT_ID`: steht im Cloudflare-Dashboard rechts unter „Account ID“

Fehlen die Secrets, überspringt der Workflow die Bereitstellung. Die Anmelde-Secrets bleiben bei Cloudflare und werden dabei nicht überschrieben.

## Secrets im Worker

| Name | Inhalt |
|---|---|
| `ADMIN_USER` | Benutzername |
| `ADMIN_PASSWORD_HASH` | Passwort-Hash (`npm run setup`) |
| `TOTP_SECRET` | Schlüssel der Authenticator-App |
| `SESSION_SECRET` | Schlüssel für die Sitzungs-Cookies; neu setzen meldet alle Sitzungen ab |
| `GITHUB_TOKEN` | fein granulierter Token (siehe oben) |

Passwort oder Handy verloren: `npm run setup` erneut ausführen. Fehlt ein Secret, antwortet der Worker nur mit „nicht eingerichtet“.

## Lokal entwickeln

```bash
cd backend
npm run setup -- --local   # schreibt .dev.vars (nicht im Repo)
npm run dev                # http://localhost:8787
npm test                   # Tests für Anmeldung und Löschen
```

## Schnittstelle

Alle Pfade außer `/api/login` verlangen eine Sitzung.

| Methode und Pfad | Zweck |
|---|---|
| `POST /api/login` | `{ user, password, code }` → Sitzungs-Cookie |
| `POST /api/logout` | Cookie löschen |
| `GET /api/me` | angemeldeter Benutzer |
| `GET /api/log` | Rohinhalt von `publisher/log.jsonl` (Header `X-Log-Commit`) |
| `POST /api/log/delete` | `{ entries: [{ line, text }], reason }`, höchstens 500 Einträge |
| `GET /api/history` | Änderungs-Historie, neueste zuerst |

## Erweitern

Neue Schnittstellen kommen in `ROUTES` in `src/index.js`. Geplant und vorbereitet:

- **Benachrichtigungen bei neuen Einträgen:** Cron-Trigger in `wrangler.toml` plus `scheduled()`-Handler, der `log.jsonl` mit dem letzten Stand vergleicht.
- **Tägliche Fehlerberichte per E-Mail:** derselbe `scheduled()`-Handler, Versand z. B. über Resend oder Cloudflare Email Routing.
- **Systemereignisse:** Anmeldungen, Fehlversuche und Löschungen werden schon jetzt als JSON in die Worker-Logs geschrieben (`ereignis: …`, Cloudflare → Workers → Observability).

Hinweis: Gelöschte Zeilen fehlen danach auch der Dublettenprüfung der Routine (`PROMPT.md` liest die letzten Zeilen von `log.jsonl`). Die Sperre im Veröffentlicher selbst nutzt `queue.json` und ist nicht betroffen.
