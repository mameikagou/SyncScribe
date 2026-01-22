export type RegisteredModel = {
  id: string;
  label: string;
  model: string;
  provider: string;
};

export const REGISTERED_MODELS: RegisteredModel[] = [
  {
    id: 'doubao-seed-1-8',
    label: 'doubao-seed-1-8-251228',
    model: 'doubao-seed-1-8-251228',
    provider: 'doubao',
  },
  {
    id: 'longcat-flash-thinking-2601',
    label: 'LongCat-Flash-Thinking-2601',
    model: 'LongCat-Flash-Thinking-2601',
    provider: 'longcat',
  },
  {
    id: 'tencent-hy-2-0-think',
    label: 'Tencent HY 2.0 Think',
    model: 'Tencent HY 2.0 Think',
    provider: 'hunyuan',
  },
  {
    id: 'gemini-3-pro-high',
    label: 'gemini-3-pro-high',
    model: 'gemini-3-pro-high',
    provider: 'packy',
  },
  {
    id: 'claude-opus-4-5-20251101',
    label: 'claude-opus-4-5-20251101',
    model: 'claude-opus-4-5-20251101',
    provider: 'packy',
  },
  {
    id: 'gpt-5-2',
    label: 'gpt-5.2',
    model: 'gpt-5.2',
    provider: 'packycode',
  },
  {
    id: 'deepseek-chat',
    label: 'deepseek-chat',
    model: 'deepseek-chat',
    provider: 'deepseek',
  },
  {
    id: 'qwen-plus-2025-07-28',
    label: 'qwen-plus-2025-07-28',
    model: 'qwen-plus-2025-07-28',
    provider: 'qwen',
  },
  {
    id: 'minimax-m2-1',
    label: 'MiniMax-M2.1',
    model: 'MiniMax-M2.1',
    provider: 'minimax',
  },
  {
    id: 'glm-4-7',
    label: 'glm-4.7',
    model: 'glm-4.7',
    provider: 'zhipu',
  },
  {
    id: 'gpt-4o-mini',
    label: 'gpt-4o-mini',
    model: 'gpt-4o-mini',
    provider: 'openai',
  },
];

export const DEFAULT_MODEL_TEST_PROMPT =
  '这是测试，你收到了就回复“你好，我是「自己的模型名」”';
