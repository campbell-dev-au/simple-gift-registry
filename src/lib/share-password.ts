import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

// Optional password gate for /share/[token]. The password is hashed with
// scrypt (memory-hard, so offline guessing against a leaked hash is slow —
// and its ~100ms cost doubles as a modest online brute-force throttle) and
// stored on the registry as `salt:hash`.
//
// A correct entry sets an httpOnly unlock cookie whose value is an HMAC of
// the registry id *keyed by the stored hash*. That means no separate cookie
// secret to provision, a cookie for one registry proves nothing about
// another, and changing or removing the password rotates the key — every
// previously issued unlock cookie dies with it.

const SCRYPT_KEY_LENGTH = 32;

export function hashSharePassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password.normalize(), salt, SCRYPT_KEY_LENGTH);
  return `${salt}:${hash.toString("hex")}`;
}

export function verifySharePassword(password: string, stored: string) {
  const [salt, hashHex] = stored.split(":");
  if (!salt || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const candidate = scryptSync(password.normalize(), salt, SCRYPT_KEY_LENGTH);
  return (
    candidate.length === expected.length && timingSafeEqual(candidate, expected)
  );
}

export function shareAccessCookieName(registryId: string) {
  return `share_access_${registryId}`;
}

export function shareAccessCookieValue(
  registryId: string,
  sharePasswordHash: string,
) {
  return createHmac("sha256", sharePasswordHash)
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
  registry: { id: string; sharePasswordHash: string | null },
  cookieStore: CookieReader,
) {
  if (!registry.sharePasswordHash) return true;

  const cookie = cookieStore.get(shareAccessCookieName(registry.id));
  if (!cookie) return false;

  const presented = Buffer.from(cookie.value);
  const expected = Buffer.from(
    shareAccessCookieValue(registry.id, registry.sharePasswordHash),
  );
  return (
    presented.length === expected.length && timingSafeEqual(presented, expected)
  );
}
