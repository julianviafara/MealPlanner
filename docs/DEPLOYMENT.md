# Deployment preparation

The repository is prepared for Firebase Hosting, but no deployment has been performed and no project alias is configured. `firebase.json` serves Vite's `dist/` output, rewrites app routes to `index.html`, applies long-lived immutable caching to fingerprinted `/assets/`, avoids caching the app shell, and points Firebase CLI at `firestore.rules`.

Use Node.js 24.15.x or 26+ for local and CI builds. The npm lockfile currently resolves Firebase, jsdom, and Undici releases whose declared engine requirements exceed Node 22.12.

## Staging

1. Create or select a dedicated staging Firebase project. Enable the required Authentication providers, create Firestore, add the staging hosting domain to authorized domains, and publish the repository's rules.
2. Set `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID` in the staging build environment. These are client configuration values, not server secrets. Do not provide service-account JSON to Vite.
3. From a trusted shell, install Firebase CLI if needed and run:

   ```sh
   npm ci
   npm run lint
   npm run typecheck
   npm test
   npm run build
   npx firebase-tools hosting:channel:deploy staging --project YOUR_STAGING_PROJECT_ID
   ```

4. Verify the preview URL, direct-refresh routing (`/recipes`, `/recipes/:id`, `/planner`, `/shopping-list`), auth providers, Firestore ownership, and browser console/network behavior.

## Production

Confirm TheMealDB access is appropriate for public production use; the current API key is explicitly the free development/education key. Configure the production Firebase web-app values and authorized host, verify Firestore rules, and complete staging checks. Then, only with repository-owner authorization:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx firebase-tools deploy --only hosting --project YOUR_PRODUCTION_PROJECT_ID
```

The repository intentionally has no `.firebaserc`, so project selection is explicit on each command. This avoids accidentally targeting a live project. CI validates code only; it does not deploy or receive Firebase deployment credentials.
