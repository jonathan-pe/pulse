// NatStat timestamps are provided in EDT by default. Parse several common
// incoming shapes and convert them to a UTC ISO string so the frontend can
// translate times consistently.
//
// Notes:
// - The provider sends times in Eastern time (EDT) by default. We append
//   a fixed -04:00 offset when none is present so the value is parsed as
//   Eastern and then converted to UTC. This matches the provider note that
//   times are in EDT by default.
// - Accepts strings like "2025-08-30 19:15:00", ISO strings with offsets,
//   numeric timestamps (seconds or milliseconds), and Date objects.
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

    // Append EDT offset. NatStat notes times are in EDT by default, so use -04:00.
    // This keeps parsing deterministic and avoids relying on server-local TZ.
    const sWithOffset = s + '-04:00'
    const d = new Date(sWithOffset)
    if (isNaN(d.getTime())) return null
    return d.toISOString()
  }

  // Unknown input type
  return null
}
