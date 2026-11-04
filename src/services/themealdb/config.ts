const API_ROOT = 'https://www.themealdb.com/api/json/v1'
const DEVELOPMENT_KEY = '1'

/** The free key is for development and education; configure a licensed production key before launch. */
export const THEMEALDB_BASE_URL = `${API_ROOT}/${DEVELOPMENT_KEY}`

export function mealDbUrl(endpoint: string, params: Record<string, string> = {}): string {
  const url = new URL(`${THEMEALDB_BASE_URL}/${endpoint}`)
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value)
  return url.toString()
}
