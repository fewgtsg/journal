import { describe, expect, it } from "vitest";
import { mapEntryRow } from "./tauriSqlEntryRepository";

describe("mapEntryRow", () => {
  it("maps every SQLite entry column into the journal entry shape", () => {
    expect(
      mapEntryRow({
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
      }),
    ).toEqual({
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
});
