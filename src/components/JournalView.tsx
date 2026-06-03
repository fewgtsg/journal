import { type CSSProperties } from "react";
import { ChevronDown } from "lucide-react";
import { moods } from "../data/previewData";
import type { EntryDraft } from "../journal/types";
import { weekdayFor } from "./helpers";

type JournalViewProps = {
  selectedDate: string;
  draft: EntryDraft;
  loading: boolean;
  saving: boolean;
  error: string | null;
  dirty: boolean;
  onUpdateDraft: (changes: Partial<EntryDraft>) => void;
  onSave: () => void;
};

export default function JournalView({
  selectedDate,
  draft,
  loading,
  saving,
  error,
  dirty,
  onUpdateDraft,
  onSave,
}: JournalViewProps) {
  const selectedWeekday = weekdayFor(selectedDate);

  return (
    <section className="editor" aria-label="每日记录编辑器">
      <header className="editorHeader">
        <div>
          <p className="eyebrow">{selectedWeekday}</p>
          <h2>{selectedDate}</h2>
        </div>
        <div className="saveState">
          <span
            className={
              !dirty && !error ? "statusDot saved" : "statusDot"
            }
          />
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
              className={
                mood.label === draft.mood ? "mood active" : "mood"
              }
              style={{ "--mood-color": mood.tone } as CSSProperties}
              type="button"
              key={mood.label}
              onClick={() => {
                onUpdateDraft({ mood: mood.label });
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
          onChange={(event) =>
            onUpdateDraft({ title: event.target.value })
          }
          disabled={loading}
        />
      </label>

      <label className="field writingField">
        <span>自由书写</span>
        <textarea
          value={draft.body}
          onChange={(event) =>
            onUpdateDraft({ body: event.target.value })
          }
          disabled={loading}
        />
      </label>

      <div className="reflectionHeader">
        <div>
          <p className="eyebrow">轻量复盘</p>
          <h3>从今天看见一点成长</h3>
        </div>
        <button
          className="collapseButton"
          type="button"
          aria-label="收起复盘区域"
          title="收起复盘区域"
        >
          <ChevronDown size={18} aria-hidden="true" />
        </button>
      </div>

      <div className="reflectionGrid">
        <label className="field">
          <span>今天发生了什么</span>
          <textarea
            value={draft.whatHappened}
            onChange={(event) =>
              onUpdateDraft({ whatHappened: event.target.value })
            }
            disabled={loading}
          />
        </label>
        <label className="field">
          <span>我有什么感受</span>
          <textarea
            value={draft.feelings}
            onChange={(event) =>
              onUpdateDraft({ feelings: event.target.value })
            }
            disabled={loading}
          />
        </label>
        <label className="field">
          <span>我学到了什么</span>
          <textarea
            value={draft.learning}
            onChange={(event) =>
              onUpdateDraft({ learning: event.target.value })
            }
            disabled={loading}
          />
        </label>
        <label className="field">
          <span>和目标有什么关系</span>
          <textarea
            value={draft.goalRelation}
            onChange={(event) =>
              onUpdateDraft({ goalRelation: event.target.value })
            }
            disabled={loading}
          />
        </label>
      </div>

      <footer className="saveBar">
        <p>你的记录默认只保存在这台设备上。</p>
        <button
          className="primaryButton"
          type="button"
          onClick={onSave}
          disabled={loading || saving}
        >
          {saving ? "保存中" : "保存记录"}
        </button>
      </footer>
    </section>
  );
}
