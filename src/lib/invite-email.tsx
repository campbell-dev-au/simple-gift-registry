import { Resend } from "resend";

// First (and so far only) outbound email: notifying someone they've been
// invited to co-own a registry. Sending is strictly best-effort — the
// invitation row is the source of truth and acceptance happens on
// /registries regardless (see docs/stories/invite-co-owner.md), so a
// failed or skipped send never fails the invite action.
//
// RESEND_API_KEY comes from the Resend integration on the Vercel
// Marketplace (`vercel integration add resend/resend-email`, then
// `vercel env pull`). Without it — local dev and BDD runs today — sending
// is skipped silently, which keeps those environments working with no
// email infrastructure.
//
// EMAIL_FROM must be an address on a domain verified in Resend. The
// fallback, Resend's shared onboarding address, only delivers to the
// Resend account owner's own inbox — fine for trying the flow out, not
// for real invitees.
const FROM_FALLBACK = "Simple Gift Registry <onboarding@resend.dev>";

export function inviteEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

// The HTML body is a React element rendered by Resend (via
// @react-email/render) rather than a hand-built HTML string, so the
// user-controlled registry title and inviter name are escaped by React
// itself — no manual sanitization to get wrong.
function InviteEmail({
  intro,
  howToAccept,
  registriesUrl,
  whoSentThis,
}: {
  intro: string;
  howToAccept: string;
  registriesUrl: string;
  whoSentThis: string;
}) {
  return (
    <div
      style={{
        fontFamily: "system-ui, sans-serif",
        maxWidth: "32rem",
        margin: "0 auto",
        lineHeight: 1.5,
      }}
    >
      <p>{intro}</p>
      <p>{howToAccept}</p>
      <p>
        <a href={registriesUrl}>Open my registries</a>
      </p>
      <hr
        style={{
          border: "none",
          borderTop: "1px solid #ddd",
          margin: "1.5rem 0",
        }}
      />
      <p style={{ color: "#666", fontSize: "0.875rem" }}>{whoSentThis}</p>
    </div>
  );
}

// Deliberately logs only a message string, never the error object or the
// send parameters — a failed-send error can echo back the recipient
// address, which doesn't belong in the logs.
function logSendFailure(reason: unknown) {
  const message =
    reason instanceof Error ? reason.message : "unknown send error";
  console.error(`Co-owner invite email failed to send: ${message}`);
}

export async function sendCoOwnerInviteEmail({
  to,
  registryTitle,
  inviterName,
  registriesUrl,
}: {
  to: string;
  registryTitle: string;
  inviterName: string;
  registriesUrl: string;
}) {
  if (!inviteEmailConfigured()) return;

  const intro = `${inviterName} invited you to be a co-owner of the gift registry "${registryTitle}".`;
  const howToAccept =
    "To accept, sign in (or create an account) with this email address and " +
    "you'll find the invitation waiting on your registries page.";
  const whoSentThis =
    "This invitation was created on Simple Gift Registry. If you weren't " +
    "expecting it, you can ignore this email — nothing is shared until you accept.";

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? FROM_FALLBACK,
      to,
      subject: `${inviterName} invited you to help manage "${registryTitle}"`,
      text: `${intro}\n\n${howToAccept}\n\n${registriesUrl}\n\n${whoSentThis}\n`,
      react: (
        <InviteEmail
          intro={intro}
          howToAccept={howToAccept}
          registriesUrl={registriesUrl}
          whoSentThis={whoSentThis}
        />
      ),
    });
    if (error) logSendFailure(new Error(error.message));
  } catch (error) {
    logSendFailure(error);
  }
}
