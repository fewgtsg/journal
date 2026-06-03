import { save } from "@tauri-apps/plugin-dialog";
import { writeTextFile } from "@tauri-apps/plugin-fs";
import type { Entry } from "../journal/types";

function formatEntryAsMarkdown(entry: Entry): string {
  const lines: string[] = [
    `# ${entry.title || "未命名记录"} — ${entry.date}`,
    "",
    `**心情：** ${entry.mood || "未记录"}`,
    "",
    "## 自由书写",
    "",
    entry.body || "*（无内容）*",
    "",
    "## 轻量复盘",
    "",
    "### 今天发生了什么",
    "",
    entry.whatHappened || "*（无内容）*",
    "",
    "### 我有什么感受",
    "",
    entry.feelings || "*（无内容）*",
    "",
    "### 我学到了什么",
    "",
    entry.learning || "*（无内容）*",
    "",
    "### 和目标有什么关系",
    "",
    entry.goalRelation || "*（无内容）*",
  ];
  return lines.join("\n");
}

export async function exportEntryToMarkdown(entry: Entry): Promise<void> {
  const filePath = await save({
    defaultPath: `${entry.date}.md`,
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });
  if (!filePath) return;

  await writeTextFile(filePath, formatEntryAsMarkdown(entry));
}

export async function exportAllEntriesToMarkdown(
  entries: Entry[],
): Promise<void> {
  const filePath = await save({
    defaultPath: "journal-export.md",
    filters: [{ name: "Markdown", extensions: ["md"] }],
  });
  if (!filePath) return;

  const content = entries
    .map(formatEntryAsMarkdown)
    .join("\n\n---\n\n");

  await writeTextFile(filePath, content);
}
