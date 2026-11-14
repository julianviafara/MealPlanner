# Testing guide

## Automated checks

Use Node.js 22.12.x, 24.x, or 26+ and install the exact lockfile dependencies with `npm ci`. Then run:

```sh
npm run lint
npm run typecheck
npm run test:unit
npm run test:integration
npm test
npm run build
```

`npm run test:unit` excludes `*.integration.test.tsx`. `npm run test:integration` runs those focused React Testing Library interactions; `npm test` runs the complete Vitest suite. Vitest uses jsdom and the shared setup in `src/test/setup.ts`. API and Firebase service tests stub `fetch` or mock Firebase modules; they do not access a real Firebase project or alter user data. Coverage currently focuses on authentication validation/error translation and form submission, protected route behavior, TheMealDB normalization/errors and recipe page interactions, planner date/service/hook logic, theme persistence, and shopping measurement parsing, aggregation, item form, and reconciliation.

The repository does not currently contain a configured Firebase Emulator Suite or Playwright dependency. Installation was attempted, but npm exits before startup with `shim integrity check failed`; package installation and validation commands must be rerun in a standard Node/npm shell. CI runs `npm ci`, lint, TypeScript checks, unit and integration Vitest suites, and the production build on pull requests and pushes to the default branch.

## Manual smoke test with a dedicated Firebase test project

Do not use production accounts or production documents for destructive checks. Create a separate Firebase project, enable Email/Password (and optionally Google) authentication, create Firestore, publish `firestore.rules`, and configure `.env.local` with that test project's web configuration. Add `localhost` as an authorized domain. Use a dedicated test account and remove test data afterward.

1. Open `/`, use the registration form to create a test account, and verify the dashboard loads after auth resolves.
2. Log out, sign in again, and directly open `/planner`; verify an unauthenticated session redirects to login and an authenticated session returns to the planner.
3. Search a recipe in `/recipes`, open its details, save it as a favourite, verify it in `/favorites`, then remove it.
4. Add two recipes to the same planner week, including two occurrences of one recipe. Change one planned recipe, remove another, reload, and verify the saved meals.
5. Open `/shopping-list`, generate ingredients, check a same-unit ingredient aggregate, add and edit a manual item, mark an item purchased, reload, and verify persisted rows and purchase states.
6. Change the plan and verify the shopping list reports that it may be outdated. Update it and verify manual rows and still-matching purchase states remain.
7. Sign in as a second test user and verify the first account's favourites, planner meals, and shopping items are not visible.
8. Verify sign-up validation, invalid login, missing recipe, empty catalogue, Firebase/network errors, light/dark theme persistence, and responsive views at mobile, tablet, and desktop widths.

Google popup behavior depends on Firebase provider setup and browser popup policies; password reset depends on authorized email configuration. Verify these manually in the isolated test project.

## Future browser automation

Before adding destructive browser tests, provision Playwright and Firebase Emulator Suite as development tooling, pin them in the lockfile, and create an isolated emulator configuration with test-only auth. Browser workflows should run only against the emulator/test project. CI should not receive production Firebase secrets, and preview or production deployment credentials must remain outside pull-request validation.
