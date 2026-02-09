import { generateObject } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';

// === AI 输出结构定义 ===
// thought: 仅“上帝日志”可见的内心独白
// speech: 公开发言（白天讨论的对外话术）
// action: 结构化动作（夜晚 kill / 白天 vote / pass / check）
// target: 目标玩家 ID（可选）
export const agentTurnSchema = z.object({
  // 给缺省值是为了容错：有些模型只会回 action/target
  // Zod 的 default 会在 parse 成功时填充缺省字段
  thought: z.string().optional().default(''),
  speech: z.string().optional().default(''),
  action: z.enum(['pass', 'kill', 'vote', 'check']),
  target: z.string().optional(),
});

export type AgentTurn = z.infer<typeof agentTurnSchema>;

// ProviderMode:
// - responses: OpenAI Responses API（部分平台如豆包 Ark 更适配）
// - chat: OpenAI Chat Completions API（大多数兼容平台）
type ProviderMode = 'responses' | 'chat';
type ProviderConfig = {
  provider: ReturnType<typeof createOpenAI>;
  mode: ProviderMode;
};

// 根据模型名选择不同的 Provider 与 API 入口。
// 这是“模型路由层”，负责把模型名映射到对应厂商与鉴权。
export const getProviderConfig = (modelName: string): ProviderConfig => {
  const normalized = modelName.toLowerCase();
  // createOpenAI 的 baseURL 建议填到 /v1 根路径，SDK 会自动拼接 /chat/completions。
  // 若厂商仅支持 responses 或特殊路径，需在这里手动分流。

  // 豆包（Ark）:
  // API 网关是 OpenAI 兼容，但 responses / chat 的支持程度不同。
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

  // 龙猫：OpenAI Chat API 兼容
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

  // 混元：OpenAI Chat API 兼容
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

  // Packy 代理：统一转发 Gemini / Claude
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

  // PackyCode：自建 OpenAI 兼容代理（GPT-5.2）
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

  // DeepSeek：OpenAI Chat API 兼容
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

  // Qwen：OpenAI Chat API 兼容
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

  // MiniMax：OpenAI Chat API 兼容（baseURL 需显式配置）
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

  // 智谱清言（GLM）：OpenAI Chat API 兼容（baseURL 需显式配置）
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

// 将 ProviderConfig 转成 AI SDK 的“模型客户端”。
// Chat/Responses 在底层会映射到不同 API 路径。
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

  // generateObject 是 AI SDK 的“结构化输出”工具。
  // 它会把 Zod schema 转成 JSON Schema，并要求模型按该结构输出。
  // mode:
  // - 'auto' 让 SDK 自行选择最合适方式。
  // - 'json' 通过 prompt 注入 JSON 约束，适合部分不支持函数调用的模型（豆包）。
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
