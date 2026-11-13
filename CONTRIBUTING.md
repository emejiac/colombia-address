# Contributing

¡Bienvenido, parce! Issues and PRs in English or Spanish are both fine.

## Setup

```bash
nvm use        # Node 22, see .nvmrc
npm install
npm run test:watch
```

## Before opening a PR

```bash
npm run typecheck
npm run format:check
npm run test:tz   # runs the suite in Bogotá, Tokyo and UTC
```

## Rules of the house

- **Zero runtime dependencies.** If you need one, open an issue first.
- **Every rule needs a source.** Address rules: link the municipal nomenclature guide or a real example (no personal addresses!) in the PR.
- **Dates in, `'YYYY-MM-DD'` out.** Never return `Date` objects from the public API (timezones, you know).
- **Commits** follow [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `chore:`, `test:`.
- Add a line under `Unreleased` in `CHANGELOG.md`.
