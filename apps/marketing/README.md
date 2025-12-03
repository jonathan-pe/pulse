# Pulse Marketing Site

Marketing landing page for Pulse, the gamified sports prediction platform.

## Overview

Single-page marketing site with anchor navigation showcasing Pulse's features, how it works, and FAQ. Emphasizes the "no gambling" positioning and probability-based scoring system.

## Tech Stack

- **Vite** - Build tool and dev server
- **React 19** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS 4.x** - Styling
- **shadcn/ui** - Component library
- **lucide-react** - Icons

## Component Structure

```
src/
├── App.tsx                      # Main app shell with navigation logic
├── components/
│   ├── Navigation.tsx           # Sticky header with nav links
│   ├── Footer.tsx               # Site footer
│   ├── sections/                # Page sections
│   │   ├── Hero.tsx            # Hero with CTA and placeholder image
│   │   ├── NoGamblingDisclaimer.tsx  # Legal compliance messaging
│   │   ├── Features.tsx         # Feature cards (6 features)
│   │   ├── HowItWorks.tsx      # 4-step process + scoring example
│   │   ├── FAQ.tsx             # 9 common questions
│   │   └── CTA.tsx             # Final call-to-action
│   └── ui/                      # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── badge.tsx
│       ├── separator.tsx
│       └── theme-toggle.tsx
└── lib/
    └── utils.ts                 # Utility functions (cn)
```

## Key Sections

### 1. Hero
- Main value proposition: "Test Your Sports Prediction Skills"
- Prominent "No Real Money. No Gambling. Just Predictions" badge
- Two CTAs: "Start Predicting Free" and "Learn How It Works"
- Placeholder for dashboard screenshot

### 2. No Gambling Disclaimer
- Legal compliance messaging
- Explains Pulse is NOT sports betting or gambling
- Emphasizes no real money, no prizes, no financial transactions

### 3. Features (6 cards)
1. **Probability-Based Scoring** - Mathematical fairness with examples
2. **Daily Bonus Multiplier** - 1.5x multiplier for first prediction
3. **Unlock Achievements** - Cosmetic badges and trophy case
4. **Compete on Leaderboards** - Daily, weekly, all-time rankings
5. **Multi-Sport Coverage** - NFL, NBA, MLB, NHL
6. **Fair Competition** - Anti-abuse mechanisms

### 4. How It Works
- 4-step process: Browse → Predict → Resolve → Earn
- Detailed scoring examples with calculations
- Expected value explanation

### 5. FAQ
9 common questions covering:
- Is this gambling? (No)
- How are points calculated?
- What are achievements?
- Can I game the system? (No)
- Sports/leagues supported
- Prediction types available
- Diminishing returns
- Streak mechanics
- Pricing (Free)

### 6. CTA
- Final call to action to get started
- No credit card required messaging

## Development

```bash
# Install dependencies
pnpm install

# Run dev server (localhost:5174 or www.playpulse.test:5174)
pnpm dev

# Type check
pnpm typecheck

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Environment Variables

```env
VITE_APP_URL=http://localhost:5173  # URL of the main Pulse web app
```

## Image Placeholders

The hero section currently has a placeholder for a dashboard screenshot. Replace with:

- Actual screenshot from `apps/web` dashboard
- Or use placeholder services:
  - **Unsplash/Pexels** - Sports photography
  - **Shots.so/Screely** - Browser mockup generators
  - **UI Faces** - Profile avatars

## Maintenance

### Adding a New Section

1. Create component in `src/components/sections/NewSection.tsx`
2. Import and add to `App.tsx`
3. Add navigation link if needed in `Navigation.tsx`
4. Add anchor ID for smooth scrolling

### Modifying Content

Each section is self-contained. Edit the relevant component file:
- Hero copy → `sections/Hero.tsx`
- Features → `sections/Features.tsx`
- FAQ → `sections/FAQ.tsx`
- etc.

### Styling

- Uses Tailwind utility classes throughout
- Color tokens defined in `src/index.css`
- Theme toggle supports light/dark mode
- Responsive breakpoints: `sm:`, `md:`, `lg:`

## Deployment

Configured for Vercel deployment via `vercel.json`. Supports:
- Static site generation
- Custom domain
- Environment variables
- Automatic HTTPS

## Design Principles

1. **No Gambling Emphasis** - Clear, prominent messaging that this is NOT betting
2. **Educational** - Explain probability-based scoring with examples
3. **Transparency** - Show how points work, no hidden mechanics
4. **Skill-Based** - Focus on prediction accuracy, not luck
5. **Fair Competition** - Equal expected value, anti-abuse systems
6. **Accessible** - Responsive, semantic HTML, ARIA labels where needed
