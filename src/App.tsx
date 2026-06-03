import { useMemo, useState, type CSSProperties } from "react";
import {
  Brain,
  CalendarDays,
  ChevronDown,
  Download,
  Goal,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
} from "lucide-react";
import {
  aiQuestions,
  aiSuggestions,
  goals,
  moods,
} from "./data/previewData";
import { TauriSqlEntryRepository } from "./journal/tauriSqlEntryRepository";
import { useJournalEntries } from "./journal/useJournalEntries";
import type { Entry } from "./journal/types";

function App() {
  const [showQuestions, setShowQuestions] = useState(true);
  const repository = useMemo(() => new TauriSqlEntryRepository(), []);
  const today = useMemo(() => localDate(new Date()), []);
  const {
    entries,
    draft,
    selectedDate,
    loading,
    saving,
    error,
    dirty,
    selectDate,
    updateDraft,
    saveDraft,
  } = useJournalEntries(repository, today);

  const selectedWeekday = useMemo(
    () => weekdayFor(selectedDate),
    [selectedDate],
  );

  async function handleSave() {
    try {
      await saveDraft();
    } catch {
      // The hook exposes the error while preserving the draft.
    }
  }

  return (
    <main className="appShell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brandMark">
            <CalendarDays size={19} strokeWidth={1.8} aria-hidden="true" />
          </div>
          <div>
            <h1>Journal</h1>
            <p>每日成长记录</p>
          </div>
        </div>

        <label className="searchBox">
          <Search size={16} strokeWidth={1.8} aria-hidden="true" />
          <input aria-label="搜索记录" placeholder="搜索记录、目标、心情" />
        </label>

        <div className="sidebarActions">
          <button className="todayButton" type="button" onClick={() => selectDate(today)}>
            今天
          </button>
          <button className="iconButton" type="button" aria-label="新建今天的记录" title="新建今天的记录" onClick={() => selectDate(today)}>
            <Plus size={17} aria-hidden="true" />
          </button>
        </div>

        <section className="entryList" aria-label="最近记录">
          <div className="sectionLabel">
            <span>最近记录</span>
            <button className="quietIcon" type="button" aria-label="更多记录选项" title="更多记录选项">
              <MoreHorizontal size={17} aria-hidden="true" />
            </button>
          </div>
          {entries.map((entry) => (
            <button
              className={entry.date === selectedDate ? "entryItem selected" : "entryItem"}
              type="button"
              key={entry.date}
              onClick={() => selectDate(entry.date)}
            >
              <span className="entryDate">{shortDate(entry.date)}</span>
              <span className="entryCopy">
                <strong>{entry.title || "未命名记录"}</strong>
                <small>{weekdayFor(entry.date)} · {entry.mood || "未选择心情"}</small>
                <em>{excerptFor(entry)}</em>
              </span>
            </button>
          ))}
          {!loading && entries.length === 0 && (
            <p className="emptyList">还没有记录，从今天开始吧。</p>
          )}
        </section>

        <nav className="sidebarNav" aria-label="应用导航">
          <button type="button">
            <Goal size={17} aria-hidden="true" />
            目标
          </button>
          <button type="button">
            <Download size={17} aria-hidden="true" />
            Markdown 导出
          </button>
          <button type="button">
            <Settings size={17} aria-hidden="true" />
            设置
          </button>
        </nav>
      </aside>

      <section className="editor" aria-label="每日记录编辑器">
        <header className="editorHeader">
          <div>
            <p className="eyebrow">{selectedWeekday}</p>
            <h2>{selectedDate}</h2>
          </div>
          <div className="saveState">
            <span className={!dirty && !error ? "statusDot saved" : "statusDot"} />
            {loading
              ? "正在加载"
              : saving
                ? "正在保存"
                : error
                  ? "保存遇到问题"
                  : dirty
                    ? "有未保存更改"
                    : "已保存到本地"}
          </div>
        </header>
        {error && <p className="errorBanner">{error}</p>}

        <section className="moodSection" aria-label="选择今天的心情">
          <div className="fieldLabel">今天的心情</div>
          <div className="moodRow">
            {moods.map((mood) => (
              <button
                className={mood.label === draft.mood ? "mood active" : "mood"}
                style={{ "--mood-color": mood.tone } as CSSProperties}
                type="button"
                key={mood.label}
                onClick={() => {
                  updateDraft({ mood: mood.label });
                }}
              >
                <span />
                {mood.label}
              </button>
            ))}
          </div>
        </section>

        <label className="field titleField">
          <span>记录标题</span>
          <input
            value={draft.title}
            onChange={(event) => updateDraft({ title: event.target.value })}
            disabled={loading}
          />
        </label>

        <label className="field writingField">
          <span>自由书写</span>
          <textarea
            value={draft.body}
            onChange={(event) => updateDraft({ body: event.target.value })}
            disabled={loading}
          />
        </label>

        <div className="reflectionHeader">
          <div>
            <p className="eyebrow">轻量复盘</p>
            <h3>从今天看见一点成长</h3>
          </div>
          <button className="collapseButton" type="button" aria-label="收起复盘区域" title="收起复盘区域">
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="reflectionGrid">
          <label className="field">
            <span>今天发生了什么</span>
            <textarea
              value={draft.whatHappened}
              onChange={(event) => updateDraft({ whatHappened: event.target.value })}
              disabled={loading}
            />
          </label>
          <label className="field">
            <span>我有什么感受</span>
            <textarea
              value={draft.feelings}
              onChange={(event) => updateDraft({ feelings: event.target.value })}
              disabled={loading}
            />
          </label>
          <label className="field">
            <span>我学到了什么</span>
            <textarea
              value={draft.learning}
              onChange={(event) => updateDraft({ learning: event.target.value })}
              disabled={loading}
            />
          </label>
          <label className="field">
            <span>和目标有什么关系</span>
            <textarea
              value={draft.goalRelation}
              onChange={(event) => updateDraft({ goalRelation: event.target.value })}
              disabled={loading}
            />
          </label>
        </div>

        <footer className="saveBar">
          <p>你的记录默认只保存在这台设备上。</p>
          <button
            className="primaryButton"
            type="button"
            onClick={handleSave}
            disabled={loading || saving}
          >
            {saving ? "保存中" : "保存记录"}
          </button>
        </footer>
      </section>

      <aside className="contextPanel">
        <section className="panelBlock">
          <div className="panelTitle">
            <div>
              <Goal size={17} strokeWidth={1.8} aria-hidden="true" />
              <h3>关联目标</h3>
            </div>
            <button className="quietIcon" type="button" aria-label="添加关联目标" title="添加关联目标">
              <Plus size={17} aria-hidden="true" />
            </button>
          </div>
          <div className="goalList">
            {goals.map((goal) => (
              <article className="goalItem" key={goal.name}>
                <div className="goalHeading">
                  <span className="goalDot" style={{ background: goal.color }} />
                  <strong>{goal.name}</strong>
                </div>
                <div className="goalMeta">
                  <span>{goal.status}</span>
                  <span>{goal.stage}</span>
                </div>
                <p>{goal.progress}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panelBlock aiBlock">
          <div className="panelTitle">
            <div>
              <Brain size={17} strokeWidth={1.8} aria-hidden="true" />
              <h3>AI 复盘</h3>
            </div>
            <span className="optionalTag">可选</span>
          </div>

          <button
            className="aiButton"
            type="button"
            onClick={() => setShowQuestions((current) => !current)}
          >
            <Sparkles size={16} aria-hidden="true" />
            {showQuestions ? "收起追问" : "生成温柔追问"}
          </button>

          {showQuestions && (
            <>
              <div className="questionList">
                {aiQuestions.map((question, index) => (
                  <button type="button" key={question}>
                    <span>{index + 1}</span>
                    {question}
                  </button>
                ))}
              </div>

              <div className="suggestionGroup">
                <p className="fieldLabel">可能的主题</p>
                <div className="chips">
                  {aiSuggestions.themes.map((theme) => (
                    <button type="button" key={theme}>{theme}</button>
                  ))}
                </div>
              </div>

              <div className="takeaway">
                <p className="fieldLabel">今日收获建议</p>
                <blockquote>{aiSuggestions.takeaway}</blockquote>
                <button type="button">采用这条收获</button>
              </div>
            </>
          )}
        </section>
      </aside>
    </main>
  );
}

export default App;

function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function shortDate(date: string): string {
  return date.slice(5).replace("-", ".");
}

function weekdayFor(date: string): string {
  return new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(
    new Date(`${date}T12:00:00`),
  );
}

function excerptFor(entry: Entry): string {
  return (
    entry.body ||
    entry.whatHappened ||
    entry.learning ||
    "这一天还没有写下内容。"
  );
}
