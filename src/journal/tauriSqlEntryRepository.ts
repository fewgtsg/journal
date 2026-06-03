import Database from "@tauri-apps/plugin-sql";
import type { EntryRepository } from "./entryRepository";
import type { Entry, EntryDraft } from "./types";

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

export class TauriSqlEntryRepository implements EntryRepository {
  private databasePromise: Promise<Database> | null = null;

  async list(): Promise<Entry[]> {
    const database = await this.database();
    const rows = await database.select<EntryRow[]>(
      "SELECT * FROM entries ORDER BY date DESC",
    );
    return rows.map(mapEntryRow);
  }

  async getByDate(date: string): Promise<Entry | null> {
    const database = await this.database();
    const rows = await database.select<EntryRow[]>(
      "SELECT * FROM entries WHERE date = $1 LIMIT 1",
      [date],
    );
    return rows[0] ? mapEntryRow(rows[0]) : null;
  }

  async save(entry: EntryDraft): Promise<Entry> {
    const database = await this.database();
    await database.execute(
      `INSERT INTO entries (
        date, title, body, mood, what_happened, feelings, learning, goal_relation
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT(date) DO UPDATE SET
        title = excluded.title,
        body = excluded.body,
        mood = excluded.mood,
        what_happened = excluded.what_happened,
        feelings = excluded.feelings,
        learning = excluded.learning,
        goal_relation = excluded.goal_relation,
        updated_at = CURRENT_TIMESTAMP`,
      [
        entry.date,
        entry.title,
        entry.body,
        entry.mood,
        entry.whatHappened,
        entry.feelings,
        entry.learning,
        entry.goalRelation,
      ],
    );

    const saved = await this.getByDate(entry.date);
    if (!saved) {
      throw new Error(`Failed to load saved entry for ${entry.date}`);
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
