import { createOpenAI } from '@ai-sdk/openai';

console.log('process.env.DEEPSEEK_API_KEY', process.env.DEEPSEEK_API_KEY);
// 初始化 DeepSeek 客户端
export const deepseek = createOpenAI({
  baseURL: 'https://api.deepseek.com/v1',
  apiKey: process.env.DEEPSEEK_API_KEY,
});
