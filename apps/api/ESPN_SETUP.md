# ESPN Integration - Setup Guide

This document explains how to use the ESPN teams API to enrich team metadata with logos and other information.

## What Was Added

### 1. ESPN Integrator (`src/integrators/espn/`)

A new integrator for ESPN's public teams API that provides:

- Team data by league (NFL, NBA, MLB, NHL)
- Logo URLs in multiple formats (default, dark, scoreboard)
- Team colors, abbreviations, and display names
- No API key required - fully public endpoint

### 2. Updated Prisma Schema

The `NatStatTeam` model includes:

```prisma
model NatStatTeam {
  // ... existing fields
  badgeUrl  String? // Team logo URL from ESPN
  logoUrl   String? // Alternate team logo URL from ESPN
}
```

### 3. Enhanced Team Sync Job

The `sync-natstat-teams` job now:

1. Fetches teams from NatStat (primary source)
2. Enriches each team with logo URLs from ESPN
3. Stores all metadata in the database

## Quick Start

### 1. Generate Prisma Client

```bash
cd /Users/jpe/dev/pulse
pnpm --filter @pulse/db prisma:generate
```

### 2. Run Database Migration (if needed)

```bash
pnpm --filter @pulse/db prisma:migrate:dev --name add_team_badge_and_logo_urls
```

### 3. Sync Teams

Sync teams for each league to populate logo URLs:

```bash
# Sync NFL teams
pnpm --filter @pulse/api sync-teams NFL

# Sync all leagues
pnpm --filter @pulse/api sync-teams NFL
pnpm --filter @pulse/api sync-teams NBA
pnpm --filter @pulse/api sync-teams MLB
pnpm --filter @pulse/api sync-teams NHL
```

## Verifying the Integration

### Check Database

```sql
-- View teams with badges/logos
SELECT 
  name,
  code,
  league,
  "badgeUrl",
  "logoUrl"
FROM "NatStatTeam"
WHERE league = 'NFL'
ORDER BY name;
```

### Expected Output

Teams will have ESPN logo URLs like:

```text
name                    | code | league | badgeUrl                                           | logoUrl
------------------------|------|--------|----------------------------------------------------|--------
Arizona Cardinals       | ARI  | NFL    | https://a.espncdn.com/i/teamlogos/nfl/500/ari.png | https://...
Dallas Cowboys          | DAL  | NFL    | https://a.espncdn.com/i/teamlogos/nfl/500/dal.png | https://...
```

## Using Team Metadata in the App

### Backend (Example)

```typescript
import { db } from '@pulse/db';

// Get team with badge/logo
const team = await db.natStatTeam.findUnique({
  where: { id: teamId },
  select: {
    name: true,
    code: true,
    badgeUrl: true,
    logoUrl: true,
  }
});

// Use in API response
return {
  name: team.name,
  logo: team.badgeUrl,
  alternateLogo: team.logoUrl,
};
```

### Frontend (Example)

Display team logos in your UI:

```tsx
interface TeamLogoProps {
  teamName: string;
  logoUrl?: string;
}

function TeamLogo({ teamName, logoUrl }: TeamLogoProps) {
  return (
    <div className="flex items-center gap-2">
      {logoUrl && (
        <img 
          src={logoUrl} 
          alt={`${teamName} logo`}
          className="w-8 h-8 object-contain"
        />
      )}
      <span>{teamName}</span>
    </div>
  );
}
```

## API Details

### Supported Leagues

- `NFL` - National Football League (32 teams)
- `NBA` - National Basketball Association (30 teams)
- `MLB` - Major League Baseball (30 teams)
- `NHL` - National Hockey League (32 teams)

### ESPN Endpoints

The integration uses ESPN's public API:

- NFL: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`
- NBA: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams`
- MLB: `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams`
- NHL: `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams`

### Team Matching Logic

The integration:

1. Fetches all teams for a league from ESPN
2. Matches teams by abbreviation or display name (case-insensitive)
3. Extracts logo URLs (default and dark variants)
4. Falls back to fuzzy name matching if needed

### Logo Formats

ESPN provides multiple logo formats:

- **Default logo**: Standard team logo on light background
- **Dark logo**: Logo optimized for dark backgrounds
- **Scoreboard logo**: Smaller logo for scoreboards

The integration stores:

- `badgeUrl`: Default logo (500px)
- `logoUrl`: Dark variant logo (500px dark)

## Maintenance

### Refresh Team Data

Team logos/badges may change over time. Re-run the sync to update:

```bash
pnpm --filter @pulse/api sync-teams NFL
```

### Before Each Season

Sync all leagues to ensure current metadata:

```bash
for league in NFL NBA MLB NHL; do
  pnpm --filter @pulse/api sync-teams $league
done
```

## Troubleshooting

### No Logo URLs Saved

**Cause**: ESPN might not have found a match for the team abbreviation.

**Solution**:

- Check the logs for warnings about unmatched teams
- Verify team codes in NatStat match ESPN abbreviations
- ESPN uses standard abbreviations (e.g., "DAL" for Dallas Cowboys)

### ESPN API Timeout

**Cause**: ESPN's API might be slow to respond.

**Solution**: The integration has built-in retry logic with exponential backoff. If issues persist, check ESPN's service status.

### Database Migration Failed

**Cause**: The migration might conflict with existing data.

**Solution**:

```bash
# Check migration status
pnpm --filter @pulse/db prisma:migrate:status

# If needed, reset (DEVELOPMENT ONLY!)
pnpm --filter @pulse/db prisma:migrate:reset
```

## Advantages of ESPN API

Compared to other sports APIs:

1. **No API Key Required**: Fully public endpoints
2. **Consistent Data**: Directly from ESPN's authoritative sports data
3. **High Quality Logos**: Professional-grade team logos in multiple formats
4. **Reliable**: ESPN's infrastructure is highly available
5. **Up-to-date**: Logos and team data are kept current

## Next Steps

With team logos now available:

1. **Display in Game Cards**: Show team logos next to team names
2. **Leaderboard UI**: Use team logos for visual interest
3. **Prediction Interface**: Display logos when selecting teams
4. **Team Pages**: Create dedicated team pages with full metadata

## Resources

- [ESPN Integrator README](./src/integrators/espn/README.md)
- [CLI Documentation](./CLI.md)
- ESPN API endpoints are public and documented through usage
