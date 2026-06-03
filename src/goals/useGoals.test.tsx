// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { GoalRepository } from "./goalRepository";
import type {
  Goal,
  GoalDraft,
  GoalStatus,
  GoalTimelineEntry,
} from "./types";
import { useGoals } from "./useGoals";

class InMemoryGoalRepository implements GoalRepository {
  private goals: Goal[] = [];
  private timelines = new Map<number, GoalTimelineEntry[]>();

  constructor(
    initialGoals: Goal[] = [],
    initialTimelines: [number, GoalTimelineEntry[]][] = [],
  ) {
    this.goals = initialGoals;
    for (const [id, entries] of initialTimelines) {
      this.timelines.set(id, entries);
    }
  }

  async list(statuses?: GoalStatus[]): Promise<Goal[]> {
    return this.goals
      .filter((g) => !statuses || statuses.includes(g.status))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async get(id: number): Promise<Goal | null> {
    return this.goals.find((g) => g.id === id) ?? null;
  }

  async timeline(id: number): Promise<GoalTimelineEntry[]> {
    return this.timelines.get(id) ?? [];
  }

  async save(draft: GoalDraft): Promise<Goal> {
    const existing = draft.id ? await this.get(draft.id) : null;
    const saved: Goal = {
      ...draft,
      id: existing?.id ?? this.goals.length + 1,
      createdAt: existing?.createdAt ?? "2026-06-03T10:00:00.000Z",
      updatedAt: "2026-06-03T10:30:00.000Z",
    };
    this.goals = [...this.goals.filter((g) => g.id !== saved.id), saved];
    return saved;
  }
}

const savedGoal: Goal = {
  id: 1,
  name: "发布个人成长应用",
  description: "",
  status: "进行中",
  stage: "MVP 开发",
  progressNote: "",
  createdAt: "2026-06-03T10:00:00.000Z",
  updatedAt: "2026-06-03T10:00:00.000Z",
};

const savedTimeline: GoalTimelineEntry = {
  entryId: 7,
  date: "2026-06-03",
  title: "完成第一版",
  body: "今天完成了第一版。",
  mood: "清晰",
  progressNote: "完成目标管理。",
};

describe("useGoals", () => {
  it("loads active and paused goals by default", async () => {
    const repository = new InMemoryGoalRepository([
      { ...savedGoal, id: 1, status: "进行中" },
      { ...savedGoal, id: 2, status: "已完成" },
    ]);
    const { result } = renderHook(() => useGoals(repository));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.goals).toHaveLength(1);
    expect(result.current.goals[0].status).toBe("进行中");
    expect(result.current.statuses).toEqual(["进行中", "暂停"]);
  });

  it("selects a goal and loads its draft and timeline", async () => {
    const repository = new InMemoryGoalRepository(
      [savedGoal],
      [[1, [savedTimeline]]],
    );
    const { result } = renderHook(() => useGoals(repository));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.selectGoal(1);
    });

    await waitFor(() => expect(result.current.timeline).toHaveLength(1));
    expect(result.current.draft).toMatchObject({
      name: "发布个人成长应用",
      status: "进行中",
    });
    expect(result.current.selectedGoal).toMatchObject({
      id: 1,
      name: "发布个人成长应用",
    });
  });

  it("creates a new draft, saves it, and refreshes the list", async () => {
    const repository = new InMemoryGoalRepository();
    const { result } = renderHook(() => useGoals(repository));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.createGoal();
    });
    expect(result.current.draft).toMatchObject({
      name: "",
      status: "进行中",
    });

    act(() => {
      result.current.updateDraft({
        name: "发布个人成长应用",
        stage: "MVP 开发",
      });
    });
    expect(result.current.dirty).toBe(true);

    await act(async () => {
      await result.current.saveDraft();
    });

    expect(result.current.dirty).toBe(false);
    expect(result.current.goals).toHaveLength(1);
    expect(result.current.goals[0]).toMatchObject({
      name: "发布个人成长应用",
      stage: "MVP 开发",
    });
  });

  it("preserves the edited draft when saving fails", async () => {
    const repository = new InMemoryGoalRepository();
    vi.spyOn(repository, "save").mockRejectedValueOnce(
      new Error("database unavailable"),
    );
    const { result } = renderHook(() => useGoals(repository));

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.createGoal();
      result.current.updateDraft({ name: "新目标" });
    });

    await act(async () => {
      await expect(result.current.saveDraft()).rejects.toThrow(
        "database unavailable",
      );
    });

    expect(result.current.draft).toMatchObject({ name: "新目标" });
    expect(result.current.dirty).toBe(true);
  });

  it("filters goals by status", async () => {
    const repository = new InMemoryGoalRepository([
      { ...savedGoal, id: 1, status: "进行中" },
      { ...savedGoal, id: 2, status: "已完成" },
      { ...savedGoal, id: 3, status: "已放弃" },
    ]);
    const { result } = renderHook(() => useGoals(repository));

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.goals).toHaveLength(1);

    act(() => {
      result.current.setStatuses(["已完成", "已放弃"]);
    });

    await waitFor(() => expect(result.current.goals).toHaveLength(2));
    expect(result.current.goals.map((g) => g.status)).toEqual([
      "已完成",
      "已放弃",
    ]);
  });
});
