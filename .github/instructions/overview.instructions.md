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
2. **Odds-Based Rewards**: The points earned scale with the difficulty of the prediction:
   - Predicting underdogs with higher odds earns more points.
   - Predicting favorites earns fewer points but still rewards consistency.
3. **Daily Engagement**: Users are encouraged to return daily through bonus opportunities.

#### **Points Tiers**

1. **Baseline Tier**:
   - **Unlimited Predictions**: Users can make as many predictions as they want daily.
   - **Points**: A fixed, small number of points (e.g., 10 points) for each correct prediction.
2. **Bonus Tier**:
   - **Daily Cap**: Up to 5 predictions per day earn bonus points.
   - **Enhanced Rewards**: Points scale with:
     - **Odds Multipliers**: Larger rewards for underdog predictions.
     - **Streak Bonuses**: Additional multipliers for maintaining correct prediction streaks.
3. **High Volume Tier**:
   - **Threshold Limit**: After 100 daily predictions, additional predictions no longer earn points.

#### **Additional Features**

- **Odds-Based Formula**:
  - **Underdog**: `(Baseline Points) * (1 + odds/100)` for positive odds.
  - **Favorite**: `(Baseline Points) * (1 - odds/100)` for negative odds.
- **Streak Bonuses**:
  - Points multipliers increase with streaks of 2 or more correct predictions.
  - Streak resets after an incorrect prediction.

#### **Anti-Abuse Measures**

- **Rate-Limiting**: Limits on how frequently predictions can be made.
- **Point Caps**: Predictions beyond the high-volume threshold earn no points.
- **Bot Detection**: Behavioral monitoring flags potential abuse.

## Future Features

- Live/Automatic Odd Updates
- Parlays/Same Game Parlays
- International Price Formats

##
