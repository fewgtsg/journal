# Goals and Entry Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build goal management, journal-to-goal links with optional progress notes, and a goal history timeline without turning the journal into a task manager.

**Architecture:** Add an independent `src/goals/` module that follows the existing repository and hook pattern. Extend the journal repository so entry content and goal links load and save together, using a SQLite transaction for the logical save operation. Split the current application surface into focused journal, goal, and goal-context components while keeping navigation state in `App.tsx`.

**Tech Stack:** Tauri 2, React 18, TypeScript, SQLite through `@tauri-apps/plugin-sql`, Vitest, Testing Library, lucide-react

---

## File Structure

### Create

- `src/goals/types.ts` — goal statuses, goal drafts, timeline entry types, and validation helpers.
- `src/goals/goalRepository.ts` — persistence contract for goal list, detail, timeline, and save behavior.
- `src/goals/tauriSqlGoalRepository.ts` — SQLite implementation and row mapping for goals and timelines.
- `src/goals/useGoals.ts` — React state for goal filters, selected goal, draft editing, saving, and timeline loading.
- `src/goals/goalRepository.test.ts` — goal validation and repository contract tests.
- `src/goals/tauriSqlGoalRepository.test.ts` — SQLite row mapping tests.
- `src/goals/useGoals.test.tsx` — goal hook behavior tests.
- `src/components/JournalView.tsx` — the existing daily editor surface.
- `src/components/GoalContextPanel.tsx` — linked goals, candidate selection, progress notes, and AI preview panel.
- `src/components/GoalsView.tsx` — goal list, filters, detail editor, and linked-entry timeline.
- `src/components/AppSidebar.tsx` — shared brand, entry list, and app navigation.
- `src/components/GoalsView.test.tsx` — timeline navigation and ended-goal display tests.

### Modify

- `src-tauri/src/lib.rs` — add SQLite migrations for `goals` and `entry_goals`.
- `src/journal/types.ts` — add entry-goal link draft and persisted entry-with-links types.
- `src/journal/entryRepository.ts` — load and save an entry together with its goal links.
- `src/journal/tauriSqlEntryRepository.ts` — query links and transactionally replace them during save.
- `src/journal/entryRepository.test.ts` — update contract coverage for links.
- `src/journal/tauriSqlEntryRepository.test.ts` — add entry-goal row mapping coverage.
- `src/journal/useJournalEntries.ts` — expose linked-goal draft state and preserve it on failures.
- `src/journal/useJournalEntries.test.tsx` — cover link editing, saving, and failure preservation.
- `src/App.tsx` — own view navigation and compose the extracted components.
- `src/data/previewData.ts` — remove mock goals after real goal data is connected.
- `src/styles.css` — style goal management, goal linking, and responsive layouts.
- `README.md` — document the goal workflow in the current feature list.

## Task 1: Define Goal Types and Repository Contract

**Files:**
- Create: `src/goals/types.ts`
- Create: `src/goals/goalRepository.ts`
- Create: `src/goals/goalRepository.test.ts`

- [ ] **Step 1: Write failing tests for goal validation and repository behavior**

```ts
import { describe, expect, it } from "vitest";
import type { GoalRepository } from "./goalRepository";
import {
  createEmptyGoalDraft,
  validateGoalDraft,
  type Goal,
  type GoalDraft,
  type GoalStatus,
} from "./types";

class InMemoryGoalRepository implements GoalRepository {
  private goals: Goal[] = [];

  async list(statuses?: GoalStatus[]): Promise<Goal[]> {
    return this.goals
      .filter((goal) => !statuses || statuses.includes(goal.status))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: number): Promise<Goal | null> {
    return this.goals.find((goal) => goal.id === id) ?? null;
  }

  async timeline() {
    return [];
  }

  async save(draft: GoalDraft): Promise<Goal> {
    const error = validateGoalDraft(draft);
    if (error) throw new Error(error);
    const existing = draft.id ? await this.get(draft.id) : null;
    const saved: Goal = {
      ...draft,
      id: existing?.id ?? this.goals.length + 1,
      createdAt: existing?.createdAt ?? "2026-06-03T10:00:00.000Z",
      updatedAt: "2026-06-03T10:30:00.000Z",
    };
    this.goals = [...this.goals.filter((goal) => goal.id !== saved.id), saved];
    return saved;
  }
}

describe("GoalRepository contract", () => {
  it("creates a useful empty goal draft", () => {
    expect(createEmptyGoalDraft()).toEqual({
      name: "",
      description: "",
      status: "进行中",
      stage: "",
      progressNote: "",
    });
  });

  it("requires a name and a supported status", () => {
    expect(validateGoalDraft(createEmptyGoalDraft())).toBe("目标名称不能为空");
    expect(
      validateGoalDraft({
        ...createEmptyGoalDraft(),
        name: "发布个人成长应用",
        status: "未知" as GoalStatus,
      }),
    ).toBe("目标状态无效");
  });

  it("creates, updates, and filters goals without deleting history", async () => {
    const repository = new InMemoryGoalRepository();
    const created = await repository.save({
      ...createEmptyGoalDraft(),
      name: "发布个人成长应用",
      stage: "MVP 开发",
    });
    await repository.save({ ...created, status: "已完成" });

    expect(await repository.list(["进行中", "暂停"])).toEqual([]);
    expect(await repository.list(["已完成"])).toHaveLength(1);
    expect(await repository.get(created.id)).toMatchObject({
      name: "发布个人成长应用",
      status: "已完成",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/goals/goalRepository.test.ts`

Expected: FAIL because `./types` and `./goalRepository` do not exist.

- [ ] **Step 3: Implement goal types, validation, and repository interface**

```ts
// src/goals/types.ts
export const goalStatuses = ["进行中", "暂停", "已完成", "已放弃"] as const;

export type GoalStatus = (typeof goalStatuses)[number];

export type Goal = {
  id: number;
  name: string;
  description: string;
  status: GoalStatus;
  stage: string;
  progressNote: string;
  createdAt: string;
  updatedAt: string;
};

export type GoalDraft = Omit<Goal, "id" | "createdAt" | "updatedAt"> & {
  id?: number;
};

export type GoalTimelineEntry = {
  entryId: number;
  date: string;
  title: string;
  body: string;
  mood: string;
  progressNote: string;
};

export function createEmptyGoalDraft(): GoalDraft {
  return {
    name: "",
    description: "",
    status: "进行中",
    stage: "",
    progressNote: "",
  };
}

export function validateGoalDraft(draft: GoalDraft): string | null {
  if (!draft.name.trim()) return "目标名称不能为空";
  if (!goalStatuses.includes(draft.status)) return "目标状态无效";
  return null;
}

export function isGoalLinkCandidate(goal: Goal): boolean {
  return goal.status === "进行中" || goal.status === "暂停";
}
```

```ts
// src/goals/goalRepository.ts
import type {
  Goal,
  GoalDraft,
  GoalStatus,
  GoalTimelineEntry,
} from "./types";

export interface GoalRepository {
  list(statuses?: GoalStatus[]): Promise<Goal[]>;
  get(id: number): Promise<Goal | null>;
  timeline(id: number): Promise<GoalTimelineEntry[]>;
  save(draft: GoalDraft): Promise<Goal>;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/goals/goalRepository.test.ts`

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit**

```bash
git add src/goals/types.ts src/goals/goalRepository.ts src/goals/goalRepository.test.ts
git commit -m "Define goal repository contract"
```

## Task 2: Add Goal and Entry-Link SQLite Migrations

**Files:**
- Modify: `src-tauri/src/lib.rs`

- [ ] **Step 1: Add migration version 2 after the existing entries migration**

```rust
Migration {
    version: 2,
    description: "create_goals_and_entry_goals_tables",
    sql: r#"
        PRAGMA foreign_keys = ON;

        CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL CHECK(length(trim(name)) > 0),
            description TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL DEFAULT '进行中'
                CHECK(status IN ('进行中', '暂停', '已完成', '已放弃')),
            stage TEXT NOT NULL DEFAULT '',
            progress_note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS entry_goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            entry_id INTEGER NOT NULL,
            goal_id INTEGER NOT NULL,
            progress_note TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(entry_id) REFERENCES entries(id) ON DELETE CASCADE,
            FOREIGN KEY(goal_id) REFERENCES goals(id) ON DELETE RESTRICT,
            UNIQUE(entry_id, goal_id)
        );

        CREATE INDEX IF NOT EXISTS idx_entry_goals_entry_id
            ON entry_goals(entry_id);
        CREATE INDEX IF NOT EXISTS idx_entry_goals_goal_id
            ON entry_goals(goal_id);
    "#,
    kind: MigrationKind::Up,
},
```

- [ ] **Step 2: Verify the Rust project compiles**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: PASS with no migration syntax compilation errors.

- [ ] **Step 3: Commit**

```bash
git add src-tauri/src/lib.rs
git commit -m "Add goals and entry links database migration"
```

## Task 3: Implement the SQLite Goal Repository

**Files:**
- Create: `src/goals/tauriSqlGoalRepository.ts`
- Create: `src/goals/tauriSqlGoalRepository.test.ts`

- [ ] **Step 1: Write failing row-mapping tests**

```ts
import { describe, expect, it } from "vitest";
import {
  mapGoalRow,
  mapGoalTimelineRow,
} from "./tauriSqlGoalRepository";

describe("TauriSqlGoalRepository row mapping", () => {
  it("maps a goal row", () => {
    expect(
      mapGoalRow({
        id: 2,
        name: "发布个人成长应用",
        description: "做一个真正愿意每天使用的产品。",
        status: "进行中",
        stage: "MVP 开发",
        progress_note: "已完成本地持久化。",
        created_at: "2026-06-03 10:00:00",
        updated_at: "2026-06-03 10:30:00",
      }),
    ).toMatchObject({
      id: 2,
      name: "发布个人成长应用",
      status: "进行中",
      stage: "MVP 开发",
      progressNote: "已完成本地持久化。",
    });
  });

  it("maps a goal timeline row", () => {
    expect(
      mapGoalTimelineRow({
        entry_id: 7,
        date: "2026-06-03",
        title: "数据库保存完成",
        body: "今天让记录真正保存下来了。",
        mood: "清晰",
        progress_note: "完成 SQLite 持久化。",
      }),
    ).toEqual({
      entryId: 7,
      date: "2026-06-03",
      title: "数据库保存完成",
      body: "今天让记录真正保存下来了。",
      mood: "清晰",
      progressNote: "完成 SQLite 持久化。",
    });
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npm test -- src/goals/tauriSqlGoalRepository.test.ts`

Expected: FAIL because `tauriSqlGoalRepository.ts` does not exist.

- [ ] **Step 3: Implement SQLite goal queries and mappings**

```ts
import Database from "@tauri-apps/plugin-sql";
import type { GoalRepository } from "./goalRepository";
import {
  validateGoalDraft,
  type Goal,
  type GoalDraft,
  type GoalStatus,
  type GoalTimelineEntry,
} from "./types";

export type GoalRow = {
  id: number;
  name: string;
  description: string;
  status: GoalStatus;
  stage: string;
  progress_note: string;
  created_at: string;
  updated_at: string;
};

export type GoalTimelineRow = {
  entry_id: number;
  date: string;
  title: string;
  body: string;
  mood: string;
  progress_note: string;
};

export function mapGoalRow(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    stage: row.stage,
    progressNote: row.progress_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapGoalTimelineRow(row: GoalTimelineRow): GoalTimelineEntry {
  return {
    entryId: row.entry_id,
    date: row.date,
    title: row.title,
    body: row.body,
    mood: row.mood,
    progressNote: row.progress_note,
  };
}
```

Implement `TauriSqlGoalRepository` with:

```ts
async list(statuses?: GoalStatus[]): Promise<Goal[]>
async get(id: number): Promise<Goal | null>
async timeline(id: number): Promise<GoalTimelineEntry[]>
async save(draft: GoalDraft): Promise<Goal>
```

Use parameterized SQL. `list()` orders by `updated_at DESC, id DESC`. `timeline()` joins `entry_goals` to `entries` and orders by `entries.date DESC`. `save()` validates with `validateGoalDraft`, inserts when `draft.id` is absent, and updates when it is present.

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- src/goals/tauriSqlGoalRepository.test.ts`

Expected: PASS with 2 tests.

- [ ] **Step 5: Commit**

```bash
git add src/goals/tauriSqlGoalRepository.ts src/goals/tauriSqlGoalRepository.test.ts
git commit -m "Persist goals with SQLite"
```

## Task 4: Extend Journal Persistence With Goal Links

**Files:**
- Modify: `src/journal/types.ts`
- Modify: `src/journal/entryRepository.ts`
- Modify: `src/journal/entryRepository.test.ts`
- Modify: `src/journal/tauriSqlEntryRepository.ts`
- Modify: `src/journal/tauriSqlEntryRepository.test.ts`

- [ ] **Step 1: Write failing contract tests for entry goal links**

Add these types to the tests:

```ts
export type EntryGoalLinkDraft = {
  goalId: number;
  progressNote: string;
};

export type EntryGoalLink = EntryGoalLinkDraft & {
  goalName: string;
  goalStatus: GoalStatus;
  goalStage: string;
};

export type EntryWithGoals = {
  entry: Entry;
  goalLinks: EntryGoalLink[];
};
```

Update the in-memory repository contract to:

```ts
getByDate(date: string): Promise<EntryWithGoals | null>;
save(entry: EntryDraft, goalLinks: EntryGoalLinkDraft[]): Promise<EntryWithGoals>;
```

Add a test that saves two links, updates one progress note, removes the other, and confirms only the updated link remains.

- [ ] **Step 2: Run the journal repository tests to verify they fail**

Run: `npm test -- src/journal/entryRepository.test.ts src/journal/tauriSqlEntryRepository.test.ts`

Expected: FAIL because journal link types and repository signatures do not exist.

- [ ] **Step 3: Add journal link types and update the repository contract**

```ts
// Add to src/journal/types.ts
import type { GoalStatus } from "../goals/types";

export type EntryGoalLinkDraft = {
  goalId: number;
  progressNote: string;
};

export type EntryGoalLink = EntryGoalLinkDraft & {
  goalName: string;
  goalStatus: GoalStatus;
  goalStage: string;
};

export type EntryWithGoals = {
  entry: Entry;
  goalLinks: EntryGoalLink[];
};
```

```ts
// src/journal/entryRepository.ts
import type {
  Entry,
  EntryDraft,
  EntryGoalLinkDraft,
  EntryWithGoals,
} from "./types";

export interface EntryRepository {
  list(): Promise<Entry[]>;
  getByDate(date: string): Promise<EntryWithGoals | null>;
  save(
    entry: EntryDraft,
    goalLinks: EntryGoalLinkDraft[],
  ): Promise<EntryWithGoals>;
}
```

- [ ] **Step 4: Implement SQLite entry-link loading and transactional saving**

Add an `EntryGoalRow` mapper and a private `getGoalLinks(entryId)` query that joins `entry_goals` to `goals`.

Change `getByDate()` to return:

```ts
return row
  ? {
      entry: mapEntryRow(row),
      goalLinks: await this.getGoalLinks(row.id),
    }
  : null;
```

Change `save()` to:

1. Start `BEGIN IMMEDIATE`.
2. Upsert the entry.
3. Reload the saved entry ID.
4. Delete existing `entry_goals` rows for that entry.
5. Insert each supplied link with parameterized SQL.
6. Commit.
7. Roll back on any error and rethrow.
8. Return the persisted entry with links.

Use `try/catch` so a failed link insert cannot leave a partially updated entry.

- [ ] **Step 5: Run the journal repository tests to verify they pass**

Run: `npm test -- src/journal/entryRepository.test.ts src/journal/tauriSqlEntryRepository.test.ts`

Expected: PASS with link contract and mapping coverage.

- [ ] **Step 6: Commit**

```bash
git add src/journal/types.ts src/journal/entryRepository.ts src/journal/entryRepository.test.ts src/journal/tauriSqlEntryRepository.ts src/journal/tauriSqlEntryRepository.test.ts
git commit -m "Persist journal goal links atomically"
```

## Task 5: Add Goal and Journal-Link React State

**Files:**
- Create: `src/goals/useGoals.ts`
- Create: `src/goals/useGoals.test.tsx`
- Modify: `src/journal/useJournalEntries.ts`
- Modify: `src/journal/useJournalEntries.test.tsx`

- [ ] **Step 1: Write failing hook tests**

For `useGoals`, cover:

- Initial list uses statuses `进行中` and `暂停`.
- Selecting a goal loads its draft and reverse-chronological timeline.
- Creating a new draft and saving it refreshes the list.
- Save failure preserves the edited draft and exposes the error.

For `useJournalEntries`, cover:

```ts
act(() => {
  result.current.addGoalLink(2);
  result.current.updateGoalLink(2, { progressNote: "完成 SQLite 持久化。" });
});

expect(result.current.goalLinks).toEqual([
  { goalId: 2, progressNote: "完成 SQLite 持久化。" },
]);
```

Also add a repository that rejects `save()` and assert that the entry draft and goal links remain unchanged after the failure.

- [ ] **Step 2: Run the hook tests to verify they fail**

Run: `npm test -- src/goals/useGoals.test.tsx src/journal/useJournalEntries.test.tsx`

Expected: FAIL because `useGoals` and journal link actions do not exist.

- [ ] **Step 3: Implement `useGoals`**

Expose:

```ts
{
  goals,
  selectedGoal,
  timeline,
  draft,
  statuses,
  loading,
  saving,
  error,
  dirty,
  setStatuses,
  selectGoal,
  createGoal,
  updateDraft,
  saveDraft,
  refresh,
}
```

Keep the selected goal visible if timeline loading fails. Validate through the repository and preserve the draft on save failure.

- [ ] **Step 4: Extend `useJournalEntries` with goal-link draft state**

Expose:

```ts
goalLinks,
addGoalLink(goalId: number),
removeGoalLink(goalId: number),
updateGoalLink(goalId: number, changes: Partial<EntryGoalLinkDraft>),
```

When loading a date, map persisted links to `{ goalId, progressNote }`. When saving, call `repository.save(draft, goalLinks)`. Mark the journal dirty for all link changes, and do not clear the draft or links when saving fails.

- [ ] **Step 5: Run the hook tests to verify they pass**

Run: `npm test -- src/goals/useGoals.test.tsx src/journal/useJournalEntries.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/goals/useGoals.ts src/goals/useGoals.test.tsx src/journal/useJournalEntries.ts src/journal/useJournalEntries.test.tsx
git commit -m "Manage goal and journal link state"
```

## Task 6: Build Goal Management and Journal Linking UI

**Files:**
- Create: `src/components/AppSidebar.tsx`
- Create: `src/components/JournalView.tsx`
- Create: `src/components/GoalContextPanel.tsx`
- Create: `src/components/GoalsView.tsx`
- Create: `src/components/GoalsView.test.tsx`
- Modify: `src/App.tsx`
- Modify: `src/data/previewData.ts`
- Modify: `src/styles.css`

- [ ] **Step 1: Write failing component tests for goal timeline navigation**

```tsx
// @vitest-environment jsdom

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoalsView } from "./GoalsView";

describe("GoalsView", () => {
  it("shows ended goals and navigates from a timeline item to its journal date", () => {
    const onOpenEntry = vi.fn();
    render(
      <GoalsView
        goals={[{
          id: 1,
          name: "发布个人成长应用",
          description: "",
          status: "已完成",
          stage: "发布",
          progressNote: "",
          createdAt: "2026-06-01",
          updatedAt: "2026-06-03",
        }]}
        selectedGoalId={1}
        draft={{
          id: 1,
          name: "发布个人成长应用",
          description: "",
          status: "已完成",
          stage: "发布",
          progressNote: "",
        }}
        timeline={[{
          entryId: 7,
          date: "2026-06-03",
          title: "完成第一版",
          body: "今天完成了第一版。",
          mood: "清晰",
          progressNote: "完成目标管理。",
        }]}
        statuses={["已完成"]}
        loading={false}
        saving={false}
        error={null}
        dirty={false}
        onStatusesChange={() => undefined}
        onSelectGoal={() => undefined}
        onCreateGoal={() => undefined}
        onDraftChange={() => undefined}
        onSave={() => undefined}
        onOpenEntry={onOpenEntry}
      />,
    );

    expect(screen.getByText("已完成")).toBeTruthy();
    fireEvent.click(screen.getByText("完成第一版"));
    expect(onOpenEntry).toHaveBeenCalledWith("2026-06-03");
  });
});
```

- [ ] **Step 2: Run the component test to verify it fails**

Run: `npm test -- src/components/GoalsView.test.tsx`

Expected: FAIL because `GoalsView` does not exist.

- [ ] **Step 3: Extract the existing journal surface into focused components**

Move the existing left sidebar into `AppSidebar.tsx`, the center editor into `JournalView.tsx`, and the right goal/AI panel into `GoalContextPanel.tsx`. Preserve current labels, mood controls, save state, and AI preview behavior.

`GoalContextPanel` receives real goals, persisted links, candidate goals, and callbacks. It shows:

- Linked goal name, status, stage, and optional progress-note input.
- A remove-link icon button.
- An add-goal menu containing only eligible unlinked goals.
- A click target that opens the goal detail.
- The existing optional AI preview below the real goal section.

- [ ] **Step 4: Implement `GoalsView`**

Build:

- Status filter controls for active, paused, completed, and abandoned goals.
- Create-goal action.
- Goal list with status and stage.
- Goal detail form for name, description, status, stage, and progress note.
- Save state and error display.
- Reverse-chronological timeline with date, title fallback, excerpt, mood, and link progress note.
- Timeline item navigation through `onOpenEntry(date)`.

Use existing restrained visual language, lucide icons, compact controls, and no task-management UI.

- [ ] **Step 5: Compose repositories, hooks, and navigation in `App.tsx`**

Keep application navigation state:

```ts
type AppView = "journal" | "goals";
```

Instantiate `TauriSqlEntryRepository` and `TauriSqlGoalRepository` with `useMemo`. Use `useJournalEntries` and `useGoals`. Selecting a goal opens the goals view. Selecting a timeline entry switches to the journal view and selects that date.

Calculate link candidates with:

```ts
goals.filter(
  (goal) =>
    isGoalLinkCandidate(goal) &&
    !goalLinks.some((link) => link.goalId === goal.id),
);
```

Remove the mock `goals` export from `src/data/previewData.ts`.

- [ ] **Step 6: Add goal-management and linking styles**

Extend `src/styles.css` with stable layouts for:

- Goal list and detail editor.
- Status filters.
- Goal timeline.
- Linked-goal progress inputs.
- Add-goal menu and empty states.
- Responsive behavior that keeps controls readable without overlaps.

Do not add nested cards, oversized headings, or project-management dashboard styling.

- [ ] **Step 7: Run the component test and production build**

Run: `npm test -- src/components/GoalsView.test.tsx`

Expected: PASS.

Run: `npm run build`

Expected: PASS with TypeScript and Vite build success.

- [ ] **Step 8: Commit**

```bash
git add src/components src/App.tsx src/data/previewData.ts src/styles.css
git commit -m "Add goal management and journal linking interface"
```

## Task 7: Document and Verify the Complete Feature

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Update the README feature list**

Document that the app now supports:

- Local journal entry persistence.
- Goal creation and status management.
- Entry-to-goal links with optional progress notes.
- Goal history timelines.

Keep Markdown export and AI marked as future or preview-only where appropriate.

- [ ] **Step 2: Run the full frontend test suite**

Run: `npm test`

Expected: PASS with all journal, goal, hook, mapping, and component tests.

- [ ] **Step 3: Run the frontend production build**

Run: `npm run build`

Expected: PASS.

- [ ] **Step 4: Run the Rust compile check**

Run: `cargo check --manifest-path src-tauri/Cargo.toml`

Expected: PASS.

- [ ] **Step 5: Build the Debian package**

Run: `npm run tauri build -- --bundles deb`

Expected: PASS and produce `src-tauri/target/release/bundle/deb/Journal_0.1.0_amd64.deb`.

- [ ] **Step 6: Perform a desktop smoke test**

Run: `npm run tauri dev`

Verify:

1. Create a goal named `发布个人成长应用`.
2. Link today's journal entry to the goal.
3. Add a link progress note and save the entry.
4. Open the goal detail and confirm the entry appears in the timeline.
5. Change the goal to `已完成`.
6. Confirm the historical link remains visible but the goal is absent from new-link candidates.

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "Document goal management workflow"
```

