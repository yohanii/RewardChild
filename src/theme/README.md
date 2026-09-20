# RewardChild design system

## Direction

- Use warm neutral surfaces as the shared medieval-fantasy foundation. Reserve blue (`child`), burgundy (`parent`), and green (`bank`) for role identity, not general hierarchy.
- Keep body copy on plain, high-contrast surfaces. Parchment and wood are material cues for contained areas, not page-wide textures.
- Gold communicates coins, rewards, and small decorative emphasis. It is not the default action color.
- System fonts are the baseline. Decorative fonts may later be limited to short display text after Korean readability is verified.

## Component rules

- `ScreenHeader`: one screen title, an optional short subtitle, and at most one primary action.
- `PrimaryButton`: the clearest next action; one dominant button per section. `SecondaryButton`: reversible or supporting actions.
- `FantasyCard`: the default elevated information container. `ParchmentCard`: quest, note, or ledger-like content only.
- `StatusChip`: status or role metadata, never a primary action. Color must be paired with a text label.
- `CoinBadge`: compact reward/value display; do not use it for arbitrary numbers.
- `SectionHeader`: separates content groups and may expose one lightweight text action.
- `ScreenLoading`: full-screen progress only. `StateCard`: empty, error, or blocked states with one recovery action at most.

## Illustration use

- Character art belongs in a hero/header, empty state, section decoration, or role-identification area.
- Do not use concept sheets as full-screen backgrounds or crop their embedded text into production UI.
- Keep text on an opaque or strongly scrimmed surface and preserve a quiet area around controls.
- Use one narrative focal image per viewport; functional information keeps visual priority.
