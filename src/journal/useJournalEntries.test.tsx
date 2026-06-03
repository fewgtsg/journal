// @vitest-environment jsdom

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { EntryRepository } from "./entryRepository";
import type {
  Entry,
  EntryDraft,
  EntryGoalLink,
  EntryGoalLinkDraft,
  EntryWithGoals,
} from "./types";
import { useJournalEntries } from "./useJournalEntries";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

class InMemoryEntryRepository implements EntryRepository {
  private entries: Entry[] = [];
  private goalLinks = new Map<string, EntryGoalLink[]>();

  constructor(
    initialEntries: Entry[] = [],
    initialGoalLinks: EntryGoalLink[] = [],
  ) {
    this.entries = initialEntries;
    for (const entry of initialEntries) {
      this.goalLinks.set(entry.date, initialGoalLinks);
    }
  }

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
    const persistedGoalLinks = goalLinks.map((link) => ({
      ...link,
      goalName: "发布个人成长应用",
      goalStatus: "进行中" as const,
      goalStage: "MVP 开发",
    }));
    this.goalLinks.set(draft.date, persistedGoalLinks);
    return { entry: saved, goalLinks: persistedGoalLinks };
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

const savedGoalLink: EntryGoalLink = {
  goalId: 2,
  progressNote: "完成 SQLite 持久化。",
  goalName: "发布个人成长应用",
  goalStatus: "进行中",
  goalStage: "MVP 开发",
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

  it("preserves loaded goal links when saving an edited entry", async () => {
    const repository = new InMemoryEntryRepository([savedEntry], [savedGoalLink]);
    const save = vi.spyOn(repository, "save");
    const { result } = renderHook(() =>
      useJournalEntries(repository, "2026-06-03"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateDraft({ body: "今天继续推进了产品。" });
    });
    await act(async () => {
      await result.current.saveDraft();
    });

    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({ body: "今天继续推进了产品。" }),
      [{ goalId: 2, progressNote: "完成 SQLite 持久化。" }],
    );
    await expect(repository.getByDate("2026-06-03")).resolves.toMatchObject({
      goalLinks: [savedGoalLink],
    });
  });

  it("keeps loaded goal links internally when saving fails", async () => {
    const repository = new InMemoryEntryRepository([savedEntry], [savedGoalLink]);
    const save = vi
      .spyOn(repository, "save")
      .mockRejectedValueOnce(new Error("database unavailable"));
    const { result } = renderHook(() =>
      useJournalEntries(repository, "2026-06-03"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateDraft({ body: "第一次编辑" });
    });
    await act(async () => {
      await expect(result.current.saveDraft()).rejects.toThrow(
        "database unavailable",
      );
    });

    act(() => {
      result.current.updateDraft({ body: "第二次编辑" });
    });
    await act(async () => {
      await result.current.saveDraft();
    });

    expect(save).toHaveBeenLastCalledWith(
      expect.objectContaining({ body: "第二次编辑" }),
      [{ goalId: 2, progressNote: "完成 SQLite 持久化。" }],
    );
  });

  it("does not overwrite edits made while a save is pending", async () => {
    const repository = new InMemoryEntryRepository([savedEntry], [savedGoalLink]);
    const pendingSave = deferred<EntryWithGoals>();
    vi.spyOn(repository, "save").mockReturnValueOnce(pendingSave.promise);
    const { result } = renderHook(() =>
      useJournalEntries(repository, "2026-06-03"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.updateDraft({ body: "准备保存的内容" });
    });
    let savePromise!: Promise<EntryWithGoals>;
    act(() => {
      savePromise = result.current.saveDraft();
    });
    act(() => {
      result.current.updateDraft({ body: "保存期间继续编辑" });
    });
    await act(async () => {
      pendingSave.resolve({
        entry: { ...savedEntry, body: "准备保存的内容" },
        goalLinks: [savedGoalLink],
      });
      await savePromise;
    });

    expect(result.current.draft.body).toBe("保存期间继续编辑");
    expect(result.current.dirty).toBe(true);
  });

  it("does not apply an old save result after switching dates", async () => {
    const repository = new InMemoryEntryRepository([savedEntry], [savedGoalLink]);
    const pendingSave = deferred<EntryWithGoals>();
    vi.spyOn(repository, "save").mockReturnValueOnce(pendingSave.promise);
    const { result } = renderHook(() =>
      useJournalEntries(repository, "2026-06-03"),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    let savePromise!: Promise<EntryWithGoals>;
    act(() => {
      savePromise = result.current.saveDraft();
      result.current.selectDate("2026-06-04");
    });
    await waitFor(() => expect(result.current.selectedDate).toBe("2026-06-04"));
    await waitFor(() => expect(result.current.draft.date).toBe("2026-06-04"));

    await act(async () => {
      pendingSave.resolve({
        entry: { ...savedEntry, body: "旧日期保存结果" },
        goalLinks: [savedGoalLink],
      });
      await savePromise;
    });

    expect(result.current.draft.date).toBe("2026-06-04");
    expect(result.current.draft.body).toBe("");
  });
});
