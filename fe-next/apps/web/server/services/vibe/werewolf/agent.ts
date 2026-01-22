import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

export const agentTurnSchema = z.object({
  thought: z.string().optional().default(''),
  speech: z.string().optional().default(''),
  action: z.enum(['pass', 'kill', 'vote', 'check']),
  target: z.string().optional(),
});

export type AgentTurn = z.infer<typeof agentTurnSchema>;

type ProviderMode = 'responses' | 'chat';
type ProviderConfig = {
  provider: ReturnType<typeof createOpenAI>;
  mode: ProviderMode;
};

export const getProviderConfig = (modelName: string): ProviderConfig => {
  const normalized = modelName.toLowerCase();

  if (normalized.includes('doubao') || normalized.includes('ark') || normalized.includes('volc')) {
    const apiKey = process.env.DOUBAO_API_KEY ?? process.env.ARK_API_KEY;
    if (!apiKey) {
      throw new Error('Missing DOUBAO_API_KEY (or ARK_API_KEY) for doubao/ark model');
    }
    return {
      provider: createOpenAI({
        baseURL: process.env.DOUBAO_BASE_URL ?? 'https://ark.cn-beijing.volces.com/api/v3',
        apiKey,
      }),
      mode: 'chat',
    };
  }

  if (normalized.includes('longcat')) {
    const apiKey = process.env.LONGCAT_API_KEY;
    if (!apiKey) {
      throw new Error('Missing LONGCAT_API_KEY for longcat model');
    }
    return {
      provider: createOpenAI({
        baseURL: process.env.LONGCAT_BASE_URL ?? 'https://api.longcat.chat/openai',
        apiKey,
      }),
      mode: 'chat',
    };
  }

  if (normalized.includes('hunyuan') || normalized.includes('hy 2.0')) {
    const apiKey = process.env.HUNYUAN_API_KEY;
    if (!apiKey) {
      throw new Error('Missing HUNYUAN_API_KEY for hunyuan model');
    }
    return {
      provider: createOpenAI({
        baseURL: process.env.HUNYUAN_BASE_URL ?? 'https://hunyuan.tencentcloudapi.com',
        apiKey,
      }),
      mode: 'chat',
    };
  }

  if (normalized.includes('gemini') || normalized.includes('claude') || normalized.includes('anthropic')) {
    const apiKey = process.env.PackyApiKey;
    if (!apiKey) {
      throw new Error('Missing PackyApiKey for gemini/anthropic model');
    }
    return {
      provider: createOpenAI({
        baseURL: process.env.PACKY_BASE_URL ?? 'https://www.packyapi.com/v1',
        apiKey,
      }),
      mode: 'chat',
    };
  }

  if (normalized.includes('gpt-5.2') || normalized.includes('gpt5.2')) {
    const apiKey = process.env.PackyCodeKey;
    if (!apiKey) {
      throw new Error('Missing PackyCodeKey for gpt-5.2 model');
    }
    return {
      provider: createOpenAI({
        baseURL: process.env.PACKYCODE_BASE_URL ?? 'https://codex.packycode.com/v1',
        apiKey,
      }),
      mode: 'chat',
    };
  }

  if (normalized.includes('deepseek')) {
    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      throw new Error('Missing DEEPSEEK_API_KEY for deepseek model');
    }
    return {
      provider: createOpenAI({
        baseURL: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
        apiKey,
      }),
      mode: 'chat',
    };
  }

  if (normalized.includes('qwen')) {
    const apiKey = process.env.QWEN_API_KEY;
    if (!apiKey) {
      throw new Error('Missing QWEN_API_KEY for qwen model');
    }
    return {
      provider: createOpenAI({
        baseURL: process.env.QWEN_BASE_URL ?? 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        apiKey,
      }),
      mode: 'chat',
    };
  }

  if (normalized.includes('minimax')) {
    const apiKey = process.env.MINIMAX_API_KEY;
    const baseURL = process.env.MINIMAX_BASE_URL;
    if (!apiKey) {
      throw new Error('Missing MINIMAX_API_KEY for minimax model');
    }
    if (!baseURL) {
      throw new Error('Missing MINIMAX_BASE_URL for minimax model');
    }
    return {
      provider: createOpenAI({
        baseURL,
        apiKey,
      }),
      mode: 'chat',
    };
  }

  if (normalized.includes('glm') || normalized.includes('zhipu')) {
    const apiKey = process.env.ZHIPU_API_KEY;
    const baseURL = process.env.ZHIPU_BASE_URL;
    if (!apiKey) {
      throw new Error('Missing ZHIPU_API_KEY for zhipu model');
    }
    if (!baseURL) {
      throw new Error('Missing ZHIPU_BASE_URL for zhipu model');
    }
    return {
      provider: createOpenAI({
        baseURL,
        apiKey,
      }),
      mode: 'chat',
    };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY for openai-compatible model');
  }

  return {
    provider: createOpenAI({
      baseURL: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
      apiKey,
    }),
    mode: 'chat',
  };
};

export const getModelClient = (modelName: string) => {
  const config = getProviderConfig(modelName);
  return config.mode === 'responses'
    ? config.provider.responses(modelName)
    : config.provider.chat(modelName);
};

export async function runAgentTurn(
  modelName: string,
  systemPrompt: string,
  gameHistory: string
): Promise<AgentTurn> {
  const normalized = modelName.toLowerCase();
  const model = getModelClient(modelName);

  const { object } = await generateObject({
    model,
    schema: agentTurnSchema,
    mode:
      normalized.includes('doubao') || normalized.includes('ark') || normalized.includes('volc')
        ? 'json'
        : 'auto',
    system: systemPrompt,
    prompt: gameHistory,
  });

  return object;
}
