import assert from "node:assert/strict";
import test from "node:test";
import { base32Encode, createSession, hashPassword, readSession, totp, verifyPassword, verifyTotp } from "../src/auth.js";

test("Passwort-Hash prüft richtig und falsch", async () => {
  const h = await hashPassword("ein sehr langes Passwort");
  assert.match(h, /^pbkdf2-sha256\$100000\$/);
  assert.equal(await verifyPassword("ein sehr langes Passwort", h), true);
  assert.equal(await verifyPassword("ein sehr langes passwort", h), false);
  assert.equal(await verifyPassword("x", "kaputt"), false);
});

test("TOTP entspricht RFC 6238 (SHA-1, Testvektor)", async () => {
  const secret = base32Encode(new TextEncoder().encode("12345678901234567890"));
  // RFC 6238 Anhang B: T = 59 s -> 94287082 (8 Stellen), 6 Stellen = 287082
  assert.equal(await totp(secret, Math.floor(59 / 30)), "287082");
  assert.equal(await totp(secret, Math.floor(1111111109 / 30)), "081804");
  assert.equal(await verifyTotp(secret, "287082", 59 * 1000), true);
  assert.equal(await verifyTotp(secret, "287082", 59 * 1000 + 30000), true); // eine Periode Toleranz
  assert.equal(await verifyTotp(secret, "287082", 59 * 1000 + 90000), false);
  assert.equal(await verifyTotp(secret, "abc", 59 * 1000), false);
});

test("Sitzung: gültig, manipuliert, abgelaufen, falscher Schlüssel", async () => {
  const { token } = await createSession("geheim", "wadii", 1_000_000);
  assert.equal((await readSession("geheim", token, 1_000_000)).u, "wadii");
  assert.equal(await readSession("anders", token, 1_000_000), null);
  const [body, sig] = token.split(".");
  const forged = Buffer.from(JSON.stringify({ u: "wadii", exp: 9e9 })).toString("base64url");
  assert.equal(await readSession("geheim", `${forged}.${sig}`, 1_000_000), null);
  assert.equal(await readSession("geheim", `${body}.${sig}`, 1_000_000 + 13 * 3600 * 1000), null);
  assert.equal(await readSession("geheim", "", 0), null);
});
