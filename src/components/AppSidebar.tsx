import { useState } from "react";
import {
  CalendarDays,
  Download,
  Goal,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import type { Entry } from "../journal/types";
import { excerptFor, shortDate, weekdayFor } from "./helpers";

type AppSidebarProps = {
  entries: Entry[];
  selectedDate: string;
  loading: boolean;
  onSelectDate: (date: string) => void;
  onSelectToday: () => void;
  onCreateEntry: () => void;
  onNavigate: (view: "journal" | "goals") => void;
  onExportMarkdown: () => void;
  onBackup: () => void;
};

export default function AppSidebar({
  entries,
  selectedDate,
  loading,
  onSelectDate,
  onSelectToday,
  onCreateEntry,
  onNavigate,
  onExportMarkdown,
  onBackup,
}: AppSidebarProps) {
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brandMark">
          <CalendarDays size={19} strokeWidth={1.8} aria-hidden="true" />
        </div>
        <div>
          <h1>Journal</h1>
          <p>每日成长记录</p>
        </div>
      </div>

      <label className="searchBox">
        <Search size={16} strokeWidth={1.8} aria-hidden="true" />
        <input aria-label="搜索记录" placeholder="搜索记录、目标、心情" />
      </label>

      <div className="sidebarActions">
        <button className="todayButton" type="button" onClick={onSelectToday}>
          今天
        </button>
        <button
          className="iconButton"
          type="button"
          aria-label="新建今天的记录"
          title="新建今天的记录"
          onClick={() => {
            onCreateEntry();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <Plus size={17} aria-hidden="true" />
        </button>
      </div>

      <section className="entryList" aria-label="最近记录">
        <div className="sectionLabel">
          <span>最近记录</span>
          <div style={{ position: "relative" }}>
            <button
              className="quietIcon"
              type="button"
              aria-label="更多记录选项"
              title="更多记录选项"
              onClick={() => setShowMoreMenu((s) => !s)}
            >
              <MoreHorizontal size={17} aria-hidden="true" />
            </button>
            {showMoreMenu && (
              <div
                className="moreMenu"
                onMouseLeave={() => setShowMoreMenu(false)}
              >
                <button
                  type="button"
                  onClick={() => {
                    onExportMarkdown();
                    setShowMoreMenu(false);
                  }}
                >
                  <Download size={14} aria-hidden="true" />
                  <span>Markdown 导出</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onBackup();
                    setShowMoreMenu(false);
                  }}
                >
                  <Settings size={14} aria-hidden="true" />
                  <span>数据备份</span>
                </button>
              </div>
            )}
          </div>
        </div>
        {entries.map((entry) => (
          <button
            className={
              entry.date === selectedDate ? "entryItem selected" : "entryItem"
            }
            type="button"
            key={entry.date}
            onClick={() => onSelectDate(entry.date)}
          >
            <span className="entryDate">{shortDate(entry.date)}</span>
            <span className="entryCopy">
              <strong>{entry.title || "未命名记录"}</strong>
              <small>
                {weekdayFor(entry.date)} · {entry.mood || "未选择心情"}
              </small>
              <em>{excerptFor(entry)}</em>
            </span>
          </button>
        ))}
        {!loading && entries.length === 0 && (
          <p className="emptyList">还没有记录，从今天开始吧。</p>
        )}
      </section>

      <nav className="sidebarNav" aria-label="应用导航">
        <button type="button" onClick={() => onNavigate("goals")}>
          <Goal size={17} aria-hidden="true" />
          目标
        </button>
      </nav>
    </aside>
  );
}
