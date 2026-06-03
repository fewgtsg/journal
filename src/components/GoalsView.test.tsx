// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { GoalsView } from "./GoalsView";

describe("GoalsView", () => {
  it("shows ended goals and navigates from a timeline item to its journal date", () => {
    const onOpenEntry = vi.fn();
    render(
      <GoalsView
        goals={[{
          id: 1,
          name: "发布个人成长应用",
          description: "",
          status: "已完成",
          stage: "发布",
          progressNote: "",
          createdAt: "2026-06-01",
          updatedAt: "2026-06-03",
        }]}
        selectedGoalId={1}
        draft={{
          id: 1,
          name: "发布个人成长应用",
          description: "",
          status: "已完成",
          stage: "发布",
          progressNote: "",
        }}
        timeline={[{
          entryId: 7,
          date: "2026-06-03",
          title: "完成第一版",
          body: "今天完成了第一版。",
          mood: "清晰",
          progressNote: "完成目标管理。",
        }]}
        statuses={["已完成"]}
        loading={false}
        saving={false}
        error={null}
        dirty={false}
        onStatusesChange={() => undefined}
        onSelectGoal={() => undefined}
        onCreateGoal={() => undefined}
        onDraftChange={() => undefined}
        onSave={() => undefined}
        onOpenEntry={onOpenEntry}
      />,
    );

    expect(screen.getAllByText("已完成").length).toBeGreaterThanOrEqual(1);
    fireEvent.click(screen.getByText("完成第一版"));
    expect(onOpenEntry).toHaveBeenCalledWith("2026-06-03");
  });
});
