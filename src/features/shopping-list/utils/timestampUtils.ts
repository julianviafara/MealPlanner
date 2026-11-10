export function timestampKey(value: unknown): string | null {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return `date:${value.getTime()}`
  if (typeof value === 'number') return `number:${value}`
  if (typeof value !== 'object') return String(value)
  if ('seconds' in value && 'nanoseconds' in value) return `timestamp:${String(value.seconds)}:${String(value.nanoseconds)}`
  const timestamp = value as { toMillis?: () => number }
  return typeof timestamp.toMillis === 'function' ? `millis:${timestamp.toMillis()}` : null
}
