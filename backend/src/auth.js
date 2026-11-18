// Anmeldung: Passwort (PBKDF2-SHA256), zweiter Faktor (TOTP, RFC 6238) und signierte Sitzungs-Cookies (HMAC-SHA256).
// Nur Web Crypto, keine Abhängigkeiten. Läuft in Cloudflare Workers und in Node 20+.

const enc = new TextEncoder();
export const SESSION_COOKIE = "__Host-fd_session";
export const SESSION_HOURS = 12;

export function b64url(bytes) {
  let s = "";
  new Uint8Array(bytes).forEach((b) => { s += String.fromCharCode(b); });
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
export function fromB64url(str) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

// Vergleich in konstanter Zeit, damit die Antwortzeit nichts über das Geheimnis verrät.
export function safeEqual(a, b) {
  const x = typeof a === "string" ? enc.encode(a) : a;
  const y = typeof b === "string" ? enc.encode(b) : b;
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] || 0) ^ (y[i] || 0);
  return diff === 0;
}

// ---------------------------------------------------------------- Passwort
// Format: pbkdf2-sha256$<iterationen>$<salt b64url>$<hash b64url>
// Cloudflare Workers erlaubt höchstens 100 000 Iterationen.
export const PBKDF2_ITER = 100000;

export async function hashPassword(password, salt = crypto.getRandomValues(new Uint8Array(16)), iter = PBKDF2_ITER) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: iter }, key, 256);
  return `pbkdf2-sha256$${iter}$${b64url(salt)}$${b64url(bits)}`;
}

export async function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  const iter = Number(parts[1]);
  if (!Number.isInteger(iter) || iter < 10000 || iter > 100000) return false;
  const again = await hashPassword(String(password), fromB64url(parts[2]), iter);
  return safeEqual(again, stored);
}

// ---------------------------------------------------------------- TOTP (Authenticator-App)
const B32 = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
export function base32Decode(str) {
  const clean = String(str || "").toUpperCase().replace(/[\s=-]/g, "");
  let bits = 0, val = 0;
  const out = [];
  for (const ch of clean) {
    const i = B32.indexOf(ch);
    if (i < 0) throw new Error("ungültiges Base32");
    val = (val << 5) | i; bits += 5;
    if (bits >= 8) { out.push((val >>> (bits - 8)) & 255); bits -= 8; }
  }
  return new Uint8Array(out);
}
export function base32Encode(bytes) {
  let bits = 0, val = 0, out = "";
  for (const b of bytes) {
    val = (val << 8) | b; bits += 8;
    while (bits >= 5) { out += B32[(val >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += B32[(val << (5 - bits)) & 31];
  return out;
}

export async function totp(secretB32, counter) {
  const key = await crypto.subtle.importKey("raw", base32Decode(secretB32), { name: "HMAC", hash: "SHA-1" }, false, ["sign"]);
  const msg = new Uint8Array(8);
  let c = BigInt(counter);
  for (let i = 7; i >= 0; i--) { msg[i] = Number(c & 255n); c >>= 8n; }
  const h = new Uint8Array(await crypto.subtle.sign("HMAC", key, msg));
  const o = h[19] & 15;
  const code = (((h[o] & 127) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3]) % 1000000;
  return String(code).padStart(6, "0");
}

// Erlaubt eine Abweichung von ±30 Sekunden (Uhren von Handy und Server).
export async function verifyTotp(secretB32, code, now = Date.now()) {
  const c = String(code || "").replace(/\s/g, "");
  if (!/^\d{6}$/.test(c)) return false;
  const step = Math.floor(now / 30000);
  let ok = false;
  for (const d of [-1, 0, 1]) if (safeEqual(await totp(secretB32, step + d), c)) ok = true;
  return ok;
}

// ---------------------------------------------------------------- Sitzung
async function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function createSession(secret, user, now = Date.now()) {
  const payload = { u: user, iat: Math.floor(now / 1000), exp: Math.floor(now / 1000) + SESSION_HOURS * 3600, n: b64url(crypto.getRandomValues(new Uint8Array(12))) };
  const body = b64url(enc.encode(JSON.stringify(payload)));
  const sig = b64url(await crypto.subtle.sign("HMAC", await hmacKey(secret), enc.encode(body)));
  return { token: `${body}.${sig}`, payload };
}

export async function readSession(secret, token, now = Date.now()) {
  if (!token || typeof token !== "string") return null;
  const [body, sig, extra] = token.split(".");
  if (!body || !sig || extra !== undefined) return null;
  let valid = false;
  try { valid = await crypto.subtle.verify("HMAC", await hmacKey(secret), fromB64url(sig), enc.encode(body)); } catch (e) { return null; }
  if (!valid) return null;
  let p;
  try { p = JSON.parse(new TextDecoder().decode(fromB64url(body))); } catch (e) { return null; }
  if (!p || typeof p.u !== "string" || typeof p.exp !== "number" || p.exp * 1000 <= now) return null;
  return p;
}

export function getCookie(request, name) {
  const header = request.headers.get("Cookie") || "";
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return part.slice(i + 1).trim();
  }
  return null;
}

export function sessionCookie(token) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}
export function clearCookie() {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}
