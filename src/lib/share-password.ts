import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

// Optional password gate for /share/[token]. The password is stored
// *encrypted* (AES-256-GCM, key from SHARE_PASSWORD_KEY), not hashed —
// deliberately: the owner can re-view and copy it from the manage page,
// password-manager style. That's the right trade-off here because a share
// password is an access code the owner hands out to guests, not a personal
// credential — but since people reuse passwords anyway, it still must not
// sit in the database as plaintext.
//
// A correct entry sets an httpOnly unlock cookie whose value is an HMAC of
// the registry id *keyed by the stored ciphertext*. The random IV makes
// the ciphertext different on every set, so changing (or removing) the
// password rotates the key and every previously issued unlock cookie dies
// with it — and a cookie for one registry proves nothing about another.

function encryptionKey() {
  const secret = process.env.SHARE_PASSWORD_KEY;
  if (!secret) return null;
  // Hashing normalises any secret string to exactly the 32 bytes AES-256 needs.
  return createHash("sha256").update(secret).digest();
}

export function sharePasswordKeyConfigured() {
  return !!process.env.SHARE_PASSWORD_KEY;
}

export function encryptSharePassword(password: string) {
  const key = encryptionKey();
  if (!key) throw new Error("SHARE_PASSWORD_KEY is not configured.");

  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(password.normalize(), "utf8"),
    cipher.final(),
  ]);
  return `v1:${iv.toString("hex")}:${cipher.getAuthTag().toString("hex")}:${encrypted.toString("hex")}`;
}

// Null rather than a throw for anything undecryptable (unknown format,
// rotated SHARE_PASSWORD_KEY): callers treat it as "the stored password is
// unusable" — the owner can still set a new one, which overwrites it.
export function decryptSharePassword(stored: string): string | null {
  const key = encryptionKey();
  if (!key) return null;

  const [version, ivHex, tagHex, cipherHex] = stored.split(":");
  if (version !== "v1" || !ivHex || !tagHex || !cipherHex) return null;

  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      key,
      Buffer.from(ivHex, "hex"),
    );
    decipher.setAuthTag(Buffer.from(tagHex, "hex"));
    return Buffer.concat([
      decipher.update(Buffer.from(cipherHex, "hex")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}

export function verifySharePassword(password: string, stored: string) {
  const actual = decryptSharePassword(stored);
  if (actual === null) return false;

  const presented = Buffer.from(password.normalize(), "utf8");
  const expected = Buffer.from(actual, "utf8");
  return (
    presented.length === expected.length && timingSafeEqual(presented, expected)
  );
}

export function shareAccessCookieName(registryId: string) {
  return `share_access_${registryId}`;
}

export function shareAccessCookieValue(
  registryId: string,
  sharePasswordEncrypted: string,
) {
  return createHmac("sha256", sharePasswordEncrypted)
    .update(registryId)
    .digest("hex");
}

type CookieReader = {
  get(name: string): { value: string } | undefined;
};

// True when the registry has no password, or the request carries a valid
// unlock cookie. Owners/co-owners are exempted separately by callers (they
// already proved a stronger identity than the password).
export function hasShareAccess(
  registry: { id: string; sharePasswordEncrypted: string | null },
  cookieStore: CookieReader,
) {
  if (!registry.sharePasswordEncrypted) return true;

  const cookie = cookieStore.get(shareAccessCookieName(registry.id));
  if (!cookie) return false;

  const presented = Buffer.from(cookie.value);
  const expected = Buffer.from(
    shareAccessCookieValue(registry.id, registry.sharePasswordEncrypted),
  );
  return (
    presented.length === expected.length && timingSafeEqual(presented, expected)
  );
}
