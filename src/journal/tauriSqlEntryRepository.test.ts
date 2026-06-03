import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mapEntryGoalRow,
  mapEntryRow,
  TauriSqlEntryRepository,
} from "./tauriSqlEntryRepository";

const { database, loadDatabase, invoke } = vi.hoisted(() => ({
  database: {
    select: vi.fn(),
  },
  loadDatabase: vi.fn(),
  invoke: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-sql", () => ({
  default: {
    load: loadDatabase,
  },
}));

vi.mock("@tauri-apps/api/core", () => ({ invoke }));

const entryRow = {
  id: 7,
  date: "2026-06-03",
  title: "方向变得清楚了",
  body: "今天把产品想得更清楚了。",
  mood: "清晰",
  what_happened: "确定了第一版方向。",
  feelings: "更踏实。",
  learning: "每天愿意打开比功能多更重要。",
  goal_relation: "推动了 MVP 设计。",
  created_at: "2026-06-03 10:00:00",
  updated_at: "2026-06-03 10:30:00",
};

const goalLinkRow = {
  goal_id: 2,
  progress_note: "完成 SQLite 持久化。",
  goal_name: "发布个人成长应用",
  goal_status: "进行中" as const,
  goal_stage: "MVP 开发",
};

const draft = {
  date: entryRow.date,
  title: entryRow.title,
  body: entryRow.body,
  mood: entryRow.mood,
  whatHappened: entryRow.what_happened,
  feelings: entryRow.feelings,
  learning: entryRow.learning,
  goalRelation: entryRow.goal_relation,
};

describe("TauriSqlEntryRepository row mapping", () => {
  it("maps every SQLite entry column into the journal entry shape", () => {
    expect(mapEntryRow(entryRow)).toEqual({
      id: 7,
      date: "2026-06-03",
      title: "方向变得清楚了",
      body: "今天把产品想得更清楚了。",
      mood: "清晰",
      whatHappened: "确定了第一版方向。",
      feelings: "更踏实。",
      learning: "每天愿意打开比功能多更重要。",
      goalRelation: "推动了 MVP 设计。",
      createdAt: "2026-06-03 10:00:00",
      updatedAt: "2026-06-03 10:30:00",
    });
  });

  it("maps a joined entry-goal row", () => {
    expect(mapEntryGoalRow(goalLinkRow)).toEqual({
      goalId: 2,
      progressNote: "完成 SQLite 持久化。",
      goalName: "发布个人成长应用",
      goalStatus: "进行中",
      goalStage: "MVP 开发",
    });
  });
});

describe("TauriSqlEntryRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadDatabase.mockResolvedValue(database);
  });

  it("loads an entry and its goal links with parameterized queries", async () => {
    database.select
      .mockResolvedValueOnce([entryRow])
      .mockResolvedValueOnce([goalLinkRow]);
    const repository = new TauriSqlEntryRepository();

    await expect(repository.getByDate(entryRow.date)).resolves.toEqual({
      entry: mapEntryRow(entryRow),
      goalLinks: [mapEntryGoalRow(goalLinkRow)],
    });

    expect(database.select).toHaveBeenNthCalledWith(
      1,
      "SELECT * FROM entries WHERE date = $1 LIMIT 1",
      [entryRow.date],
    );
    expect(database.select).toHaveBeenNthCalledWith(
      2,
      `SELECT
        entry_goals.goal_id,
        entry_goals.progress_note,
        goals.name AS goal_name,
        goals.status AS goal_status,
        goals.stage AS goal_stage
      FROM entry_goals
      JOIN goals ON goals.id = entry_goals.goal_id
      WHERE entry_goals.entry_id = $1
      ORDER BY entry_goals.created_at ASC, entry_goals.id ASC`,
      [entryRow.id],
    );
  });

  it("returns null without loading links when the date has no entry", async () => {
    database.select.mockResolvedValue([]);
    const repository = new TauriSqlEntryRepository();

    await expect(repository.getByDate("2026-06-04")).resolves.toBeNull();

    expect(database.select).toHaveBeenCalledTimes(1);
  });

  it("saves an entry and its goal links with one Tauri command", async () => {
    const saved = {
      entry: mapEntryRow(entryRow),
      goalLinks: [mapEntryGoalRow(goalLinkRow)],
    };
    invoke.mockResolvedValue(saved);
    const repository = new TauriSqlEntryRepository();

    await expect(
      repository.save(draft, [
        { goalId: 2, progressNote: goalLinkRow.progress_note },
      ]),
    ).resolves.toEqual(saved);

    expect(invoke).toHaveBeenCalledTimes(1);
    expect(invoke).toHaveBeenCalledWith("save_entry_with_goal_links", {
      entry: draft,
      goalLinks: [{ goalId: 2, progressNote: goalLinkRow.progress_note }],
    });
    expect(loadDatabase).not.toHaveBeenCalled();
  });
});
