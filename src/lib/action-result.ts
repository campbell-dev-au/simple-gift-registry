// Shared result shape for server actions with user-visible outcomes.
// Expected failures (validation, caps, lost races) come back as
// `{ error }` for the form to render inline; `{ ok: true }` lets a form
// confirm success; `null` means "done, nothing to say" — the pattern the
// Next error-handling guide recommends over throwing, since thrown errors
// are masked in production and only reach the generic error boundary.
// `emailed` qualifies an ok: whether the action queued a notification
// email (false when email isn't configured, or when an idempotent
// re-submit sent nothing new) so the form doesn't overclaim.
export type ActionResult =
  | { ok: true; emailed?: boolean }
  | { error: string }
  | null;
