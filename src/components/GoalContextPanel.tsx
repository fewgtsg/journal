import { useState } from "react";
import {
  Brain,
  Goal as GoalIcon,
  Loader2,
  Plus,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { loadAIConfig, saveAIConfig, type AIConfig } from "../ai/config";
import {
  generateFollowUpQuestions,
  type AIFollowUpResponse,
} from "../ai/aiService";
import type { Goal } from "../goals/types";
import type { EntryDraft, EntryGoalLinkDraft } from "../journal/types";

type GoalContextPanelProps = {
  goals: Goal[];
  linkedGoals: EntryGoalLinkDraft[];
  candidates: Goal[];
  draft: EntryDraft;
  onAddGoal: (goalId: number) => void;
  onRemoveGoal: (goalId: number) => void;
  onUpdateGoalLink: (
    goalId: number,
    changes: Partial<EntryGoalLinkDraft>,
  ) => void;
  onOpenGoal: (goalId: number) => void;
};

export function GoalContextPanel({
  goals,
  linkedGoals,
  candidates,
  draft,
  onAddGoal,
  onRemoveGoal,
  onUpdateGoalLink,
  onOpenGoal,
}: GoalContextPanelProps) {
  const [showMenu, setShowMenu] = useState(false);

  const [aiConfig, setAiConfig] = useState<AIConfig | null>(loadAIConfig);
  const [showSettings, setShowSettings] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIFollowUpResponse | null>(null);

  const goalMap = new Map(goals.map((g) => [g.id, g]));

  async function handleGenerate() {
    if (!aiConfig) {
      setShowSettings(true);
      return;
    }
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateFollowUpQuestions(
        aiConfig,
        draft,
        linkedGoals,
        goals,
      );
      setAiResult(result);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : String(err));
    } finally {
      setAiLoading(false);
    }
  }

  function handleSaveConfig(form: AIConfig) {
    saveAIConfig(form);
    setAiConfig(form);
    setShowSettings(false);
  }

  return (
    <aside className="contextPanel">
      <section className="panelBlock">
        <div className="panelTitle">
          <div>
            <GoalIcon size={17} strokeWidth={1.8} aria-hidden="true" />
            <h3>关联目标</h3>
          </div>
          {candidates.length > 0 && (
            <div style={{ position: "relative" }}>
              <button
                className="quietIcon"
                type="button"
                aria-label="添加关联目标"
                title="添加关联目标"
                onClick={() => setShowMenu((s) => !s)}
              >
                <Plus size={17} aria-hidden="true" />
              </button>
              {showMenu && (
                <div
                  className="goalAddMenu"
                  onMouseLeave={() => setShowMenu(false)}
                >
                  {candidates.map((goal) => (
                    <button
                      key={goal.id}
                      type="button"
                      onClick={() => {
                        onAddGoal(goal.id);
                        setShowMenu(false);
                      }}
                    >
                      <span
                        className="goalDot"
                        style={{ background: "#4f8f78" }}
                      />
                      <span>{goal.name}</span>
                      <span className="optionalTag">{goal.status}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="goalList">
          {linkedGoals.length === 0 && (
            <p className="emptyList">还没有关联目标。</p>
          )}
          {linkedGoals.map((link) => {
            const goal = goalMap.get(link.goalId);
            if (!goal) return null;
            return (
              <article className="goalItem linkedGoalItem" key={link.goalId}>
                <div className="goalHeading">
                  <span
                    className="goalDot"
                    style={{
                      background:
                        goal.status === "已完成"
                          ? "#b17832"
                          : goal.status === "已放弃"
                            ? "#7c7195"
                            : "#4f8f78",
                    }}
                  />
                  <button
                    type="button"
                    className="goalNameButton"
                    onClick={() => onOpenGoal(link.goalId)}
                  >
                    <strong>{goal.name}</strong>
                  </button>
                  <button
                    className="quietIcon"
                    type="button"
                    aria-label={`移除关联 ${goal.name}`}
                    title="移除关联"
                    onClick={() => onRemoveGoal(link.goalId)}
                  >
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
                <div className="goalMeta">
                  <span>{goal.status}</span>
                  {goal.stage && <span>{goal.stage}</span>}
                </div>
                <label className="linkProgressField">
                  <span>进度笔记</span>
                  <input
                    value={link.progressNote}
                    placeholder="今天有什么进展？"
                    onChange={(e) =>
                      onUpdateGoalLink(link.goalId, {
                        progressNote: e.target.value,
                      })
                    }
                  />
                </label>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panelBlock aiBlock">
        <div className="panelTitle">
          <div>
            <Brain size={17} strokeWidth={1.8} aria-hidden="true" />
            <h3>AI 复盘</h3>
          </div>
          <button
            className="quietIcon"
            type="button"
            aria-label="配置 AI"
            title="配置 AI"
            onClick={() => setShowSettings((s) => !s)}
          >
            <Settings size={14} aria-hidden="true" />
          </button>
        </div>

        {showSettings && (
          <AISettingsForm
            initial={
              aiConfig ?? {
                apiKey: "",
                baseUrl: "https://api.openai.com/v1",
                model: "gpt-4o-mini",
              }
            }
            onSave={handleSaveConfig}
            onCancel={() => setShowSettings(false)}
          />
        )}

        <button
          className="aiButton"
          type="button"
          onClick={handleGenerate}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <Loader2 size={16} className="spin" aria-hidden="true" />
          ) : (
            <Sparkles size={16} aria-hidden="true" />
          )}
          {aiLoading
            ? "正在生成中…"
            : aiConfig
              ? "生成温柔追问"
              : "生成温柔追问（需先配置）"}
        </button>

        {aiError && <p className="aiError">{aiError}</p>}

        {aiResult && (
          <>
            <div className="questionList">
              {aiResult.questions.map((question, index) => (
                <button type="button" key={index}>
                  <span>{index + 1}</span>
                  {question}
                </button>
              ))}
            </div>

            <div className="suggestionGroup">
              <p className="fieldLabel">可能的主题</p>
              <div className="chips">
                {aiResult.themes.map((theme) => (
                  <button type="button" key={theme}>
                    {theme}
                  </button>
                ))}
              </div>
            </div>

            <div className="takeaway">
              <p className="fieldLabel">今日收获建议</p>
              <blockquote>{aiResult.takeaway}</blockquote>
            </div>
          </>
        )}

        {!aiResult && !aiError && !showSettings && !aiConfig && (
          <p className="emptyList" style={{ marginTop: 12 }}>
            点击上方齿轮配置 OpenAI 兼容 API 后，AI
            会根据你的日记内容和目标进度生成温柔追问。
          </p>
        )}
      </section>
    </aside>
  );
}

function AISettingsForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: AIConfig;
  onSave: (config: AIConfig) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);

  return (
    <form
      className="aiSettingsForm"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <label>
        <span>API Key</span>
        <input
          type="password"
          value={form.apiKey}
          placeholder="sk-..."
          onChange={(e) => setForm({ ...form, apiKey: e.target.value })}
          required
        />
      </label>
      <label>
        <span>Base URL</span>
        <input
          value={form.baseUrl}
          placeholder="https://api.openai.com/v1"
          onChange={(e) => setForm({ ...form, baseUrl: e.target.value })}
          required
        />
      </label>
      <label>
        <span>模型</span>
        <input
          value={form.model}
          placeholder="gpt-4o-mini"
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          required
        />
      </label>
      <div className="aiSettingsActions">
        <button type="button" className="quietButton" onClick={onCancel}>
          取消
        </button>
        <button type="submit" className="primaryButton">
          保存
        </button>
      </div>
    </form>
  );
}
