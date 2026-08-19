import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4 text-xs text-ink-dim">
        <span>Simple Gift Registry</span>
        <span>
          Having trouble, or have feedback? Email{" "}
          <a
            href="mailto:support@simplegiftregistry.com.au"
            className="text-violet hover:underline"
          >
            support@simplegiftregistry.com.au
          </a>
        </span>
        <nav className="flex items-center gap-4">
          <a
            href="https://campbelldavis.com.au"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-ink hover:underline"
          >
            Campbell Davis
          </a>
          <Link href="/privacy" className="hover:text-ink hover:underline">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-ink hover:underline">
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
}
