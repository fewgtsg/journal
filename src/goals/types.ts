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
