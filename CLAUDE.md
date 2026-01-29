# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.



## Project Overview

This is a Next.js 15 application built with React 19, TypeScript, and Tailwind CSS. It combines a HandCash-integrated web app template with "Slavic Survivors," a browser-based 2.5D bullet-heaven game built using Three.js. The project features enterprise-grade authentication, payment integration, NFT/item management, and a complex game engine with sprite-based rendering.

## Response Guidelines

- Be concise. No preamble, no summaries, no "here's what I did" explanations
- Code only unless explanation is explicitly requested
- No comments unless they add critical context
- Skip confirmations—just do the task
- One solution, not multiple options
- No verbose error handling unless asked
- Minimize diff size—change only what's necessary

## Commands

### Development
```bash
npm run dev          # Start Next.js development server (port 3000)
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Database (Drizzle ORM + Neon PostgreSQL)
```bash
npm run db:push      # Push schema changes to database (development)
npm run db:generate  # Generate migration files (production)
npm run db:studio    # Open Drizzle Studio (database GUI)
```

### Testing
```bash
npm run test              # Run all Playwright tests
npm run test:ui           # Run tests with Playwright UI mode
npm run test:headed       # Run tests with browser windows visible
npm run test:debug        # Run tests in debug mode
npm run test:e2e          # Run e2e tests only
npm run test:api          # Run API tests only
npm run test:report       # Show test report

# Run a single test file
npx playwright test path/to/test.ts

# Run tests matching a pattern
npx playwright test -g "test name pattern"
```

### Scripts
```bash
npm run bulk-payment      # Run bulk payment script
npm run chaos-test        # Run automated chaos test (Playwright)
npm run ci:game           # Run CI game tests
tsx scripts/seed-item-templates.ts      # Seed item templates
tsx scripts/simulate-game.ts            # Run game simulation
tsx scripts/query-minted-items.ts       # Query minted items
tsx scripts/generate-sprites.ts         # Generate sprites
```

## Architecture

### Tech Stack
- **Framework**: Next.js 15 (App Router)
- **UI**: React 19, Tailwind CSS v4, Radix UI
- **Game Engine**: Three.js (WebGL) with 2.5D billboard sprites
- **Database**: Neon PostgreSQL with Drizzle ORM
- **Authentication**: HandCash OAuth 2.0 (RFC 9700 compliant)
- **Payments**: HandCash SDK v3 + HandCash Connect

### HandCash Integration

The app uses TWO HandCash SDKs for different purposes:
- **@handcash/sdk** (v3): Profile, balance, payments - newer, recommended API
- **@handcash/handcash-connect**: Friends, inventory, item transfers - older SDK

All HandCash operations go through `lib/handcash-service.ts`, which provides a unified interface for both SDKs.

### Authentication System

Centralized authentication context (`lib/auth-context.tsx`) provides:
- Single source of truth for user state
- Automatic profile refresh every 5 minutes
- Session management with metadata tracking (IP, User-Agent)
- CSRF protection with OAuth state parameter validation
- HTTP-only cookies for private key storage

**Key Files**:
- `lib/auth-context.tsx` - React Context provider
- `lib/auth-middleware.ts` - Unified auth validation for API routes
- `lib/admin-middleware.ts` - Admin-only route protection
- `lib/csrf-utils.ts` - CSRF token generation/validation
- `lib/session-utils.ts` - Session management
- `lib/audit-logger.ts` - Security event logging

### Modular Feature Organization

The codebase follows a **Widget + Hook Pattern** (see `docs/MODULAR_STRUCTURE.md`):

**User Features** (`components/widgets/` + `hooks/`):
- Widgets are pure UI components (no API calls)
- Hooks contain business logic (API calls, state management)
- Example: `inventory-display.tsx` uses `use-inventory.ts` hook

**Admin Features** (`components/admin/` + `app/api/admin/`):
- Self-contained admin components
- Admin-only API routes with `requireAdmin()` middleware
- Business wallet operations (minting, payments, inventory)

**Core Features**:
- Payment requests with webhook handling
- Item templates and collections management
- NFT minting and burning
- Inventory management
- Friends list

### Database Schema

All tables are defined in `lib/schema.ts`:
- `users` - Cached HandCash user data
- `payments` - Payment transaction records
- `collections` - NFT/item collections
- `item_templates` - Minting templates
- `minted_items` - Complete mint history
- `audit_logs` - Security and audit events
- `sessions` - Server-side session management
- `rate_limits` - Distributed rate limiting

Each table has a corresponding storage module in `lib/` (e.g., `payments-storage.ts`).

### Game Architecture (Slavic Survivors)

Located in `components/game/`, the game is a 2.5D bullet-heaven roguelike with these key principles:

**Technical Design**:
- **Engine**: Three.js with orthographic top-down camera
- **Rendering**: 2.5D animated billboard sprites (always face camera)
- **Performance**: Fixed 60Hz timestep, object pooling mandatory, max 1,500 entities
- **Determinism**: All randomness uses `SeededRandom` (no `Math.random()`)

**Directory Structure**:
- `components/game/entities/` - Player, Enemy classes
- `components/game/systems/` - SpawnSystem, AbilitySystem, LevelUpSystem, VFXManager, EventSystem
- `components/game/data/` - Weapon stats, enemy data, stage configs
- `components/game/core/` - Game engine core loop
- `components/game/screens/` - Menu screens (MainMenu, GameOver, etc.)
- `components/game/ui/` - HUD components
- `components/game/utils/` - Helper functions

**Core Systems**:
- **SpawnSystem**: Ring-based enemy spawning, wave management, elite spawns
- **AbilitySystem**: Auto-attacking weapons, evolution system
- **LevelUpSystem**: XP collection, level progression, upgrade selection
- **VFXManager**: Particle effects, damage numbers, screen shake

**Gameplay Loop**:
1. WASD movement (auto-attack weapons)
2. Collect XP gems from defeated enemies
3. Level up → Pick 1 of 3 upgrades
4. Max weapon level (5) + passive item = weapon evolution

See `SLAVIC_SURVIVORS_GUIDE.md` for detailed game design principles.

## Environment Variables

Required in `.env.local`:
```bash
# HandCash Credentials
HANDCASH_APP_ID=your_app_id
HANDCASH_APP_SECRET=your_app_secret

# Admin Configuration
ADMIN_HANDLE=admin_handcash_handle
BUSINESS_AUTH_TOKEN=business_wallet_token

# Database
DATABASE_URL=postgresql://...neon.tech/dbname?sslmode=require

# Security
SERVER_TOKEN_PEPPER=random_32_byte_hex

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_BUSINESS_HANDLE=business_handle_id
WEBSITE_URL=https://your-deployment-url.vercel.app/
```

## API Routes Structure

```
app/api/
├── auth/               # Authentication (login, callback, profile, logout)
├── admin/              # Admin-only endpoints (requires ADMIN_HANDLE)
│   ├── payment-requests/
│   ├── items/          # Item operations (transfer, burn)
│   ├── item-templates/ # Template management
│   ├── mint/           # Item minting
│   ├── collections/    # Collection management
│   ├── inventory/      # Business inventory
│   ├── payments/       # Business payments
│   └── balance/        # Business wallet balance
├── payments/           # User payments (send, balance, rate)
├── inventory/          # User inventory
├── items/              # User item transfer
├── friends/            # User friends list
├── collections/        # Collections metadata
├── levels/             # Game levels API
├── replays/            # Game replays
├── stats/              # Game statistics
└── webhooks/           # Webhook handlers
```

## Creating Protected API Routes

Use middleware helpers for authentication:

```typescript
import { requireAuth } from "@/lib/auth-middleware"
import { requireAdmin } from "@/lib/admin-middleware"
import { NextRequest, NextResponse } from "next/server"

// User-authenticated route
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request)
  if (!authResult.success) return authResult.response

  const { privateKey, session } = authResult
  // Your logic here
}

// Admin-only route
export async function POST(request: NextRequest) {
  const adminResult = await requireAdmin(request)
  if (!adminResult.success) return adminResult.response

  const { businessAuthToken } = adminResult
  // Your logic here
}
```

## Game Development

### Adding New Game Content

Follow the entity-component pattern:
1. Define data/stats in `components/game/data/`
2. Create entity class in `components/game/entities/`
3. Register in appropriate system (`AbilitySystem`, `SpawnSystem`)
4. Add sprite sheet to `public/sprites/`

### Performance Requirements

- **Object pooling** is mandatory for repeated entities
- Never `new` or `delete` inside the game loop
- Target 60 FPS at all times
- Hard cap: 1,500 simultaneous entities
- Use `SeededRandom` instead of `Math.random()`

### Sprite System

Sprites use AI-generated sprite sheets with animation frames:
- Format: PNG sprite sheets with transparent backgrounds
- Naming: `{entity}-{animation}.png` (e.g., `player-idle.png`)
- Billboarding: All sprites always face camera
- Management: VFXManager handles rendering and pooling

### Mathematical Balance System

The game uses a comprehensive mathematical balance system for enemy spawning and difficulty curves:

- Three-phase difficulty curve (Early/Mid/Late game)
- Smooth sigmoid transitions between phases
- Boss waves every 5 minutes with 3.5x HP and 1.75x spawn multipliers
- Power gap coefficient maintains player advantage at 15-25% above enemy threat
- Overflow protection and performance caps

**Regenerating Timelines:**
```bash
npx tsx scripts/regenerate-timelines.ts
```

Edit configuration in the script to adjust enemy spawn rates, boss/elite events, enemy progressions, and level duration.

### Performance Profiling

Performance profiling system for analyzing rendering with hundreds of enemies:

**Key Components:**
- `PerformanceProfiler` (`components/game/core/`) - Core profiling engine
- `ProfiledGameLoop` - Drop-in GameLoop replacement with profiling
- `PerformanceOverlay` (`components/game/ui/`) - Real-time visual overlay
- `BenchmarkMode` (`components/game/debug/`) - Stress testing tool

**Quick Usage:**
- Press `F3` to toggle performance overlay
- Press `F4` to export detailed performance report
- Console: `benchmark.start('heavy')` to spawn 500 enemies
- Console: `benchmark.help()` for all commands

## Database Patterns

All database operations use Drizzle ORM:

```typescript
import { db } from "@/lib/db"
import { users, payments } from "@/lib/schema"
import { eq } from "drizzle-orm"

// Insert
await db.insert(users).values({ id: "123", handle: "$user" })

// Query
const user = await db.select().from(users).where(eq(users.id, "123"))

// Update
await db.update(users).set({ lastSeen: new Date() }).where(eq(users.id, "123"))
```

Use storage modules for complex operations (e.g., `users-storage.ts`).

## Security Best Practices

The template implements enterprise-grade security:
- ✅ Private keys in HTTP-only cookies (XSS protection)
- ✅ CSRF protection with OAuth state validation (RFC 9700)
- ✅ Session metadata tracking (hijacking detection)
- ✅ Comprehensive audit logging
- ✅ Timing-safe token comparison
- ✅ 30-day session expiration

See `SECURITY.md` for complete security documentation.

## Common Patterns

### Using Auth Context in Components
```tsx
import { useAuth } from "@/lib/auth-context"

export function MyComponent() {
  const { user, isAuthenticated, isLoading, login, logout } = useAuth()

  if (isLoading) return <div>Loading...</div>
  if (!isAuthenticated) return <button onClick={login}>Login</button>

  return <div>Hello, {user.publicProfile.displayName}!</div>
}
```

### HandCash Service Usage
```typescript
import { handcashService } from "@/lib/handcash-service"

// Get profile
const profile = await handcashService.getUserProfile(privateKey)

// Send payment
const result = await handcashService.sendPayment(privateKey, {
  destination: "$handle",
  amount: 0.10,
  currency: "USD"
})
```

## Important Notes

- **Path Alias**: Use `@/` for imports (e.g., `@/lib/utils`)
- **TypeScript**: Strict mode enabled
- **React**: Version 19 (uses new React Compiler features)
- **Next.js**: App Router only (no Pages Router)
- **Styling**: Tailwind v4 with custom theme in `app/globals.css`
- **Icons**: Lucide React (e.g., `import { User } from "lucide-react"`)

## Documentation Files

- `README.md` - Project overview and quick start
- `SECURITY.md` - Complete security architecture
- `DATABASE.md` - Database setup and schema
- `docs/MODULAR_STRUCTURE.md` - Feature organization and removal guide
- `SLAVIC_SURVIVORS_GUIDE.md` - Game design principles and rules
- `components/widgets/README.md` - Widget usage examples
- `scripts/BULK_PAYMENT_README.md` - Bulk payment script documentation
- `scripts/SIMULATION_README.md` - Game simulation documentation

## Game Level Editor

The project includes a comprehensive level editor (`components/game/debug/LevelEditor.tsx`) with:
- **Levels Tab**: Create, duplicate, delete, import/export custom levels
- **Timeline Tab**: Configure enemy spawns with types, counts, elite/boss flags
- **Meshes Tab**: Place 3D obstacles with scale/rotation controls
- **Paint Tab**: Scatter decorative elements or paint terrain colors
- **Settings Tab**: Configure difficulty, theme colors, world size, available enemies
- **Visual Editor**: 3D isometric preview with camera controls (WASD pan, mouse wheel zoom)

Custom levels are stored via `lib/custom-levels-storage.ts` with API-first approach (localhost only) and localStorage fallback.

## Voice Generation (MiniMax TTS)

When generating voicelines for the game using MiniMax TTS:
- **Always use voice ID**: `Russian_AttractiveGuy`
- Output directory: `public/audio/voicelines/`
- Timeline voicelines go in: `public/audio/voicelines/timeline/`
