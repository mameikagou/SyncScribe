import { createOpenAI } from '@ai-sdk/openai';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

if (!DEEPSEEK_API_KEY) {
  throw new Error('Missing DEEPSEEK_API_KEY environment variable');
}

const QWEN_API_KEY = process.env.QWEN_API_KEY;

if (!QWEN_API_KEY) {
  throw new Error('Missing QWEN_API_KEY environment variable');
}

// 初始化 DeepSeek 客户端
export const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: DEEPSEEK_API_KEY,
});

export const qwen = createOpenAI({
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
  apiKey: QWEN_API_KEY,
});