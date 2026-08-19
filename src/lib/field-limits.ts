// Shared client/server field size limits. Client components use these for
// `maxLength`/`max` so the browser stops oversized input before it's typed;
// server actions re-check the same limits since the client-side attributes
// are trivially bypassable (raw fetch, disabled JS, etc).

export const TITLE_MAX_LENGTH = 200;
export const GIFT_NAME_MAX_LENGTH = 200;
export const NOTES_MAX_LENGTH = 1000;
export const REGISTRY_NOTES_MAX_LENGTH = 2000;
export const EMAIL_MAX_LENGTH = 254;
export const QUANTITY_MAX = 999;
export const GIFT_COUNT_MAX = 50;
export const NAME_MAX_LENGTH = 100;
export const PASSWORD_MAX_LENGTH = 128;
export const SHARE_PASSWORD_MIN_LENGTH = 4;
export const SHARE_PASSWORD_MAX_LENGTH = 128;

// Per-account / per-registry caps. Like GIFT_COUNT_MAX, these exist purely
// as abuse limits — a scripted free account shouldn't be able to fill the
// database — and sit far above anything a real household needs.
export const REGISTRY_COUNT_MAX = 20;
export const INVITE_COUNT_MAX = 10;

// Returns the error message, or null when the value fits. Server actions
// surface this via their typed result (see ActionResult in
// src/lib/action-result.ts) instead of throwing — a thrown validation error
// only reaches the generic error boundary, telling the user to "try again"
// for input that will never pass.
export function maxLengthError(
  value: string,
  max: number,
  fieldLabel: string,
) {
  if (value.length > max) {
    return `${fieldLabel} must be ${max} characters or fewer.`;
  }
  return null;
}
