/**
 * Typed API errors with stable machine-readable codes (see docs/specs/parlays-and-same-game-parlays.md).
 */
export class PredictionRejectedError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly httpStatus: number = 400
  ) {
    super(message)
    this.name = 'PredictionRejectedError'
  }
}
