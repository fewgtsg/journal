# Tauri SQLite Journal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the approved frontend preview into a Tauri desktop application that stores daily journal entries in SQLite and reloads them after restart.

**Architecture:** Add Tauri 2 to the existing Vite React app and use the official SQL plugin with a `sqlite:journal.db` application-data database. Keep persistence behind an `EntryRepository` interface so the React UI depends on journal behavior rather than SQL details. Replace preview entry fixtures with controlled editor state loaded from the repository while leaving goals and AI panels as preview-only context for this phase.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, `@tauri-apps/plugin-sql`, SQLite, Vitest.

---

## File Structure

- Modify: `package.json` to add Tauri, SQL plugin, and test scripts.
- Modify: `vite.config.ts` for Tauri-compatible development settings.
- Create: `src-tauri/` using Tauri initialization files.
- Modify: `src-tauri/src/lib.rs` to register SQL migrations and the SQL plugin.
- Modify: `src-tauri/tauri.conf.json` to configure Vite commands, bundle metadata, and Debian output.
- Create: `src/journal/types.ts` for the persisted `Entry` model and editor draft type.
- Create: `src/journal/entryRepository.ts` for the persistence interface.
- Create: `src/journal/tauriSqlEntryRepository.ts` for SQLite queries.
- Create: `src/journal/entryRepository.test.ts` for repository contract tests using an in-memory fake.
- Create: `src/journal/useJournalEntries.ts` for loading, selecting, editing, and saving entries.
- Create: `src/journal/useJournalEntries.test.tsx` for save and reload behavior.
- Modify: `src/App.tsx` to use persisted journal state.
- Modify: `src/data/previewData.ts` to keep only moods, goals, and AI preview data.
- Modify: `src/styles.css` to add loading and error states.

## Task 1: Add Tauri and Test Tooling

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`
- Create: `src-tauri/`

- [ ] **Step 1: Install Tauri CLI, API, SQL plugin, Vitest, and Testing Library**

Run:

```bash
npm install @tauri-apps/api @tauri-apps/plugin-sql
npm install -D @tauri-apps/cli vitest jsdom @testing-library/react @testing-library/jest-dom
```

Expected: `package.json` and `package-lock.json` include the new dependencies.

- [ ] **Step 2: Add scripts**

Update `package.json` scripts to include:

```json
{
  "test": "vitest run",
  "tauri": "tauri"
}
```

- [ ] **Step 3: Initialize Tauri against the existing Vite frontend**

Run:

```bash
npx tauri init --ci --app-name Journal --window-title Journal --frontend-dist ../dist --dev-url http://localhost:5173 --before-dev-command "npm run dev" --before-build-command "npm run build"
```

Expected: `src-tauri/` is created without replacing the existing React files.

- [ ] **Step 4: Add the official SQL plugin with SQLite support**

Run:

```bash
npm run tauri add sql
```

Expected: the Rust SQL plugin and frontend permissions are configured.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vite.config.ts src-tauri
git commit -m "Add Tauri desktop application shell"
```

## Task 2: Define the Journal Repository Contract

**Files:**
- Create: `src/journal/types.ts`
- Create: `src/journal/entryRepository.ts`
- Create: `src/journal/entryRepository.test.ts`

- [ ] **Step 1: Write the repository contract test**

Create a test that defines an in-memory `EntryRepository`, saves an entry for `2026-06-03`, lists entries, loads it by date, updates the title, and verifies the update replaces the same date rather than creating a duplicate.

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npm test -- src/journal/entryRepository.test.ts
```

Expected: FAIL because the journal types and repository interface do not exist.

- [ ] **Step 3: Define journal types and repository interface**

Create `src/journal/types.ts` with:

```ts
export type Entry = {
  id: number;
  date: string;
  title: string;
  body: string;
  mood: string;
  whatHappened: string;
  feelings: string;
  learning: string;
  goalRelation: string;
  createdAt: string;
  updatedAt: string;
};

export type EntryDraft = Omit<Entry, "id" | "createdAt" | "updatedAt">;
```

Create `src/journal/entryRepository.ts` with:

```ts
import type { Entry, EntryDraft } from "./types";

export interface EntryRepository {
  list(): Promise<Entry[]>;
  getByDate(date: string): Promise<Entry | null>;
  save(entry: EntryDraft): Promise<Entry>;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run:

```bash
npm test -- src/journal/entryRepository.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/journal
git commit -m "Define journal entry repository contract"
```

## Task 3: Implement SQLite Persistence

**Files:**
- Modify: `src-tauri/src/lib.rs`
- Create: `src/journal/tauriSqlEntryRepository.ts`
- Create: `src/journal/tauriSqlEntryRepository.test.ts`

- [ ] **Step 1: Write mapping tests**

Create tests for a `mapEntryRow` function that converts snake_case SQL rows into the `Entry` TypeScript shape and preserves every reflection field.

- [ ] **Step 2: Run the tests to verify they fail**

Run:

```bash
npm test -- src/journal/tauriSqlEntryRepository.test.ts
```

Expected: FAIL because `mapEntryRow` does not exist.

- [ ] **Step 3: Register the SQLite migration**

Update `src-tauri/src/lib.rs` to initialize `tauri_plugin_sql` with a migration for `sqlite:journal.db`:

```sql
CREATE TABLE IF NOT EXISTS entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  date TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  mood TEXT NOT NULL DEFAULT '',
  what_happened TEXT NOT NULL DEFAULT '',
  feelings TEXT NOT NULL DEFAULT '',
  learning TEXT NOT NULL DEFAULT '',
  goal_relation TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- [ ] **Step 4: Implement the SQL repository**

Create `TauriSqlEntryRepository` that loads `sqlite:journal.db`, lists entries ordered by date descending, gets one entry by date, and performs an SQLite upsert on the unique `date` field. Export `mapEntryRow` for unit testing.

- [ ] **Step 5: Run the mapping tests**

Run:

```bash
npm test -- src/journal/tauriSqlEntryRepository.test.ts
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src-tauri/src/lib.rs src/journal/tauriSqlEntryRepository.ts src/journal/tauriSqlEntryRepository.test.ts
git commit -m "Persist journal entries with SQLite"
```

## Task 4: Connect React Editor State to the Repository

**Files:**
- Create: `src/journal/useJournalEntries.ts`
- Create: `src/journal/useJournalEntries.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/data/previewData.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Write hook tests**

Test that the journal hook:

- loads today's entry when one exists;
- creates an empty draft when today has no entry;
- marks the draft dirty after editing;
- saves the draft through the repository;
- reloads the saved entry after a new hook instance is mounted.

- [ ] **Step 2: Run hook tests to verify they fail**

Run:

```bash
npm test -- src/journal/useJournalEntries.test.tsx
```

Expected: FAIL because the hook does not exist.

- [ ] **Step 3: Implement the journal hook**

Create a hook that accepts an `EntryRepository`, exposes `entries`, `draft`, `selectedDate`, `loading`, `saving`, `error`, and `dirty`, and provides `selectDate`, `updateDraft`, and `saveDraft`.

- [ ] **Step 4: Replace preview entry state in the UI**

Update `App.tsx` to:

- construct a `TauriSqlEntryRepository`;
- render entry list data from the hook;
- use controlled inputs for all journal fields;
- save through `saveDraft`;
- show loading, saving, saved, dirty, and error states;
- keep goals and AI suggestions as preview-only data.

Remove the `entries` fixture from `previewData.ts`.

- [ ] **Step 5: Run hook tests and frontend build**

Run:

```bash
npm test -- src/journal/useJournalEntries.test.tsx
npm run build
```

Expected: tests PASS and Vite build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/data/previewData.ts src/styles.css src/journal
git commit -m "Connect journal editor to persisted entries"
```

## Task 5: Verify the Desktop Persistence Flow

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Run all automated checks**

Run:

```bash
npm test
npm run build
npm run tauri build -- --bundles deb
```

Expected: tests, frontend build, and Debian bundle build succeed.

- [ ] **Step 2: Run the desktop app**

Run:

```bash
npm run tauri dev
```

Expected: the Journal desktop window opens.

- [ ] **Step 3: Perform the persistence smoke test**

In the desktop app:

1. Write a title and body for today's entry.
2. Choose a mood and fill the four reflection fields.
3. Click save.
4. Close the app.
5. Start it again with `npm run tauri dev`.
6. Confirm the same entry reloads from SQLite.

- [ ] **Step 4: Document development commands**

Update `README.md` with:

```markdown
## Development

```bash
npm install
npm run tauri dev
```

## Build Debian Package

```bash
npm run tauri build -- --bundles deb
```
```

- [ ] **Step 5: Commit**

```bash
git add README.md
git commit -m "Document journal desktop development"
```

## Self-Review

- Spec coverage: This plan implements only phase one of the approved MVP: Tauri shell, SQLite daily entries, and persistence after restart. Goals, Markdown export, AI calls, encryption, and cloud sync remain outside this plan.
- Placeholder scan: Every task names exact files, commands, expected results, and required behavior.
- Type consistency: `Entry`, `EntryDraft`, and `EntryRepository` names are used consistently across persistence, hook, and UI tasks.
