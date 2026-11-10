export interface GeneratedShoppingItem {
  itemId: string
  type: 'generated'
  name: string
  normalizedName: string
  quantity: number | null
  unit: string | null
  originalMeasures: string[]
  sourceRecipeIds: string[]
  sourceRecipeNames: string[]
  isPurchased: boolean
  createdAt?: unknown
  updatedAt?: unknown
}

export interface ManualShoppingItem {
  itemId: string
  type: 'manual'
  name: string
  note: string
  isPurchased: boolean
  createdAt?: unknown
  updatedAt?: unknown
}

export type ShoppingItem = GeneratedShoppingItem | ManualShoppingItem

export interface ShoppingListData {
  weekStartDate: string
  sourceMealPlanUpdatedAt: unknown | null
  generatedAt: unknown | null
  updatedAt?: unknown
  items: ShoppingItem[]
}

export interface GeneratedIngredient {
  itemId: string
  name: string
  normalizedName: string
  quantity: number | null
  unit: string | null
  originalMeasures: string[]
  sourceRecipeIds: string[]
  sourceRecipeNames: string[]
}
