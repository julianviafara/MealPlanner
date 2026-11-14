import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { RecipeCatalogPage } from './RecipeCatalogPage'
import { RecipeDetailsPage } from './RecipeDetailsPage'
import { useAuth } from '../../../app/providers/useAuth'
import { getAreas, getCategories, getIngredients, getRecipeById, searchRecipes } from '../services/recipeApi'
import { getFavorites, removeFavorite, saveFavorite } from '../services/favoritesService'

vi.mock('../../../app/providers/useAuth', () => ({ useAuth: vi.fn() }))
vi.mock('../services/recipeApi', () => ({
  filterRecipesByArea: vi.fn(), filterRecipesByCategory: vi.fn(), filterRecipesByIngredient: vi.fn(),
  getAreas: vi.fn(), getCategories: vi.fn(), getIngredients: vi.fn(), getRandomRecipe: vi.fn(),
  getRecipeById: vi.fn(), searchRecipes: vi.fn(),
}))
vi.mock('../services/favoritesService', () => ({ getFavorites: vi.fn(), removeFavorite: vi.fn(), saveFavorite: vi.fn() }))

const mockAuth = vi.mocked(useAuth)
const mockSearch = vi.mocked(searchRecipes)
const mockGetRecipeById = vi.mocked(getRecipeById)
const mockGetFavorites = vi.mocked(getFavorites)
const recipeSummary = { id: 'meal-42', name: 'Garden Pasta', thumbnail: 'https://images.test/pasta.jpg', category: 'Pasta', area: 'Italian' }
const detail = {
  ...recipeSummary, instructions: 'Boil pasta. Add vegetables.',
  ingredients: [{ name: 'Pasta', measure: '200 g' }], tags: [], youtubeUrl: null, sourceUrl: null, creativeCommonsConfirmed: null,
}

function setSignedInUser() {
  mockAuth.mockReturnValue({ user: { uid: 'test-user' }, status: 'authenticated', loading: false, configured: true } as ReturnType<typeof useAuth>)
}

afterEach(() => { cleanup(); vi.clearAllMocks() })

describe('recipe page interactions', () => {
  it('searches after the input settles and opens the matching recipe detail', async () => {
    setSignedInUser()
    vi.mocked(getCategories).mockResolvedValue([])
    vi.mocked(getAreas).mockResolvedValue([])
    vi.mocked(getIngredients).mockResolvedValue([])
    mockGetFavorites.mockResolvedValue([])
    mockSearch.mockResolvedValue([recipeSummary])
    mockGetRecipeById.mockResolvedValue(detail)
    render(<MemoryRouter initialEntries={['/recipes']}><Routes>
      <Route path="/recipes" element={<RecipeCatalogPage />} />
      <Route path="/recipes/:id" element={<RecipeDetailsPage />} />
    </Routes></MemoryRouter>)

    fireEvent.change(screen.getByRole('textbox', { name: 'Search recipes by name' }), { target: { value: 'garden pasta' } })
    await waitFor(() => expect(mockSearch).toHaveBeenCalledWith('garden pasta', expect.any(AbortSignal)))
    fireEvent.click(await screen.findByRole('link', { name: 'View Garden Pasta' }))
    expect(await screen.findByRole('heading', { name: 'Garden Pasta' })).toBeInTheDocument()
    expect(screen.getByText('200 g')).toBeInTheDocument()
    expect(mockGetRecipeById).toHaveBeenCalledWith('meal-42', expect.any(AbortSignal))
  })

  it('shows the empty search state and can save then remove a favourite', async () => {
    setSignedInUser()
    vi.mocked(getCategories).mockResolvedValue([])
    vi.mocked(getAreas).mockResolvedValue([])
    vi.mocked(getIngredients).mockResolvedValue([])
    mockGetFavorites.mockResolvedValue([])
    mockSearch.mockResolvedValue([])
    render(<MemoryRouter initialEntries={['/recipes']}><RecipeCatalogPage /></MemoryRouter>)
    fireEvent.change(screen.getByRole('textbox', { name: 'Search recipes by name' }), { target: { value: 'missing dish' } })
    await waitFor(() => expect(mockSearch).toHaveBeenCalledWith('missing dish', expect.any(AbortSignal)))
    expect(await screen.findByRole('heading', { name: 'No recipes found' })).toBeInTheDocument()

    mockSearch.mockResolvedValue([recipeSummary])
    fireEvent.change(screen.getByRole('textbox', { name: 'Search recipes by name' }), { target: { value: 'garden pasta' } })
    const favoriteButton = await screen.findByRole('button', { name: 'Save to favourites' })
    vi.mocked(saveFavorite).mockResolvedValue(undefined)
    fireEvent.click(favoriteButton)
    await waitFor(() => expect(saveFavorite).toHaveBeenCalledWith('test-user', recipeSummary))
    expect(screen.getByRole('button', { name: 'Remove from favourites' })).toBeInTheDocument()
    vi.mocked(removeFavorite).mockResolvedValue(undefined)
    fireEvent.click(screen.getByRole('button', { name: 'Remove from favourites' }))
    await waitFor(() => expect(removeFavorite).toHaveBeenCalledWith('test-user', 'meal-42'))
  })
})
