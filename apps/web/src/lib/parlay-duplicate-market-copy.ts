/**
 * User-facing copy for parlay / SGP duplicate-market rules (see docs/specs/parlays-and-same-game-parlays.md).
 */
export const PARLAY_COPY = {
  pendingSingle:
    'You already have this pick as a single. Pulse scores points, not separate bets like a sportsbook—one open pick per market.',
  gameLocked: 'This game has already started.',
  alreadyInSlip: 'This pick is already on your slip.',
  submitConflict:
    'That market is already used elsewhere. Pulse allows one open pick per game and market so points are not double-counted.',
} as const
