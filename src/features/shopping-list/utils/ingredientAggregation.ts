import type { Recipe } from '../../recipes/types/recipe.types'
import type { PlannedMeal } from '../../planner/types/mealPlan.types'
import type { GeneratedIngredient } from '../types/shoppingList.types'
import { normalizeRawMeasure, parseMeasurement } from './measurementUtils'

interface IngredientGroup {
  identity: string
  name: string
  normalizedName: string
  quantity: number | null
  unit: string | null
  originalMeasures: string[]
  recipeIds: Set<string>
  recipeNames: Set<string>
}

export function normalizeIngredientName(name: string): string {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

function safeItemId(identity: string): string {
  return `generated_${encodeURIComponent(identity)}`
}

function compareText(a: string, b: string): number {
  return a.localeCompare(b, 'en', { sensitivity: 'base' }) || a.localeCompare(b)
}

export function aggregatePlannedIngredients(
  plannedMeals: PlannedMeal[],
  recipes: ReadonlyMap<string, Pick<Recipe, 'id' | 'name' | 'ingredients'>>,
): GeneratedIngredient[] {
  const groups = new Map<string, IngredientGroup>()

  for (const plannedMeal of plannedMeals) {
    const recipe = recipes.get(plannedMeal.recipeId)
    if (!recipe) continue
    for (const ingredient of recipe.ingredients) {
      const displayName = ingredient.name.trim().replace(/\s+/g, ' ')
      const normalizedName = normalizeIngredientName(displayName)
      if (!normalizedName) continue
      const originalMeasure = ingredient.measure
      const parsed = parseMeasurement(originalMeasure)
      const measureIdentity = parsed ? `numeric:${parsed.unit ?? 'unitless'}` : `unparsed:${normalizeRawMeasure(originalMeasure)}`
      const identity = `${normalizedName}|${measureIdentity}`
      let group = groups.get(identity)
      if (!group) {
        group = {
          identity, name: displayName, normalizedName,
          quantity: parsed ? 0 : null, unit: parsed?.unit ?? null,
          originalMeasures: [], recipeIds: new Set(), recipeNames: new Set(),
        }
        groups.set(identity, group)
      }
      group.originalMeasures.push(originalMeasure)
      group.recipeIds.add(recipe.id)
      group.recipeNames.add(recipe.name.trim())
      if (parsed && group.quantity !== null) group.quantity += parsed.quantity
    }
  }

  return [...groups.values()].map((group) => ({
    itemId: safeItemId(group.identity),
    name: group.name,
    normalizedName: group.normalizedName,
    quantity: group.quantity === null ? null : Number(group.quantity.toFixed(6)),
    unit: group.unit,
    originalMeasures: [...group.originalMeasures].sort(compareText),
    sourceRecipeIds: [...group.recipeIds].sort(compareText),
    sourceRecipeNames: [...group.recipeNames].sort(compareText),
  })).sort((a, b) => a.normalizedName.localeCompare(b.normalizedName) || a.itemId.localeCompare(b.itemId))
}
