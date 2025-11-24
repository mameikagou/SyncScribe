'use server';

import { prisma } from '@/lib/db/prisma';
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import { recursiveChunking } from '@/lib/ai/chunking';
import { v4 as uuidv4 } from 'uuid';
import { insertEmbedding } from '@prisma/client/sql'; // 导入pnpx prisma generate自动生成的函数
import { qwen } from './ai';

export async function ingestDocument(content: string, metadata: any = {}) {
  try {
    console.log('🚀 开始入库流程...');

    // 直接创建一条记录。
    const resource = await prisma.resource.create({
      data: {
        content: content,
        metadata: metadata,
      },
    });

    console.log(`✅ Resource 创建成功: ${resource.id}`);

    // 2. 切片 (Chunking)
    const chunks = recursiveChunking(content);
    console.log(`🔪 切分为 ${chunks.length} 个片段`);

    // 3. 批量向量化 (Embedding)
    const { embeddings } = await embedMany({
      model: qwen.embedding('text-embedding-v2'),
      values: chunks,
    });

    console.log(`🧠 向量化完成，开始写入数据库...`);

    await Promise.all(
      chunks.map(async (chunk, i) => {
        // 将向量数组转换为 Postgres 认识的字符串格式 '[0.1, 0.2, ...]'
        if (!embeddings[i]) {
          throw new Error(`embeddings[${i}] is undefined`);
        }
        const vectors = embeddings[i];

        // 生成一个新的 UUID 给这个 embedding 片段
        const embeddingId = uuidv4();
        // 这里的解法是通过queryRawTyped方式来解决prisma对vector支持不足的问题。
        await prisma.$queryRawTyped(insertEmbedding(embeddingId, chunk, vectors, resource.id));
      })
    );

    console.log(`🎉 入库完成！已存储 ${chunks.length} 条记忆`);
    return { success: true, resourceId: resource.id };
  } catch (error) {
    console.error('❌ 入库失败:', error);
    return { success: false, error: String(error) };
  }
}
