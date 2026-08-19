import { Breadcrumbs } from "@/components/breadcrumbs";
import { NewRegistryForm } from "@/components/new-registry-form";

export default function NewRegistryPage() {
  return (
    <main className="mx-auto flex w-full max-w-xs flex-1 flex-col justify-center gap-6 px-6 py-10">
      <Breadcrumbs
        items={[
          { label: "My registries", href: "/registries" },
          { label: "New registry" },
        ]}
      />
      <h1 className="font-display text-2xl font-bold text-ink">
        Create a gift registry
      </h1>
      <NewRegistryForm />
    </main>
  );
}
