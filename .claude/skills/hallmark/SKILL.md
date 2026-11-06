---
name: hallmark
description: Hallmark (lite) for CareSync. Use only when the user names Hallmark or asks to "unslop" the UI. Polish the existing Angular screens in place so they read as designed, not generated. No new pages, no screenshots, no before/after captures.
---

# Hallmark (lite)

A trimmed copy of [nutlope/hallmark](https://github.com/nutlope/hallmark) (MIT, see LICENSE; files from commit 407fa68).
Only what a **polish** of an existing app needs is kept:

- `references/gates.md`: the list of tells and their fixes (Floor = never waivable, Reflex, Finish).
- `scripts/sloplint.mjs`: the static linter. Zero dependencies, no network. It mentions craft.md in some fix
  hints; that file is not kept (see the upstream repo if needed).

## How to run

```
node .claude/skills/hallmark/scripts/sloplint.mjs src/app src/styles.css --scope app --genre modern-minimal
```

Static only. Never pass `--render`, `--url`, `--before` or `--kept`: those open a browser and write
screenshots and records to `.hallmark/`, which this project does not want. The owner checks the result locally.

## Polish rules (from Hallmark's redesign.md, depth "polish")

- **Fix in place, never restructure.** Tokens, colour, type, motion, states, contrast, single elements: fold an
  eyebrow into its heading, add a focus ring, flatten a gradient, name a transition. No moving sections, no new
  layout, no new components.
- **Keep the wiring.** Every link, form, field, handler, route, id, `name`, `type`, `data-testid` and API call stays.
- **Keep the content.** Facts, claims, prices, names stay as found; list doubtful claims for the owner instead of
  removing them. Reword only copy a copy gate names (19, 54, 58, 63, 69) and list each change.
- **Keep the house sizes.** Buttons sm 26 / md 32 / lg 38px, filter controls 38px: the owner chose these (app range).
- **App scope.** These are app screens: no hero, fold, section-count or word-budget gates; density is the design.
- Structural findings (layout, composition) are printed for the owner, not rebuilt.
