import { useMemo, useState } from "react";
import AppSidebar from "./components/AppSidebar";
import { GoalContextPanel } from "./components/GoalContextPanel";
import { GoalsView } from "./components/GoalsView";
import JournalView from "./components/JournalView";
import { backupDatabase } from "./export/backup";
import { exportAllEntriesToMarkdown } from "./export/markdownExport";
import { TauriSqlGoalRepository } from "./goals/tauriSqlGoalRepository";
import { isGoalLinkCandidate } from "./goals/types";
import { useGoals } from "./goals/useGoals";
import { TauriSqlEntryRepository } from "./journal/tauriSqlEntryRepository";
import { useJournalEntries } from "./journal/useJournalEntries";
import { localDate } from "./components/helpers";

type AppView = "journal" | "goals";

function App() {
  const [view, setView] = useState<AppView>("journal");
  const entryRepository = useMemo(
    () => new TauriSqlEntryRepository(),
    [],
  );
  const goalRepository = useMemo(() => new TauriSqlGoalRepository(), []);
  const today = useMemo(() => localDate(new Date()), []);

  const journal = useJournalEntries(entryRepository, today);
  const goals = useGoals(goalRepository);

  const candidates = useMemo(() => {
    return goals.goals.filter(
      (goal) =>
        isGoalLinkCandidate(goal) &&
        !journal.goalLinks.some((link) => link.goalId === goal.id),
    );
  }, [goals.goals, journal.goalLinks]);

  return (
    <main className="appShell" data-view={view}>
      <AppSidebar
        entries={journal.entries}
        selectedDate={journal.selectedDate}
        loading={journal.loading}
        onSelectDate={(date) => {
          journal.selectDate(date);
          setView("journal");
        }}
        onSelectToday={() => {
          journal.selectDate(today);
          setView("journal");
        }}
        onCreateEntry={() => {
          journal.selectDate(today);
          setView("journal");
        }}
        onNavigate={setView}
        onExportMarkdown={() => {
          void exportAllEntriesToMarkdown(journal.entries);
        }}
        onBackup={() => {
          void backupDatabase();
        }}
      />

      {view === "journal" ? (
        <>
          <JournalView
            selectedDate={journal.selectedDate}
            draft={journal.draft}
            loading={journal.loading}
            saving={journal.saving}
            error={journal.error}
            dirty={journal.dirty}
            onUpdateDraft={journal.updateDraft}
            onSave={journal.saveDraft}
          />
          <GoalContextPanel
            goals={goals.goals}
            linkedGoals={journal.goalLinks}
            candidates={candidates}
            onAddGoal={journal.addGoalLink}
            onRemoveGoal={journal.removeGoalLink}
            onUpdateGoalLink={journal.updateGoalLink}
            onOpenGoal={(goalId) => {
              goals.selectGoal(goalId);
              setView("goals");
            }}
          />
        </>
      ) : (
        <GoalsView
          goals={goals.goals}
          selectedGoalId={goals.selectedGoal?.id ?? null}
          draft={goals.draft}
          timeline={goals.timeline}
          statuses={goals.statuses}
          loading={goals.loading}
          saving={goals.saving}
          error={goals.error}
          dirty={goals.dirty}
          onStatusesChange={goals.setStatuses}
          onSelectGoal={goals.selectGoal}
          onCreateGoal={goals.createGoal}
          onDraftChange={goals.updateDraft}
          onSave={goals.saveDraft}
          onOpenEntry={(date) => {
            journal.selectDate(date);
            setView("journal");
          }}
        />
      )}
    </main>
  );
}

export default App;
