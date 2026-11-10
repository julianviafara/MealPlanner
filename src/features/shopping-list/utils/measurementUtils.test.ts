import { describe, expect, it } from 'vitest'
import { formatGeneratedMeasure, formatUnit, parseMeasurement } from './measurementUtils'

describe('parseMeasurement', () => {
  it.each([
    ['2 cups', { quantity: 2, unit: 'cup' }],
    ['1.5 tbsp', { quantity: 1.5, unit: 'tbsp' }],
    ['1/2 tsp', { quantity: 0.5, unit: 'tsp' }],
    ['1 1/2 cups', { quantity: 1.5, unit: 'cup' }],
    ['200g', { quantity: 200, unit: 'g' }],
    ['0.25 kilograms', { quantity: 0.25, unit: 'kg' }],
    ['300 millilitres', { quantity: 300, unit: 'ml' }],
    ['2 pcs', { quantity: 2, unit: 'piece' }],
    ['3 cloves', { quantity: 3, unit: 'clove' }],
    ['2', { quantity: 2, unit: null }],
  ])('parses %s', (value, expected) => expect(parseMeasurement(value)).toEqual(expected))

  it.each(['', 'To taste', 'A pinch', 'A handful', 'Some', 'about 2 cups', '1/0 tsp', '.5 cup', '2 large'])('does not parse ambiguous or nonnumeric measure %s', (value) => {
    expect(parseMeasurement(value)).toBeNull()
  })

  it('formats normalized quantities without unnecessary conversions', () => {
    expect(formatGeneratedMeasure(3, 'cup', ['1 cup', '2 cups'])).toBe('3 cups')
    expect(formatGeneratedMeasure(500, 'g', ['200g', '300g'])).toBe('500 g')
    expect(formatGeneratedMeasure(null, null, ['To taste', ' to   taste '])).toBe('To taste')
    expect(formatGeneratedMeasure(null, null, [''])).toBe('No quantity specified')
    expect(formatUnit('ml', 2)).toBe('ml')
  })
})
