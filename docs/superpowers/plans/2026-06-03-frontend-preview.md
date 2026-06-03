# Frontend Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a first-screen frontend preview for the personal growth journal so the user can judge whether the product direction feels right.

**Architecture:** Create a Vite React TypeScript app shaped for future Tauri integration. Keep the preview data in local TypeScript fixtures, split the UI into focused components, and use plain CSS for a calm desktop-app working surface.

**Tech Stack:** Vite, React, TypeScript, CSS, future Tauri.

---

## File Structure

- Create: `package.json` for scripts and dependencies.
- Create: `index.html` as the Vite entry page.
- Create: `tsconfig.json` for TypeScript settings.
- Create: `vite.config.ts` for Vite React configuration.
- Create: `src/main.tsx` to mount React.
- Create: `src/App.tsx` to compose the preview screen.
- Create: `src/data/previewData.ts` for mock entries, goals, moods, and AI suggestions.
- Create: `src/styles.css` for layout, responsive behavior, and visual styling.

## Task 1: Project Skeleton

**Files:**
- Create: `package.json`
- Create: `index.html`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `src/main.tsx`

- [ ] **Step 1: Create package metadata and scripts**

Create `package.json`:

```json
{
  "name": "journal",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --host 0.0.0.0",
    "build": "tsc && vite build",
    "preview": "vite preview --host 0.0.0.0"
  },
  "dependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.7",
    "typescript": "^5.7.2",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "lucide-react": "^0.468.0"
  },
  "devDependencies": {}
}
```

- [ ] **Step 2: Create Vite HTML entry**

Create `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Journal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 3: Create TypeScript and Vite config**

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["DOM", "DOM.Iterable", "ES2020"],
    "allowJs": false,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx"
  },
  "include": ["src"],
  "references": []
}
```

Create `vite.config.ts`:

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

- [ ] **Step 4: Create React mount**

Create `src/main.tsx`:

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

- [ ] **Step 5: Commit**

Run:

```bash
git add package.json index.html tsconfig.json vite.config.ts src/main.tsx
git commit -m "Add frontend preview skeleton"
```

## Task 2: Preview Data and Main UI

**Files:**
- Create: `src/data/previewData.ts`
- Create: `src/App.tsx`

- [ ] **Step 1: Create preview data**

Create `src/data/previewData.ts`:

```ts
export const moods = ["Calm", "Heavy", "Clear", "Hopeful", "Restless"];

export const entries = [
  {
    date: "2026-06-03",
    weekday: "Wednesday",
    title: "A clearer direction",
    mood: "Clear",
    excerpt: "I noticed that the product becomes more real when it connects feelings to goals.",
  },
  {
    date: "2026-06-02",
    weekday: "Tuesday",
    title: "Small progress",
    mood: "Calm",
    excerpt: "Finished one difficult conversation and wrote down what I learned from it.",
  },
  {
    date: "2026-06-01",
    weekday: "Monday",
    title: "A tired but honest start",
    mood: "Heavy",
    excerpt: "Energy was low, but I still named the thing I was avoiding.",
  },
];

export const goals = [
  {
    name: "Build a daily reflection rhythm",
    status: "Active",
    stage: "Week 1",
    progress: "Wrote three evenings in a row and noticed the emotional pattern.",
  },
  {
    name: "Ship the personal growth app",
    status: "Active",
    stage: "MVP design",
    progress: "Decided on Tauri, SQLite, Markdown export, and optional AI.",
  },
];

export const aiQuestions = [
  "What part of today felt more important than it looked from the outside?",
  "Which goal did this experience quietly move forward?",
  "What would you like tomorrow-you to remember about this moment?",
];

export const aiSuggestions = {
  themes: ["product clarity", "self-trust", "steady progress"],
  takeaway: "A useful product direction is emerging: write from real experience, then connect it to growth.",
};
```

- [ ] **Step 2: Create the main preview UI**

Create `src/App.tsx`:

```tsx
import {
  Brain,
  CalendarDays,
  Download,
  Goal,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import { aiQuestions, aiSuggestions, entries, goals, moods } from "./data/previewData";

function App() {
  const today = entries[0];

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand">
          <CalendarDays size={22} aria-hidden="true" />
          <div>
            <h1>Journal</h1>
            <p>Daily growth record</p>
          </div>
        </div>

        <label className="search">
          <Search size={16} aria-hidden="true" />
          <input aria-label="Search entries" placeholder="Search entries, goals, moods" />
        </label>

        <button className="todayButton" type="button">Today</button>

        <section className="entryList" aria-label="Recent entries">
          {entries.map((entry) => (
            <button className="entryItem" type="button" key={entry.date}>
              <span>{entry.date}</span>
              <strong>{entry.title}</strong>
              <small>{entry.weekday} · {entry.mood}</small>
            </button>
          ))}
        </section>
      </aside>

      <section className="editor" aria-label="Daily entry editor">
        <header className="editorHeader">
          <div>
            <p className="eyebrow">{today.weekday}</p>
            <h2>{today.date}</h2>
          </div>
          <div className="headerActions">
            <button type="button" aria-label="Export Markdown"><Download size={18} /></button>
            <button type="button" aria-label="Settings"><Settings size={18} /></button>
          </div>
        </header>

        <div className="moodRow" aria-label="Mood selector">
          {moods.map((mood) => (
            <button className={mood === today.mood ? "mood active" : "mood"} type="button" key={mood}>
              {mood}
            </button>
          ))}
        </div>

        <label className="field titleField">
          <span>Entry title</span>
          <input defaultValue={today.title} />
        </label>

        <label className="field">
          <span>Free writing</span>
          <textarea defaultValue={"今天我把这个产品想得更清楚了。它不是一个普通日记，而是帮我把经历、情绪和目标放在同一个地方看见。"} />
        </label>

        <div className="reflectionGrid">
          <label className="field">
            <span>What happened today</span>
            <textarea defaultValue="确定了第一版方向：B + A，成长复盘为主，AI 只做轻量辅助。" />
          </label>
          <label className="field">
            <span>How I felt</span>
            <textarea defaultValue="更清楚，也更踏实。范围变小之后反而更像真的能做出来。" />
          </label>
          <label className="field">
            <span>What I learned</span>
            <textarea defaultValue="产品最重要的不是功能多，而是每天打开时愿意写。" />
          </label>
          <label className="field">
            <span>Goal relation</span>
            <textarea defaultValue="推动了“Ship the personal growth app”的 MVP 设计阶段。" />
          </label>
        </div>

        <footer className="saveBar">
          <span>Saved locally · AI optional</span>
          <button type="button">Save entry</button>
        </footer>
      </section>

      <aside className="contextPanel">
        <section className="panelBlock">
          <div className="panelTitle">
            <Goal size={18} aria-hidden="true" />
            <h3>Linked goals</h3>
          </div>
          {goals.map((goal) => (
            <article className="goalItem" key={goal.name}>
              <div>
                <strong>{goal.name}</strong>
                <span>{goal.status} · {goal.stage}</span>
              </div>
              <p>{goal.progress}</p>
            </article>
          ))}
        </section>

        <section className="panelBlock aiBlock">
          <div className="panelTitle">
            <Brain size={18} aria-hidden="true" />
            <h3>AI reflection</h3>
          </div>
          <button className="aiButton" type="button">
            <Sparkles size={16} aria-hidden="true" />
            Generate gentle questions
          </button>
          <div className="questionList">
            {aiQuestions.map((question) => (
              <p key={question}>{question}</p>
            ))}
          </div>
          <div className="chips">
            {aiSuggestions.themes.map((theme) => (
              <span key={theme}>{theme}</span>
            ))}
          </div>
          <blockquote>{aiSuggestions.takeaway}</blockquote>
        </section>
      </aside>
    </main>
  );
}

export default App;
```

- [ ] **Step 3: Commit**

Run:

```bash
git add src/data/previewData.ts src/App.tsx
git commit -m "Add journal preview UI"
```

## Task 3: Styling and Verification

**Files:**
- Create: `src/styles.css`

- [ ] **Step 1: Create polished desktop preview styles**

Create `src/styles.css` with a responsive three-column work surface, restrained colors, fixed panel sizing, readable text areas, and mobile fallback.

- [ ] **Step 2: Install dependencies**

Run:

```bash
npm install
```

Expected: dependencies are installed and `package-lock.json` is created.

- [ ] **Step 3: Build the app**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 4: Start dev server**

Run:

```bash
npm run dev
```

Expected: Vite serves the preview and prints a local URL.

- [ ] **Step 5: Commit**

Run:

```bash
git add src/styles.css package-lock.json
git commit -m "Style journal frontend preview"
```

## Self-Review

- Spec coverage: This plan covers only the approved first frontend preview, not SQLite persistence, real AI, Markdown export implementation, or Debian packaging.
- Placeholder scan: The plan intentionally leaves the full CSS body to implementation because visual polish is best reviewed in the running app, but it fixes the files, behavior, commands, and acceptance criteria for the preview.
- Type consistency: `entries`, `goals`, `moods`, `aiQuestions`, and `aiSuggestions` names match across the data and UI tasks.
