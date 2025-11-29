---
applyTo: '**'
---

**Pulse** (this application) is a gamified sports prediction platform where users can engage in daily predictions of real-world sporting events. By leveraging sportsbook odds, the app offers a fun and competitive environment for sports enthusiasts to test their prediction skills. Users can earn points for correct predictions, unlock achievements and badges, and compete on leaderboards—all without any real money, gambling, or prizes involved, ensuring compliance with laws and regulations.

## Features

- Predict outcomes of sporting events with real-time sportsbook odds.
- Earn points based purely on prediction difficulty (probability-based scoring).
- Participate in daily capped bonus predictions for higher rewards.
- Unlimited predictions for casual engagement, with baseline point earnings.
- Unlock achievements and badges for milestones, streaks, and accomplishments.
- Anti-abuse mechanisms to maintain a fair and competitive environment.

## Point Scoring System

#### **Core Principles**

1. **Reward-Based System**: Points are only awarded for correct predictions. No points are deducted for incorrect predictions.
2. **Probability-Based Fairness**: Points scale inversely with implied win probability, ensuring equal expected value across all odds ranges.
3. **Pure Skill-Based Scoring**: Points awarded based solely on prediction difficulty, with no bonuses or multipliers.
4. **Daily Engagement**: Users are encouraged to return daily through bonus tier opportunities and cosmetic achievements.

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

#### **Tier Determination**

**Bonus Tier Eligibility:**

- First prediction created each day (UTC, by `createdAt` timestamp)
- Bonus tier prediction receives a **1.5x point multiplier** before diminishing returns
- If a user replaces a prediction (changes pick on same game/type), the replacement inherits the original's tier status
- Once the bonus slot is used, it cannot be reclaimed even if the prediction is deleted

**Bonus Tier Examples:**

- Pick -200 favorite in bonus tier: 15 base × **1.5** = 22.5 points (before diminishing returns)
- Pick -200 favorite in baseline tier: 15 base × 1.0 = 15 points (before diminishing returns)
- Pick +300 underdog in bonus tier: 40 base × **1.5** = 60 points (before diminishing returns)

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

**30-Day Simulation Results (1 bonus pick/day with 1.5x multiplier):**

- Heavy Favorite Player (-300 avg, 75% win rate): ~1,950 points
- Balanced Player (mixed picks, 50% win rate): ~1,950 points
- Moderate Underdog Player (+225 avg, 33% win rate): ~1,950 points
- Pure Longshot Player (+700 avg, 13% win rate): ~1,950 points

All strategies produce equal expected value due to pure probability-based scoring. The bonus tier multiplier encourages daily engagement without creating dailies fatigue.

#### **Anti-Abuse Measures**

- **Diminishing Returns**: Soft cap at 30 predictions (50% points), hard cap at 75 (0 points)
- **Tier Status Lock**: Bonus tier eligibility fixed at prediction creation, cannot be manipulated
- **Rate-Limiting**: Limits on how frequently predictions can be made
- **Bot Detection**: Behavioral monitoring flags potential abuse patterns

## Achievements & Progression

**Achievements are cosmetic rewards** that recognize player accomplishments without affecting point scoring. They provide goals, bragging rights, and profile customization.

#### **Achievement Types**

1. **Streak Achievements**

   - Track consecutive correct predictions (bonus tier only)
   - Unlock badges at milestones: 2, 5, 10, 25, 50, 100+ correct predictions
   - Broken streaks don't penalize points, only reset achievement progress

2. **Milestone Achievements**

   - Total predictions made (volume-based)
   - Total points earned (cumulative)
   - Perfect days (all predictions correct)
   - Accuracy milestones (75%+ win rate over X predictions)

3. **League Expertise**

   - Master badges for high accuracy in specific leagues
   - Multi-sport achievements for engagement across leagues
   - Underdog specialist (high win rate on +200 or longer)

4. **Social & Competitive**
   - Leaderboard rankings (Top 10, Top 100, etc.)
   - Seasonal achievements
   - Community milestones (when platform reaches X users)

#### **Achievement Display**

- **Profile Badge Showcase**: Users can display 3-5 earned badges on their profile
- **Trophy Case**: Full collection view with progress toward locked achievements
- **Rarity Tiers**: Common, Rare, Epic, Legendary (based on difficulty/completion %)
- **Progress Tracking**: Visual indicators showing progress toward next achievement

#### **Streak Tracking (Cosmetic Only)**

While streaks no longer affect point scoring, they remain tracked for achievements:

- **Current Streak**: Consecutive correct bonus tier predictions
- **Longest Streak**: Personal best ever achieved
- **Streak Badges**: Unlock cosmetic rewards at streak milestones
- **Streak Resets**: Only affect achievement progress, not points

This design keeps the engaging aspects of streaks (goals, milestones, bragging rights) while maintaining mathematically fair point scoring.

## Future Features

### Under Consideration

- **Daily/Weekly Challenges**: Themed objectives with bonus point rewards
  - Example: "Pick an underdog (+150+) today" or "Make predictions in 3 different leagues"
  - Could include seasonal challenges (playoff-themed, rivalry games)
  - Weekly goals with progressive rewards for consistent participation
- **Social Prediction Pools**: Create or join group competitions with friends
- **Confidence System**: Daily confidence units to allocate across predictions

### Planned Features

- Live/Automatic Odd Updates
- Parlays/Same Game Parlays
- International Price Formats

## Documentation

- When creating documentation, ensure to include each doc in the appropriate `/docs` directory for easy access.
- READMEs can exist at the root level of each app or library for general overview and setup instructions.
