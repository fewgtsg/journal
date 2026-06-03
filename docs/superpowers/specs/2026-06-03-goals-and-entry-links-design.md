# Goals and Entry Links Design

Date: 2026-06-03

## Purpose

Add goal management and entry-to-goal linking to the personal growth journal. Goals are not tasks or projects. They provide a durable way to connect daily experiences with longer-term growth and to review that growth as a dated journal timeline.

This phase builds on the existing Tauri, React, TypeScript, and SQLite journal app.

## Scope

This phase includes:

- Creating and editing goals.
- Fixed goal statuses: `进行中`, `暂停`, `已完成`, and `已放弃`.
- A free-text stage field for labels such as `第 1 周`, `MVP 开发`, or `准备发布`.
- A goal-level progress note.
- Many-to-many links between journal entries and goals.
- An optional progress note for each entry-to-goal link.
- A goal detail view with a reverse-chronological timeline of linked entries.
- Navigation between a goal timeline entry and the corresponding journal date.

This phase does not include:

- Physical deletion of goals.
- Tasks, milestones, reminders, percentages, charts, or other project-management features.
- Markdown export changes.
- AI goal-link suggestions.
- Goal search or advanced reporting.

## Product Rules

- A goal name is required.
- Goal status must be one of the four fixed values.
- Goal stage is optional free text.
- Goal description and goal-level progress note are optional.
- Goals cannot be physically deleted. The user ends a goal by setting its status to `已完成` or `已放弃`.
- A journal entry can link to multiple goals.
- A goal can link to multiple journal entries.
- The same entry cannot link to the same goal more than once.
- Each entry-to-goal link can contain an optional progress note describing what changed on that date.
- Completed and abandoned goals remain visible in existing entry links and goal history.
- Completed and abandoned goals do not appear as candidates when adding a new link.

## Architecture

Use an independent goal module plus a journal-linking module.

The goal module owns goal types, validation, persistence, listing, filtering, and detail loading. It follows the repository pattern already used by journal entries so that SQLite behavior can be tested separately from React state.

The linking module owns the relationship between an entry and its goals. Journal saving treats the entry content, selected goals, and per-link progress notes as one logical save operation. If any part fails, the editor keeps the complete unsaved draft.

The existing journal editor remains the primary writing surface. Goal management is a separate application view reached from the left navigation. The right context panel connects the current entry to goals without turning the editor into a project-management screen.

## Data Model

### goals

- `id`
- `name`
- `description`
- `status`
- `stage`
- `progress_note`
- `created_at`
- `updated_at`

The `status` column is constrained to `进行中`, `暂停`, `已完成`, or `已放弃`.

### entry_goals

- `id`
- `entry_id`
- `goal_id`
- `progress_note`
- `created_at`
- `updated_at`

The table has foreign keys to `entries` and `goals`, plus a unique constraint on `(entry_id, goal_id)`.

## User Interface

### Goal View

The left navigation `目标` action opens the goal view.

The goal view contains:

- A goal list.
- A status filter.
- A create-goal action.
- A goal detail editor.
- A linked-entry timeline.

The default filter shows goals with status `进行中` and `暂停`. The user can switch filters to view completed or abandoned goals.

The goal detail editor contains:

- Name.
- Description.
- Status.
- Stage.
- Goal-level progress note.
- Save action.

The linked-entry timeline appears below the goal details. It is ordered by entry date descending and shows the entry date, title or fallback label, excerpt, mood when available, and the optional link progress note. Selecting a timeline item returns to the journal editor at that date.

### Journal Goal Panel

The right-side `关联目标` panel displays goals linked to the selected entry.

The user can:

- Add a goal from eligible candidates.
- Remove an existing link.
- Write or edit an optional progress note for each linked goal.
- Select a linked goal to open its detail view.

Eligible candidates include only goals with status `进行中` or `暂停` that are not already linked to the current entry.

## Data Flow

### Create or Edit a Goal

1. The user opens the goal view.
2. The user creates a goal or selects an existing goal.
3. The user edits the goal fields.
4. The frontend validates the required name and fixed status.
5. The goal repository saves the goal to SQLite.
6. The goal list and detail view refresh from persisted data.

### Link Goals to an Entry

1. The user opens or creates a journal entry.
2. The user adds one or more eligible goals in the right panel.
3. The user optionally adds a progress note to each link.
4. The user saves the journal entry.
5. The persistence layer saves the entry and replaces its goal links as one logical operation.
6. The journal editor reloads the persisted entry and links.

### Review a Goal Timeline

1. The user opens a goal detail.
2. The goal repository loads the goal and its linked entries.
3. The timeline displays linked entries in reverse chronological order.
4. The user selects an entry to return to the journal editor at that date.

## Error Handling

- Goal create or update failures preserve the goal form and show a clear error.
- Journal save failures preserve entry content, selected goals, and link progress notes.
- Invalid goal names or statuses are rejected before persistence.
- Database foreign-key and unique constraints protect relationship integrity.
- A failed goal timeline load leaves the selected goal visible and shows an error instead of switching views.
- Existing links to completed or abandoned goals remain readable and removable.

## Testing

Automated tests cover:

- Goal type validation.
- Goal create, update, list, and status filtering behavior.
- SQLite mapping and constraints for goals and entry links.
- Linking an entry to multiple goals.
- Preventing duplicate entry-to-goal links.
- Saving, editing, and removing optional link progress notes.
- Preserving the complete journal draft when saving links fails.
- Filtering completed and abandoned goals out of new-link candidates.
- Keeping historical links visible after a goal is completed or abandoned.
- Loading a goal timeline in reverse chronological order.
- Navigating from a goal timeline item to the corresponding journal date.
- Existing journal tests and the frontend production build.

## Success Criteria

The phase is complete when a user can create a goal, link it to daily entries with optional progress notes, change its status without losing history, and review its growth timeline from the goal view.
