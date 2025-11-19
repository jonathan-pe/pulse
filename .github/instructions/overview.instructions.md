---
applyTo: '**'
---

**Pulse** (this application) is a gamified sports prediction platform where users can engage in daily predictions of real-world sporting events. By leveraging sportsbook odds, the app offers a fun and competitive environment for sports enthusiasts to test their prediction skills. Users can earn points for correct predictions, participate in streak challenges, and compete on leaderboards—all without any real money, gambling, or prizes involved, ensuring compliance with laws and regulations.

## Features

- Predict outcomes of sporting events with real-time sportsbook odds.
- Earn points based on odds, streaks, and upsets for correct predictions.
- Participate in daily capped bonus predictions for higher rewards.
- Unlimited predictions for casual engagement, with baseline point earnings.
- Anti-abuse mechanisms to maintain a fair and competitive environment.

## Point Scoring System

#### **Core Principles**

1. **Reward-Based System**: Points are only awarded for correct predictions. No points are deducted for incorrect predictions.
2. **Probability-Based Fairness**: Points scale inversely with implied win probability, ensuring equal expected value across all odds ranges.
3. **Skill Rewarding**: Consistent prediction accuracy is rewarded through streak bonuses.
4. **Daily Engagement**: Users are encouraged to return daily through bonus tier opportunities.

#### **Points Calculation**

**Base Points Formula (All Tiers):**

Points are calculated using implied probability to ensure mathematical fairness:

```
Implied Probability:
- For favorites (negative odds): |odds| / (|odds| + 100) × 100
- For underdogs (positive odds): 100 / (odds + 100) × 100

Base Points = 10 × (100 / Implied Probability)
```

**Examples:**

- **-500 (83% favorite)**: 10 × (100/83.3) = **12 points**
- **-200 (67% favorite)**: 10 × (100/66.7) = **15 points**
- **-110 (52% favorite)**: 10 × (100/52.4) = **19 points**
- **+150 (40% underdog)**: 10 × (100/40.0) = **25 points**
- **+300 (25% underdog)**: 10 × (100/25.0) = **40 points**
- **+700 (12.5% underdog)**: 10 × (100/12.5) = **80 points**

This ensures that **expected value is equal** for all picks: a 75% favorite giving 13 points has the same expected value (9.75) as a 12.5% longshot giving 80 points (10.0).

#### **Points Tiers**

1. **Baseline Tier (Unlimited)**:
   - **Unlimited Predictions**: Users can make as many predictions as they want daily.
   - **Points**: Base points only (using formula above).
   - **No Bonuses**: Pure expected value calculation encourages volume and experimentation.
2. **Bonus Tier (First 5 Daily)**:
   - **Daily Cap**: First 5 predictions created each day (by timestamp).
   - **Enhanced Rewards**:
     - Base points (using formula above)
     - Flat streak bonuses (rewards consistency)
   - **Eligibility**: Determined at prediction creation time. Replacements inherit the original prediction's tier status.
3. **Diminishing Returns Tier**:
   - **Predictions 1-30**: 100% of points
   - **Predictions 31-75**: 50% of points
   - **Predictions 76+**: 0 points
   - **Purpose**: Soft cap discourages excessive volume while remaining forgiving.

#### **Streak Bonuses (Bonus Tier Only)**

Flat bonuses added to base points for consecutive correct predictions:

- **2-win streak**: +10 points
- **3-win streak**: +25 points
- **4-win streak**: +50 points
- **5+ win streak**: +100 points (capped)

**Streak Rules:**

- Applies only to Bonus Tier predictions
- Resets to 0 on any incorrect prediction
- Bonus is added to the prediction that extends the streak
- All users receive equal streak bonuses regardless of odds picked

**Example:** User on 2-win streak correctly picks -150 favorite:

- Base points: 17
- Streak bonus: +10
- **Total: 27 points**

#### **Tier Determination**

**Bonus Tier Eligibility:**

- First 5 predictions created each day (UTC, by `createdAt` timestamp)
- If a user replaces a prediction (changes pick on same game/type), the replacement inherits the original's tier status
- Once a bonus slot is used, it cannot be reclaimed even if the prediction is deleted

#### **Balance & Fairness**

The system is designed to ensure equal expected value across all strategies:

- **Expected Value Calculation**: `Win_Rate × Points_Per_Win`
- **Heavy Favorites (-300)**: 0.75 × 13 = 9.75 EV per pick
- **Balanced Pick'em (+100)**: 0.50 × 20 = 10.0 EV per pick
- **Longshot Underdogs (+700)**: 0.125 × 80 = 10.0 EV per pick

This mathematical fairness means:

- Players cannot "game" the system by only picking favorites or underdogs
- Leaderboard rankings reflect prediction accuracy, not strategy exploitation
- All risk/reward profiles are viable and competitive

**30-Day Simulation Results (5 bonus picks/day):**

- Heavy Favorite Player (-300 avg, 75% win rate): ~1,740 points
- Balanced Player (mixed picks, 50% win rate): ~1,950 points
- Moderate Underdog Player (+225 avg, 33% win rate): ~1,775 points
- Pure Longshot Player (+700 avg, 13% win rate): ~1,920 points

The balanced player wins slightly due to strategic diversification and moderate streak opportunities.

#### **Anti-Abuse Measures**

- **Diminishing Returns**: Soft cap at 30 predictions (50% points), hard cap at 75 (0 points)
- **Tier Status Lock**: Bonus tier eligibility fixed at prediction creation, cannot be manipulated
- **Rate-Limiting**: Limits on how frequently predictions can be made
- **Bot Detection**: Behavioral monitoring flags potential abuse patterns

## Future Features

- Live/Automatic Odd Updates
- Parlays/Same Game Parlays
- International Price Formats

## Documentation

- When creating documentation, ensure to include each doc in the appropriate `/docs` directory for easy access.
- READMEs can exist at the root level of each app or library for general overview and setup instructions.
