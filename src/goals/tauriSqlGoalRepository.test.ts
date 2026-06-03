import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  mapGoalRow,
  mapGoalTimelineRow,
  TauriSqlGoalRepository,
} from "./tauriSqlGoalRepository";

const { database, loadDatabase } = vi.hoisted(() => ({
  database: {
    select: vi.fn(),
    execute: vi.fn(),
  },
  loadDatabase: vi.fn(),
}));

vi.mock("@tauri-apps/plugin-sql", () => ({
  default: {
    load: loadDatabase,
  },
}));

const goalRow = {
  id: 2,
  name: "发布个人成长应用",
  description: "做一个真正愿意每天使用的产品。",
  status: "进行中" as const,
  stage: "MVP 开发",
  progress_note: "已完成本地持久化。",
  created_at: "2026-06-03 10:00:00",
  updated_at: "2026-06-03 10:30:00",
};

describe("TauriSqlGoalRepository row mapping", () => {
  it("maps a goal row", () => {
    expect(mapGoalRow(goalRow)).toEqual({
      id: 2,
      name: "发布个人成长应用",
      description: "做一个真正愿意每天使用的产品。",
      status: "进行中",
      stage: "MVP 开发",
      progressNote: "已完成本地持久化。",
      createdAt: "2026-06-03 10:00:00",
      updatedAt: "2026-06-03 10:30:00",
    });
  });

  it("maps a goal timeline row", () => {
    expect(
      mapGoalTimelineRow({
        entry_id: 7,
        date: "2026-06-03",
        title: "数据库保存完成",
        body: "今天让记录真正保存下来了。",
        mood: "清晰",
        progress_note: "完成 SQLite 持久化。",
      }),
    ).toEqual({
      entryId: 7,
      date: "2026-06-03",
      title: "数据库保存完成",
      body: "今天让记录真正保存下来了。",
      mood: "清晰",
      progressNote: "完成 SQLite 持久化。",
    });
  });
});

describe("TauriSqlGoalRepository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    loadDatabase.mockResolvedValue(database);
  });

  it("lists goals in recently updated order", async () => {
    database.select.mockResolvedValue([goalRow]);
    const repository = new TauriSqlGoalRepository();

    await expect(repository.list()).resolves.toEqual([mapGoalRow(goalRow)]);

    expect(database.select).toHaveBeenCalledWith(
      "SELECT * FROM goals ORDER BY updated_at DESC, id DESC",
    );
  });

  it("filters goals with parameterized statuses", async () => {
    database.select.mockResolvedValue([goalRow]);
    const repository = new TauriSqlGoalRepository();

    await repository.list(["进行中", "暂停"]);

    expect(database.select).toHaveBeenCalledTimes(1);
    expect(database.select).toHaveBeenCalledWith(
      "SELECT * FROM goals WHERE status IN ($1, $2) ORDER BY updated_at DESC, id DESC",
      ["进行中", "暂停"],
    );
  });

  it("returns no goals for an empty status filter without querying SQLite", async () => {
    const repository = new TauriSqlGoalRepository();

    await expect(repository.list([])).resolves.toEqual([]);

    expect(database.select).not.toHaveBeenCalled();
    expect(loadDatabase).not.toHaveBeenCalled();
  });

  it("loads a goal by id with a parameterized query", async () => {
    database.select.mockResolvedValue([goalRow]);
    const repository = new TauriSqlGoalRepository();

    await expect(repository.get(2)).resolves.toEqual(mapGoalRow(goalRow));

    expect(database.select).toHaveBeenCalledWith(
      "SELECT * FROM goals WHERE id = $1 LIMIT 1",
      [2],
    );
  });

  it("loads a goal timeline newest date first", async () => {
    const timelineRow = {
      entry_id: 7,
      date: "2026-06-03",
      title: "数据库保存完成",
      body: "今天让记录真正保存下来了。",
      mood: "清晰",
      progress_note: "完成 SQLite 持久化。",
    };
    database.select.mockResolvedValue([timelineRow]);
    const repository = new TauriSqlGoalRepository();

    await expect(repository.timeline(2)).resolves.toEqual([
      mapGoalTimelineRow(timelineRow),
    ]);

    expect(database.select).toHaveBeenCalledWith(
      `SELECT
        entries.id AS entry_id,
        entries.date,
        entries.title,
        entries.body,
        entries.mood,
        entry_goals.progress_note
      FROM entry_goals
      JOIN entries ON entries.id = entry_goals.entry_id
      WHERE entry_goals.goal_id = $1
      ORDER BY entries.date DESC`,
      [2],
    );
  });

  it("inserts a valid new goal and reloads it", async () => {
    database.execute.mockResolvedValue({ lastInsertId: 2, rowsAffected: 1 });
    database.select.mockResolvedValue([goalRow]);
    const repository = new TauriSqlGoalRepository();

    await expect(
      repository.save({
        name: goalRow.name,
        description: goalRow.description,
        status: goalRow.status,
        stage: goalRow.stage,
        progressNote: goalRow.progress_note,
      }),
    ).resolves.toEqual(mapGoalRow(goalRow));

    expect(database.execute).toHaveBeenCalledWith(
      expect.stringContaining("INSERT INTO goals"),
      [
        goalRow.name,
        goalRow.description,
        goalRow.status,
        goalRow.stage,
        goalRow.progress_note,
      ],
    );
    expect(database.select).toHaveBeenCalledWith(
      "SELECT * FROM goals WHERE id = $1 LIMIT 1",
      [2],
    );
  });

  it("updates an existing goal and reloads it", async () => {
    database.execute.mockResolvedValue({ lastInsertId: 0, rowsAffected: 1 });
    database.select.mockResolvedValue([goalRow]);
    const repository = new TauriSqlGoalRepository();

    await repository.save({
      id: 2,
      name: goalRow.name,
      description: goalRow.description,
      status: goalRow.status,
      stage: goalRow.stage,
      progressNote: goalRow.progress_note,
    });

    expect(database.execute).toHaveBeenCalledWith(
      expect.stringContaining("UPDATE goals SET"),
      [
        goalRow.name,
        goalRow.description,
        goalRow.status,
        goalRow.stage,
        goalRow.progress_note,
        2,
      ],
    );
  });

  it("throws a clear error when updating a goal that does not exist", async () => {
    database.execute.mockResolvedValue({ lastInsertId: 0, rowsAffected: 0 });
    const repository = new TauriSqlGoalRepository();

    await expect(
      repository.save({
        id: 99,
        name: goalRow.name,
        description: goalRow.description,
        status: goalRow.status,
        stage: goalRow.stage,
        progressNote: goalRow.progress_note,
      }),
    ).rejects.toThrow("Cannot update missing goal 99");

    expect(database.select).not.toHaveBeenCalled();
  });

  it("throws when a saved goal cannot be reloaded", async () => {
    database.execute.mockResolvedValue({ lastInsertId: 2, rowsAffected: 1 });
    database.select.mockResolvedValue([]);
    const repository = new TauriSqlGoalRepository();

    await expect(
      repository.save({
        name: goalRow.name,
        description: goalRow.description,
        status: goalRow.status,
        stage: goalRow.stage,
        progressNote: goalRow.progress_note,
      }),
    ).rejects.toThrow("Failed to load saved goal 2");
  });

  it("propagates database select errors", async () => {
    const databaseError = new Error("database unavailable");
    database.select.mockRejectedValue(databaseError);
    const repository = new TauriSqlGoalRepository();

    await expect(repository.get(2)).rejects.toBe(databaseError);
  });

  it("propagates database execute errors", async () => {
    const databaseError = new Error("database is read-only");
    database.execute.mockRejectedValue(databaseError);
    const repository = new TauriSqlGoalRepository();

    await expect(
      repository.save({
        name: goalRow.name,
        description: goalRow.description,
        status: goalRow.status,
        stage: goalRow.stage,
        progressNote: goalRow.progress_note,
      }),
    ).rejects.toBe(databaseError);
  });

  it("rejects invalid drafts before writing", async () => {
    const repository = new TauriSqlGoalRepository();

    await expect(
      repository.save({
        name: " ",
        description: "",
        status: "进行中",
        stage: "",
        progressNote: "",
      }),
    ).rejects.toThrow("目标名称不能为空");

    expect(database.execute).not.toHaveBeenCalled();
  });
});
