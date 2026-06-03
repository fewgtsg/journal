import { useCallback, useEffect, useState } from "react";
import type { GoalRepository } from "./goalRepository";
import {
  createEmptyGoalDraft,
  type Goal,
  type GoalDraft,
  type GoalStatus,
  type GoalTimelineEntry,
} from "./types";

export function useGoals(repository: GoalRepository) {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [timeline, setTimeline] = useState<GoalTimelineEntry[]>([]);
  const [draft, setDraft] = useState<GoalDraft | null>(null);
  const [statuses, setStatuses] = useState<GoalStatus[]>(["进行中", "暂停"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const loadGoals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await repository.list(statuses);
      setGoals(list);
    } catch (cause) {
      setError(messageFrom(cause));
    } finally {
      setLoading(false);
    }
  }, [repository, statuses]);

  useEffect(() => {
    void loadGoals();
  }, [loadGoals]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (selectedGoalId === null) {
          setTimeline([]);
          setDraft(null);
          return;
        }
        const [goal, entries] = await Promise.all([
          repository.get(selectedGoalId),
          repository.timeline(selectedGoalId),
        ]);
        if (!active) return;
        if (goal) {
          setDraft(toDraft(goal));
        }
        setTimeline(entries);
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
  }, [repository, selectedGoalId]);

  const selectGoal = useCallback((id: number | null) => {
    setSelectedGoalId(id);
    setDirty(false);
    setError(null);
  }, []);

  const createGoal = useCallback(() => {
    setSelectedGoalId(null);
    setDraft(createEmptyGoalDraft());
    setTimeline([]);
    setDirty(false);
    setError(null);
  }, []);

  const updateDraft = useCallback((changes: Partial<GoalDraft>) => {
    setDraft((current) => (current ? { ...current, ...changes } : null));
    setDirty(true);
  }, []);

  const saveDraft = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await repository.save(draft);
      setGoals(await repository.list(statuses));
      setSelectedGoalId(saved.id);
      setDraft(toDraft(saved));
      setDirty(false);
      return saved;
    } catch (cause) {
      setError(messageFrom(cause));
      throw cause;
    } finally {
      setSaving(false);
    }
  }, [draft, repository, statuses]);

  const refresh = useCallback(async () => {
    await loadGoals();
  }, [loadGoals]);

  return {
    goals,
    selectedGoal: goals.find((g) => g.id === selectedGoalId) ?? null,
    timeline,
    draft,
    statuses,
    loading,
    saving,
    error,
    dirty,
    setStatuses,
    selectGoal,
    createGoal,
    updateDraft,
    saveDraft,
    refresh,
  };
}

function toDraft(goal: Goal): GoalDraft {
  const {
    id: _id,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    ...draft
  } = goal;
  return draft;
}

function messageFrom(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}
