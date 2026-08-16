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

Additional tooling (security, accessibility) to be added as the project grows.

### Environment variables

Clerk keys live in `.env.local` (gitignored, provisioned by Vercel). If you're setting up a fresh checkout, run:

```bash
vercel link
vercel env pull
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
npm run test:bdd        # generate tests from .feature files and run them
npm run test:bdd:ui     # same, but with Playwright's interactive UI runner
npm run test:bdd:report # open the HTML report from the last run
```

`test:bdd` starts its own `next dev` instance on port 3100 (kept separate from your normal dev server on 3000) and tears it down after the run.

### Adding a new feature

1. Add `docs/stories/<feature>.md` describing the story and acceptance criteria.
2. Add `features/<feature>/<scenario>.feature` with one or more scenarios covering the acceptance criteria.
3. Run `npm run test:bdd` — Playwright will report undefined steps and print snippet stubs for any steps that don't exist yet.
4. Implement the missing steps in `features/step-definitions/`, then implement the app code until the scenario passes.
