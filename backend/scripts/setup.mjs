#!/usr/bin/env node
// Einrichtung der Zugangsdaten. Fragt Benutzername, Passwort und GitHub-Token ab, erzeugt
// Passwort-Hash, Sitzungsschlüssel und den Schlüssel für die Authenticator-App und lädt alles
// als verschlüsselte Secrets zu Cloudflare hoch. Nichts davon landet im Repository.
//
//   npm run setup            -> Secrets zu Cloudflare hochladen (vorher: npx wrangler login)
//   npm run setup -- --local -> nur .dev.vars für "npm run dev" schreiben
import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import readline from "node:readline";
import { b64url, base32Encode, hashPassword } from "../src/auth.js";

const local = process.argv.includes("--local");

function ask(question, { hidden = false } = {}) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    if (hidden) {
      rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); else rl.output.write("*".repeat(s.length ? 1 : 0)); };
    }
    rl.question(question, (a) => { rl.close(); if (hidden) process.stdout.write("\n"); resolve(a.trim()); });
  });
}

const user = (await ask("Benutzername: ")).toLowerCase();
if (!/^[a-z0-9._-]{3,40}$/.test(user)) { console.error("Benutzername: 3 bis 40 Zeichen, nur a-z, 0-9, Punkt, Strich."); process.exit(1); }
const pw = await ask("Passwort (mindestens 12 Zeichen): ", { hidden: true });
if (pw.length < 12) { console.error("Das Passwort ist zu kurz."); process.exit(1); }
if (pw !== await ask("Passwort wiederholen: ", { hidden: true })) { console.error("Die Passwörter stimmen nicht überein."); process.exit(1); }
const token = await ask("GitHub-Token (fein granuliert, siehe README): ", { hidden: true });
if (!token) { console.error("Ohne GitHub-Token kann das Backend das Protokoll nicht lesen."); process.exit(1); }

const totpSecret = base32Encode(crypto.getRandomValues(new Uint8Array(20)));
const secrets = {
  ADMIN_USER: user,
  ADMIN_PASSWORD_HASH: await hashPassword(pw),
  TOTP_SECRET: totpSecret,
  SESSION_SECRET: b64url(crypto.getRandomValues(new Uint8Array(32))),
  GITHUB_TOKEN: token,
};

if (local) {
  writeFileSync(new URL("../.dev.vars", import.meta.url), Object.entries(secrets).map(([k, v]) => `${k}='${v}'`).join("\n") + "\n", { mode: 0o600 });
  console.log("\n.dev.vars geschrieben (steht in .gitignore).");
} else {
  const dir = mkdtempSync(join(tmpdir(), "fd-"));
  const file = join(dir, "secrets.json");
  writeFileSync(file, JSON.stringify(secrets), { mode: 0o600 });
  const r = spawnSync("npx", ["wrangler", "secret", "bulk", file], { stdio: "inherit", shell: process.platform === "win32" });
  rmSync(dir, { recursive: true, force: true });
  if (r.status !== 0) { console.error("Hochladen fehlgeschlagen. Bist du mit \"npx wrangler login\" angemeldet?"); process.exit(1); }
}

const label = encodeURIComponent(`Fortschritt-Dashboard:${user}`);
console.log(`
Zweiter Faktor: In der Authenticator-App (Google Authenticator, Microsoft Authenticator, 1Password …)
"Schlüssel manuell eingeben" wählen und diesen Schlüssel eintragen (zeitbasiert, 6 Stellen):

    ${totpSecret.match(/.{1,4}/g).join(" ")}

oder diesen Link in einer App öffnen, die otpauth-Links versteht:
    otpauth://totp/${label}?secret=${totpSecret}&issuer=Fortschritt-Dashboard&digits=6&period=30

Den Schlüssel sicher aufbewahren und nicht weitergeben. Bei Verlust einfach "npm run setup" erneut ausführen;
dabei werden alle bestehenden Sitzungen ungültig.`);
