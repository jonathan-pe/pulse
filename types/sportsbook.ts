export interface Sportsbook {
  id: string
  name: string
  state: string | null
  country: string | null
  fantasy: boolean
  sgp: boolean
  clone: {
    id: string
    name: string
    state: string | null
    country: string | null
  } | null
}
