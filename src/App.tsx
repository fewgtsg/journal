import { useMemo, useState } from "react";
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
  entries,
  goals,
  moods,
} from "./data/previewData";

function App() {
  const [selectedDate, setSelectedDate] = useState(entries[0].date);
  const [selectedMood, setSelectedMood] = useState(entries[0].mood);
  const [showQuestions, setShowQuestions] = useState(true);
  const [saved, setSaved] = useState(true);

  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.date === selectedDate) ?? entries[0],
    [selectedDate],
  );

  function markChanged() {
    setSaved(false);
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
          <button className="todayButton" type="button" onClick={() => setSelectedDate(entries[0].date)}>
            今天
          </button>
          <button className="iconButton" type="button" aria-label="新建记录" title="新建记录">
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
              onClick={() => {
                setSelectedDate(entry.date);
                setSelectedMood(entry.mood);
                setSaved(true);
              }}
            >
              <span className="entryDate">{entry.shortDate}</span>
              <span className="entryCopy">
                <strong>{entry.title}</strong>
                <small>{entry.weekday} · {entry.mood}</small>
                <em>{entry.excerpt}</em>
              </span>
            </button>
          ))}
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
            <p className="eyebrow">{selectedEntry.weekday}</p>
            <h2>{selectedEntry.date}</h2>
          </div>
          <div className="saveState">
            <span className={saved ? "statusDot saved" : "statusDot"} />
            {saved ? "已保存到本地" : "有未保存更改"}
          </div>
        </header>

        <section className="moodSection" aria-label="选择今天的心情">
          <div className="fieldLabel">今天的心情</div>
          <div className="moodRow">
            {moods.map((mood) => (
              <button
                className={mood.label === selectedMood ? "mood active" : "mood"}
                style={{ "--mood-color": mood.tone } as React.CSSProperties}
                type="button"
                key={mood.label}
                onClick={() => {
                  setSelectedMood(mood.label);
                  markChanged();
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
          <input defaultValue={selectedEntry.title} onChange={markChanged} />
        </label>

        <label className="field writingField">
          <span>自由书写</span>
          <textarea
            defaultValue="今天我把这个产品想得更清楚了。它不是一个普通日记，而是帮我把经历、情绪和目标放在同一个地方看见。范围变小之后，我反而更相信它真的能被做出来，也能成为我每天愿意打开的东西。"
            onChange={markChanged}
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
              defaultValue="确定了第一版方向：成长复盘为主，目标进展作为上下文，AI 只做轻量辅助。"
              onChange={markChanged}
            />
          </label>
          <label className="field">
            <span>我有什么感受</span>
            <textarea
              defaultValue="更清楚，也更踏实。产品不再只是一个模糊的想法。"
              onChange={markChanged}
            />
          </label>
          <label className="field">
            <span>我学到了什么</span>
            <textarea
              defaultValue="产品最重要的不是功能多，而是每天打开时愿意写。"
              onChange={markChanged}
            />
          </label>
          <label className="field">
            <span>和目标有什么关系</span>
            <textarea
              defaultValue="推动了“发布个人成长应用”的 MVP 设计阶段。"
              onChange={markChanged}
            />
          </label>
        </div>

        <footer className="saveBar">
          <p>你的记录默认只保存在这台设备上。</p>
          <button
            className="primaryButton"
            type="button"
            onClick={() => setSaved(true)}
          >
            保存记录
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
