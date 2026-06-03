import type { Entry } from "../journal/types";

export function localDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function shortDate(date: string): string {
  return date.slice(5).replace("-", ".");
}

export function weekdayFor(date: string): string {
  return new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(
    new Date(`${date}T12:00:00`),
  );
}

export function excerptFor(entry: Entry): string {
  return (
    entry.body ||
    entry.whatHappened ||
    entry.learning ||
    "这一天还没有写下内容。"
  );
}
