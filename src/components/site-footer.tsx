import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-line">
      <div className="relative mx-auto max-w-5xl px-6 py-4">
        <a
          href="https://buymeacoffee.com/campbelldavis"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute right-6 top-0 -translate-y-1/2 rounded bg-canvas px-2 text-xs text-ink-dim hover:text-ink hover:underline"
        >
          Buy me a coffee
        </a>
        <div className="flex flex-col gap-2 text-xs text-ink-dim sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
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
      </div>
    </footer>
  );
}
