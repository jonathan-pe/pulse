/**
 * Parse NatStat timestamps (which are in Eastern Time) and convert to UTC ISO string.
 * Uses Intl.DateTimeFormat to automatically handle DST transitions.
 *
 * Accepts:
 * - Strings like "2025-08-30 19:15:00" (treated as America/New_York timezone)
 * - ISO strings with timezone offsets (parsed as-is)
 * - Numeric timestamps (seconds or milliseconds)
 * - Date objects
 */
export function natstatToUtcISOString(value: unknown): string | null {
  if (value == null) return null

  // Date objects -> toISOString directly
  if (value instanceof Date) {
    if (isNaN(value.getTime())) return null
    return value.toISOString()
  }

  // Numeric timestamps: allow seconds (10-digit) or milliseconds
  if (typeof value === 'number') {
    const ms = value < 1e12 ? value * 1000 : value // seconds -> ms
    const d = new Date(ms)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  }

  if (typeof value === 'string') {
    let s = value.trim()
    if (!s) return null

    // If the string already contains a timezone designator (Z or ±hh or ±hh:mm),
    // parse it as-is and return the normalized ISO string.
    const hasTZ = /(?:Z|[+-]\d{2}(?::?\d{2})?)$/i.test(s)
    if (hasTZ) {
      const d = new Date(s)
      if (isNaN(d.getTime())) return null
      return d.toISOString()
    }

    // Normalize common separators
    s = s.replace(' ', 'T')

    // If only date provided, add midnight time
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) s = s + 'T00:00:00'

    // If time provided without seconds (YYYY-MM-DDTHH:MM), append seconds
    if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(s)) s = s + ':00'

    // Convert Eastern time to UTC using a two-step process:
    // 1. Parse the string in UTC (append 'Z')
    // 2. Find what that UTC time displays as in ET
    // 3. Calculate the offset and apply it
    
    // Parse the input string as if it were UTC
    const asUtc = new Date(s + 'Z')
    if (isNaN(asUtc.getTime())) return null
    
    // See what this UTC time displays as in Eastern timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    
    const etDisplay = formatter.format(asUtc)
    // etDisplay format: "MM/DD/YYYY, HH:mm:ss"
    
    // Parse the components from our original input
    const match = s.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/)
    if (!match) return null
    const [, year, month, day, hour, minute, second] = match
    
    // Parse the components from the ET display
    const etMatch = etDisplay.match(/^(\d{2})\/(\d{2})\/(\d{4}), (\d{2}):(\d{2}):(\d{2})$/)
    if (!etMatch) return null
    const [, etMonth, etDay, etYear, etHour, etMinute, etSecond] = etMatch
    
    // Calculate how many hours/minutes/seconds we need to adjust
    const inputMs = Date.UTC(+year, +month - 1, +day, +hour, +minute, +second)
    const etMs = Date.UTC(+etYear, +etMonth - 1, +etDay, +etHour, +etMinute, +etSecond)
    
    // The difference is the offset we need to apply
    const offset = inputMs - etMs
    
    // Apply the offset to the UTC interpretation
    const correctUtc = new Date(asUtc.getTime() + offset)
    
    if (isNaN(correctUtc.getTime())) return null
    return correctUtc.toISOString()
  }

  // Unknown input type
  return null
}
