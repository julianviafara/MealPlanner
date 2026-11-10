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

## Shopping list feature (Phase 5)

`features/shopping-list/pages/ShoppingListPage.tsx` selects a week, presents generated recipe ingredients separately from manual items, displays progress, purchase controls, and an outdated-plan notice. The initial selected week is the next Monday-to-Sunday week. Week navigation reuses the planner's `WeekNavigation`, `getCurrentWeekStart`, and `shiftWeek` utilities.

`useShoppingList.ts` loads shopping data together with a stable meal-plan snapshot. The snapshot checks the plan's `updatedAt` before and after reading its meal subcollection and retries if it changes mid-read. Regeneration is user controlled: it fetches each unique planned recipe ID once through the existing `getRecipeById` service, then aggregates each planned meal occurrence. If any recipe details are unavailable, generation stops and leaves the saved shopping list untouched.

`utils/ingredientAggregation.ts` is deterministic and independent of React. Ingredient names are trimmed, whitespace-collapsed, and compared case-insensitively; it does not fuzzy-match. `measurementUtils.ts` accepts nonnegative integers, decimals, simple fractions, and mixed numbers with supported units (`g`, `kg`, `ml`, `l`, `cup`, `tbsp`, `tsp`, `clove`, and `piece`, plus documented spelling aliases). It only adds quantities that share the same canonical unit (or both have no unit). It never converts between units. Unknown, malformed, empty, and nonnumeric measures remain separate raw-measure groups; identical normalized raw measures may be grouped without assigning a numeric quantity.

Generated IDs encode the normalized ingredient name and parsed-unit or normalized-raw-measure group. Reconciliation upserts those IDs, preserves `isPurchased` and `createdAt` for matching generated documents, removes obsolete generated documents, and never deletes manual documents. Manual names and optional notes can be edited; purchase state is stored for both item types. Removing a generated item is allowed, though a later regeneration will add it again if the ingredient is still required.

Shopping data is stored at `users/{uid}/shoppingLists/{weekId}` with `weekStartDate`, `sourceMealPlanUpdatedAt`, `generatedAt`, and `updatedAt`. Items are documents at `items/{itemId}`. Generated documents contain a normalized name, optional numeric quantity/unit, original measurement strings, and unique source recipe IDs/names. Manual documents contain only a name, free-form optional note, purchase state, and timestamps. Rules limit every list and item to its authenticated owner.

## Routes

Public routes are `/`, `/login`, `/register`, and `/forgot-password`. Authenticated routes include `/dashboard`, `/recipes`, `/recipes/:id`, `/favorites`, `/planner`, `/shopping-list`, and `/profile`, all rendered inside `AppLayout`.

## Styling and dependencies

Feature styles use CSS Modules and consume the global CSS custom properties in `styles/variables.css`. Lucide React is the icon source. The API integration adds no dependencies.

## Development and validation

Start the app with `npm run dev`. Run `npm run lint`, `npm test`, and `npm run build` to validate changes. Planner date utilities, shopping measurement/aggregation, recipe-detail fetch deduplication, and Firestore list reconciliation have focused tests using local inputs and mocked Firebase calls. The feature uses the existing Firebase config and adds no dependencies.
