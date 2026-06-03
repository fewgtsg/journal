import { CalendarDays, Goal, Plus } from "lucide-react";
import {
  goalStatuses,
  type Goal as GoalType,
  type GoalDraft,
  type GoalStatus,
  type GoalTimelineEntry,
} from "../goals/types";

type GoalsViewProps = {
  goals: GoalType[];
  selectedGoalId: number | null;
  draft: GoalDraft | null;
  timeline: GoalTimelineEntry[];
  statuses: GoalStatus[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  dirty: boolean;
  onStatusesChange: (statuses: GoalStatus[]) => void;
  onSelectGoal: (id: number | null) => void;
  onCreateGoal: () => void;
  onDraftChange: (changes: Partial<GoalDraft>) => void;
  onSave: () => void;
  onOpenEntry: (date: string) => void;
};

const statusGroups: { label: string; statuses: GoalStatus[] }[] = [
  { label: "进行中 / 暂停", statuses: ["进行中", "暂停"] },
  { label: "已完成", statuses: ["已完成"] },
  { label: "已放弃", statuses: ["已放弃"] },
];

export function GoalsView({
  goals,
  selectedGoalId,
  draft,
  timeline,
  statuses,
  loading,
  saving,
  error,
  dirty,
  onStatusesChange,
  onSelectGoal,
  onCreateGoal,
  onDraftChange,
  onSave,
  onOpenEntry,
}: GoalsViewProps) {
  const toggleStatusGroup = (groupStatuses: GoalStatus[]) => {
    const allInGroup = groupStatuses.every((s) => statuses.includes(s));
    if (allInGroup) {
      onStatusesChange(statuses.filter((s) => !groupStatuses.includes(s)));
    } else {
      const next = [...statuses];
      for (const s of groupStatuses) {
        if (!next.includes(s)) next.push(s);
      }
      onStatusesChange(next);
    }
  };

  const saveStateText = saving
    ? "正在保存"
    : error
      ? "保存遇到问题"
      : dirty
        ? "有未保存更改"
        : "已保存";

  return (
    <div className="goalsView">
      <header className="goalsViewHeader">
        <div className="filterPills">
          {statusGroups.map((group) => {
            const active = group.statuses.every((s) => statuses.includes(s));
            return (
              <button
                key={group.label}
                type="button"
                className={active ? "filterPill active" : "filterPill"}
                onClick={() => toggleStatusGroup(group.statuses)}
              >
                {group.label}
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="primaryButton"
          onClick={onCreateGoal}
          disabled={loading || saving}
        >
          <Plus size={15} aria-hidden="true" />
          新建目标
        </button>
      </header>

      <div className="goalsViewBody">
        <section className="goalsViewList" aria-label="目标列表">
          {goals.length === 0 && !loading && (
            <p className="emptyList">暂无目标</p>
          )}
          {goals.map((goal) => (
            <button
              key={goal.id}
              type="button"
              className={
                goal.id === selectedGoalId
                  ? "goalListItem selected"
                  : "goalListItem"
              }
              onClick={() => onSelectGoal(goal.id)}
            >
              <span className="goalListItemName">{goal.name}</span>
              <span className="goalListItemMeta">
                <span className="optionalTag">{goal.status}</span>
                {goal.stage && (
                  <span className="optionalTag">{goal.stage}</span>
                )}
              </span>
            </button>
          ))}
        </section>

        <section className="goalsViewDetail">
          {draft ? (
            <>
              <div className="goalDetailForm">
                <label className="field titleField">
                  <span>目标名称</span>
                  <input
                    value={draft.name}
                    onChange={(e) =>
                      onDraftChange({ name: e.target.value })
                    }
                    disabled={loading || saving}
                  />
                </label>

                <label className="field">
                  <span>描述</span>
                  <textarea
                    value={draft.description}
                    onChange={(e) =>
                      onDraftChange({ description: e.target.value })
                    }
                    disabled={loading || saving}
                    rows={3}
                  />
                </label>

                <div className="reflectionGrid">
                  <label className="field">
                    <span>状态</span>
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        onDraftChange({
                          status: e.target.value as GoalStatus,
                        })
                      }
                      disabled={loading || saving}
                    >
                      {goalStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="field">
                    <span>阶段</span>
                    <input
                      value={draft.stage}
                      onChange={(e) =>
                        onDraftChange({ stage: e.target.value })
                      }
                      disabled={loading || saving}
                    />
                  </label>
                </div>

                <label className="field">
                  <span>进展记录</span>
                  <textarea
                    value={draft.progressNote}
                    onChange={(e) =>
                      onDraftChange({ progressNote: e.target.value })
                    }
                    disabled={loading || saving}
                    rows={3}
                  />
                </label>

                {error && <p className="errorBanner">{error}</p>}

                <footer className="saveBar">
                  <p>{saveStateText}</p>
                  <button
                    type="button"
                    className="primaryButton"
                    onClick={onSave}
                    disabled={loading || saving}
                  >
                    {saving ? "保存中" : "保存目标"}
                  </button>
                </footer>
              </div>

              {timeline.length > 0 && (
                <div className="timelineSection">
                  <div className="panelTitle">
                    <div>
                      <CalendarDays
                        size={17}
                        strokeWidth={1.8}
                        aria-hidden="true"
                      />
                      <h3>关联记录</h3>
                    </div>
                  </div>
                  <div className="timelineList">
                    {timeline.map((entry) => (
                      <button
                        key={entry.entryId}
                        type="button"
                        className="timelineItem"
                        onClick={() => onOpenEntry(entry.date)}
                      >
                        <span className="timelineItemDate">
                          {entry.date}
                        </span>
                        <span className="timelineItemTitle">
                          {entry.title || "未命名记录"}
                        </span>
                        <span className="timelineItemExcerpt">
                          {entry.body || "这一天还没有写下内容。"}
                        </span>
                        {entry.mood && (
                          <span className="timelineItemMeta">
                            <span className="optionalTag">{entry.mood}</span>
                          </span>
                        )}
                        {entry.progressNote && (
                          <span className="timelineItemNote">
                            {entry.progressNote}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="emptyState">
              <Goal
                size={32}
                strokeWidth={1.5}
                aria-hidden="true"
                style={{ color: "#b5c0b7", marginBottom: 10 }}
              />
              <p>选择一个目标查看详情，或创建新目标。</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
