# CLAUDE.md - AI Assistant Guide for Hush

## Project Overview

**Hush** is an anti-catfish platform for booking and verification of service providers (creators) and clients. It facilitates safe, verified meetups between clients and content creators/service providers in Nigeria (Lagos, Abuja, Port Harcourt), using Naira (₦) for pricing.

### Key Features
- WhatsApp OTP-based authentication (no passwords)
- Trust deposit system with tiered verification (Visitor → Verified → Baller → Bossman)
- Anti-catfish measures: video verification, in-app camera capture, screenshot protection
- Smart matching algorithm based on preferences (location, body type, age, services)
- Booking system with code-based meetup confirmation
- Creator earnings tracking and photo management

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18.2, React Router 7.12, Vite 5 |
| Styling | Tailwind CSS 3.4, Lucide React icons |
| Backend | Supabase (PostgreSQL, Edge Functions, Storage) |
| Edge Functions | Deno/TypeScript |
| Testing | Vitest + Testing Library (unit), Playwright (E2E) |
| CI/CD | GitHub Actions → Vercel |
| Runtime | Node.js 20 |

## Directory Structure

```
src/
├── main.jsx              # Entry point with routing
├── App.jsx               # Main app (creator profile display)
├── index.css             # Tailwind + custom animations
├── pages/                # Page components
│   ├── AuthPage.jsx      # Auth flow (OTP, registration)
│   ├── ExplorePage.jsx   # Creator discovery & filtering
│   ├── ClientDashboardPage.jsx
│   ├── CreatorDashboardPage.jsx
│   └── ReviewsPage.jsx
├── context/
│   └── AuthContext.jsx   # Global auth state management
├── services/             # Supabase integration layer
│   ├── authService.js    # OTP, registration, login
│   ├── bookingService.js # Booking CRUD
│   ├── creatorService.js # Creator data queries
│   ├── userService.js    # User profile management
│   └── storageService.js # Photo uploads
├── hooks/
│   └── useFavorites.js   # Favorites with localStorage sync
├── utils/
│   └── matchingAlgorithm.js  # Client-creator matching
├── lib/
│   └── supabase.js       # Supabase client setup
├── data/
│   └── models.js         # Platform config, mock data
└── __tests__/            # Unit & integration tests

supabase/
├── schema.sql            # Complete database schema
└── functions/            # Edge Functions
    ├── send-whatsapp-otp/
    └── verify-whatsapp-otp/

e2e/                      # Playwright E2E tests
.github/workflows/        # CI/CD pipelines
```

## Quick Commands

```bash
# Development
npm run dev           # Start Vite dev server
npm run build         # Production build
npm run preview       # Preview production build

# Testing
npm test              # Run unit tests (Vitest)
npm run test:watch    # Unit tests in watch mode
npm run test:e2e      # Run E2E tests (Playwright)
npm run test:e2e:ui   # E2E tests with UI

# Linting
npm run lint          # Run ESLint
npm run lint -- --max-warnings 300  # CI threshold
```

## Development Workflow

### Before Submitting PRs
1. Run `npm run build` to ensure the build succeeds
2. Run `npm run lint -- --max-warnings 300` (CI enforces this limit)
3. Run `npm test` to verify unit tests pass
4. Run `npm run test:e2e` to verify E2E tests pass

### CI Pipeline (runs on every PR)
1. **Build** - Vite production build
2. **Lint** - ESLint with max 300 warnings
3. **Unit Tests** - Vitest
4. **E2E Tests** - Playwright (desktop Chrome + mobile)
5. **Deploy Preview** - Vercel preview URL

## Code Conventions

### ESLint Rules
- `react-hooks/rules-of-hooks`: warn (TODO: fix to error)
- `react-hooks/exhaustive-deps`: warn
- `no-unused-vars`: warn (prefix with `_` to ignore)
- `no-undef`: error

### Service Layer Pattern
All Supabase interactions go through service objects in `src/services/`:
```javascript
// Example: services/creatorService.js
export const creatorService = {
  async getCreators(filters) {
    // Returns { data, error } or { success, error }
  }
}
```

### State Management
- **AuthContext** - Global auth state, user data, preferences
- **localStorage** - Favorites sync, offline mock mode
- **Event emitters** - Cross-component updates

### Mock Mode
The app runs in mock mode when Supabase credentials aren't configured:
- Uses localStorage for data persistence
- Mock OTP verification (any 6-digit code works)
- Useful for development without backend

## Database Schema

Key tables in `supabase/schema.sql`:

| Table | Purpose |
|-------|---------|
| users | Base user data (phone, username, user_type) |
| clients | Client deposits, tier, preferences, stats |
| creators | Profiles, pricing, schedule, verification |
| bookings | Requests with codes, pricing, status |
| creator_photos | Photos with storage paths |
| favorites | Client favorites (with auto-count trigger) |

All tables have Row Level Security (RLS) enabled.

## Testing Guide

### Unit Tests (`src/__tests__/`)
- Mock Supabase in `setup.js`
- Test services, hooks, and utilities
- Use `vi.mock()` for dependencies

### Integration Tests (`*Flow.integration.test.js`)
- Test complete user flows
- Verify component interactions
- Mock external services

### E2E Tests (`e2e/`)
- Run against preview build
- Test auth, explore, navigation
- Screenshots on failure
- 0 retries locally, 2 retries in CI

## Environment Setup

1. Copy env template:
   ```bash
   cp env.example .env.local
   ```

2. Configure Supabase (optional - app works in mock mode):
   - Create project at supabase.com
   - Run `supabase/schema.sql` in SQL Editor
   - Create "creator-photos" storage bucket
   - Add credentials to `.env.local`

3. For WhatsApp OTP:
   - Deploy Edge Functions
   - Configure WhatsApp Business API
   - See `env.example` for full instructions

## Key Business Logic

### Trust Tiers
```
Visitor (₦15,000) → Verified (₦30,000) → Baller (₦100,000) → Bossman (₦1,000,000)
```

### Matching Algorithm (`src/utils/matchingAlgorithm.js`)
Weighted scoring (0-100%):
- Location: 25%
- Body type: 20%
- Skin tone: 20%
- Age range: 20%
- Services: 15%

### Booking Flow
1. Client requests booking with selected extras
2. Both parties get 6-digit verification codes
3. Codes unlock at scheduled meetup time
4. Both confirm meetup with code exchange

## Common Pitfalls

1. **Conditional hooks** - App.jsx and ExplorePage.jsx have known conditional hook issues (TODO to fix)

2. **ESLint warnings** - Keep under 300 or CI fails

3. **Mock mode detection** - Check `!supabaseUrl || supabaseUrl.includes('placeholder')` in services

4. **RLS policies** - All database operations require proper auth context

5. **E2E auth state** - Tests inject auth via localStorage

## File Size Notes

Some files are large due to comprehensive UI:
- `App.jsx` - ~3,100 lines (creator profile display)
- `AuthPage.jsx` - ~1,900 lines (multi-step auth flow)
- `CreatorDashboardPage.jsx` - ~3,100 lines (creator management)

These contain complete flows and should be read in sections when making changes.

## Deployment

- **Platform**: Vercel
- **Production**: Deploys on push to main
- **Preview**: Deploys on PR (URL commented on PR)
- **Config**: `vercel.json` handles SPA rewrites
