import { hc } from 'hono/client';
// 导入类型，注意是 'import type'，所以不会增加前端 bundle 体积
import type { AppType } from '@/app/api/[[...route]]/route';

// 创建并导出客户端
// 这里的 URL 要根据环境变，开发环境是 localhost，生产环境是你的域名
const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // 浏览器端使用相对路径
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
};

export const client = hc<AppType>(getBaseUrl());