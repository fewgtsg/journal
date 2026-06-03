import type {
  Entry,
  EntryDraft,
  EntryGoalLinkDraft,
  EntryWithGoals,
} from "./types";

export interface EntryRepository {
  list(): Promise<Entry[]>;
  getByDate(date: string): Promise<EntryWithGoals | null>;
  save(
    entry: EntryDraft,
    goalLinks: EntryGoalLinkDraft[],
  ): Promise<EntryWithGoals>;
}
