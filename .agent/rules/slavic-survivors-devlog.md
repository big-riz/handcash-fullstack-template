---
trigger: always_on
---

---
description: 
alwaysApply: true
---

# Slavic Survivors Devlog Documentation

When making changes to the Slavic Survivors game (any file in `components/game/`), you MUST document the change to the devlog.

## Devlog Entry Requirement

After completing any feature work, run the devlog script:

```bash
node scripts/devlog.js <type> "<one-line description>"
```

## Entry Types

| Type | Use For |
|---|---|
| `add` | New features, new weapons, new systems, new UI elements |
| `fix` | Bug fixes, corrections, error handling improvements |
| `rem` | Removed features, deleted code, deprecated functionality |
| `upd` | Updates to existing features, balance changes, tweaks |

## Entry Format

Write entries as short, clear one-liners:

```bash
# Good examples
node scripts/devlog.js add "Implemented nuclear pigeon companion"
node scripts/devlog.js fix "Fixed enemy spawn rate scaling in frozen waste"
node scripts/devlog.js rem "Removed deprecated test weapon"
node scripts/devlog.js upd "Increased dagger damage from 15 to 18"

# Bad examples (too verbose)
node scripts/devlog.js add "Added a new feature where players can now use nuclear pigeons as companions that fire projectiles at enemies"
```

## When to Log

- **ALWAYS** log after completing a feature, fix, or change
- Log at the end of your implementation, not during
- One entry per logical change (group related micro-changes)

## Example Workflow

1. User asks for a new weapon
2. Implement the weapon in `components/game/systems/`
3. Test and verify it works
4. Run: `node scripts/devlog.js add "Implemented <weapon name> weapon"`
