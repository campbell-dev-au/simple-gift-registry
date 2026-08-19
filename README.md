# Simple Gift Registry

A gift registry web application built with Next.js (App Router) and TypeScript.

## Getting Started

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- [Next.js](https://nextjs.org) (App Router)
- TypeScript
- Tailwind CSS
- ESLint
- [Playwright](https://playwright.dev) + [playwright-bdd](https://vitalets.github.io/playwright-bdd/) for Gherkin-driven functional testing
- [Clerk](https://clerk.com) for account creation / authentication (provisioned via the Vercel Marketplace)
- [Neon Postgres](https://neon.com) + [Drizzle ORM](https://orm.drizzle.team) for persistence (provisioned via the Vercel Marketplace)

Additional tooling (security, accessibility) to be added as the project grows.

### Environment variables

Clerk and database credentials live in `.env.local` (gitignored, provisioned by Vercel). If you're setting up a fresh checkout, run:

```bash
vercel link
vercel env pull
```

### Database

Schema lives in `src/db/schema.ts`; generated SQL migrations are committed under `drizzle/`.

```bash
npm run db:generate  # after changing src/db/schema.ts, generate a migration
npm run db:migrate   # apply pending migrations to the database in .env.local
```

## BDD workflow

Features are developed story-first, in this order:

1. **User story** — a short markdown file in [`docs/stories/`](docs/stories) describing who wants what and why (`As a / I want / So that`), plus acceptance criteria.
2. **Gherkin feature** — a `.feature` file in [`features/`](features), one directory per feature area, translating the acceptance criteria into `Given/When/Then` scenarios. This is the source of truth for expected behaviour.
3. **Step definitions** — TypeScript in `features/step-definitions/` that implements each Gherkin step using Playwright (`page.goto`, `page.getByRole`, etc.).
4. **Application code** — implement just enough of the feature to make the scenario pass.

Scenarios are compiled into real Playwright tests and run in a browser, so they exercise the app the way a user actually would rather than asserting against internals.

### Running the scenarios

```bash
npm run test:bdd         # generate tests from .feature files and run everything
npm run test:bdd:app     # homepage + registry + account-deletion scenarios
npm run test:bdd:account # account scenarios only (sign-up, sign-in, sign-out, deletion)
npm run test:bdd:ui      # interactive UI runner (all scenarios)
npm run test:bdd:report  # open the HTML report from the last run
```

`test:bdd` and friends start their own `next dev` instance on port 3100 (kept separate from your normal dev server on 3000) and tear it down after the run.

**Prefer `test:bdd:app` while iterating on product features.** `features/account/` exercises Clerk's actual sign-up/sign-in UI end to end (real password + email-code round trips, the device-trust step) — each run is several real calls against Clerk's dev-instance Frontend and Backend APIs, which has its own rate limits. `features/registry/` scenarios still need a signed-in user, but arrange that the cheap way (a Backend API–created account + `clerk.signIn()`'s bypass, skipping the UI flow entirely — see `docs/stories/sign-in.md`), so `test:bdd:app` is both faster and much lighter on Clerk's quota. (`delete_account.feature` is the exception: it arranges sign-in the cheap way too, so `test:bdd:app` includes it.) Run `test:bdd:account` deliberately when you're actually working on auth, and reach for full `test:bdd` before pushing or when you want complete coverage.

### Adding a new feature

1. Add `docs/stories/<feature>.md` describing the story and acceptance criteria.
2. Add `features/<feature>/<scenario>.feature` with one or more scenarios covering the acceptance criteria.
3. Run `npm run test:bdd` — Playwright will report undefined steps and print snippet stubs for any steps that don't exist yet.
4. Implement the missing steps in `features/step-definitions/`, then implement the app code until the scenario passes.
