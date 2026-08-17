import { createRegistry } from "./actions";
import { Button } from "@/components/button";
import { inputClass, labelClass } from "@/components/field";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { TITLE_MAX_LENGTH } from "@/lib/field-limits";

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
      <form action={createRegistry} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="title" className={labelClass}>
            Registry title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            maxLength={TITLE_MAX_LENGTH}
            className={inputClass}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="eventDate" className={labelClass}>
            Event date (optional)
          </label>
          <input
            id="eventDate"
            name="eventDate"
            type="date"
            className={inputClass}
          />
        </div>

        <Button type="submit">Create registry</Button>
      </form>
    </main>
  );
}
