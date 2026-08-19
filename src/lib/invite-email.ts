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

function escapeHtml(text: string) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
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

  const subject = `${inviterName} invited you to help manage "${registryTitle}"`;
  const intro = `${inviterName} invited you to be a co-owner of the gift registry "${registryTitle}".`;
  const howToAccept =
    "To accept, sign in (or create an account) with this email address and " +
    "you'll find the invitation waiting on your registries page.";
  const whoSentThis =
    "This invitation was created on Simple Gift Registry. If you weren't " +
    "expecting it, you can ignore this email — nothing is shared until you accept.";

  const text = `${intro}\n\n${howToAccept}\n\n${registriesUrl}\n\n${whoSentThis}\n`;
  const html = `
<div style="font-family: system-ui, sans-serif; max-width: 32rem; margin: 0 auto; line-height: 1.5;">
  <p>${escapeHtml(intro)}</p>
  <p>${escapeHtml(howToAccept)}</p>
  <p><a href="${escapeHtml(registriesUrl)}">Open my registries</a></p>
  <hr style="border: none; border-top: 1px solid #ddd; margin: 1.5rem 0;" />
  <p style="color: #666; font-size: 0.875rem;">${escapeHtml(whoSentThis)}</p>
</div>`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error } = await resend.emails.send({
      from: process.env.EMAIL_FROM ?? FROM_FALLBACK,
      to,
      subject,
      text,
      html,
    });
    if (error) {
      console.error("Co-owner invite email failed to send:", error);
    }
  } catch (error) {
    console.error("Co-owner invite email failed to send:", error);
  }
}
