import { describe, expect, it } from "vitest";
import type { GoalRepository } from "./goalRepository";
import {
  createEmptyGoalDraft,
  isGoalLinkCandidate,
  validateGoalDraft,
  type Goal,
  type GoalDraft,
  type GoalStatus,
} from "./types";

class InMemoryGoalRepository implements GoalRepository {
  private goals: Goal[] = [];

  async list(statuses?: GoalStatus[]): Promise<Goal[]> {
    return this.goals
      .filter((goal) => !statuses || statuses.includes(goal.status))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: number): Promise<Goal | null> {
    return this.goals.find((goal) => goal.id === id) ?? null;
  }

  async timeline() {
    return [];
  }

  async save(draft: GoalDraft): Promise<Goal> {
    const error = validateGoalDraft(draft);
    if (error) throw new Error(error);

    const existing = draft.id ? await this.get(draft.id) : null;
    const saved: Goal = {
      ...draft,
      id: existing?.id ?? this.goals.length + 1,
      createdAt: existing?.createdAt ?? "2026-06-03T10:00:00.000Z",
      updatedAt: "2026-06-03T10:30:00.000Z",
    };

    this.goals = [...this.goals.filter((goal) => goal.id !== saved.id), saved];
    return saved;
  }
}

describe("GoalRepository contract", () => {
  it("creates a useful empty goal draft", () => {
    expect(createEmptyGoalDraft()).toEqual({
      name: "",
      description: "",
      status: "进行中",
      stage: "",
      progressNote: "",
    });
  });

  it("requires a name and a supported status", () => {
    expect(validateGoalDraft(createEmptyGoalDraft())).toBe("目标名称不能为空");
    expect(
      validateGoalDraft({
        ...createEmptyGoalDraft(),
        name: "发布个人成长应用",
        status: "未知" as GoalStatus,
      }),
    ).toBe("目标状态无效");
  });

  it("only offers active goals as new link candidates", () => {
    const draft = {
      ...createEmptyGoalDraft(),
      name: "发布个人成长应用",
    };
    const goal = (status: GoalStatus): Goal => ({
      ...draft,
      id: 1,
      status,
      createdAt: "2026-06-03T10:00:00.000Z",
      updatedAt: "2026-06-03T10:30:00.000Z",
    });

    expect(isGoalLinkCandidate(goal("进行中"))).toBe(true);
    expect(isGoalLinkCandidate(goal("暂停"))).toBe(true);
    expect(isGoalLinkCandidate(goal("已完成"))).toBe(false);
    expect(isGoalLinkCandidate(goal("已放弃"))).toBe(false);
  });

  it("creates, updates, and filters goals without deleting history", async () => {
    const repository = new InMemoryGoalRepository();
    const created = await repository.save({
      ...createEmptyGoalDraft(),
      name: "发布个人成长应用",
      stage: "MVP 开发",
    });
    await repository.save({ ...created, status: "已完成" });

    expect(await repository.list(["进行中", "暂停"])).toEqual([]);
    expect(await repository.list(["已完成"])).toHaveLength(1);
    expect(await repository.get(created.id)).toMatchObject({
      name: "发布个人成长应用",
      status: "已完成",
    });
  });
});
