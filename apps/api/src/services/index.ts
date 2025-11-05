export { gamesService, GamesService } from './games.service.js'
export type { GameInput, GameUpdateInput, GameScoreInput } from './games.service.js'

export { oddsService, OddsService } from './odds.service.js'
export type { OddsLineInput, Market } from './odds.service.js'

export { oddsAggregationService, OddsAggregationService } from './odds-aggregation.service.js'

export { predictionsService, PredictionsService } from './predictions.service.js'
export type {
  CreatePredictionInput,
  CreatePredictionsResult,
  PredictionValidationError,
} from './predictions.service.js'
