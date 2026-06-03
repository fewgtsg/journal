// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { EntryRepository } from "./entryRepository";
import type {
  Entry,
  EntryDraft,
  EntryGoalLinkDraft,
  EntryWithGoals,
} from "./types";
import { useJournalEntries } from "./useJournalEntries";

class InMemoryEntryRepository implements EntryRepository {
  private entries: Entry[] = [];

  constructor(initialEntries: Entry[] = []) {
    this.entries = initialEntries;
  }

  async list(): Promise<Entry[]> {
    return [...this.entries].sort((a, b) => b.date.localeCompare(a.date));
  }

  async getByDate(date: string): Promise<EntryWithGoals | null> {
    const entry = this.entries.find((candidate) => candidate.date === date);
    return entry ? { entry, goalLinks: [] } : null;
  }

  async save(
    draft: EntryDraft,
    _goalLinks: EntryGoalLinkDraft[],
  ): Promise<EntryWithGoals> {
    const existing = await this.getByDate(draft.date);
    const saved: Entry = {
      ...draft,
      id: existing?.entry.id ?? this.entries.length + 1,
      createdAt:
        existing?.entry.createdAt ?? "2026-06-03T10:00:00.000Z",
      updatedAt: "2026-06-03T10:30:00.000Z",
    };
    this.entries = [
      ...this.entries.filter((entry) => entry.date !== draft.date),
      saved,
    ];
    return { entry: saved, goalLinks: [] };
  }
}

const savedEntry: Entry = {
  id: 1,
  date: "2026-06-03",
  title: "方向变得清楚了",
  body: "今天把产品想得更清楚了。",
  mood: "清晰",
  whatHappened: "确定了第一版方向。",
  feelings: "更踏实。",
  learning: "每天愿意打开比功能多更重要。",
  goalRelation: "推动了 MVP 设计。",
  createdAt: "2026-06-03T10:00:00.000Z",
  updatedAt: "2026-06-03T10:00:00.000Z",
};

describe("useJournalEntries", () => {
  it("loads today's saved entry", async () => {
    const repository = new InMemoryEntryRepository([savedEntry]);
    const { result } = renderHook(() =>
      useJournalEntries(repository, "2026-06-03"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.draft).toMatchObject({
      date: "2026-06-03",
      title: "方向变得清楚了",
    });
    expect(result.current.entries).toHaveLength(1);
  });

  it("creates, edits, saves, and reloads an entry for an empty day", async () => {
    const repository = new InMemoryEntryRepository();
    const first = renderHook(() => useJournalEntries(repository, "2026-06-04"));

    await waitFor(() => expect(first.result.current.loading).toBe(false));
    expect(first.result.current.draft.title).toBe("");

    act(() => {
      first.result.current.updateDraft({ title: "新的记录", mood: "平静" });
    });
    expect(first.result.current.dirty).toBe(true);

    await act(async () => {
      await first.result.current.saveDraft();
    });
    expect(first.result.current.dirty).toBe(false);

    first.unmount();
    const second = renderHook(() =>
      useJournalEntries(repository, "2026-06-04"),
    );
    await waitFor(() => expect(second.result.current.loading).toBe(false));

    expect(second.result.current.draft).toMatchObject({
      title: "新的记录",
      mood: "平静",
    });
  });
});
