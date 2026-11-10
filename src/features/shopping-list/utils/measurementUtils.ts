export interface ParsedMeasurement {
  quantity: number
  unit: string | null
}

const UNIT_ALIASES: Readonly<Record<string, string>> = {
  g: 'g', gram: 'g', grams: 'g',
  kg: 'kg', kilogram: 'kg', kilograms: 'kg',
  ml: 'ml', milliliter: 'ml', milliliters: 'ml', millilitre: 'ml', millilitres: 'ml',
  l: 'l', liter: 'l', liters: 'l', litre: 'l', litres: 'l',
  cup: 'cup', cups: 'cup',
  tbsp: 'tbsp', tbs: 'tbsp', tablespoon: 'tbsp', tablespoons: 'tbsp', 'table spoon': 'tbsp', 'table spoons': 'tbsp',
  tsp: 'tsp', teaspoon: 'tsp', teaspoons: 'tsp', 'tea spoon': 'tsp', 'tea spoons': 'tsp',
  clove: 'clove', cloves: 'clove',
  piece: 'piece', pieces: 'piece', pc: 'piece', pcs: 'piece',
}

function parseNumber(value: string): number | null {
  const token = value.trim()
  if (token.includes('/')) {
    const parts = token.split(/\s+/)
    const fraction = parts[parts.length - 1]
    const [numeratorText, denominatorText] = fraction.split('/')
    const numerator = Number(numeratorText)
    const denominator = Number(denominatorText)
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) return null
    const fractionValue = numerator / denominator
    const whole = parts.length === 2 ? Number(parts[0]) : 0
    if (!Number.isFinite(whole)) return null
    return whole + fractionValue
  }
  const number = Number(token)
  return Number.isFinite(number) ? number : null
}

export function parseMeasurement(measure: string): ParsedMeasurement | null {
  const value = measure.trim().replace(/\s+/g, ' ')
  const match = /^(\d+\s+\d+\/\d+|\d+\/\d+|\d+(?:\.\d+)?)(?:\s*(.*))$/.exec(value)
  if (!match) return null
  const quantity = parseNumber(match[1])
  if (quantity === null) return null
  const rawUnit = (match[2] ?? '').trim().toLowerCase().replace(/\s+/g, ' ')
  if (!rawUnit) return { quantity, unit: null }
  const unit = UNIT_ALIASES[rawUnit]
  return unit ? { quantity, unit } : null
}

export function formatQuantity(quantity: number): string {
  if (Number.isInteger(quantity)) return String(quantity)
  return String(Number(quantity.toFixed(6)))
}

export function formatUnit(unit: string | null, quantity: number): string {
  if (!unit) return ''
  if (['g', 'kg', 'ml', 'l', 'tbsp', 'tsp'].includes(unit)) return unit
  return Math.abs(quantity) === 1 ? unit : `${unit}s`
}

export function formatGeneratedMeasure(quantity: number | null, unit: string | null, originals: string[]): string {
  if (quantity !== null) return [formatQuantity(quantity), formatUnit(unit, quantity)].filter(Boolean).join(' ')
  const unique = [...new Map(originals.map((measure) => [measure.trim().replace(/\s+/g, ' ').toLowerCase(), measure.trim()])).values()]
  return unique.filter(Boolean).join(' · ') || 'No quantity specified'
}

export function normalizeRawMeasure(measure: string): string {
  return measure.trim().replace(/\s+/g, ' ').toLowerCase()
}
