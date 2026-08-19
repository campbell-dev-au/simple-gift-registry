// Event dates are stored as date-only YYYY-MM-DD strings (see event_date in
// src/db/schema.ts). Split manually instead of new Date(isoString) — the
// latter parses as UTC midnight, which shifts the date backwards a day for
// viewers east of Greenwich.
export function formatEventDate(isoDate: string) {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("en-AU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
