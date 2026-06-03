# Journal

A local-first personal growth journal for recording daily experiences, feelings,
reflections, and goal progress.

## Features

- **Daily journal entries** with mood tracking and structured reflection
- **Local SQLite persistence** — all data stays on your device
- **Goal management** — create goals, track status (active / paused / completed / abandoned), and set stages
- **Entry-to-goal links** — connect daily entries to goals with optional progress notes
- **Goal history timelines** — review linked entries in reverse chronological order
- **Markdown export** (planned)
- **AI reflection prompts** (preview)

## Development

Install dependencies and start the Tauri desktop app:

```bash
npm install
npm run tauri dev
```

## Tests

```bash
npm test
npm run build
```

## Build Debian Package

```bash
npm run tauri build -- --bundles deb
```

The package is written to:

```text
src-tauri/target/release/bundle/deb/
```
