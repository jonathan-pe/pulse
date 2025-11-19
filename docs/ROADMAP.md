# Pulse Feature Roadmap

This document tracks implemented features, in-progress work, and planned enhancements for the Pulse sports prediction platform.

---

## 🎯 Core Features (Implemented)

### ✅ Prediction System
- [x] Create predictions on games (moneyline, spread, over/under)
- [x] Lock predictions at game start time
- [x] Store odds snapshot at prediction time
- [x] Support unlimited baseline tier predictions
- [x] Support first 5 daily bonus tier predictions
- [x] Track prediction history per user

### ✅ Point Scoring System
- [x] Probability-based point calculation (10 × 100/ImpliedProbability)
- [x] Flat streak bonuses for bonus tier (10/25/50/100 points)
- [x] Three-tier system (baseline/bonus/diminishing returns)
- [x] Automatic correctness determination (ML/spread/total)
- [x] Points ledger with transaction history
- [x] User streak tracking (consecutive correct predictions)
- [x] Diminishing returns after 30 predictions (50% at 31-75, 0% at 76+)

**Documentation:** 
- `apps/api/docs/AUTO_SCORING.md`
- `.github/instructions/overview.instructions.md`

### ✅ Game Data Ingestion
- [x] NatStat API integration for odds and scores
- [x] Support for MLB, NBA, NFL, NHL leagues
- [x] Moneyline, spread, and over/under odds
- [x] Automatic game result ingestion
- [x] Team data synchronization
- [x] Historical data backfill CLI (`ingest-historical`)

**Documentation:**
- `.github/instructions/natstat.instructions.md`
- `apps/api/docs/ESPN_INTEGRATOR.md`

### ✅ Automated Scoring
- [x] Auto-score games when results are ingested from NatStat
- [x] Admin endpoints for manual scoring
- [x] CLI commands for batch scoring
- [x] Idempotent scoring (safe to run multiple times)
- [x] Error isolation (scoring failures don't break ingestion)

**Commands:**
```bash
pnpm --filter @pulse/api ingest <league>           # Ingest with auto-scoring
pnpm --filter @pulse/api ingest-historical NBA 7    # Backfill 7 days
pnpm --filter @pulse/api score-games                # Manual batch scoring
```

### ✅ Authentication & User Management
- [x] Clerk authentication integration
- [x] User profile creation
- [x] Session management
- [x] Protected routes (API and web)

### ✅ Database & ORM
- [x] PostgreSQL database
- [x] Prisma ORM with type-safe queries
- [x] Migration system
- [x] Database seeding
- [x] Composite unique indexes for idempotency

**Models:**
- User, Prediction, Game, GameOdds, Result, Team, PointsLedger, NatStatTeam

---

## 🚧 In Progress

### Admin Dashboard
- [ ] View all users and their stats
- [ ] Manually set game results
- [ ] View prediction analytics
- [ ] System health monitoring

### Leaderboards
- [ ] Global leaderboard (all-time points)
- [ ] Monthly leaderboard (reset each month)
- [ ] Weekly leaderboard
- [ ] Friends leaderboard
- [ ] Streak leaderboard

---

## 📋 Planned Features

### High Priority

#### User Experience Enhancements
- [ ] **Hedge Detection Warning** 🎯 *Added from discussion*
  - Detect when user makes opposing picks on same game
  - Show UI warning: "Hedging reduces expected points by ~12% and breaks streaks"
  - Display EV comparison: "Making independent picks gives 20 EV vs hedge 17.5 EV"
  - Allow users to proceed but educate them on suboptimal strategy
  - Track hedge behavior for analytics
  - **Location:** `apps/web/src/features/predictions/` (when user selects game/market)
  - **API:** New endpoint `POST /predictions/check-hedge` or client-side check
  
#### Push Handling
- [ ] Treat spread/total pushes as void (preserve streak, no points)
  - Currently pushes count as incorrect predictions
  - Should return `null` for `isCorrect` instead of `false`
  - Preserve user streak on pushes
  - Log pushes separately from wins/losses

#### Stricter Odds Validation
- [ ] Require odds to be captured at prediction time
  - Fail prediction creation if odds are missing
  - Remove fallback `-110` defaults
  - Ensure fair point calculation

#### Live Odds Updates
- [ ] Real-time odds updates before game start
  - WebSocket or polling for odds changes
  - Update UI when lines move
  - Show line movement history (optional visual)

### Medium Priority

#### Social Features
- [ ] Follow other users
- [ ] Friends system
- [ ] Private leagues/groups
- [ ] Social feed of friends' predictions (after lock)
- [ ] Comments on games
- [ ] Share predictions (after lock)

#### Advanced Prediction Types
- [ ] Parlays (combine multiple games)
- [ ] Same Game Parlays (SGP)
  - Combine different markets on same game
  - Adjusted odds calculation
- [ ] Alternate spreads/totals
  - Store multiple line options per game
  - User selects specific spread (e.g., -10.5 at +140 vs -7.5 at -110)
- [ ] Team totals (over/under for one team)
- [ ] First half/quarter lines
- [ ] Player props (when available from data provider)

#### Points & Rewards
- [ ] Achievement badges
  - "5-game streak", "Perfect week", "Underdog hunter"
  - Display on user profile
- [ ] Daily challenges
  - "Pick 3 underdogs today for bonus 20 points"
  - "Hit 75% win rate this week"
- [ ] Seasonal rewards (cosmetic only, no cash/prizes)
- [ ] Profile customization (themes, avatars)

#### Analytics & Insights
- [ ] Personal statistics dashboard
  - Win rate by league, market type, odds range
  - Best/worst days of week
  - ROI analysis (points per prediction)
  - Streak history chart
- [ ] Game predictions analytics
  - Show community consensus (% picking each side)
  - Show sharpest picks (high-confidence underdogs)
- [ ] Export prediction history (CSV)

### Low Priority / Future Considerations

#### Multi-Provider Odds
- [ ] Integrate additional odds providers (FanDuel, DraftKings APIs)
- [ ] Best-line selection (show best odds across providers)
- [ ] Source attribution (show which book has best line)

#### Line Movement Tracking
- [ ] Historical odds snapshots (append-only table)
- [ ] Line movement charts
- [ ] Steam moves detection (sudden line changes)
- [ ] Reverse line movement alerts

#### Mobile App
- [ ] React Native app (iOS/Android)
- [ ] Push notifications for:
  - Game about to lock
  - Prediction results
  - Streak milestones
  - Friends' activity

#### International Expansion
- [ ] Support for international sports (soccer, cricket, etc.)
- [ ] European odds format (decimal)
- [ ] Fractional odds format (UK)
- [ ] Multi-language support

#### Circuit Breakers & Reliability
- [ ] Provider health checks
- [ ] Auto-backoff on repeated failures
- [ ] Fallback to cached odds if provider down
- [ ] Alert system for admin (Slack, PagerDuty)

#### Advanced Admin Tools
- [ ] Feature flags system (enable/disable features per user)
- [ ] A/B testing framework
- [ ] User segmentation for experiments
- [ ] Manual odds override (emergency use)
- [ ] Bulk user operations

---

## 🔬 Research & Exploration

These are ideas that need more investigation before committing to implementation:

- **Machine Learning Predictions**: Train model on historical data, show "AI pick" alongside odds
- **Consensus Fading**: Bonus points for picking against heavy public consensus (requires betting percentages data)
- **Live In-Play Betting**: Real-time odds during games (much higher complexity)
- **Virtual Currency**: Allow users to "bet" virtual coins for additional engagement
- **Tournaments**: Time-boxed competitions with prizes (legal review required)
- **Affiliate Integration**: Link to legal sportsbooks (monetization strategy)

---

## 📊 Metrics to Track

### User Engagement
- Daily/monthly active users
- Predictions per user per day
- Retention (Day 1, Day 7, Day 30)
- Session duration

### Prediction Quality
- Overall win rate
- Win rate by market type (ML/spread/total)
- Win rate by odds range (favorites vs underdogs)
- Streak distribution (how many users hit 5+ streaks)

### System Health
- Ingestion success rate
- Auto-scoring success rate
- API response times
- Error rates by endpoint

### Feature Adoption
- % of users using bonus tier slots
- % of predictions in each tier
- Hedge detection frequency
- Average predictions per user

---

## 🚀 Release Planning

### Version 1.0 (MVP) - Current
- Core prediction system
- Auto-scoring
- Basic leaderboards
- Clerk authentication

### Version 1.1 - Next Quarter
- Hedge detection warning
- Push handling improvements
- Admin dashboard
- Enhanced leaderboards (monthly, friends)

### Version 1.2 - Future
- Social features (follow, leagues)
- Advanced prediction types (parlays)
- Personal analytics dashboard
- Achievement badges

### Version 2.0 - Long Term
- Mobile app
- Multi-provider odds
- Live odds updates
- International sports

---

## 📝 Technical Debt & Improvements

- [ ] Add comprehensive test coverage (target 80%+)
  - Unit tests for scoring logic
  - Integration tests for ingestion
  - E2E tests for critical user flows
- [ ] Add OpenTelemetry for distributed tracing
- [ ] Set up proper logging aggregation (Datadog, LogRocket)
- [ ] Add API rate limiting per user
- [ ] Add request validation middleware
- [ ] Optimize database queries (add indexes where needed)
- [ ] Add Redis for caching (odds, leaderboards)
- [ ] Set up proper CI/CD pipeline
- [ ] Add staging environment
- [ ] Document all API endpoints (OpenAPI/Swagger)

---

## 🔐 Compliance & Legal

- [ ] Terms of Service finalization
- [ ] Privacy Policy (GDPR, CCPA)
- [ ] Age verification (18+)
- [ ] Responsible gaming resources
- [ ] Legal review for each US state (gambling laws vary)
- [ ] Clarify "no real money, no prizes" prominently
- [ ] Data retention and deletion policies

---

## 📚 Documentation Needed

- [ ] User guide (how to play)
- [ ] FAQ (common questions about scoring, streaks, etc.)
- [ ] API documentation (for potential future API consumers)
- [ ] Deployment guide (production setup)
- [ ] Runbook (incident response, common issues)
- [ ] Architecture decision records (ADRs)

---

## Version History

- **v0.1.0** (2024-11-18): Initial implementation with core prediction system, auto-scoring, NatStat integration
- **Roadmap created**: 2024-11-18

---

## Contributing

When adding new features:
1. Update this roadmap (move from Planned → In Progress → Implemented)
2. Add documentation in `apps/*/docs/` or `.github/instructions/`
3. Update relevant instruction files if architecture changes
4. Add tests for new functionality
5. Update CHANGELOG.md with user-facing changes

---

*Last updated: November 18, 2024*
