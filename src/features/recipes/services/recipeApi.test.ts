import { afterEach, describe, expect, it, vi } from 'vitest'
import { filterRecipesByArea, filterRecipesByCategory, filterRecipesByIngredient, getAreas, getCategories, getIngredients, getRandomRecipe, getRecipeById, searchRecipes, searchRecipesByLetter } from './recipeApi'

afterEach(() => vi.unstubAllGlobals())

describe('recipeApi', () => {
  it('encodes search values and treats null meals as an empty result', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ meals: null }) })
    vi.stubGlobal('fetch', fetchMock)
    expect(await searchRecipes('green curry & rice')).toEqual([])
    expect(String(fetchMock.mock.calls[0][0])).toContain('s=green+curry+%26+rice')
  })

  it('normalizes valid meal records and ignores malformed records', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ meals: [
      { idMeal: '7', strMeal: 'Pasta', strMealThumb: 'img' }, { idMeal: '', strMeal: 'broken' },
    ] }) }))
    expect(await searchRecipes('pasta')).toEqual([{ id: '7', name: 'Pasta', thumbnail: 'img', category: null, area: null }])
  })

  it('returns null for a missing detail and validates first-letter requests', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ meals: null }) })
    vi.stubGlobal('fetch', fetchMock)
    expect(await getRecipeById('invalid')).toBeNull()
    expect(await getRandomRecipe()).toBeNull()
    expect(await searchRecipesByLetter('b')).toEqual([])
    expect(String(fetchMock.mock.calls[2][0])).toContain('f=b')
    await expect(searchRecipesByLetter('ab')).rejects.toThrow('single letter')
  })

  it('uses supported single filters and list endpoints', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ meals: [] }) })
    vi.stubGlobal('fetch', fetchMock)
    await getCategories(); await getAreas(); await getIngredients()
    await filterRecipesByCategory('Side dish & sauce')
    await filterRecipesByArea('Trinidadian & Tobagonian')
    await filterRecipesByIngredient('sweet potato')
    const urls = fetchMock.mock.calls.map(([url]) => String(url))
    expect(urls[0]).toContain('c=list')
    expect(urls[1]).toContain('a=list')
    expect(urls[2]).toContain('i=list')
    expect(urls[3]).toContain('c=Side+dish+%26+sauce')
    expect(urls[4]).toContain('a=Trinidadian+%26+Tobagonian')
    expect(urls[5]).toContain('i=sweet+potato')
  })

  it('reports HTTP and malformed response errors', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }))
    await expect(searchRecipes('rice')).rejects.toThrow('503')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ meals: 'invalid' }) }))
    await expect(searchRecipes('rice')).rejects.toThrow('invalid response')
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => null }))
    await expect(searchRecipes('rice')).rejects.toThrow('invalid response')
  })
})
