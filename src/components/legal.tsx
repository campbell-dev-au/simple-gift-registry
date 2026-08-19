import { Breadcrumbs } from "@/components/breadcrumbs";

// Shared shell for the legal pages (/privacy, /terms) so the two documents
// stay visually in lockstep without each page carrying its own class soup.
export function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-10">
      <div className="flex flex-col gap-6">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: title }]} />
        <div>
          <h1 className="font-display text-3xl font-bold text-ink">{title}</h1>
          <p className="mt-2 text-sm text-ink-dim">Last updated: {updated}</p>
        </div>
      </div>
      {children}
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 text-sm leading-relaxed text-ink-dim [&_li]:pl-1 [&_strong]:font-medium [&_strong]:text-ink [&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5">
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      {children}
    </section>
  );
}
