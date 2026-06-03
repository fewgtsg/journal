export type Mood = {
  label: string;
  tone: string;
};

export type GoalItem = {
  name: string;
  status: string;
  stage: string;
  progress: string;
  color: string;
};

export const moods: Mood[] = [
  { label: "平静", tone: "#4f8f78" },
  { label: "清晰", tone: "#3376a8" },
  { label: "有希望", tone: "#b17832" },
  { label: "沉重", tone: "#7c7195" },
  { label: "躁动", tone: "#b45d50" },
];

export const goals: GoalItem[] = [
  {
    name: "建立每日复盘节奏",
    status: "进行中",
    stage: "第 1 周",
    progress: "连续记录了三天，开始看见自己的情绪模式。",
    color: "#4f8f78",
  },
  {
    name: "发布个人成长应用",
    status: "进行中",
    stage: "MVP 设计",
    progress: "确定了 Tauri、SQLite、Markdown 导出和可选 AI。",
    color: "#3376a8",
  },
];

export const aiQuestions = [
  "今天哪一件看起来很小的事，其实比你以为的更重要？",
  "这段经历悄悄推动了哪个目标？",
  "你希望明天的自己记住今天的什么？",
];

export const aiSuggestions = {
  themes: ["产品清晰度", "自我信任", "稳定前进"],
  takeaway: "一个真实可用的方向正在出现：从经历出发，再把它连接到成长。",
};
