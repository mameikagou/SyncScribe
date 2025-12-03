import { handle } from 'hono/vercel';
import app from '@/server/app'; 


export const GET = handle(app);
export const POST = handle(app);

// ✨✨✨ 4. 关键一步：导出类型定义！
// 这行代码把后端的整个路由结构、参数类型、返回值类型都“打包”了
export type { AppType } from '@/server/app';