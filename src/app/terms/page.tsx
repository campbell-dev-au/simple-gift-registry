import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/legal";

export const metadata: Metadata = {
  title: "Terms of Service · Simple Gift Registry",
  description: "The terms that apply when you use Simple Gift Registry.",
};

const CONTACT_EMAIL = "campbell.davis90@gmail.com";

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="19 August 2026">
      <LegalSection title="Agreement">
        <p>
          These terms apply when you use Simple Gift Registry (&ldquo;the
          service&rdquo;). By creating an account or using the service, you
          agree to them. If you do not agree, please do not use the service.
        </p>
      </LegalSection>

      <LegalSection title="The service">
        <p>
          Simple Gift Registry lets you create gift registries, share them
          with a link, and coordinate gift claims among guests. The service
          is provided free of charge. It is a coordination tool only: no
          purchases are made through the service, no payments are processed,
          and a claim on a gift is a signal to other guests, not a
          transaction. We cannot guarantee that a claimed gift will actually
          be given.
        </p>
      </LegalSection>

      <LegalSection title="Your account">
        <p>
          You must be at least 13 years old to use the service. Keep your
          sign-in credentials secure — you are responsible for activity that
          happens under your account. Provide accurate account information
          and keep it up to date.
        </p>
      </LegalSection>

      <LegalSection title="Your content">
        <p>
          You own the content you add to the service — registry titles, gift
          names, notes, and so on. By adding it, you give us permission to
          store it and display it to the people you share it with, which is
          what the service is for. You are responsible for the content you
          add and for the email addresses you invite; only invite people who
          would expect to hear from you.
        </p>
      </LegalSection>

      <LegalSection title="Share links">
        <p>
          Anyone with a registry&rsquo;s share link can view it and, with an
          account, claim gifts. You choose who to give the link to, and you
          are responsible for where you share it. If a link spreads further
          than you intended, contact us and we can help.
        </p>
      </LegalSection>

      <LegalSection title="Acceptable use">
        <p>When using the service, you must not:</p>
        <ul>
          <li>break the law or infringe anyone else&rsquo;s rights;</li>
          <li>
            add content that is abusive, deceptive, or harmful, or use the
            service to harass anyone;
          </li>
          <li>
            invite or spam people who have no connection to you or your
            registry;
          </li>
          <li>
            attempt to access other people&rsquo;s registries or accounts, or
            probe, scrape, or disrupt the service;
          </li>
          <li>use the service to send unsolicited advertising.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Ending your use">
        <p>
          You can stop using the service at any time and ask us to delete
          your account and data. We may suspend or remove accounts or content
          that violate these terms, and we may discontinue the service — if
          we do, we will make reasonable efforts to give notice so you can
          keep a copy of your registries.
        </p>
      </LegalSection>

      <LegalSection title="Disclaimers">
        <p>
          The service is provided &ldquo;as is&rdquo; and free of charge. We
          do not promise that it will be uninterrupted, error-free, or that
          content will never be lost. Nothing in these terms excludes
          guarantees that cannot be excluded under the Australian Consumer
          Law; to the extent permitted by law, our liability for anything
          arising out of your use of the service is limited to resupplying
          the service.
        </p>
      </LegalSection>

      <LegalSection title="Changes to these terms">
        <p>
          If we make material changes to these terms, we will update this
          page and the &ldquo;last updated&rdquo; date above. Continuing to
          use the service after a change means you accept the updated terms.
        </p>
      </LegalSection>

      <LegalSection title="Governing law">
        <p>These terms are governed by the laws of Australia.</p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          Questions about these terms can be sent to{" "}
          <a
            href={`mailto:${CONTACT_EMAIL}`}
            className="text-violet hover:underline"
          >
            {CONTACT_EMAIL}
          </a>
          . Our privacy practices are described in the{" "}
          <Link href="/privacy" className="text-violet hover:underline">
            Privacy Policy
          </Link>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
