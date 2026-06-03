import { useCallback, useEffect, useState } from "react";
import type { EntryRepository } from "./entryRepository";
import { createEmptyEntryDraft, type Entry, type EntryDraft } from "./types";

export function useJournalEntries(
  repository: EntryRepository,
  initialDate: string,
) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [draft, setDraft] = useState<EntryDraft>(() =>
    createEmptyEntryDraft(initialDate),
  );
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

  const saveDraft = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await repository.save(draft, []);
      setDraft(toDraft(saved.entry));
      setEntries(await repository.list());
      setDirty(false);
      return saved;
    } catch (cause) {
      setError(messageFrom(cause));
      throw cause;
    } finally {
      setSaving(false);
    }
  }, [draft, repository]);

  return {
    entries,
    draft,
    selectedDate,
    loading,
    saving,
    error,
    dirty,
    selectDate,
    updateDraft,
    saveDraft,
  };
}

function toDraft(entry: Entry): EntryDraft {
  const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...draft } =
    entry;
  return draft;
}

function messageFrom(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
