import type {
  Goal,
  GoalDraft,
  GoalStatus,
  GoalTimelineEntry,
} from "./types";

export interface GoalRepository {
  list(statuses?: GoalStatus[]): Promise<Goal[]>;
  get(id: number): Promise<Goal | null>;
  timeline(id: number): Promise<GoalTimelineEntry[]>;
  save(draft: GoalDraft): Promise<Goal>;
}
