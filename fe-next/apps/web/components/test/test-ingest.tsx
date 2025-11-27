'use client';

import { useState } from 'react';
import { ingestDocument } from '@/lib/rag/ingest'; // 引入你刚写的 Action
import { Loader2 } from 'lucide-react'; // 假设你有 lucide 图标，没有就用文字代替

export function TestIngest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTest = async () => {
    setLoading(true);
    try {
      // 测试文本：一段关于 Prisma 7 的介绍，方便一会做语义搜索测试
      const text = `
        Prisma 7 引入了全新的 TypedSQL 功能。
        它允许开发者编写原生的 SQL 语句，并自动生成类型安全的 TypeScript 函数。
        这对 RAG 应用特别有用，因为它解决了 Prisma 原生 Schema 不支持 pgvector 向量类型的问题。
        此外，Prisma 7 还移除了 Rust 依赖，大大减少了 Serverless 环境下的冷启动时间。
      `;

      const res = await ingestDocument(text, { source: 'manual_test', title: 'Prisma 7 Update' });
      setResult(res);
    } catch (e) {
      setResult(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50 max-w-md my-4">
      <h3 className="font-bold mb-2">🧪 RAG 入库测试</h3>
      <button
        onClick={handleTest}
        disabled={loading}
        className="px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50 flex items-center gap-2"
      >
        {loading && <Loader2 className="animate-spin w-4 h-4" />}
        {loading ? '正在切片向量化...' : '写入测试数据'}
      </button>

      {result && (
        <pre className="mt-4 p-2 bg-white border rounded text-xs overflow-auto">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
