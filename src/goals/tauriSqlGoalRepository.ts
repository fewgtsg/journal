import Database from "@tauri-apps/plugin-sql";
import type { GoalRepository } from "./goalRepository";
import type {
  Goal,
  GoalDraft,
  GoalStatus,
  GoalTimelineEntry,
} from "./types";
import { validateGoalDraft } from "./types";

export type GoalRow = {
  id: number;
  name: string;
  description: string;
  status: GoalStatus;
  stage: string;
  progress_note: string;
  created_at: string;
  updated_at: string;
};

export type GoalTimelineRow = {
  entry_id: number;
  date: string;
  title: string;
  body: string;
  mood: string;
  progress_note: string;
};

export function mapGoalRow(row: GoalRow): Goal {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    status: row.status,
    stage: row.stage,
    progressNote: row.progress_note,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapGoalTimelineRow(row: GoalTimelineRow): GoalTimelineEntry {
  return {
    entryId: row.entry_id,
    date: row.date,
    title: row.title,
    body: row.body,
    mood: row.mood,
    progressNote: row.progress_note,
  };
}

export class TauriSqlGoalRepository implements GoalRepository {
  private databasePromise: Promise<Database> | null = null;

  async list(statuses?: GoalStatus[]): Promise<Goal[]> {
    if (statuses && statuses.length === 0) return [];

    const database = await this.database();
    if (!statuses) {
      const rows = await database.select<GoalRow[]>(
        "SELECT * FROM goals ORDER BY updated_at DESC, id DESC",
      );
      return rows.map(mapGoalRow);
    }

    const placeholders = statuses.map((_, index) => `$${index + 1}`).join(", ");
    const rows = await database.select<GoalRow[]>(
      `SELECT * FROM goals WHERE status IN (${placeholders}) ORDER BY updated_at DESC, id DESC`,
      statuses,
    );
    return rows.map(mapGoalRow);
  }

  async get(id: number): Promise<Goal | null> {
    const database = await this.database();
    const rows = await database.select<GoalRow[]>(
      "SELECT * FROM goals WHERE id = $1 LIMIT 1",
      [id],
    );
    return rows[0] ? mapGoalRow(rows[0]) : null;
  }

  async timeline(id: number): Promise<GoalTimelineEntry[]> {
    const database = await this.database();
    const rows = await database.select<GoalTimelineRow[]>(
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
      [id],
    );
    return rows.map(mapGoalTimelineRow);
  }

  async save(draft: GoalDraft): Promise<Goal> {
    const validationError = validateGoalDraft(draft);
    if (validationError) throw new Error(validationError);

    const database = await this.database();
    let id = draft.id;

    if (id === undefined) {
      const result = await database.execute(
        `INSERT INTO goals (
          name, description, status, stage, progress_note
        ) VALUES ($1, $2, $3, $4, $5)`,
        [
          draft.name,
          draft.description,
          draft.status,
          draft.stage,
          draft.progressNote,
        ],
      );
      id = result.lastInsertId;
    } else {
      await database.execute(
        `UPDATE goals SET
          name = $1,
          description = $2,
          status = $3,
          stage = $4,
          progress_note = $5,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $6`,
        [
          draft.name,
          draft.description,
          draft.status,
          draft.stage,
          draft.progressNote,
          id,
        ],
      );
    }

    if (id === undefined) {
      throw new Error("Failed to determine saved goal id");
    }

    const saved = await this.get(id);
    if (!saved) {
      throw new Error(`Failed to load saved goal ${id}`);
    }
    return saved;
  }

  private database(): Promise<Database> {
    if (!this.databasePromise) {
      this.databasePromise = Database.load("sqlite:journal.db");
    }
    return this.databasePromise;
  }
}
