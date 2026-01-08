'use client';
import { client } from '@/lib/client';

export default function TestComponent() {
  const handleClick = async () => {
    // 当你打出 client.api. 时，VS Code 会自动提示出你 Hono 里定义的路由！
    // 比如 client.api.mcp.search.$post(...)
    const res = await client.api.test.hello.$get();
    const data = await res.json();
    console.log(data);
  };
  
  return <button onClick={handleClick}>Test RPC</button>;
}