const STORAGE_KEY = "journal-ai-config";

export type AIConfig = {
  apiKey: string;
  baseUrl: string;
  model: string;
};

export function loadAIConfig(): AIConfig | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AIConfig>;
    if (!parsed.apiKey) return null;
    return {
      apiKey: parsed.apiKey,
      baseUrl: parsed.baseUrl || "https://api.openai.com/v1",
      model: parsed.model || "gpt-4o-mini",
    };
  } catch {
    return null;
  }
}

export function saveAIConfig(config: AIConfig): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
}
