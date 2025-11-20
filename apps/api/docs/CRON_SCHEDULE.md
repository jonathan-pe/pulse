# Pulse CRON Job Schedule

## Overview

This document defines the CRON schedules for ingesting odds data from NatStat for each major sport. Jobs run at 15-minute intervals during active game days within each sport's season.

## CRON Format

```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * *
```

## Sport Seasons & Schedules

### NBA (National Basketball Association)

**Season**: October - June (9 months)
- **Regular Season**: October - April
- **Playoffs**: April - June

**CRON Schedule**:
```cron
# NBA: Every 15 minutes from 12 PM to 2 AM PT (covers all NBA games including matinees and overtime)
# Runs October through June
*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 * cd /app && pnpm ingest NBA
```

**Explanation**:
- Runs at :00, :15, :30, :45 of each hour
- Hours: 12 PM - 2 AM PT (12-23, 0-2)
  - UTC equivalent (PDT): 19-23,7-9 (7 PM - 9 AM UTC)
  - UTC equivalent (PST): 20-23,8-10 (8 PM - 10 AM UTC)
- Months: October (10) through June (6)
- Covers early afternoon games (12 PM start) through late night games with overtime (ending ~2 AM)

---

### NFL (National Football League)

**Season**: September - February (6 months)
- **Regular Season**: September - January (18 weeks)
- **Playoffs**: January - February

**CRON Schedule**:
```cron
# NFL: Every 15 minutes from 9 AM to 2 AM PT (covers all NFL games including overtime)
# Runs September through February
# Thursday, Sunday, Monday games primarily
*/15 9-23,0-2 * 9,10,11,12,1,2 * cd /app && pnpm ingest NFL
```

**Explanation**:
- Runs at :00, :15, :30, :45 of each hour
- Hours: 9 AM - 2 AM PT (9-23, 0-2)
  - UTC equivalent (PDT): 16-23,7-9 (4 PM - 9 AM UTC, Sep-Nov)
  - UTC equivalent (PST): 17-23,8-10 (5 PM - 10 AM UTC, Nov-Feb)
- Months: September (9) through February (2)
- Covers Thursday Night Football, Sunday games, and Monday Night Football including overtime

---

### NHL (National Hockey League)

**Season**: October - June (9 months)
- **Regular Season**: October - April
- **Playoffs**: April - June

**CRON Schedule**:
```cron
# NHL: Every 15 minutes from 12 PM to 2 AM PT (covers all NHL games including matinees and overtime)
# Runs October through June
*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 * cd /app && pnpm ingest NHL
```

**Explanation**:
- Runs at :00, :15, :30, :45 of each hour
- Hours: 12 PM - 2 AM PT (12-23, 0-2)
  - UTC equivalent (PDT): 19-23,7-9 (7 PM - 9 AM UTC)
  - UTC equivalent (PST): 20-23,8-10 (8 PM - 10 AM UTC)
- Months: October (10) through June (6)
- Covers early afternoon games (12 PM start) through late night games with overtime (ending ~2 AM)

---

### MLB (Major League Baseball)

**Season**: March/April - October (7 months)
- **Spring Training**: February - March
- **Regular Season**: Late March/Early April - September (162 games)
- **Playoffs**: October

**CRON Schedule**:
```cron
# MLB: Every 15 minutes from 9 AM to 2 AM PT (covers all MLB games including extra innings)
# Runs April through October
*/15 9-23,0-2 * 4,5,6,7,8,9,10 * cd /app && pnpm ingest MLB
```

**Explanation**:
- Runs at :00, :15, :30, :45 of each hour
- Hours: 9 AM - 2 AM PT (9-23, 0-2)
  - UTC equivalent (PDT): 16-23,7-9 (4 PM - 9 AM UTC)
  - UTC equivalent (PST): 17-23,8-10 (5 PM - 10 AM UTC, Nov only)
- Months: April (4) through October (10)
- MLB games throughout the day and evening, including extra innings

---

## Complete CRON Configuration

### For Production (crontab format)

```cron
# Pulse - NatStat Odds Ingestion
# Runs every 15 minutes during active game hours for each sport
# Auto-scoring happens within ingestion when games are completed
# NOTE: Times shown in PT. For UTC-only systems, see UTC conversions below.

# NBA (October - June) - 12 PM - 2 AM PT (19-23,7-9 UTC PDT / 20-23,8-10 UTC PST)
*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 * cd /app && pnpm ingest NBA >> /var/log/pulse/nba-ingest.log 2>&1

# NFL (September - February) - 9 AM - 2 AM PT (16-23,7-9 UTC PDT / 17-23,8-10 UTC PST)
*/15 9-23,0-2 * 9,10,11,12,1,2 * cd /app && pnpm ingest NFL >> /var/log/pulse/nfl-ingest.log 2>&1

# NHL (October - June) - 12 PM - 2 AM PT (19-23,7-9 UTC PDT / 20-23,8-10 UTC PST)
*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 * cd /app && pnpm ingest NHL >> /var/log/pulse/nhl-ingest.log 2>&1

# MLB (April - October) - 9 AM - 2 AM PT (16-23,7-9 UTC PDT)
*/15 9-23,0-2 * 4,5,6,7,8,9,10 * cd /app && pnpm ingest MLB >> /var/log/pulse/mlb-ingest.log 2>&1
```

**For UTC-only environments**, use these schedules instead:
```cron
# NBA (October - June) - UTC schedule
# Oct-Nov (PDT): */15 19-23,7-9 * 10,11 *
# Nov-Mar (PST): */15 20-23,8-10 * 12,1,2,3 *
# Mar-Jun (PDT): */15 19-23,7-9 * 4,5,6 *
*/15 19-23,7-9 * 10,11 * cd /app && pnpm ingest NBA >> /var/log/pulse/nba-ingest.log 2>&1
*/15 20-23,8-10 * 12,1,2,3 * cd /app && pnpm ingest NBA >> /var/log/pulse/nba-ingest.log 2>&1
*/15 19-23,7-9 * 4,5,6 * cd /app && pnpm ingest NBA >> /var/log/pulse/nba-ingest.log 2>&1

# NFL (September - February) - UTC schedule
# Sep-Nov (PDT): */15 16-23,7-9 * 9,10,11 *
# Nov-Feb (PST): */15 17-23,8-10 * 12,1,2 *
*/15 16-23,7-9 * 9,10,11 * cd /app && pnpm ingest NFL >> /var/log/pulse/nfl-ingest.log 2>&1
*/15 17-23,8-10 * 12,1,2 * cd /app && pnpm ingest NFL >> /var/log/pulse/nfl-ingest.log 2>&1

# NHL (October - June) - UTC schedule (same as NBA)
*/15 19-23,7-9 * 10,11 * cd /app && pnpm ingest NHL >> /var/log/pulse/nhl-ingest.log 2>&1
*/15 20-23,8-10 * 12,1,2,3 * cd /app && pnpm ingest NHL >> /var/log/pulse/nhl-ingest.log 2>&1
*/15 19-23,7-9 * 4,5,6 * cd /app && pnpm ingest NHL >> /var/log/pulse/nhl-ingest.log 2>&1

# MLB (April - October) - UTC schedule
# Apr-Nov (PDT): */15 16-23,7-9 * 4,5,6,7,8,9,10 *
*/15 16-23,7-9 * 4,5,6,7,8,9,10 * cd /app && pnpm ingest MLB >> /var/log/pulse/mlb-ingest.log 2>&1
```

---

## Team Sync (Yearly)

We run a single yearly sync for team metadata (rosters, IDs, venue info, etc.) one month before each league's season starts. These jobs are lightweight and only need to run once per year before the season kickoff to capture any offseason changes.

Scheduling convention: run on the 1st day of the month at 03:00 PT (America/Los_Angeles).

### Per-league team-sync dates
- **NBA teams sync**: Sep 1 at 03:00 PT — cron: `0 3 1 9 *` (runs once each year)
  - UTC equivalent (PDT): `0 10 1 9 *` (10:00 UTC, Sep 1)
- **NHL teams sync**: Sep 1 at 03:00 PT — cron: `0 3 1 9 *`
  - UTC equivalent (PDT): `0 10 1 9 *` (10:00 UTC, Sep 1)
- **NFL teams sync**: Aug 1 at 03:00 PT — cron: `0 3 1 8 *`
  - UTC equivalent (PDT): `0 10 1 8 *` (10:00 UTC, Aug 1)
- **MLB teams sync**: Mar 1 at 03:00 PT — cron: `0 3 1 3 *`
  - UTC equivalent (PST): `0 11 1 3 *` (11:00 UTC, Mar 1)

**Timezone note**: PT (Pacific Time) = UTC-8 during PST (Nov-Mar) and UTC-7 during PDT (Mar-Nov). Sep 1, Aug 1 use PDT (+7 hours), Mar 1 uses PST (+8 hours).

### Example (crontab)
```cron
# NBA teams sync (Sep 1 03:00 PT / 10:00 UTC)
0 3 1 9 * cd /app && pnpm sync-teams NBA >> /var/log/pulse/sync-nba.log 2>&1

# NHL teams sync (Sep 1 03:00 PT / 10:00 UTC)
0 3 1 9 * cd /app && pnpm sync-teams NHL >> /var/log/pulse/sync-nhl.log 2>&1

# NFL teams sync (Aug 1 03:00 PT / 10:00 UTC)
0 3 1 8 * cd /app && pnpm sync-teams NFL >> /var/log/pulse/sync-nfl.log 2>&1

# MLB teams sync (Mar 1 03:00 PT / 11:00 UTC)
0 3 1 3 * cd /app && pnpm sync-teams MLB >> /var/log/pulse/sync-mlb.log 2>&1
```

**For UTC-only environments**, use these schedules instead:
```cron
# NBA teams sync (10:00 UTC on Sep 1)
0 10 1 9 * cd /app && pnpm sync-teams NBA >> /var/log/pulse/sync-nba.log 2>&1

# NHL teams sync (10:00 UTC on Sep 1)
0 10 1 9 * cd /app && pnpm sync-teams NHL >> /var/log/pulse/sync-nhl.log 2>&1

# NFL teams sync (10:00 UTC on Aug 1)
0 10 1 8 * cd /app && pnpm sync-teams NFL >> /var/log/pulse/sync-nfl.log 2>&1

# MLB teams sync (11:00 UTC on Mar 1 - uses PST)
0 11 1 3 * cd /app && pnpm sync-teams MLB >> /var/log/pulse/sync-mlb.log 2>&1
```

### Docker Compose / Ofelia labels
Add these labels to the scheduler container (or equivalent job runner):

```yaml
      # NBA teams sync (Sep 1 03:00 PT / 10:00 UTC)
      ofelia.job-exec.sync-nba.schedule: "0 3 1 9 *"
      ofelia.job-exec.sync-nba.container: "pulse-api"
      ofelia.job-exec.sync-nba.command: "pnpm sync-teams NBA"

      # NHL teams sync (Sep 1 03:00 PT / 10:00 UTC)
      ofelia.job-exec.sync-nhl.schedule: "0 3 1 9 *"
      ofelia.job-exec.sync-nhl.container: "pulse-api"
      ofelia.job-exec.sync-nhl.command: "pnpm sync-teams NHL"

      # NFL teams sync (Aug 1 03:00 PT / 10:00 UTC)
      ofelia.job-exec.sync-nfl.schedule: "0 3 1 8 *"
      ofelia.job-exec.sync-nfl.container: "pulse-api"
      ofelia.job-exec.sync-nfl.command: "pnpm sync-teams NFL"

      # MLB teams sync (Mar 1 03:00 PT / 11:00 UTC)
      ofelia.job-exec.sync-mlb.schedule: "0 3 1 3 *"
      ofelia.job-exec.sync-mlb.container: "pulse-api"
      ofelia.job-exec.sync-mlb.command: "pnpm sync-teams MLB"
```

### Kubernetes CronJob examples
Use the `timeZone: "America/Los_Angeles"` field if your cluster supports it.

```yaml
# NBA teams sync (runs Sep 1 03:00 PT every year)
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pulse-sync-nba
spec:
  schedule: "0 3 1 9 *"
  timeZone: "America/Los_Angeles"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: sync
            image: pulse-api:latest
            command: ["pnpm", "sync-teams", "NBA"]
            envFrom:
            - secretRef:
                name: pulse-secrets
          restartPolicy: OnFailure

---
# For UTC-only clusters, use schedule: "0 10 1 9 *" for NBA/NHL/NFL, "0 11 1 3 *" for MLB
# Repeat similar CronJobs for NHL (Sep 1), NFL (Aug 1), MLB (Mar 1)
```

### Vercel cron.json example
Add one-off yearly routes (Vercel supports yearly cron expressions):

```json
{
  "crons": [
    { "path": "/api/admin/sync-teams?league=NBA", "schedule": "0 3 1 9 *" },
    { "path": "/api/admin/sync-teams?league=NHL", "schedule": "0 3 1 9 *" },
    { "path": "/api/admin/sync-teams?league=NFL", "schedule": "0 3 1 8 *" },
    { "path": "/api/admin/sync-teams?league=MLB", "schedule": "0 3 1 3 *" }
  ]
}
```

**Note**: Vercel cron runs in UTC. If you need UTC schedules, use:
```json
{
  "crons": [
    { "path": "/api/admin/sync-teams?league=NBA", "schedule": "0 10 1 9 *" },
    { "path": "/api/admin/sync-teams?league=NHL", "schedule": "0 10 1 9 *" },
    { "path": "/api/admin/sync-teams?league=NFL", "schedule": "0 10 1 8 *" },
    { "path": "/api/admin/sync-teams?league=MLB", "schedule": "0 11 1 3 *" }
  ]
}
```

### Railway (railway.toml)

```toml
[[crons]]
name = "sync-nba"
schedule = "0 3 1 9 *"
command = "pnpm sync-teams NBA"

[[crons]]
name = "sync-nhl"
schedule = "0 3 1 9 *"
command = "pnpm sync-teams NHL"

[[crons]]
name = "sync-nfl"
schedule = "0 3 1 8 *"
command = "pnpm sync-teams NFL"

[[crons]]
name = "sync-mlb"
schedule = "0 3 1 3 *"
command = "pnpm sync-teams MLB"
```

**For UTC-only Railway deployments**:
```toml
[[crons]]
name = "sync-nba"
schedule = "0 10 1 9 *"
command = "pnpm sync-teams NBA"

[[crons]]
name = "sync-nhl"
schedule = "0 10 1 9 *"
command = "pnpm sync-teams NHL"

[[crons]]
name = "sync-nfl"
schedule = "0 10 1 8 *"
command = "pnpm sync-teams NFL"

[[crons]]
name = "sync-mlb"
schedule = "0 11 1 3 *"
command = "pnpm sync-teams MLB"
```

### Notes
- These syncs are intentionally infrequent and lightweight — they fetch team lists and static metadata, not live odds.
- **Timezone handling**:
  - If your platform supports `timeZone: "America/Los_Angeles"`, use the PT schedules as-is
  - For UTC-only platforms, use the UTC equivalents above (10:00 UTC for Aug/Sep, 11:00 UTC for Mar)
  - Sep 1, Aug 1 use PDT (UTC-7), so add 7 hours: 03:00 PT → 10:00 UTC
  - Mar 1 uses PST (UTC-8), so add 8 hours: 03:00 PT → 11:00 UTC
- If you prefer a different sync date (e.g., 15th of the month), adjust the day-of-month component accordingly.

---

## Docker Compose / Kubernetes CronJob Format

### Docker Compose (using `ofelia` or similar)

```yaml
version: '3.8'

services:
  api:
    image: pulse-api:latest
    # ... other config ...

  scheduler:
    image: mcuadros/ofelia:latest
    depends_on:
      - api
    command: daemon --docker
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
    labels:
      # NBA (October - June)
      ofelia.job-exec.nba-ingest.schedule: "*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 *"
      ofelia.job-exec.nba-ingest.container: "pulse-api"
      ofelia.job-exec.nba-ingest.command: "pnpm ingest NBA"
      
      # NFL (September - February)
      ofelia.job-exec.nfl-ingest.schedule: "*/15 9-23,0-2 * 9,10,11,12,1,2 *"
      ofelia.job-exec.nfl-ingest.container: "pulse-api"
      ofelia.job-exec.nfl-ingest.command: "pnpm ingest NFL"
      
      # NHL (October - June)
      ofelia.job-exec.nhl-ingest.schedule: "*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 *"
      ofelia.job-exec.nhl-ingest.container: "pulse-api"
      ofelia.job-exec.nhl-ingest.command: "pnpm ingest NHL"
      
      # MLB (April - October)
      ofelia.job-exec.mlb-ingest.schedule: "*/15 9-23,0-2 * 4,5,6,7,8,9,10 *"
      ofelia.job-exec.mlb-ingest.container: "pulse-api"
      ofelia.job-exec.mlb-ingest.command: "pnpm ingest MLB"
```

### Kubernetes CronJob

```yaml
# NBA Ingestion
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pulse-nba-ingest
spec:
  schedule: "*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 *"
  timeZone: "America/Los_Angeles"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: ingest
            image: pulse-api:latest
            command: ["pnpm", "ingest", "NBA"]
            envFrom:
            - secretRef:
                name: pulse-secrets
          restartPolicy: OnFailure

---
# NFL Ingestion
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pulse-nfl-ingest
spec:
  schedule: "*/15 9-23,0-2 * 9,10,11,12,1,2 *"
  timeZone: "America/Los_Angeles"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: ingest
            image: pulse-api:latest
            command: ["pnpm", "ingest", "NFL"]
            envFrom:
            - secretRef:
                name: pulse-secrets
          restartPolicy: OnFailure

---
# NHL Ingestion
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pulse-nhl-ingest
spec:
  schedule: "*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 *"
  timeZone: "America/Los_Angeles"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: ingest
            image: pulse-api:latest
            command: ["pnpm", "ingest", "NHL"]
            envFrom:
            - secretRef:
                name: pulse-secrets
          restartPolicy: OnFailure

---
# MLB Ingestion
apiVersion: batch/v1
kind: CronJob
metadata:
  name: pulse-mlb-ingest
spec:
  schedule: "*/15 9-23,0-2 * 4,5,6,7,8,9,10 *"
  timeZone: "America/Los_Angeles"
  concurrencyPolicy: Forbid
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: ingest
            image: pulse-api:latest
            command: ["pnpm", "ingest", "MLB"]
            envFrom:
            - secretRef:

                name: pulse-secrets
          restartPolicy: OnFailure
```

---

## Platform-Specific Instructions

### Vercel Cron (vercel.json)

```json
{
  "crons": [
    {
      "path": "/api/admin/ingest?league=NBA",
      "schedule": "*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 *"
    },
    {
      "path": "/api/admin/ingest?league=NFL",
      "schedule": "*/15 9-23,0-2 * 9,10,11,12,1,2 *"
    },
    {
      "path": "/api/admin/ingest?league=NHL",
      "schedule": "*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 *"
    },
    {
      "path": "/api/admin/ingest?league=MLB",
      "schedule": "*/15 9-23,0-2 * 4,5,6,7,8,9,10 *"
    }
  ]
}
```

### Railway

Railway uses the same cron format. Add to your railway.toml:

```toml
[[crons]]
name = "nba-ingest"
schedule = "*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 *"
command = "pnpm ingest NBA"

[[crons]]
name = "nfl-ingest"
schedule = "*/15 9-23,0-2 * 9,10,11,12,1,2 *"
command = "pnpm ingest NFL"

[[crons]]
name = "nhl-ingest"
schedule = "*/15 12-23,0-2 * 10,11,12,1,2,3,4,5,6 *"
command = "pnpm ingest NHL"

[[crons]]
name = "mlb-ingest"
schedule = "*/15 9-23,0-2 * 4,5,6,7,8,9,10 *"
command = "pnpm ingest MLB"
```

---

## Testing CRON Schedules

To test if your CRON schedule works:

```bash
# Test the expression (using cronie or similar)
# This shows the next 10 run times
croniter "*/15 15-23,0-1 * 10,11,12,1,2,3,4,5,6 *"

# Or use online tools:
# https://crontab.guru/
# https://crontab-generator.org/
```

---

## Monitoring & Alerts

### Key Metrics to Monitor

1. **Job Success Rate**: Each league should have >95% success rate
2. **Execution Time**: Should complete within 30 seconds typically
3. **Predictions Locked**: Number should increase during active game times
4. **Points Awarded**: Should increase after game completion

### Recommended Alerts

```yaml
alerts:
  - name: "Ingestion Job Failed"
    condition: "job_failure_count > 3 in 1 hour"
    severity: "high"
    
  - name: "No Predictions Locked"
    condition: "predictions_locked_count == 0 for 2 hours during active season"
    severity: "medium"
    
  - name: "Scoring Job Failed"
    condition: "scoring_job_failure_count > 2 in 1 hour"
    severity: "high"
```

---

## Notes

- **Timezone**: All times are in Pacific Time (PT) which is where most US sports are centered
  - PT = UTC-7 during PDT (March-November)
  - PT = UTC-8 during PST (November-March)
  - For UTC-only platforms, use the UTC conversion schedules provided in each section
  - DST transitions happen in March and November, requiring separate cron entries for UTC deployments
- **Overlap**: NBA and NHL have the same schedule since they overlap seasons and game times
- **Off-season**: Jobs automatically don't run during off-season months
- **Concurrency**: Use `concurrencyPolicy: Forbid` to prevent overlapping runs
- **Retries**: Most platforms support automatic retries on failure
- **Rate Limits**: 15-minute intervals respect NatStat API rate limits (4 calls/hour per league)
- **Auto-Scoring**: Scoring happens automatically during ingestion when games are completed - no separate scoring job needed

## Manual Testing

```bash
# Test ingestion for today (includes auto-scoring)
pnpm ingest NBA
pnpm ingest NFL
pnpm ingest NHL
pnpm ingest MLB

# Test specific date
pnpm ingest 2025-11-18 NBA

# Manual scoring (if needed, though auto-scoring handles this)
pnpm score-games
```
