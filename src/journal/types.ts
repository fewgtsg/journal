import type { GoalStatus } from "../goals/types";

export type Entry = {
  id: number;
  date: string;
  title: string;
  body: string;
  mood: string;
  whatHappened: string;
  feelings: string;
  learning: string;
  goalRelation: string;
  createdAt: string;
  updatedAt: string;
};

export type EntryDraft = Omit<Entry, "id" | "createdAt" | "updatedAt">;

export type EntryGoalLinkDraft = {
  goalId: number;
  progressNote: string;
};

export type EntryGoalLink = EntryGoalLinkDraft & {
  goalName: string;
  goalStatus: GoalStatus;
  goalStage: string;
};

export type EntryWithGoals = {
  entry: Entry;
  goalLinks: EntryGoalLink[];
};

export function createEmptyEntryDraft(date: string): EntryDraft {
  return {
    date,
    title: "",
    body: "",
    mood: "",
    whatHappened: "",
    feelings: "",
    learning: "",
    goalRelation: "",
  };
}
