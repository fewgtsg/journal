import type { Entry, EntryDraft } from "./types";

export interface EntryRepository {
  list(): Promise<Entry[]>;
  getByDate(date: string): Promise<Entry | null>;
  save(entry: EntryDraft): Promise<Entry>;
}
