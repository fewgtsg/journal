import { invoke } from "@tauri-apps/api/core";
import Database from "@tauri-apps/plugin-sql";
import type { EntryRepository } from "./entryRepository";
import type {
  Entry,
  EntryDraft,
  EntryGoalLink,
  EntryGoalLinkDraft,
  EntryWithGoals,
} from "./types";

type EntryRow = {
  id: number;
  date: string;
  title: string;
  body: string;
  mood: string;
  what_happened: string;
  feelings: string;
  learning: string;
  goal_relation: string;
  created_at: string;
  updated_at: string;
};

type EntryGoalRow = {
  goal_id: number;
  progress_note: string;
  goal_name: string;
  goal_status: EntryGoalLink["goalStatus"];
  goal_stage: string;
};

export function mapEntryRow(row: EntryRow): Entry {
  return {
    id: row.id,
    date: row.date,
    title: row.title,
    body: row.body,
    mood: row.mood,
    whatHappened: row.what_happened,
    feelings: row.feelings,
    learning: row.learning,
    goalRelation: row.goal_relation,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapEntryGoalRow(row: EntryGoalRow): EntryGoalLink {
  return {
    goalId: row.goal_id,
    progressNote: row.progress_note,
    goalName: row.goal_name,
    goalStatus: row.goal_status,
    goalStage: row.goal_stage,
  };
}

export class TauriSqlEntryRepository implements EntryRepository {
  private databasePromise: Promise<Database> | null = null;

  async list(): Promise<Entry[]> {
    const database = await this.database();
    const rows = await database.select<EntryRow[]>(
      "SELECT * FROM entries ORDER BY date DESC",
    );
    return rows.map(mapEntryRow);
  }

  async getByDate(date: string): Promise<EntryWithGoals | null> {
    const database = await this.database();
    const rows = await database.select<EntryRow[]>(
      "SELECT * FROM entries WHERE date = $1 LIMIT 1",
      [date],
    );
    const row = rows[0];
    return row
      ? {
          entry: mapEntryRow(row),
          goalLinks: await this.getGoalLinks(row.id),
        }
      : null;
  }

  async save(
    entry: EntryDraft,
    goalLinks: EntryGoalLinkDraft[],
  ): Promise<EntryWithGoals> {
    return invoke<EntryWithGoals>("save_entry_with_goal_links", {
      entry,
      goalLinks,
    });
  }

  private async getGoalLinks(entryId: number): Promise<EntryGoalLink[]> {
    const database = await this.database();
    const rows = await database.select<EntryGoalRow[]>(
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
      [entryId],
    );
    return rows.map(mapEntryGoalRow);
  }

  private database(): Promise<Database> {
    if (!this.databasePromise) {
      this.databasePromise = Database.load("sqlite:journal.db");
    }
    return this.databasePromise;
  }
}
