# AGENTS.md

This guide is for agentic coding agents working in the Slavic Survivors repository.

## Commands

### Development & Maintenance
- `npm run dev` - Start Next.js dev server (port 3000).
- `npm run test:chaos` - PERIODIC CHECK: Run chaos test to verify every feature on the `/play` endpoint.
- `npm run build` - Build production bundle.
- `npm run lint` - Run ESLint (enforced before commits).
- `npm run db:push` - Sync Drizzle schema to Neon PostgreSQL (local dev).
- `npm run bulk-payment` - Run bulk payment utility script.
- `npm run chaos-test` - Run chaos test on `/play` endpoint.

### Test Execution
**Playwright Tests:**
- `npm run test` - Run all Playwright tests
- `npm run test:chaos` - Run chaos test on `/play` endpoint
- `npm run test:ui` - Run tests with Playwright UI mode
- `npm run test:headed` - Run tests with browser windows visible

**Vitest Tests:**
- `npx vitest run lib/date-utils.test.ts` - Run a specific test file.
- `npx vitest run` - Run all tests once.

## Code Style & Conventions

### Imports & Architecture
- **Path Aliases**: Always use `@/` for project imports (e.g., `import { db } from "@/lib/db"`).
- **Service Pattern**: All HandCash logic must go through `handcashService` in `lib/handcash-service.ts`. Never instantiate SDKs directly in components.
- **Widget + Hook Pattern**: UI components in `components/widgets/` must be pure. Business logic/API calls should live in custom hooks in `hooks/`.
- **Admin Isolation**: Admin features must use `requireAdmin()` middleware in API routes and live in `components/admin/`.

### TypeScript & Naming
- **Strict Typing**: Avoid `any`. Define interfaces for API responses and HandCash profile structures in `lib/schema.ts` or local types.
- **File Naming**: Kebab-case for files (`auth-middleware.ts`). PascalCase for React components (`InventoryDisplay.tsx`).
- **Function Naming**: Use descriptive prefixes: `handle*` for events, `use*` for hooks, `upsert*` for DB operations.

### Formatting & Style
- **Indentation**: 2 spaces.
- **Semicolons**: None (standard JS/TS style used in this repo).
- **Comments**: DO NOT ADD COMMENTS unless explaining complex game engine math or requested. Reference `file_path:line_number` when discussing existing code.
- **Tailwind**: Use Tailwind v4 classes. Prefer utility classes over custom CSS.

### Error Handling & Security
- **API Responses**: Always return `NextResponse.json()` with clear success/error states.
- **Private Keys**: Never log or store `privateKey` in plain text. Use HTTP-only cookies (`private_key`).
- **Audit Logs**: Log security-sensitive events (auth, payments, minting) using `logAuditEvent` from `lib/audit-logger.ts`.
- **Database**: Use Drizzle ORM. Prefer storage modules (e.g., `users-storage.ts`) for complex table interactions.

### Game Engine (Slavic Survivors)
- **Entities**: All game entities must inherit from base classes in `components/game/entities/`.
- **Math**: Use `SeededRandom` for all gameplay-impacting randomness to ensure replay consistency.
- **Performance**: Object pooling is mandatory for bullets, enemies, and particles. Never call `new` or `delete` inside the 60Hz loop.
- **Rendering**: Maintain 2.5D billboard sprite consistency. Sprites must always face the camera.

## CI/CD Expectations
- Run `npm run lint` before finishing any task involving file modifications.
- If modifying `lib/`, check for existing `*.test.ts` and run them to prevent regressions.
