export type Mood = {
  label: string;
  tone: string;
};

export const moods: Mood[] = [
  { label: "平静", tone: "#4f8f78" },
  { label: "清晰", tone: "#3376a8" },
  { label: "有希望", tone: "#b17832" },
  { label: "沉重", tone: "#7c7195" },
  { label: "躁动", tone: "#b45d50" },
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
