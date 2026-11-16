import Anthropic from "@anthropic-ai/sdk";
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import type { Entry, Level } from "../lib/types";

const WordSchema = z.object({
  en: z.string().describe("English headword or set phrase, lower case unless a proper noun"),
  ipa: z.string().describe("British IPA without slashes or brackets, with stress marks"),
  pos: z.enum(["n", "v", "adj", "adv", "phr v", "idiom", "phr", "prep", "conj"]),
  ru: z.string().describe("Short natural Russian translation, the most useful sense"),
  example: z.string().describe("One natural English example sentence, 6–14 words, using the headword"),
  exampleRu: z.string().describe("Natural Russian translation of the example"),
});

const ResultSchema = z.object({ words: z.array(WordSchema) });

export class GenerateError extends Error {
  constructor(
    message: string,
    readonly kind: "auth" | "rate" | "network" | "refusal" | "other",
  ) {
    super(message);
  }
}

const SYSTEM = `You pick English vocabulary for a Russian-speaking adult who learns words in short sessions on their phone.
Choose words that are genuinely useful at the requested CEFR level: common in real speech, films and work, not rare or archaic.
Mix parts of speech, include a few phrasal verbs or idioms when they fit the topic, and never repeat a word from the excluded list.
Translations are short and natural Russian; examples are everyday sentences a person would actually say.`;

export async function generateWords(opts: {
  apiKey: string;
  level: Level;
  topic: string;
  exclude: string[];
  count?: number;
  signal?: AbortSignal;
}): Promise<Entry[]> {
  const { apiKey, level, topic, exclude, count = 20, signal } = opts;
  // The key belongs to the learner and lives only on their phone; requests go straight to api.anthropic.com.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true, maxRetries: 1, timeout: 90_000 });

  const prompt = [
    `Level: ${level}.`,
    `Topic: ${topic || "any everyday topic"}.`,
    `Give exactly ${count} words.`,
    exclude.length ? `Excluded (already known or already in sets): ${exclude.slice(-400).join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const message = await client.beta.messages.parse(
      {
        model: "claude-opus-5-5",
        max_tokens: 8000,
        system: SYSTEM,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low", format: betaZodOutputFormat(ResultSchema) },
        messages: [{ role: "user", content: prompt }],
      },
      { signal },
    );

    if (message.stop_reason === "refusal") {
      throw new GenerateError("Claude отказался подбирать слова на эту тему. Попробуй сформулировать её иначе.", "refusal");
    }
    const parsed = message.parsed_output;
    if (!parsed || parsed.words.length === 0) {
      throw new GenerateError("Claude вернул пустой ответ. Попробуй ещё раз.", "other");
    }

    const banned = new Set(exclude.map((w) => w.toLowerCase()));
    const seen = new Set<string>();
    return parsed.words
      .filter((w) => {
        const k = w.en.trim().toLowerCase();
        if (!k || banned.has(k) || seen.has(k)) return false;
        seen.add(k);
        return true;
      })
      .map((w) => ({ ...w, ipa: w.ipa.replace(/[/[\]]/g, "").trim(), topic, level }));
  } catch (err) {
    if (err instanceof GenerateError) throw err;
    if (err instanceof Anthropic.AuthenticationError || err instanceof Anthropic.PermissionDeniedError) {
      throw new GenerateError("Ключ Claude не подошёл. Проверь его в настройках.", "auth");
    }
    if (err instanceof Anthropic.RateLimitError) {
      throw new GenerateError("Слишком много запросов или закончился баланс. Подожди минуту и попробуй снова.", "rate");
    }
    if (err instanceof Anthropic.APIConnectionError) {
      throw new GenerateError("Нет связи с Claude. Подбираю слова из встроенного словаря.", "network");
    }
    if (err instanceof Anthropic.APIError) {
      throw new GenerateError(`Claude ответил ошибкой (${err.status ?? "?"}). Попробуй позже.`, "other");
    }
    throw new GenerateError("Не удалось получить слова от Claude.", "other");
  }
}
