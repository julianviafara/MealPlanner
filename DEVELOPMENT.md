# MealPlanner development

## Phase status

**Phase 1 — Public landing page and design system: complete.**

**Phase 2 — Application architecture and Firebase Authentication: complete.** The app has feature-oriented routes/layouts, Firebase Auth and Firestore integration, profile editing, a protected dashboard foundation, and owner-only Firestore rules.

**Phase 3 — Recipe discovery, details and favourites: implemented.** Authenticated users can search and filter TheMealDB recipes, view full recipe details and manage per-user Firestore favourites. Meal planning and shopping lists remain future phases.

## Project structure

```text
src/
  app/
    App.tsx
    providers/        AuthProvider, AuthContext/useAuth, ThemeProvider/useTheme
    router/           AppRouter and route-guard tests
  components/
    shared/           Logo, ThemeToggle
    ui/               Button, Input, Card, LoadingSpinner
  features/
    auth/             login, registration, password recovery, auth services and validation
    dashboard/        introductory dashboard and future-feature placeholders
    landing/           LandingPage and separate page-section components
    profile/          profile read and edit page
    recipes/          TheMealDB catalogue, normalized recipes, details, and Firestore favourites
  layouts/
    AppLayout/        responsive private app shell
    PublicLayout/     public route outlet
  services/firebase/
    config.ts         single Firebase app initialization, env validation, and lazy Auth/Firestore instances
    firestore.ts      user profile document operations
  services/themealdb/
    config.ts         centralized development API URL and query construction
  styles/
    globals.css
    variables.css
  test/setup.ts
  main.tsx
firestore.rules
.env.example
```

## Firebase setup

1. The provided Firebase web app values are now stored in the ignored `.env.local` file. `.env.example` documents the four required variable names for other developers. Analytics is not initialized because Phase 2 does not use it.
2. In Firebase Console, enable **Email/Password** and **Google** under Authentication → Sign-in method. Add `localhost` and the production host to Authentication → Settings → Authorized domains.
3. Create/select the Cloud Firestore database.
4. Open Firestore → Rules, replace the editor with the contents of `firestore.rules`, and click Publish. The rules have not been deployed by this project change.
5. Restart Vite after editing `.env.local`.

The recipe catalogue uses TheMealDB's public development key (`1`) configured centrally in `src/services/themealdb/config.ts`. It is intended for development and education; replace it with an appropriately licensed production configuration before release. No API credential is required for local development.

Firebase app initialization is centralized and guarded against duplicate app initialization. The config module exposes lazy Auth and Firestore instance getters; private pages and auth features are route/code split. With missing env values, public pages still work and auth pages display a setup message.

## Routes and auth flow

- Public: `/`, `/login`, `/register`, `/forgot-password`.
- Private: `/dashboard`, `/recipes`, `/recipes/:id`, `/favorites`, `/profile`.
- A Firebase auth-state listener resolves the initial session before route guards redirect. Private-route redirects retain the requested pathname for post-login navigation. Signed-in visitors to login/registration are sent to the dashboard.
- Email/password registration validates display name, email, password (8+ characters with upper/lower case and a number), and confirmation; it sets the Auth display name and creates `users/{uid}` with server timestamps.
- Email/password login, Google popup login, logout, and password reset use Firebase Authentication. First-time Google sign-in creates a user document only when one does not already exist.
- Profile edits update Auth and Firestore. Email changes reauthenticate with the current password or a Google popup before calling Firebase `updateEmail`; Firestore synchronization errors are surfaced rather than reported as a successful profile save.
- Firebase owns session persistence; auth state is not stored in local storage. The separate theme preference remains persisted in local storage across routes.

## Firestore user documents and favourites

`users/{uid}` contains `uid`, `displayName`, `email`, `provider`, `createdAt`, and `updatedAt`. `users/{uid}/favorites/{mealId}` stores only `id`, `name`, `thumbnail`, `category`, `area`, and `savedAt`; recipe instructions and ingredients remain sourced from TheMealDB. Passwords and auth secrets are never written to Firestore. `firestore.rules` restricts profile and favourites access to the matching authenticated UID and validates document fields. Rules are prepared in the repository and must be published in the Firebase Console; changing the local rules file does not deploy it.

## Recipe API and normalization

`features/recipes/services/recipeApi.ts` owns fetch behavior, request cancellation, empty responses, HTTP/JSON errors, and TheMealDB endpoints. `utils/normalizeRecipe.ts` maps raw API records to app types and walks ingredient/measure slots 1–20, trimming values while preserving order and source measurements. Search is debounced and latest requests are aborted. Category, area, and single-ingredient filters run individually because the free API does not support combined filters. The API does not provide pagination for these workflows. Recipe imagery is served by TheMealDB; original source/video/licensing metadata is only shown when supplied.

To deploy the updated rules, open Firebase Console → Firestore Database → Rules, replace the editor contents with this repository's `firestore.rules`, and publish them. Favourites will return permission errors until the update is deployed.

## Design and interface

The Phase 1 palette and typography remain in `src/styles/variables.css`; the existing landing layout and copy are preserved in modular sections. Shared Button/Input/Card/LoadingSpinner, Logo, and ThemeToggle components support new pages. Lucide React supplies interface icons. The private shell becomes a slide-over navigation on mobile; auth pages and dashboard/profile forms use the same warm palette, typography, focus states, and light/dark theme.

## Validation

Run `npm run build`, `npm run lint`, and `npm test`.

Recipe normalization and API response tests have been added using mocked API requests. In this environment `npm run build`, `npm test`, and `npm run lint` could not start: the managed Node/npm commands exited immediately with `shim integrity check failed`; the alternate Node runner blocks `node:process`, which Vite/Vitest require. Direct requests to TheMealDB also failed from the restricted network environment. As a result, this phase still needs build/test execution in a normal project shell and live API verification. Firestore favourites need integration verification against Firebase or an Emulator; successful account lifecycle checks require an authorized test account. No Firebase Emulator configuration is present.

Dependencies added in Phase 2: `firebase`, `react-router-dom`, `lucide-react`, `vitest`, `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom`.

## Known limitations and next phase

- The dashboard's meal-plan and shopping-list cards are illustrative placeholders.
- Firebase sign-in providers, authorized domains, Firestore database, and deployed rules still need verification in Firebase Console.
- Profile email changes use Firebase’s immediate `updateEmail` API after reauthentication; Firebase may reject the operation for account or project policy reasons, and those errors are surfaced.
- The free TheMealDB key is development/education access, and the API does not offer combined filters or pagination here.
- Firestore rules must be published in Firebase Console before favourites work for users.
- Meal planning, ingredient aggregation, and shopping lists remain future work.

Phase 4 can add the weekly meal planner, using the recipe catalogue as the source of selectable recipes. Shopping-list aggregation remains out of scope until explicitly planned.
