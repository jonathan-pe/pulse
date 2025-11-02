# ESPN Teams API Integrator

Integration layer for ESPN's public teams API to enrich team metadata with official logos and brand information.

## Overview

ESPN provides free, public access to comprehensive team data including official logos, team colors, and metadata. This integrator fetches team information to complement our primary odds data from NatStat.

## Features

- Fetch all teams for a given league
- Extract primary and alternate team logos
- Get team colors and branding information
- No authentication required
- Fast, reliable API responses

## Configuration

No configuration needed! ESPN's teams API is publicly accessible.

## Supported Leagues

The following league codes are supported:

- `NFL` - National Football League
- `NBA` - National Basketball Association  
- `MLB` - Major League Baseball
- `NHL` - National Hockey League

## Usage

### Get All Teams for a League

```typescript
import { getTeamsForLeague } from './integrators/espn';

const teams = await getTeamsForLeague('NFL');

teams.forEach(team => {
  console.log(team.displayName);      // "Dallas Cowboys"
  console.log(team.abbreviation);     // "DAL"
  console.log(team.color);            // "#003594"
  console.log(team.logos);            // Array of logo objects
});
```

### Find a Specific Team

```typescript
import { findTeamInLeague } from './integrators/espn';

const team = await findTeamInLeague('NFL', 'Dallas Cowboys');

if (team) {
  console.log(team.displayName);
  console.log(team.logos);
}
```

### Extract Logo URLs

```typescript
import { 
  getTeamsForLeague, 
  extractPrimaryLogo, 
  extractAlternateLogo 
} from './integrators/espn';

const teams = await getTeamsForLeague('NBA');
const team = teams.find(t => t.abbreviation === 'LAL');

if (team) {
  const primaryLogo = extractPrimaryLogo(team);    // Main logo
  const altLogo = extractAlternateLogo(team);      // Dark/alternate logo
  
  console.log({ primaryLogo, altLogo });
}
```

## Data Structure

### ESPN Team Object

```typescript
interface ESPNTeam {
  id: string;                    // "16"
  abbreviation: string;          // "DAL"
  displayName: string;           // "Dallas Cowboys"
  shortDisplayName: string;      // "Cowboys"
  location: string;              // "Dallas"
  name: string;                  // "Cowboys"
  color?: string;                // "#003594" (primary brand color)
  alternateColor?: string;       // "#869397" (secondary color)
  isActive: boolean;
  logos?: ESPNTeamLogo[];        // Array of logo objects
}
```

### ESPN Logo Object

```typescript
interface ESPNTeamLogo {
  href: string;                  // Full URL to logo image
  width: number;                 // Image width
  height: number;                // Image height
  alt: string;                   // Alt text
  rel: string[];                 // ["full", "default"] or ["dark", "alternate"]
}
```

## Integration with Team Sync

The `sync-natstat-teams` job uses this integrator to enrich NatStat team data:

```typescript
// 1. Fetch teams from NatStat
const natstatTeams = await loadTeamCodes({ league: 'nfl' });

// 2. Enrich with ESPN metadata
const espnTeams = await getTeamsForLeague('NFL');

for (const team of natstatTeams) {
  const espnTeam = espnTeams.find(et => 
    et.abbreviation.toLowerCase() === team.code.toLowerCase()
  );
  
  if (espnTeam) {
    await db.natStatTeam.upsert({
      where: { id: team.id },
      update: {
        badgeUrl: extractPrimaryLogo(espnTeam),
        logoUrl: extractAlternateLogo(espnTeam),
      },
      // ...
    });
  }
}
```

## API Endpoints

ESPN teams endpoints follow this pattern:

```
https://site.api.espn.com/apis/site/v2/sports/{sport}/{league}/teams
```

Examples:
- NFL: `https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams`
- NBA: `https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams`
- MLB: `https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams`
- NHL: `https://site.api.espn.com/apis/site/v2/sports/hockey/nhl/teams`

## Error Handling

- **Network errors**: Single retry with jittered backoff
- **Timeouts**: 10 second timeout (configurable)
- **Rate limiting**: Logs warning on 429, no automatic retry
- **Missing teams**: Returns `null` for team not found, logs warning

## Logo Selection Logic

### Primary Logo
1. Prefers logos with `rel: ["full"]` or `rel: ["default"]`
2. Falls back to first logo if no full/default found

### Alternate Logo
1. Looks for logos with `rel: ["dark"]` or `rel: ["alternate"]`
2. Falls back to second logo if multiple logos exist
3. Returns `null` if no alternate available

## Testing

```bash
# Sync teams for a league (includes ESPN enrichment)
pnpm --filter @pulse/api sync-teams NFL

# Check the database for enriched data
psql $DATABASE_URL -c "SELECT name, \"badgeUrl\", \"logoUrl\" FROM \"NatStatTeam\" WHERE league = 'NFL' LIMIT 5;"
```

## Advantages Over TheSportsDB

✅ **No API key required** - Fully public endpoint  
✅ **Official ESPN data** - High quality, regularly updated  
✅ **Better reliability** - ESPN's infrastructure  
✅ **Team name alignment** - Matches other ESPN APIs  
✅ **Consistent structure** - All leagues follow same format  
✅ **Multiple logo sizes** - Different resolutions available  
✅ **Brand colors included** - Official team colors

## Implementation Notes

- Team matching prioritizes **abbreviation** (most reliable)
- Falls back to fuzzy matching on display name and location
- All logo URLs are served from ESPN's CDN
- Logos are SVG or high-quality PNG
- No rate limits on reasonable usage (public API)
