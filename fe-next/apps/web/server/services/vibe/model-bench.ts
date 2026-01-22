import { generateText } from 'ai';

import { DEFAULT_MODEL_TEST_PROMPT, REGISTERED_MODELS } from '@/lib/ai-models';
import { getModelClient } from '@/server/services/vibe/werewolf/agent';

export type ModelBenchResult = {
  id: string;
  label: string;
  model: string;
  provider: string;
  ok: boolean;
  text?: string;
  error?: string;
  durationMs: number;
};

const formatError = (error: unknown) => {
  if (error instanceof Error) return error.message;
  return String(error);
};

export async function runModelBench(prompt?: string) {
  const safePrompt = prompt?.trim() || DEFAULT_MODEL_TEST_PROMPT;
  const results: ModelBenchResult[] = [];

  for (const model of REGISTERED_MODELS) {
    const startAt = Date.now();
    try {
      const { text } = await generateText({
        model: getModelClient(model.model),
        system: `你是模型测试助手，你的模型名是「${model.model}」。请严格按提示回复。`,
        prompt: safePrompt,
      });
      results.push({
        ...model,
        ok: true,
        text,
        durationMs: Date.now() - startAt,
      });
    } catch (error) {
      results.push({
        ...model,
        ok: false,
        error: formatError(error),
        durationMs: Date.now() - startAt,
      });
    }
  }

  return { prompt: safePrompt, results };
}
