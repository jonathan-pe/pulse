# API Endpoints

This document lists all the REST API endpoints available in the Pulse API.

## Base URL
- Development: `http://localhost:4000`
- Production: (Set via deployment)

## Authentication
Most endpoints require authentication via Clerk. Include the Clerk session token in the `Authorization` header:
```
Authorization: Bearer <clerk-token>
```

---

## Health

### GET /health
Check if the API is healthy.

**Response:**
```json
{
  "healthy": true
}
```

---

## Authentication

### GET /api/auth/me
Get the current authenticated user's information.

**Auth Required:** Yes

**Response:**
```json
{
  "userId": "user_123",
  "user": {
    "id": "user_123"
  }
}
```

---

## Games

### GET /api/games/upcoming
List upcoming scheduled games.

**Auth Required:** No

**Query Parameters:**
- `league` (optional): Filter by league (e.g., "MLB", "NBA", "NFL", "NHL")
- `limit` (optional): Maximum number of games to return (default: 50)

**Response:**
```json
[
  {
    "id": "game_123",
    "league": "MLB",
    "startsAt": "2024-03-20T19:00:00Z",
    "homeTeam": {
      "id": "team_1",
      "code": "BOS",
      "name": "Red Sox",
      "city": "Boston",
      "logoUrl": "https://...",
      "primaryColor": "#BD3039"
    },
    "awayTeam": { /* same structure */ },
    "status": "scheduled",
    "odds": {
      "moneyline": { "home": -150, "away": 130 },
      "spread": { "value": -1.5, "homePrice": -110, "awayPrice": -110 },
      "total": { "value": 8.5, "overPrice": -110, "underPrice": -110 }
    }
  }
]
```

### GET /api/games/:id
Get details for a specific game by ID.

**Auth Required:** No

**Response:** Same structure as individual game in `/upcoming` response, plus `result` if game is completed.

---

## Predictions

### POST /api/predictions
Create a single prediction.

**Auth Required:** Yes

**Body:**
```json
{
  "gameId": "game_123",
  "type": "MONEYLINE",
  "pick": "HOME"
}
```

**Types:** `MONEYLINE`, `SPREAD`, `TOTAL`  
**Picks:** Varies by type (e.g., "HOME"/"AWAY", "OVER"/"UNDER")

### POST /api/predictions/batch
Create multiple predictions at once (max 20).

**Auth Required:** Yes

**Body:**
```json
{
  "predictions": [
    { "gameId": "game_1", "type": "MONEYLINE", "pick": "HOME" },
    { "gameId": "game_2", "type": "SPREAD", "pick": "AWAY" }
  ]
}
```

### GET /api/predictions/daily-stats
Get daily prediction statistics for the current user.

**Auth Required:** Yes

**Response:**
```json
{
  "today": 5,
  "bonusRemaining": 3,
  "totalToday": 5
}
```

### GET /api/predictions/pending
Get pending (unlocked) predictions for the current user.

**Auth Required:** Yes

**Response:** Array of prediction objects.

### GET /api/predictions/history
Get all predictions for the current user.

**Auth Required:** Yes

**Response:** Array of prediction objects.

### GET /api/predictions/game-ids
Get game IDs that the user has already predicted on.

**Auth Required:** Yes

**Response:** Array of game ID strings.

### GET /api/predictions/by-game
Get user's predictions grouped by game and type.

**Auth Required:** Yes

**Response:**
```json
{
  "game_123": {
    "MONEYLINE": "HOME",
    "SPREAD": "AWAY"
  }
}
```

---

## Points

### GET /api/points/me
Get the current user's total points.

**Auth Required:** Yes

**Response:**
```json
{
  "points": 150
}
```

### GET /api/points/leaderboard
Get the leaderboard.

**Auth Required:** No

**Query Parameters:**
- `limit` (optional): Number of top users to return (default: 10)

**Response:**
```json
[
  {
    "userId": "user_123",
    "points": 500
  }
]
```

---

## Admin

### POST /admin/ingest-natstat
Trigger NatStat odds ingestion (protected by CRON_TOKEN).

**Auth Required:** Admin token via `x-cron-token` header or query param

**Body:**
```json
{
  "league": "MLB"
}
```

---

## Webhooks

### POST /webhooks/clerk
Handle Clerk webhooks for user lifecycle events.

**Auth Required:** Clerk webhook signature
