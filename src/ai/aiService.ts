import type { AIConfig } from "./config";
import type { EntryDraft, EntryGoalLinkDraft } from "../journal/types";
import type { Goal } from "../goals/types";

export type AIFollowUpResponse = {
  questions: string[];
  themes: string[];
  takeaway: string;
};

export async function generateFollowUpQuestions(
  config: AIConfig,
  draft: EntryDraft,
  goalLinks: EntryGoalLinkDraft[],
  goals: Goal[],
): Promise<AIFollowUpResponse> {
  const goalMap = new Map(goals.map((g) => [g.id, g]));

  const linkedGoalsInfo = goalLinks
    .map((link) => {
      const goal = goalMap.get(link.goalId);
      if (!goal) return null;
      return `- 目标：${goal.name}（${goal.status}${goal.stage ? ` · ${goal.stage}` : ""}）\n  进度笔记：${link.progressNote || "（无）"}`;
    })
    .filter(Boolean)
    .join("\n");

  const prompt = `你是一位温柔的个人成长教练。请根据用户今天的日记内容和关联的目标，生成 3 个温柔而深入的追问、3 个可能的主题标签、以及 1 条今日收获建议。

请严格按以下 JSON 格式输出，不要包含任何其他内容：

{\n  "questions": ["问题1", "问题2", "问题3"],\n  "themes": ["主题1", "主题2", "主题3"],\n  "takeaway": "今日收获建议"\n}

---

今天的日记：

日期：${draft.date}
心情：${draft.mood || "未记录"}
标题：${draft.title || "未命名"}
自由书写：${draft.body || "（空）"}

四维度复盘：
- 发生了什么：${draft.whatHappened || "（空）"}
- 感受如何：${draft.feelings || "（空）"}
- 学到了什么：${draft.learning || "（空）"}
- 与成长目标的关系：${draft.goalRelation || "（空）"}

${linkedGoalsInfo ? `关联的目标及进度：\n${linkedGoalsInfo}` : "今天没有关联任何目标。"}`;

  const response = await fetch(`${config.baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        {
          role: "system",
          content:
            "你是一位温柔、敏锐的个人成长教练。你的追问要具体、有温度，能引导用户从日常经历中发现成长线索。输出必须是合法的 JSON，不要添加任何 markdown 代码块标记或其他说明文字。",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.8,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`API 请求失败 (${response.status}): ${text}`);
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: { content?: string };
    }>;
  };

  const content = data.choices?.[0]?.message?.content?.trim() ?? "";
  if (!content) {
    throw new Error("API 返回为空");
  }

  // 有些模型会包裹在 markdown code block 中
  let jsonText = content;
  const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonText = codeBlockMatch[1].trim();
  }

  try {
    const parsed = JSON.parse(jsonText) as Partial<AIFollowUpResponse>;
    return {
      questions: Array.isArray(parsed.questions)
        ? parsed.questions.slice(0, 3)
        : [],
      themes: Array.isArray(parsed.themes) ? parsed.themes.slice(0, 3) : [],
      takeaway: parsed.takeaway || "",
    };
  } catch {
    throw new Error("API 返回格式异常，无法解析 JSON");
  }
}
