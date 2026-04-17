import type { AIProvider, ChatMessage, ChatOptions, VisionMessage } from "./types";

interface OpenAICompatibleConfig {
  baseUrl: string;
  apiKey: string;
  provider: string;
}

export class OpenAICompatibleProvider implements AIProvider {
  private baseUrl: string;
  private apiKey: string;
  private provider: string;

  constructor(config: OpenAICompatibleConfig) {
    this.baseUrl = config.baseUrl.replace(/\/+$/, "");
    this.apiKey = config.apiKey;
    this.provider = config.provider;
  }

  async chat(messages: ChatMessage[], options: ChatOptions): Promise<string> {
    const body = {
      model: options.model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 1500,
      top_p: options.topP,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(this.provider === "openrouter"
          ? { "HTTP-Referer": "https://blueprint-rak.ae", "X-Title": "BluePrint AI" }
          : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`[${this.provider}] API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }

  async chatWithVision(messages: VisionMessage[], options: ChatOptions): Promise<string> {
    const formattedMessages = messages.map((m) => {
      if (typeof m.content === "string") return { role: m.role, content: m.content };
      const parts = m.content.map((part) => {
        if (part.type === "text") return { type: "text", text: part.text };
        if (part.type === "image_url") return { type: "image_url", image_url: part.image_url };
        if (part.type === "file_url") return { type: "image_url", image_url: { url: part.file_url?.url } };
        return { type: "text", text: "" };
      });
      return { role: m.role, content: parts };
    });

    const body = {
      model: options.model,
      messages: formattedMessages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 2000,
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
        ...(this.provider === "openrouter"
          ? { "HTTP-Referer": "https://blueprint-rak.ae", "X-Title": "BluePrint AI" }
          : {}),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`[${this.provider}] Vision API error ${response.status}: ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
}
