import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/legal";

export const metadata: Metadata = {
  title: "Privacy Policy · Simple Gift Registry",
  description: "How Simple Gift Registry collects, uses, and shares your information.",
};

const CONTACT_EMAIL = "campbell.davis90@gmail.com";

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="19 August 2026">
      <LegalSection title="Overview">
        <p>
          Simple Gift Registry (&ldquo;we&rdquo;, &ldquo;us&rdquo;) is a web
          application that lets you build a gift registry, share it with a
          link, and let guests claim gifts. This policy explains what
          information we collect, how it is used, and who can see it. We
          collect only what the service needs to work — we do not run ads, we
          do not sell your data, and we do not send marketing email.
        </p>
      </LegalSection>

      <LegalSection title="Information we collect">
        <p>
          <strong>Account information.</strong> When you create an account we
          collect your name and email address. If you sign up with a password,
          it is stored in hashed form by our authentication provider, Clerk —
          we never see it. If you sign in with Google, we receive your name
          and email address from your Google account. Clerk also processes
          email verification codes and bot-protection checks during sign-up.
        </p>
        <p>
          <strong>Content you create.</strong> Registry titles and event
          dates, gift names, notes, and quantities, gift claims (which
          account claimed a gift, and how many), the email addresses of
          people you invite to co-manage a registry, and registries you save.
        </p>
        <p>
          <strong>Technical information.</strong> Like most web services, our
          hosting and authentication providers keep standard server logs that
          may include your IP address and browser details, used for security
          and to keep the service running.
        </p>
      </LegalSection>

      <LegalSection title="How we use your information">
        <p>
          Solely to provide the service: signing you in, showing registries to
          the people you share them with, tracking gift claims so guests
          don&rsquo;t double up, and matching co-owner invitations to the
          right account. We do not use your information for advertising or
          profiling, and we do not sell or rent it to anyone.
        </p>
      </LegalSection>

      <LegalSection title="Who can see what">
        <p>
          <strong>Share links.</strong> Anyone who has a registry&rsquo;s
          share link can view its title, event date, and gifts, including how
          many of each gift are still unclaimed. Share links are long and
          unguessable, but they are not password-protected — anyone the link
          is forwarded to can open it.
        </p>
        <p>
          <strong>Gift claims.</strong> Other guests can see how many of a
          gift remain, but never who claimed it. Registry owners cannot see
          claim activity at all unless they explicitly opt in, and even then
          they see only how many of each gift have been claimed — never by
          whom.
        </p>
        <p>
          <strong>Invitations.</strong> If you invite someone to co-manage a
          registry, the email address you enter is visible to that
          registry&rsquo;s owners and co-owners.
        </p>
      </LegalSection>

      <LegalSection title="Service providers">
        <p>
          We rely on a small number of providers to run the service, each of
          which processes data on our behalf:
        </p>
        <ul>
          <li>
            <strong>Clerk</strong> — authentication and account management
            (name, email, password hashes, session cookies).
          </li>
          <li>
            <strong>Neon</strong> — the database where registries, gifts,
            claims, invitations, and saves are stored.
          </li>
          <li>
            <strong>Vercel</strong> — hosting and serving the application.
          </li>
          <li>
            <strong>Google</strong> — only if you choose to sign in with
            Google.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          We use only the cookies required to keep you signed in, set by our
          authentication provider. There are no advertising or third-party
          tracking cookies.
        </p>
      </LegalSection>

      <LegalSection title="Retention and deletion">
        <p>
          Your account and content are kept while your account is active.
          Archiving a registry hides it but does not delete it; deleting a
          gift removes it and its claims permanently. To delete your account
          and the data associated with it, contact us at the address below
          and we will remove it.
        </p>
      </LegalSection>

      <LegalSection title="Your rights">
        <p>
          You can access and correct your account details from the Account
          page at any time. You may also ask us for a copy of the personal
          information we hold about you, ask us to correct it, or ask us to
          delete it, by contacting us at the address below. We handle
          personal information in accordance with the Australian Privacy Act
          1988, including the Australian Privacy Principles.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          All traffic to the service is encrypted over HTTPS, passwords are
          handled exclusively by Clerk, and access to the database is
          restricted. No online service can promise perfect security, but we
          keep the amount of personal information we hold to a minimum.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          The service is not directed at children under 13, and we do not
          knowingly collect personal information from them.
        </p>
      </LegalSection>

      <LegalSection title="Changes to this policy">
        <p>
          If we make material changes to this policy, we will update this
          page and the &ldquo;last updated&rdquo; date above.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions or requests about your data can be sent to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-violet hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
