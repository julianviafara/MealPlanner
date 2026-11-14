# MealPlanner

MealPlanner is a responsive meal-planning application for discovering recipes, organizing meals across a week, and preparing a shopping list from the planned recipes.

## Contents

- [Live demo](#live-demo)
- [Screenshots](#screenshots)
- [Features](#features)
- [Technology](#technology)
- [Architecture and data model](#architecture)
- [Ingredient aggregation](#ingredient-aggregation)
- [Local development and environment](#requirements-and-local-setup)
- [Scripts and testing](#scripts-and-tests)
- [Deployment](#deployment)
- [Attribution and limitations](#attribution-and-api-limitations)
- [Project purpose and license](#project-purpose-and-future-work)

## Live demo

**Pending deployment.** No live application URL has been configured or verified.

## Screenshots

Screenshots below are from the application in this repository.

| Landing page | Recipe catalogue |
| --- | --- |
| <img src="docs/screenshots/Landing%20page.png" alt="MealPlanner landing page" width="420" /> | <img src="docs/screenshots/Recipe%20catalogue.png" alt="Recipe catalogue" width="420" /> |

| Recipe details | Weekly planner |
| --- | --- |
| <img src="docs/screenshots/Recipe%20detail.png" alt="Recipe detail" width="420" /> | <img src="docs/screenshots/Weekly%20planner.png" alt="Weekly planner" width="420" /> |

| Shopping list |
| --- |
| <img src="docs/screenshots/Shopping%20list.png" alt="Shopping list" width="420" /> |

## Features

- Email/password and Google authentication, password recovery, and protected routes.
- Recipe search, category/cuisine/ingredient browsing, recipe details, and favourites through TheMealDB.
- Flexible weekly planning with any number of recipe meals per day.
- Weekly shopping lists generated from planned recipes, conservative aggregation of compatible quantities, manual items, and persisted purchase tracking.
- Light and dark themes, responsive layouts, loading/error/empty states, a generic render-error fallback, and keyboard-accessible controls.

## Technology

| Technology | Responsibility |
| --- | --- |
| React and TypeScript | User interface and application types |
| Vite | Local development and production bundling |
| React Router | Public and protected navigation |
| Firebase Authentication | Account and session management |
| Cloud Firestore | User profiles, favourites, meal plans, and shopping lists |
| TheMealDB | External recipe data and imagery |
| CSS Modules | Feature and component styling |
| Lucide React | Interface icons |
| Vitest and React Testing Library | Unit and component/service interaction tests |
| Oxlint | Static lint checks |

## Architecture

The code is organized by product feature. Pages compose focused components and hooks; service modules own Firestore and TheMealDB requests; domain utilities normalize API data, dates, and shopping ingredients. A single Firebase configuration module supplies Auth and Firestore. Firestore paths are scoped by authenticated UID.

```text
src/
  app/                 providers and route guards
  components/          shared UI and brand components
  features/
    auth/              forms, validation, and Firebase Auth service
    landing/           public landing page sections
    recipes/           catalogue, details, favourites, API normalization
    planner/           calendar, week utilities, meal-plan service
    shopping-list/     aggregation, parsing, list service, and UI
    profile/ dashboard/
  layouts/              public and authenticated shells
  services/
    firebase/           centralized Firebase initialization and profile data
    themealdb/          API configuration
  styles/               global reset and design tokens
  test/                 Vitest setup
firestore.rules
docs/screenshots/       application screenshots
```

Firestore data is organized under `users/{uid}` and is private to that UID under `firestore.rules`. The user document stores profile metadata; `favorites/{mealId}` stores a small recipe snapshot; `mealPlans/{weekId}` stores week metadata and a `meals/{mealId}` subcollection; `shoppingLists/{weekId}` stores generation/version metadata and an `items/{itemId}` subcollection. The week ID is the Monday date in local `YYYY-MM-DD` form. See [ARCHITECTURE.md](ARCHITECTURE.md) for document fields and ownership rules.

## Ingredient aggregation

The shopping list fetches details for recipes actually scheduled in the selected week. Ingredient names are trimmed, whitespace-collapsed, and compared without regard to case. Measurements support nonnegative integers, decimals, fractions, and mixed numbers with a small allowlist of units and aliases. Quantities are summed only when both ingredient identity and canonical unit match. No unit conversions or density assumptions are made. Unknown, unstructured, and missing measurements are preserved without invented quantities. Manual items survive regeneration, and purchase status is retained for generated items that still match. See [DEVELOPMENT.md](DEVELOPMENT.md) for supported units and limitations.

## Requirements and local setup

- Node.js `24.15.x` or `26+` (satisfies the engine ranges of the locked Firebase, jsdom, and Undici dependencies).
- npm and Git.
- A Firebase project for authentication and Firestore-backed features. Public landing and recipe browsing do not require Firebase configuration, but user features do.

```sh
git clone https://github.com/julianviafara/MealPlanner.git
cd MealPlanner
npm ci
```

Copy `.env.example` to `.env.local` and provide the Firebase web-app values. In Firebase Console, enable Email/Password and Google providers, create Firestore, authorize local/hosting domains, and publish this repository's `firestore.rules`. Do not use a Firebase Admin service-account key in this frontend project. Vite `VITE_` variables are embedded in client code and must not contain private credentials.

```sh
npm run dev
```

TheMealDB development key is currently centralized in `src/services/themealdb/config.ts`; the free key is for development and educational use. Public production use needs an appropriately licensed API configuration.

## Environment variables

See [.env.example](.env.example). The application currently reads these required Firebase values:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`

The app does not currently read storage bucket, messaging sender, analytics, or a TheMealDB environment variable. Do not add unused settings as if they were active configuration.

## Scripts and tests

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite development server |
| `npm run lint` | Run Oxlint |
| `npm run typecheck` | Run TypeScript project checks |
| `npm test` | Run Vitest unit and component/service tests |
| `npm run test:unit` | Run isolated business-logic tests |
| `npm run test:integration` | Run React Testing Library and service interaction tests |
| `npm run build` | Type-check and create `dist/` production output |
| `npm run preview` | Preview the production build locally |

See [docs/TESTING.md](docs/TESTING.md) for test boundaries and repeatable manual checks. Tests mock external API and Firebase operations; they do not write to production user data. Playwright and Firebase Emulator tests are not configured because the required packages and emulator setup are not available in this checkout. CI runs unit and integration test scripts separately.

## Deployment

Firebase Hosting configuration is provided in `firebase.json` with a React Router SPA rewrite. Set the four Firebase environment values in the build environment, then build and deploy to a staging project/channel before production:

```sh
npm ci
npm run lint
npm run typecheck
npm test
npm run build
npx firebase-tools hosting:channel:deploy staging --project YOUR_STAGING_PROJECT_ID
```

For production, first verify the target project, environment values, Authentication domains/providers, and deployed Firestore rules. Then run:

```sh
npx firebase-tools deploy --only hosting --project YOUR_PRODUCTION_PROJECT_ID
```

No Firebase project alias or live deployment is included in this repository. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Do not deploy without approval from the project owner.

## Attribution and API limitations

Recipe data and imagery are provided by [TheMealDB](https://www.themealdb.com/). See its [API documentation](https://www.themealdb.com/api.php) and confirm applicable access and licensing terms before public deployment. MealPlanner does not claim ownership of third-party recipes or images. Recipe ingredient measures are free-form source data; aggregation is limited to tested matching units and does not certify nutrition or dietary suitability.

## Project purpose and future work

MealPlanner was developed as a software engineering portfolio project. Potential future work includes end-to-end browser tests against isolated Firebase emulators, once emulator and browser tooling are provisioned. Grocery ordering, pricing, nutrition, and shared household lists are not implemented.

## License

No license file is present. The project owner should choose and add a license before granting reuse rights; until then, reuse permissions are not explicitly granted.
