# ADR-002: External CRON Service for Scheduled Jobs

## Status

**Accepted** - Implemented on 2025

## Context

Pulse requires regular automated execution of two critical tasks:

1. **Game Ingestion** - Fetches game schedules, odds, and results from NatStat API (needs frequent execution during active seasons)
2. **Team Sync** - Updates team metadata including logos and codes (needs infrequent execution before each season)

Initially, GitHub Actions was considered for scheduled workflows, but this approach had limitations:

- GitHub Actions has usage limits on free/paid tiers
- Workflow minutes count toward repository quotas
- Requires repository maintenance for cron configuration
- Limited flexibility for runtime schedule adjustments

### Decision Drivers

- Need reliable, frequent execution (every 15-30 minutes during games)
- Want to preserve GitHub Actions minutes for CI/CD
- Require simple schedule management without code changes
- Need cost-effective solution for multiple leagues/schedules

## Decision

Use **cron-job.org** (external free CRON service) to schedule and trigger Pulse API endpoints for:

1. **Game Ingestion** - POST to `/admin/ingest-natstat` every 15-30 minutes
2. **Team Sync** - POST to `/admin/sync-teams` once per season before league start

### Key Implementation Details

- API endpoints protected by `x-cron-token` header authentication
- Separate jobs per league (NFL, NBA, MLB, NHL) for independent scheduling
- JSON request bodies specify league and optional date ranges
- Jobs can be enabled/disabled seasonally to conserve API quota

### Alternatives Considered

| Option                                    | Rejected Because                                        |
| ----------------------------------------- | ------------------------------------------------------- |
| GitHub Actions scheduled workflows        | Consumes repository minutes, less flexible scheduling   |
| In-process Node.js schedulers (node-cron) | Requires always-running process, no observability       |
| AWS EventBridge                           | Over-engineered, requires AWS account and configuration |
| Railway/Vercel native crons               | Platform lock-in, limited free tier                     |

## Consequences

### Positive

- ✅ **Zero infrastructure cost** - Free tier supports all Pulse needs
- ✅ **Simple schedule management** - Update schedules via web UI without code changes
- ✅ **Built-in monitoring** - Dashboard shows execution history and failures
- ✅ **Seasonal flexibility** - Enable/disable jobs per league season
- ✅ **Preserved GitHub Actions** - Repository minutes saved for CI/CD
- ✅ **No server state** - Stateless API calls, no persistent scheduler process

### Negative

- ⚠️ **External dependency** - Relies on cron-job.org availability
- ⚠️ **Manual configuration** - Jobs must be configured in external UI
- ⚠️ **No version control** - Schedule changes not tracked in git
- ⚠️ **Limited retry logic** - Relies on service's retry capabilities

### Neutral

- 📋 **Migration path available** - Can switch to other services with minimal changes
- 📋 **Backup mechanism** - Manual triggers available via CLI and API
- 📋 **Monitoring required** - Must set up failure notifications

## Setup Guide

### Step 1: Create an Account

1. Go to [cron-job.org](https://cron-job.org)
2. Click **"Sign Up"** and create a free account
3. Verify your email

### Step 2: Create Game Ingestion Jobs

You'll create one job per league. Here's how:

#### Create NFL Ingestion Job

1. Click **"CREATE CRONJOB"**
2. Fill in the details:

| Field               | Value                                          |
| ------------------- | ---------------------------------------------- |
| **Title**           | Pulse - Ingest NFL Games                       |
| **URL**             | `https://YOUR_API_URL/admin/ingest-natstat`    |
| **Schedule**        | Every 15 minutes (or your preferred frequency) |
| **Request Method**  | POST                                           |
| **Request Headers** | See below                                      |
| **Request Body**    | `{"league":"NFL"}`                             |

**Request Headers:**

```
Content-Type: application/json
x-cron-token: YOUR_CRON_TOKEN
```

3. Click **"CREATE"**

#### Repeat for Other Leagues

Create similar jobs for NBA, MLB, and NHL:

| Job Title                | Request Body       | Active Months |
| ------------------------ | ------------------ | ------------- |
| Pulse - Ingest NFL Games | `{"league":"NFL"}` | Sep - Feb     |
| Pulse - Ingest NBA Games | `{"league":"NBA"}` | Oct - Jun     |
| Pulse - Ingest MLB Games | `{"league":"MLB"}` | Mar - Oct     |
| Pulse - Ingest NHL Games | `{"league":"NHL"}` | Oct - Jun     |

> **Tip:** You can enable/disable jobs based on season to avoid unnecessary API calls during off-season.

### Step 3: Create Team Sync Jobs

Create one job per league to sync team metadata before each season:

| Job Title              | Request Body       | Schedule                    |
| ---------------------- | ------------------ | --------------------------- |
| Pulse - Sync NFL Teams | `{"league":"NFL"}` | August 1st, 3:00 AM UTC     |
| Pulse - Sync NBA Teams | `{"league":"NBA"}` | September 1st, 3:00 AM UTC  |
| Pulse - Sync MLB Teams | `{"league":"MLB"}` | February 1st, 3:00 AM UTC   |
| Pulse - Sync NHL Teams | `{"league":"NHL"}` | September 15th, 3:00 AM UTC |

**URL:** `https://YOUR_API_URL/admin/sync-teams`

**Request Headers:**

```
Content-Type: application/json
x-cron-token: YOUR_CRON_TOKEN
```

### Step 4: Configure Schedules

#### For Game Ingestion (Frequent)

In cron-job.org schedule settings:

- **Every 15 minutes:** Select "Every 15 minutes"
- **Every 30 minutes:** Select "Every 30 minutes"
- **Every hour:** Select "Every hour"

#### For Team Sync (Once per Season)

Use the "Advanced" schedule option with cron expressions:

- NFL (Aug 1): `0 3 1 8 *`
- NBA (Sep 1): `0 3 1 9 *`
- MLB (Feb 1): `0 3 1 2 *`
- NHL (Sep 15): `0 3 15 9 *`

## API Endpoints Reference

### POST `/admin/ingest-natstat`

Ingests game data and odds for a league.

**Headers:**

```
Content-Type: application/json
x-cron-token: <CRON_TOKEN>
```

**Body:**

```json
{
  "league": "NFL",
  "dateRange": "2024-12-08,2024-12-10" // Optional, defaults to 2 days before and 2 days after today
}
```

**Response:**

```json
{
  "ok": true,
  "range": "2024-12-08,2024-12-10",
  "result": {
    "counts": {
      "games": 15,
      "odds": 45
    }
  }
}
```

### POST `/admin/sync-teams`

Syncs team metadata (names, logos) for a league.

**Headers:**

```
Content-Type: application/json
x-cron-token: <CRON_TOKEN>
```

**Body:**

```json
{
  "league": "NFL"
}
```

**Response:**

```json
{
  "ok": true,
  "league": "NFL",
  "result": {
    "created": 0,
    "updated": 32,
    "unchanged": 0
  }
}
```

## Environment Variables

Ensure your API has these environment variables set:

| Variable          | Description                                   |
| ----------------- | --------------------------------------------- |
| `CRON_TOKEN`      | Secret token for authenticating cron requests |
| `NATSTAT_API_KEY` | API key for NatStat data provider             |

Generate a secure CRON_TOKEN:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Recommended Schedules

### During Active Season

| League | Frequency       | Why                                 |
| ------ | --------------- | ----------------------------------- |
| NFL    | Every 15-30 min | Fewer games, odds change frequently |
| NBA    | Every 15-30 min | Many games daily                    |
| MLB    | Every 30-60 min | Many games, odds relatively stable  |
| NHL    | Every 15-30 min | Moderate game count                 |

### Off-Season

Disable or reduce frequency to daily/weekly to save API calls.

## Monitoring

### cron-job.org Dashboard

- View job execution history
- Check success/failure status
- See response times and HTTP status codes

### Failure Notifications

1. Go to your cron-job.org account settings
2. Enable email notifications for failed jobs
3. Optionally configure webhook notifications

## Troubleshooting

### Job Returns 401 Unauthorized

- Verify `x-cron-token` header matches your API's `CRON_TOKEN` env var
- Check for typos or extra whitespace in the token
- Ensure the header name is exactly `x-cron-token` (lowercase)

### Job Returns 500 Error

- Check your API logs for detailed error messages
- Verify `NATSTAT_API_KEY` is set correctly
- Ensure database is accessible

### No Data Being Ingested

- Verify the league is correct (NFL, NBA, MLB, NHL)
- Check if it's within the season dates
- Test the endpoint manually with curl:

```bash
curl -X POST "https://YOUR_API_URL/admin/ingest-natstat" \
  -H "Content-Type: application/json" \
  -H "x-cron-token: YOUR_TOKEN" \
  -d '{"league":"NFL"}'
```

### Jobs Not Running

- Check job is enabled in cron-job.org dashboard
- Verify schedule is set correctly
- Check cron-job.org status page for outages

## Alternative Services

If cron-job.org doesn't meet your needs:

| Service                                      | Free Tier      | Min Interval      |
| -------------------------------------------- | -------------- | ----------------- |
| [cron-job.org](https://cron-job.org)         | Unlimited jobs | 1 minute          |
| [EasyCron](https://www.easycron.com)         | 1 job          | 20 minutes        |
| [Cronhub](https://cronhub.io)                | 5 jobs         | 1 minute          |
| [Upstash QStash](https://upstash.com/qstash) | 500 msgs/day   | N/A (queue-based) |

## Manual Triggers (GitHub Actions)

The GitHub Actions workflows are still available for manual runs:

1. Go to repository **Actions** tab
2. Select **"Ingest Games"** or **"Sync Team Metadata"**
3. Click **"Run workflow"**
4. Select league and run

This is useful for:

- Testing changes
- One-off data refreshes
- Debugging issues
