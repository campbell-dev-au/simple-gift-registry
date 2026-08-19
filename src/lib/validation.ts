const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Every id and share token in the app is a Postgres uuid. Checking the
// shape before querying keeps a crafted request from reaching Postgres,
// where a malformed uuid throws `invalid input syntax` — a 500 — instead
// of behaving like the not-found it really is.
export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}
