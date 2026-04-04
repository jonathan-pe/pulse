// Vitest setup file for web app
// Stable local calendar keys in date-grouping tests (group-games-by-local-day).
process.env.TZ = 'UTC'

import '@testing-library/jest-dom'

// Example: Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})
