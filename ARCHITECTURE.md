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

## Routes

Public routes are `/`, `/login`, `/register`, and `/forgot-password`. Authenticated routes include `/dashboard`, `/recipes`, `/recipes/:id`, `/favorites`, and `/profile`, all rendered inside `AppLayout`.

## Styling and dependencies

Feature styles use CSS Modules and consume the global CSS custom properties in `styles/variables.css`. Lucide React is the icon source. The API integration adds no dependencies.
