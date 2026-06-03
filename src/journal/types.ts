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
