# MealPlanner development

## Phase status

**Phase 1 — Public landing page and design system: complete.**

**Phase 2 — Application architecture and Firebase Authentication: implemented; successful account-flow verification still needs a test account and Firebase Console setup.** The app now has feature-oriented routes/layouts, Firebase Auth and Firestore integration, profile editing, a protected dashboard foundation, and owner-only Firestore rules. No recipe catalogue, meal planning, or shopping-list logic has been started.

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
  layouts/
    AppLayout/        responsive private app shell
    PublicLayout/     public route outlet
  services/firebase/
    config.ts         single Firebase app initialization, env validation, and lazy Auth/Firestore instances
    firestore.ts      user profile document operations
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

Firebase app initialization is centralized and guarded against duplicate app initialization. The config module exposes lazy Auth and Firestore instance getters; private pages and auth features are route/code split. With missing env values, public pages still work and auth pages display a setup message.

## Routes and auth flow

- Public: `/`, `/login`, `/register`, `/forgot-password`.
- Private: `/dashboard`, `/profile`.
- A Firebase auth-state listener resolves the initial session before route guards redirect. Private-route redirects retain the requested pathname for post-login navigation. Signed-in visitors to login/registration are sent to the dashboard.
- Email/password registration validates display name, email, password (8+ characters with upper/lower case and a number), and confirmation; it sets the Auth display name and creates `users/{uid}` with server timestamps.
- Email/password login, Google popup login, logout, and password reset use Firebase Authentication. First-time Google sign-in creates a user document only when one does not already exist.
- Profile edits update Auth and Firestore. Email changes reauthenticate with the current password or a Google popup before calling Firebase `updateEmail`; Firestore synchronization errors are surfaced rather than reported as a successful profile save.
- Firebase owns session persistence; auth state is not stored in local storage. The separate theme preference remains persisted in local storage across routes.

## Firestore user documents

`users/{uid}` contains `uid`, `displayName`, `email`, `provider`, `createdAt`, and `updatedAt`. Passwords and auth secrets are never written to Firestore. `firestore.rules` restricts reads and writes to the matching authenticated UID, validates the profile shape and email claim, protects UID/provider/creation time, requires server timestamps, and denies deletes. Rules are prepared in the repository and must still be published in the Firebase Console.

## Design and interface

The Phase 1 palette and typography remain in `src/styles/variables.css`; the existing landing layout and copy are preserved in modular sections. Shared Button/Input/Card/LoadingSpinner, Logo, and ThemeToggle components support new pages. Lucide React supplies interface icons. The private shell becomes a slide-over navigation on mobile; auth pages and dashboard/profile forms use the same warm palette, typography, focus states, and light/dark theme.

## Validation

Run `npm run build`, `npm run lint`, and `npm test`.

The implemented local suite covers auth service behavior with Firebase SDK mocks, email/password validation, auth error mapping, public registration/login validation, private-route redirects, guest-route redirects, and initial-auth loading behavior. A browser smoke test confirmed that Firebase Auth responds to the configured project: an intentionally nonexistent synthetic account was rejected with the expected invalid-credentials message. No account or Firestore document was created. No Firebase Emulator configuration is present, and the Firebase Console providers/rules have not been confirmed. Successful registration/login, Google popup, password reset delivery, profile writes/email changes, and logout still require an authorized test account and manual verification against the Firebase project.

Dependencies added in Phase 2: `firebase`, `react-router-dom`, `lucide-react`, `vitest`, `jsdom`, `@testing-library/react`, and `@testing-library/jest-dom`.

## Known limitations and next phase

- The dashboard's meal-plan and shopping-list cards are illustrative placeholders.
- Firebase sign-in providers, authorized domains, Firestore database, and deployed rules still need verification in Firebase Console.
- Profile email changes use Firebase’s immediate `updateEmail` API after reauthentication; Firebase may reject the operation for account or project policy reasons, and those errors are surfaced.
- TheMealDB catalogue, recipe details, favorites, meal planning, ingredient aggregation, and shopping lists remain future work.

After Firebase configuration is verified, the next product phase can implement recipe discovery and its normalized recipe model, without beginning meal-planning or shopping-list functionality until authorized.
