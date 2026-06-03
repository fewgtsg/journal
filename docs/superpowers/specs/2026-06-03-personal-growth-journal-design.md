# Personal Growth Journal Design

Date: 2026-06-03

## Product Goal

Build a Linux desktop app for daily personal growth journaling. The first version helps one person record daily experiences, feelings, reflections, and goal progress. It should feel more like a growth review tool than a generic diary.

The app will eventually ship as a Debian package. The MVP should be useful without AI, while allowing optional AI assistance when the user provides an API key.

## MVP Scope

The first version includes:

- Daily entries with free writing and light structured reflection fields.
- Mood tracking.
- Goals with status, stage, and progress notes.
- Many-to-many links between daily entries and goals.
- Local SQLite storage.
- Markdown export so the user's records are not locked into the app.
- Optional AI assistance for gentle follow-up questions and lightweight suggestions.

The first version does not include:

- Encryption or app unlock.
- Cloud sync.
- Multi-user accounts.
- Full task management.
- Habit tracking.
- Weekly or monthly AI reports.
- Built-in hosted AI service.

## Technical Architecture

Use Tauri, React, TypeScript, and SQLite.

Tauri provides the desktop shell, Linux integration, filesystem access, and Debian packaging. React and TypeScript provide the user interface. Rust-side Tauri commands handle SQLite persistence, Markdown export, settings storage, and AI API calls.

The app is local-first. Records are saved to SQLite before any AI action runs. AI calls only use the current entry or explicitly selected context, and failed AI requests must not affect journal saving.

## Application Modules

### Journal

Creates, edits, lists, searches, and displays daily entries. Opening the app defaults to today's entry.

### Goals

Creates and edits goals. A goal has a name, description, status, stage, and progress note. Entries can link to one or more goals.

### Reflection

Stores structured reflection fields for each entry:

- What happened today.
- How I felt.
- What I learned or noticed.
- How this relates to my goals.

### AI Assist

Runs only when configured and triggered by the user. It can generate:

- One to three gentle follow-up questions.
- Mood and theme suggestions.
- Goal-link suggestions.
- A short suggested takeaway.

The user can accept, edit, or ignore AI suggestions.

### Export

Exports records and goals to Markdown files organized by date. Exported files include the entry date, mood, linked goals, free writing, structured reflection fields, and accepted AI suggestions.

### Settings

Stores API base URL, model name, API key setting, data directory, and export directory. The MVP does not promise encrypted secret storage.

## User Interface

The MVP uses a focused three-column layout:

- Left column: date-based entry list, today shortcut, and search.
- Center column: daily editor.
- Right column: goal context and AI assistance.

The daily editor includes:

- Entry date.
- Mood selector.
- Linked goals.
- Free writing area.
- Structured reflection fields.
- Save action.

The right panel includes:

- Linked goals and progress notes.
- AI follow-up questions.
- AI suggestion chips for mood, themes, goal links, and takeaway.

The goals view lists goals with status, stage, recent linked entries, and progress notes. It avoids project-management features such as task boards, milestones, reminders, and completion charts.

## Core Flow

1. The user opens the app and lands on today's entry.
2. The user writes freely and optionally fills structured reflection fields.
3. The user links the entry to one or more goals.
4. The user saves the entry.
5. If AI is configured, the user can request follow-up questions and suggestions.
6. The user accepts, edits, or ignores AI suggestions.
7. The user searches or browses previous entries by date, goal, mood, or theme.
8. The user exports records to Markdown from settings.

## Data Model

### entries

- id
- date
- title
- body
- mood
- what_happened
- feelings
- learning
- goal_relation
- created_at
- updated_at

### goals

- id
- name
- description
- status
- stage
- progress_note
- created_at
- updated_at

### entry_goals

- id
- entry_id
- goal_id
- progress_note
- created_at
- updated_at

### ai_suggestions

- id
- entry_id
- kind
- content
- accepted
- created_at
- updated_at

The `kind` field supports values such as `question`, `mood`, `theme`, `goal_link`, `takeaway`, and `summary`.

### settings

- key
- value
- updated_at

## Error Handling

Saving an entry must preserve unsaved editor content if the database write fails. AI failures show a clear message and never block record saving. Export failures identify the failing directory or file when possible. Missing AI configuration disables or hides AI actions without interrupting the rest of the app.

## Testing

The first implementation should test:

- Entry create, update, list, and search behavior.
- Goal create and update behavior.
- Entry-to-goal linking.
- Markdown export format.
- AI response parsing and fallback behavior.
- Frontend save flow for the daily editor.
- Debian package smoke test: install, launch, create entry, link goal, export Markdown.

## First Frontend Preview

Before implementing full persistence, build a frontend preview that demonstrates the main product shape:

- Three-column layout.
- Today's entry editor.
- Mood selector.
- Linked goal panel.
- Structured reflection fields.
- AI suggestions panel with mock data.
- Export/settings entry point.

The preview should make the product feel calm, private, and focused. It should avoid a marketing-page feel and should present the actual working surface as the first screen.
