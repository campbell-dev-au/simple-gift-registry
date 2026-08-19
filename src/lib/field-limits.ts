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

export function assertMaxLength(
  value: string,
  max: number,
  fieldLabel: string,
) {
  if (value.length > max) {
    throw new Error(`${fieldLabel} must be ${max} characters or fewer.`);
  }
}
