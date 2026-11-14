import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ShoppingListPage } from './ShoppingListPage'
import { useAuth } from '../../../app/providers/useAuth'
import { useShoppingList } from '../hooks/useShoppingList'
import type { ShoppingListData } from '../types/shoppingList.types'

vi.mock('../../../app/providers/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../hooks/useShoppingList', () => ({ useShoppingList: vi.fn() }))

const mockUseAuth = vi.mocked(useAuth)
const mockUseShoppingList = vi.mocked(useShoppingList)
const generatedItem = {
  itemId: 'generated_milk_cup', type: 'generated' as const, name: 'Milk', normalizedName: 'milk',
  quantity: 3, unit: 'cup', originalMeasures: ['1 cup', '2 cups'], sourceRecipeIds: ['recipe-1'],
  sourceRecipeNames: ['Pancakes'], isPurchased: false,
}
const manualItem = { itemId: 'manual-1', type: 'manual' as const, name: 'Coffee', note: '', isPurchased: false }
const meal = { mealId: 'meal-1', date: '2026-11-16', recipeId: 'recipe-1', recipeName: 'Pancakes', recipeThumbnail: '' }
const list: ShoppingListData = {
  weekStartDate: '2026-11-16', sourceMealPlanUpdatedAt: 100, generatedAt: 100,
  items: [generatedItem, manualItem],
}
const addItem = vi.fn(async () => undefined)
const regenerate = vi.fn(async () => undefined)
const setPurchased = vi.fn(async () => undefined)

function renderShoppingList() {
  mockUseAuth.mockReturnValue({ user: { uid: 'test-user' }, status: 'authenticated', loading: false, configured: true } as ReturnType<typeof useAuth>)
  mockUseShoppingList.mockReturnValue({
    list, plannedMeals: [meal], planUpdatedAt: 100, loading: false, error: '',
    refresh: vi.fn(async () => undefined), regenerate, addItem, editItem: vi.fn(async () => undefined),
    removeItem: vi.fn(async () => undefined), setPurchased,
  })
  return render(<MemoryRouter><ShoppingListPage /></MemoryRouter>)
}

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('shopping list page interactions', () => {
  it('renders generated and manual items, updates purchase state, and regenerates', async () => {
    renderShoppingList()
    expect(screen.getByText('3 cups')).toBeInTheDocument()
    expect(screen.getByText('Used in: Pancakes')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mark Milk as purchased' }))
    await waitFor(() => expect(setPurchased).toHaveBeenCalledWith(generatedItem, true))
    fireEvent.click(screen.getByRole('button', { name: 'Update shopping list' }))
    await waitFor(() => expect(regenerate).toHaveBeenCalledOnce())
  })

  it('submits a manual item from the list page and links empty weeks to the planner', async () => {
    renderShoppingList()
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    fireEvent.change(screen.getByLabelText('Item name'), { target: { value: 'Olive oil' } })
    fireEvent.change(screen.getByLabelText('Quantity or note (optional)'), { target: { value: '1 bottle' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add item' }))
    await waitFor(() => expect(addItem).toHaveBeenCalledWith('Olive oil', '1 bottle'))

    mockUseShoppingList.mockReturnValue({
      list: { ...list, items: [] }, plannedMeals: [], planUpdatedAt: null, loading: false, error: '',
      refresh: vi.fn(async () => undefined), regenerate, addItem, editItem: vi.fn(async () => undefined),
      removeItem: vi.fn(async () => undefined), setPurchased,
    })
    cleanup()
    render(<MemoryRouter><ShoppingListPage /></MemoryRouter>)
    expect(screen.getByRole('link', { name: /Open planner/ })).toHaveAttribute('href', '/planner')
  })
})
