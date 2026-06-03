import { describe, expect, it } from "vitest";
import type { EntryRepository } from "./entryRepository";
import { createEmptyEntryDraft, type Entry, type EntryDraft } from "./types";

class InMemoryEntryRepository implements EntryRepository {
  private entries: Entry[] = [];

  async list(): Promise<Entry[]> {
    return [...this.entries].sort((a, b) => b.date.localeCompare(a.date));
  }

  async getByDate(date: string): Promise<Entry | null> {
    return this.entries.find((entry) => entry.date === date) ?? null;
  }

  async save(draft: EntryDraft): Promise<Entry> {
    const existing = await this.getByDate(draft.date);
    const timestamp = "2026-06-03T10:00:00.000Z";
    const saved: Entry = {
      ...draft,
      id: existing?.id ?? this.entries.length + 1,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };

    this.entries = [
      ...this.entries.filter((entry) => entry.date !== draft.date),
      saved,
    ];
    return saved;
  }
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

    await repository.save(draft);

    expect(await repository.list()).toHaveLength(1);
    expect(await repository.getByDate("2026-06-03")).toMatchObject(draft);

    await repository.save({ ...draft, title: "新的标题" });

    expect(await repository.list()).toHaveLength(1);
    expect(await repository.getByDate("2026-06-03")).toMatchObject({
      title: "新的标题",
    });
  });
});
