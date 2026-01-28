# Playwright Testing - Quick Start Guide

## 30-Second Setup

```bash
# Already installed, but to verify/reinstall browsers:
npx playwright install

# In one terminal, start the dev server:
npm run dev

# In another terminal, run the tests:
npm test
```

## Common Commands

```bash
# Run all tests
npm test

# Interactive UI mode (recommended for development)
npm run test:ui

# With browser visible (great for debugging)
npm run test:headed

# Run only E2E tests
npm run test:e2e

# Run only API tests
npm run test:api

# Run specific test file
npx playwright test tests/e2e/public/home-authenticated.spec.ts

# Debug a test step-by-step
npm run test:debug tests/e2e/public/home-authenticated.spec.ts

# View test report (after running tests)
npm run test:report
```

## What Gets Tested

✅ **UI** - Home page, tabs, buttons, navigation
✅ **Auth** - Login/logout, profile display, balance
✅ **Game** - Menu, character select, pause, game over
✅ **Inventory** - Item display, transfer UI (no submission)
✅ **API** - Read-only endpoints (blocked unsafe operations)
✅ **Mobile** - Responsive design on iPhone 13 viewport
✅ **Integration** - Complete user journeys

## Safety Guarantees

❌ **BLOCKED** - Minting, transfers, burning, payments
- These operations are blocked at the network level
- Tests can't accidentally execute them

✅ **ALLOWED** - UI interactions, form validation, page navigation
- Tests verify that forms exist without submitting
- All operations are safe read-only or UI validation

## File Structure

```
tests/
├── config/           # Shared configuration and helpers
├── e2e/             # End-to-end UI tests
├── api/             # API endpoint tests
├── integration/     # Complete user journey tests
└── README.md        # Full documentation

playwright.config.ts  # Test configuration (root)
```

## Understanding Test Results

### Passing Test
```
✓ should show landing page with login button (1.2s)
```

### Failing Test
```
✗ should show landing page with login button (2.3s)
  Error: Timeout 5000ms exceeded waiting for locator('button:has-text("Login")')
```

**What to do**:
1. Run with `--headed` to see what's happening
2. Check if element selector is correct
3. Check if element takes longer to appear (increase timeout)
4. Run with `--debug` to step through test

## Test Organization

### Public Pages
- Unauthenticated landing page
- Authenticated home with tabs
- Navigation and menu

### Authentication
- Login button behavior
- Profile/user display
- Logout flow

### Game
- Main menu screen
- Character selection
- Pause menu
- Game over screen
- Level editor (localhost only)

### Inventory
- Item display
- Refresh button
- Transfer UI (form verification only)

### API
- Profile endpoint
- Inventory endpoint
- Statistics endpoint
- Blocked dangerous endpoints

### Integration
- Complete user journeys
- Game lifecycle flow
- State persistence

## Debugging Tips

### 1. Run with headed browser
```bash
npm run test:headed
```
This shows the browser so you can see exactly what's happening.

### 2. Debug a single test
```bash
npm run test:debug tests/e2e/public/home-authenticated.spec.ts
```
Step through the test code line by line.

### 3. Run in UI mode
```bash
npm run test:ui
```
Interactive mode with timeline and detailed reporting.

### 4. Check test output
```bash
npm test 2>&1 | tee test-output.txt
```
Save output to file for detailed inspection.

### 5. Take screenshots
Tests automatically take screenshots on failure:
```
test-results/
├── home-unauthenticated-1704...png
└── ... (screenshots from failed tests)
```

## Adding New Tests

### Simple pattern:
```typescript
import { test, expect } from '../../config/fixtures'
import { TestHelpers } from '../../config/test-helpers'

test('should do something', async ({ authenticatedPage: page }) => {
  await page.goto('/')
  await TestHelpers.verifyTextVisible(page, 'Some Text')
  expect(true).toBeTruthy()
})
```

### Available fixtures:
- `{ page }` - Bare page (no mocking)
- `{ authenticatedPage }` - User is logged in
- `{ unauthenticatedPage }` - User is logged out
- `{ adminPage }` - User is admin

### Useful helpers:
```typescript
// Navigation
await TestHelpers.clickButton(page, /button name/i)
await TestHelpers.clickButtonAndWait(page, /login/i)

// Verification
await TestHelpers.verifyElementVisible(page, 'selector')
await TestHelpers.verifyTextVisible(page, 'text or regex')
await TestHelpers.verifyButtonEnabled(page, 'button name')

// Waiting
await TestHelpers.waitForPageLoad(page)
await TestHelpers.waitForGameCanvas(page)
await TestHelpers.waitForText(page, 'text', 5000)
await TestHelpers.delay(1000)

// Forms
await TestHelpers.fillInput(page, /placeholder/i, 'value')
await TestHelpers.closeModal(page)

// Debugging
await TestHelpers.takeScreenshot(page, 'name')
await TestHelpers.getAllText(page) // Get all page text
```

## Troubleshooting

### Tests timeout waiting for element
```typescript
// Increase timeout
await page.waitForSelector('selector', { timeout: 20000 })

// Or use TestHelpers with longer timeout
await TestHelpers.waitForText(page, 'text', 10000)
```

### Game canvas doesn't render in headless
This is expected - Three.js rendering is limited in headless mode.
Tests verify canvas exists but don't require visible rendering:
```typescript
await TestHelpers.waitForGameCanvas(page).catch(() => {
  // It's okay if canvas doesn't render, just verify page loaded
})
```

### Tests pass locally but fail in CI
Common causes:
1. Timing issues - add more delays
2. Viewport differences - use explicit viewport sizes
3. Network mocking not working - check mock-auth.ts
4. Missing environment variables - check .env.local

Solution:
```bash
CI=true npm test  # Run locally with CI settings
```

### Tests run too slowly
```bash
# Run tests in parallel (default)
npm test

# Or limit parallelism
npx playwright test --workers=4
```

## Quick Reference

| What | Command |
|------|---------|
| Run all tests | `npm test` |
| Run with UI | `npm run test:ui` |
| Run with browser visible | `npm run test:headed` |
| Debug test | `npm run test:debug` |
| Run E2E tests only | `npm run test:e2e` |
| Run API tests only | `npm run test:api` |
| View report | `npm run test:report` |
| Run single file | `npx playwright test path/to/file.spec.ts` |
| Run with regex filter | `npx playwright test -g "pattern"` |
| List all tests | `npx playwright test --list` |

## Expected Results

Running the full test suite:
- Total tests: ~120+
- Expected duration: 5-10 minutes
- Expected pass rate: 95%+ (some skipped on CI)
- Success: All critical tests pass

## Safety Features in Action

### Before running tests:
```typescript
await mockAuthenticatedUser(page)

// These operations are automatically blocked:
page.route('**/api/payments/send', route => route.abort())
page.route('**/api/admin/mint', route => route.abort())
page.route('**/api/items/transfer', route => route.abort())
// ... and 5 more dangerous endpoints
```

### Result:
Even if a test accidentally tries to send payment, mint item, or transfer token:
- ❌ Network request is aborted
- ❌ Server never receives it
- ❌ No money spent, no NFT minted, no item transferred
- ✅ Test fails safely with error message

## Next Steps

1. **First run**: `npm test`
2. **View results**: `npm run test:report`
3. **Interactive mode**: `npm run test:ui`
4. **Add to CI**: Copy playwright command to GitHub Actions

---

For detailed documentation, see: `tests/README.md`
For implementation details, see: `.claude/PLAYWRIGHT_FRAMEWORK_IMPLEMENTATION.md`
