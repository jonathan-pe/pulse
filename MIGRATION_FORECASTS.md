# Migration to NatStat Forecasts Endpoint

## Summary

The Pulse ingestion system has been migrated from using three separate NatStat endpoints (moneyline, pointspread, overunder) to a single unified `/forecasts` endpoint that provides all markets in one response.

## Benefits

1. **Single API Call**: Reduced from 3 API calls to 1 per league/date
2. **Unified Data**: All odds markets guaranteed to be from the same snapshot
3. **More Metadata**: Access to game status, scores, venue info, ELO ratings
4. **Score Ingestion**: Automatically capture final scores for completed games
5. **Better Performance**: Fewer API requests = faster ingestion and lower rate limit usage

## Changes Made

### Files Modified

#### `apps/api/src/integrators/natstat/client.ts`

- ✅ Added `loadForecasts()` function for the new endpoint
- ⚠️ Deprecated `loadMarket()` (retained for backward compatibility)

#### `apps/api/src/integrators/natstat/normalize.ts`

- ✅ Added `normalizeForecasts()` to parse unified forecast response
- ✅ Extended `NormalizedEvent` type to include status and scores
- ⚠️ Deprecated `normalizeMarket()` (retained for backward compatibility)

#### `apps/api/src/jobs/ingest-natstat.ts`

- ✅ Completely rewritten to use `loadForecasts()` and `normalizeForecasts()`
- ✅ Added support for date ranges ("YYYY-MM-DD,YYYY-MM-DD")
- ✅ Added score ingestion to `Result` table
- ✅ Improved error handling (continue on failure, log per-date errors)
- ✅ Enhanced return statistics (dates processed, scores updated)

#### `apps/api/src/integrators/natstat/__tests__/normalize.test.ts`

- ✅ Added comprehensive test suite for `normalizeForecasts()`
- ✅ Tests cover: all markets, partial data, missing data, league normalization

### Files Created

#### `docs/NATSTAT_FORECASTS.md`

- Complete documentation of the new integration
- Usage examples, API reference, troubleshooting guide

## API Endpoint Format

**Old (deprecated):**

```text
GET https://api3.natst.at/{API_KEY}/moneyline/{league}/{date}
GET https://api3.natst.at/{API_KEY}/pointspread/{league}/{date}
GET https://api3.natst.at/{API_KEY}/overunder/{league}/{date}
```

**New:**

```text
GET https://api3.natst.at/{API_KEY}/forecasts/{league}/{date}
```

## League Code Mapping

The system automatically maps standard league codes to NatStat-specific codes:

| Standard | NatStat | Sport |
|----------|---------|-------|
| NFL | pfb | Pro Football |
| NBA | nba | Basketball |
| MLB | mlb | Baseball |
| NHL | nhl | Hockey |

## Data Flow

### Before

```text
loadMarket('moneyline') ─┐
loadMarket('spread')     ├─→ normalizeMarket() ─→ merge by identity ─→ upsert
loadMarket('overunder')  ┘
```

### After

```text
loadForecasts() ─→ normalizeForecasts() ─→ upsert (already unified)
```

## Database Changes

### New Behavior

**Game Status Updates:**

- Games are created with `status = 'scheduled'`
- Status is updated to 'Final', 'Q4 1:14', etc. as reported by NatStat

**Score Ingestion:**

- When a game has `gamestatus: 'Final'` and scores are present
- System automatically creates/updates `Result` record
- Enables automatic settlement of predictions

**No Schema Changes Required:**

- Uses existing `Game`, `GameOdds`, and `Result` tables
- Composite unique keys prevent duplicates

## Breaking Changes

### None

The migration is **fully backward compatible**:

- Old `loadMarket()` and `normalizeMarket()` functions still exist (deprecated)
- All environment variables remain the same
- Database schema unchanged
- Admin API endpoint signature unchanged

## Migration Path

### For Production

**No action required.** The system will automatically use the new endpoint on next deployment.

### For Existing Data

No migration needed. The new ingestion will:

- Match existing games by unique key `(league, startsAt, homeTeam, awayTeam)`
- Update odds as new data arrives
- Add scores for completed games

### Testing Migration

```bash
# Test with current day's data
curl -X POST http://localhost:4000/admin/ingest-natstat \
  -H "x-cron-token: $CRON_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"league":"NFL"}'

# Verify results
# - Check logs for "datesProcessed", "events", "games", "oddsLines", "scoresUpdated"
# - Query database to confirm games, odds, and scores
```

## Rollback Plan

If issues arise, rollback is simple:

1. Revert `jobs/ingest-natstat.ts` to use old implementation
2. Keep using the old `loadMarket()` calls
3. The deprecated functions remain available

No database changes needed since schema is unchanged.

## Performance Impact

### Expected Improvements

- **API Calls**: Reduced by 67% (3 calls → 1 call per league/date)
- **Ingestion Time**: 40-50% faster (parallelization overhead eliminated)
- **Rate Limits**: 67% less API quota consumption
- **Data Consistency**: Guaranteed same-snapshot odds across all markets

### Monitoring

Watch for:

- Reduced API error rates (fewer opportunities for individual market failures)
- Faster job completion times
- Lower rate limit warnings from NatStat

## Known Limitations

1. **Historical Data**: The `/forecasts` endpoint may have different historical data availability than individual market endpoints. If ingesting very old dates, verify data exists.

2. **Spread/Total Prices**: The forecasts endpoint typically does not include "juice" (prices) for spreads and totals. If needed in the future, may require supplemental calls.

3. **League Availability**: Ensure the league code is supported by the forecasts endpoint. Not all sports may be available via forecasts.

## Future Enhancements

Opportunities enabled by richer forecast data:

- [ ] **ELO-Based Insights**: Show win probability based on ELO ratings
- [ ] **Line Movement Tracking**: Use `moneylinemovement` and `moneylinedrift` fields
- [ ] **Simulation Predictions**: Display NatStat's AI predictions alongside odds
- [ ] **Venue Context**: Show neutral site games differently
- [ ] **Historical Accuracy**: Track prediction performance over time

## Support

For issues or questions:

1. Check logs for error messages (correlation ID in metadata)
2. Review documentation: `docs/NATSTAT_FORECASTS.md`
3. Test with CLI: `pnpm --filter @pulse/api ingest <date> <league>`
4. Verify environment variables are set correctly

## Changelog

### v2.0.0 - NatStat Forecasts Migration

**Added:**

- Unified `/forecasts` endpoint integration
- Automatic score ingestion for completed games
- Game status tracking
- Date range support for batch ingestion
- Enhanced error reporting per date

**Changed:**

- Primary ingestion method from 3 endpoints to 1
- League code normalization (PFB → NFL automatic)

**Deprecated:**

- `loadMarket()` function (still available)
- `normalizeMarket()` function (still available)

**Fixed:**

- Race conditions from parallel market API calls
- Inconsistent data from non-atomic market fetches
