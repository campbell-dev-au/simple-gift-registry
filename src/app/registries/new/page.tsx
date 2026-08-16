import { createRegistry } from "./actions";

export default function NewRegistryPage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <h1 className="text-2xl font-semibold">Create a gift registry</h1>
      <form
        action={createRegistry}
        className="flex w-full max-w-xs flex-col gap-3"
      >
        <label htmlFor="title" className="text-sm font-medium">
          Registry title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          className="rounded border px-3 py-2"
        />

        <label htmlFor="eventDate" className="text-sm font-medium">
          Event date (optional)
        </label>
        <input
          id="eventDate"
          name="eventDate"
          type="date"
          className="rounded border px-3 py-2"
        />

        <button
          type="submit"
          className="rounded bg-black py-2 text-white"
        >
          Create registry
        </button>
      </form>
    </main>
  );
}
