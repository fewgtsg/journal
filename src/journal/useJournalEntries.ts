import { useCallback, useEffect, useRef, useState } from "react";
import type { EntryRepository } from "./entryRepository";
import {
  createEmptyEntryDraft,
  type Entry,
  type EntryDraft,
  type EntryGoalLink,
  type EntryGoalLinkDraft,
} from "./types";

export function useJournalEntries(
  repository: EntryRepository,
  initialDate: string,
) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [draft, setDraft] = useState<EntryDraft>(() =>
    createEmptyEntryDraft(initialDate),
  );
  const [goalLinks, setGoalLinks] = useState<EntryGoalLinkDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [allEntries, selectedEntry] = await Promise.all([
          repository.list(),
          repository.getByDate(selectedDate),
        ]);
        if (!active) return;
        setEntries(allEntries);
        setDraft(
          selectedEntry
            ? toDraft(selectedEntry.entry)
            : createEmptyEntryDraft(selectedDate),
        );
        setGoalLinks(
          selectedEntry ? selectedEntry.goalLinks.map(toGoalLinkDraft) : [],
        );
        setDirty(false);
      } catch (cause) {
        if (!active) return;
        setError(messageFrom(cause));
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [repository, selectedDate]);

  const selectDate = useCallback((date: string) => {
    setSelectedDate(date);
  }, []);

  const updateDraft = useCallback((changes: Partial<EntryDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setDirty(true);
  }, []);

  const addGoalLink = useCallback((goalId: number) => {
    setGoalLinks((current) => {
      if (current.some((link) => link.goalId === goalId)) return current;
      return [...current, { goalId, progressNote: "" }];
    });
    setDirty(true);
  }, []);

  const removeGoalLink = useCallback((goalId: number) => {
    setGoalLinks((current) =>
      current.filter((link) => link.goalId !== goalId),
    );
    setDirty(true);
  }, []);

  const updateGoalLink = useCallback(
    (goalId: number, changes: Partial<EntryGoalLinkDraft>) => {
      setGoalLinks((current) =>
        current.map((link) =>
          link.goalId === goalId ? { ...link, ...changes } : link,
        ),
      );
      setDirty(true);
    },
    [],
  );

  const selectedDateRef = useRef(selectedDate);
  selectedDateRef.current = selectedDate;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const goalLinksRef = useRef(goalLinks);
  goalLinksRef.current = goalLinks;

  const saveDraft = useCallback(async () => {
    setSaving(true);
    setError(null);
    const savedAtDate = selectedDateRef.current;
    const snapshot = draftRef.current;
    try {
      const saved = await repository.save(snapshot, goalLinksRef.current);
      setEntries(await repository.list());
      const currentDraft = draftRef.current;
      const currentDate = selectedDateRef.current;
      if (currentDate === savedAtDate && draftsEqual(currentDraft, snapshot)) {
        setDraft(toDraft(saved.entry));
        setGoalLinks(saved.goalLinks.map(toGoalLinkDraft));
        setDirty(false);
      }
      return saved;
    } catch (cause) {
      setError(messageFrom(cause));
      throw cause;
    } finally {
      setSaving(false);
    }
  }, [repository]);

  return {
    entries,
    draft,
    selectedDate,
    goalLinks,
    loading,
    saving,
    error,
    dirty,
    selectDate,
    updateDraft,
    addGoalLink,
    removeGoalLink,
    updateGoalLink,
    saveDraft,
  };
}

function toDraft(entry: Entry): EntryDraft {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...draft } =
    entry;
  return draft;
}

function toGoalLinkDraft(link: EntryGoalLink): EntryGoalLinkDraft {
  return {
    goalId: link.goalId,
    progressNote: link.progressNote,
  };
}

function draftsEqual(a: EntryDraft, b: EntryDraft): boolean {
  return (
    a.date === b.date &&
    a.title === b.title &&
    a.body === b.body &&
    a.mood === b.mood &&
    a.whatHappened === b.whatHappened &&
    a.feelings === b.feelings &&
    a.learning === b.learning &&
    a.goalRelation === b.goalRelation
  );
}

function messageFrom(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
