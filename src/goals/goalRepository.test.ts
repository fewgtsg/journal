import { describe, expect, it } from "vitest";
import type { GoalRepository } from "./goalRepository";
import {
  createEmptyGoalDraft,
  isGoalLinkCandidate,
  validateGoalDraft,
  type Goal,
  type GoalDraft,
  type GoalStatus,
  type GoalTimelineEntry,
} from "./types";

class InMemoryGoalRepository implements GoalRepository {
  private goals: Goal[] = [];
  private saveCount = 0;

  constructor(
    private timelineEntries: Array<{
      goalId: number;
      entry: GoalTimelineEntry;
    }> = [],
  ) {}

  async list(statuses?: GoalStatus[]): Promise<Goal[]> {
    return this.goals
      .filter((goal) => !statuses || statuses.includes(goal.status))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: number): Promise<Goal | null> {
    return this.goals.find((goal) => goal.id === id) ?? null;
  }

  async timeline(id: number): Promise<GoalTimelineEntry[]> {
    return this.timelineEntries
      .filter(({ goalId }) => goalId === id)
      .map(({ entry }) => entry)
      .sort((a, b) => b.date.localeCompare(a.date));
  }

  async save(draft: GoalDraft): Promise<Goal> {
    const error = validateGoalDraft(draft);
    if (error) throw new Error(error);

    const existing = draft.id ? await this.get(draft.id) : null;
    this.saveCount += 1;
    const updatedAt = `2026-06-03T10:${String(this.saveCount).padStart(2, "0")}:00.000Z`;
    const saved: Goal = {
      ...draft,
      id: existing?.id ?? this.goals.length + 1,
      createdAt: existing?.createdAt ?? "2026-06-03T10:00:00.000Z",
      updatedAt,
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

  it("rejects invalid drafts at the repository boundary", async () => {
    const repository = new InMemoryGoalRepository();

    await expect(repository.save(createEmptyGoalDraft())).rejects.toThrow(
      "目标名称不能为空",
    );
    await expect(
      repository.save({
        ...createEmptyGoalDraft(),
        name: "发布个人成长应用",
        status: "未知" as GoalStatus,
      }),
    ).rejects.toThrow("目标状态无效");
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

  it("lists goals by most recently updated first", async () => {
    const repository = new InMemoryGoalRepository();
    await repository.save({
      ...createEmptyGoalDraft(),
      name: "较早更新的目标",
    });
    await repository.save({
      ...createEmptyGoalDraft(),
      name: "最近更新的目标",
    });

    expect((await repository.list()).map((goal) => goal.name)).toEqual([
      "最近更新的目标",
      "较早更新的目标",
    ]);
  });

  it("returns one goal's timeline by date descending after the goal ends", async () => {
    const timelineEntries: GoalTimelineEntry[] = [
      {
        entryId: 1,
        date: "2026-06-01",
        title: "开始行动",
        body: "完成了第一步。",
        mood: "期待",
        progressNote: "搭好了基础。",
      },
      {
        entryId: 2,
        date: "2026-06-03",
        title: "准备发布",
        body: "完成了最后检查。",
        mood: "踏实",
        progressNote: "可以发布了。",
      },
    ];
    const otherGoalEntry: GoalTimelineEntry = {
      entryId: 3,
      date: "2026-06-04",
      title: "另一个目标",
      body: "这条记录不属于当前目标。",
      mood: "平静",
      progressNote: "",
    };
    const repository = new InMemoryGoalRepository([
      { goalId: 1, entry: timelineEntries[0] },
      { goalId: 1, entry: timelineEntries[1] },
      { goalId: 2, entry: otherGoalEntry },
    ]);
    const goal = await repository.save({
      ...createEmptyGoalDraft(),
      name: "发布个人成长应用",
    });
    await repository.save({ ...goal, status: "已完成" });

    expect(await repository.timeline(goal.id)).toEqual([
      timelineEntries[1],
      timelineEntries[0],
    ]);
  });
});
