# MealPlanner architecture

## Application layers

- `app/` owns providers and route composition. `RequireAuth` protects the authenticated app shell.
- `layouts/` contains shared public and authenticated navigation.
- `components/` contains general purpose UI controls.
- `features/` groups pages, components, types, hooks, and service logic by product capability.
- `services/` contains infrastructure shared across features, including the single Firebase app and TheMealDB configuration.

## Recipes feature (Phase 3)

`features/recipes/services/recipeApi.ts` is the only layer that fetches TheMealDB. Its request helper handles abort signals, HTTP and invalid JSON/payload errors, and normalizes null meal arrays to empty arrays. `utils/normalizeRecipe.ts` converts API records into the application's `Recipe`, `RecipeSummary`, and `Ingredient` types. UI components never receive raw API records.

`RecipeCatalogPage` owns search, exclusive server filters, random discovery, and local favorite state. Search requests are debounced and aborted when superseded. The free API filters are mutually exclusive: one name search or one category, area, or ingredient query is sent at a time. `RecipeDetailsPage` retrieves a complete recipe by ID. `RecipeGrid`, `RecipeCard`, and `FavoriteButton` are reused by catalogue and saved-recipe pages.

`favoritesService.ts` uses the existing Firebase initialization from `services/firebase/config.ts`. It stores a compact snapshot at `users/{uid}/favorites/{mealId}` with no duplicated ingredient or instruction data. Security rules authorize only the matching authenticated user and disallow updates, preserving a create-once/remove model. Deploy the repository's `firestore.rules` from Firebase Console before using favourites against the hosted database.

## Weekly planner feature (Phase 4)

`features/planner/pages/WeeklyPlannerPage.tsx` composes the week controls and calendar. `useWeeklyPlan.ts` loads the selected week and updates in-memory state only after Firestore operations succeed. `mealPlanService.ts` contains Firestore access and uses transactions for add, change, and remove operations; it writes one meal document at a time and updates the parent week's timestamps without fetching the full meal collection.

`dateUtils.ts` treats date strings as local calendar dates. It constructs dates from numeric year/month/day parts at local noon rather than parsing `YYYY-MM-DD` as UTC. Week IDs are the local date of Monday, and `shiftWeek` moves by seven calendar days so month changes, year boundaries, and leap days work naturally. The recipe selector calls the existing `searchRecipes` API service and stores only TheMealDB's recipe ID, name, and thumbnail on a planned meal.

Firestore documents are stored at `users/{uid}/mealPlans/{weekId}` with `weekStartDate`, `createdAt`, and `updatedAt`. Each child at `meals/{mealId}` has its own ID, local `date`, `recipeId`, `recipeName`, `recipeThumbnail`, `createdAt`, and `updatedAt`. A new document reference supplies a unique meal ID, so the same recipe can be added multiple times. Existing owner-only profile and favourites rules remain; meal plan and meal rules validate their shapes and require the owner UID.

The calendar is a seven-column grid on wide screens, three/two columns on narrower tablet widths, and a vertical list on mobile. Each day renders exactly the meals stored for its date; there are no meal-time slots or count limits. The planner can be opened from `/planner` and from the dashboard. Recipe cards link to the existing `/recipes/:id` details route.

## Routes

Public routes are `/`, `/login`, `/register`, and `/forgot-password`. Authenticated routes include `/dashboard`, `/recipes`, `/recipes/:id`, `/favorites`, `/planner`, and `/profile`, all rendered inside `AppLayout`.

## Styling and dependencies

Feature styles use CSS Modules and consume the global CSS custom properties in `styles/variables.css`. Lucide React is the icon source. The API integration adds no dependencies.

## Development and validation

Start the app with `npm run dev`. Run `npm run lint`, `npm test`, and `npm run build` to validate changes. Planner date utilities and Firestore service operations have focused tests using local dates and mocked Firebase calls; the app uses the existing Firebase config and requires no additional dependencies.
