import { useState } from "react";
import {
  Brain,
  Goal as GoalIcon,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import {
  aiQuestions,
  aiSuggestions,
} from "../data/previewData";
import type { Goal } from "../goals/types";
import type { EntryGoalLinkDraft } from "../journal/types";

type GoalContextPanelProps = {
  goals: Goal[];
  linkedGoals: EntryGoalLinkDraft[];
  candidates: Goal[];
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
  onAddGoal,
  onRemoveGoal,
  onUpdateGoalLink,
  onOpenGoal,
}: GoalContextPanelProps) {
  const [showQuestions, setShowQuestions] = useState(true);
  const [showMenu, setShowMenu] = useState(false);

  const goalMap = new Map(goals.map((g) => [g.id, g]));

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
                      <span className="goalDot" style={{ background: "#4f8f78" }} />
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
                  <button type="button" key={theme}>
                    {theme}
                  </button>
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
  );
}
