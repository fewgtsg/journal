# Journal

A local-first personal growth journal for recording daily experiences, feelings,
reflections, and goal progress.

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
