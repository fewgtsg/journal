import { describe, expect, it } from "vitest";
import type { EntryRepository } from "./entryRepository";
import {
  createEmptyEntryDraft,
  type Entry,
  type EntryDraft,
  type EntryGoalLink,
  type EntryGoalLinkDraft,
  type EntryWithGoals,
} from "./types";

class InMemoryEntryRepository implements EntryRepository {
  private entries: Entry[] = [];
  private goalLinks = new Map<string, EntryGoalLink[]>();

  async list(): Promise<Entry[]> {
    return [...this.entries].sort((a, b) => b.date.localeCompare(a.date));
  }

  async getByDate(date: string): Promise<EntryWithGoals | null> {
    const entry = this.entries.find((candidate) => candidate.date === date);
    return entry
      ? { entry, goalLinks: this.goalLinks.get(date) ?? [] }
      : null;
  }

  async save(
    draft: EntryDraft,
    goalLinks: EntryGoalLinkDraft[],
  ): Promise<EntryWithGoals> {
    const existing = await this.getByDate(draft.date);
    const timestamp = "2026-06-03T10:00:00.000Z";
    const saved: Entry = {
      ...draft,
      id: existing?.entry.id ?? this.entries.length + 1,
      createdAt: existing?.entry.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    this.entries = [
      ...this.entries.filter((entry) => entry.date !== draft.date),
      saved,
    ];
    const persistedLinks = goalLinks.map(toPersistedGoalLink);
    this.goalLinks.set(draft.date, persistedLinks);
    return { entry: saved, goalLinks: persistedLinks };
  }
}

function toPersistedGoalLink(link: EntryGoalLinkDraft): EntryGoalLink {
  const goals = {
    1: { goalName: "发布个人成长应用", goalStatus: "进行中", goalStage: "MVP 开发" },
    2: { goalName: "恢复稳定运动", goalStatus: "暂停", goalStage: "每周三次" },
  } as const;

  return { ...link, ...goals[link.goalId as keyof typeof goals] };
}

const draft: EntryDraft = {
  date: "2026-06-03",
  title: "方向变得清楚了",
  body: "今天把产品想得更清楚了。",
  mood: "清晰",
  whatHappened: "确定了第一版方向。",
  feelings: "更踏实。",
  learning: "每天愿意打开比功能多更重要。",
  goalRelation: "推动了 MVP 设计。",
};

describe("EntryRepository contract", () => {
  it("creates an empty draft for a selected date", () => {
    expect(createEmptyEntryDraft("2026-06-04")).toEqual({
      date: "2026-06-04",
      title: "",
      body: "",
      mood: "",
      whatHappened: "",
      feelings: "",
      learning: "",
      goalRelation: "",
    });
  });

  it("saves, lists, loads, and updates one entry per date", async () => {
    const repository = new InMemoryEntryRepository();

    await repository.save(draft, []);

    expect(await repository.list()).toHaveLength(1);
    expect(await repository.getByDate("2026-06-03")).toMatchObject({
      entry: draft,
      goalLinks: [],
    });

    await repository.save({ ...draft, title: "新的标题" }, []);

    expect(await repository.list()).toHaveLength(1);
    expect(await repository.getByDate("2026-06-03")).toMatchObject({
      entry: { title: "新的标题" },
      goalLinks: [],
    });
  });

  it("replaces goal links while preserving the updated progress note", async () => {
    const repository = new InMemoryEntryRepository();

    await repository.save(draft, [
      { goalId: 1, progressNote: "完成数据库设计。" },
      { goalId: 2, progressNote: "散步二十分钟。" },
    ]);

    await repository.save(draft, [
      { goalId: 1, progressNote: "完成数据库设计和持久化。" },
    ]);

    expect(await repository.getByDate("2026-06-03")).toMatchObject({
      goalLinks: [
        {
          goalId: 1,
          goalName: "发布个人成长应用",
          goalStatus: "进行中",
          goalStage: "MVP 开发",
          progressNote: "完成数据库设计和持久化。",
        },
      ],
    });
  });
});
