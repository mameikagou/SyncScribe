// 入库流程：接收文件 -> 切片 -> 向量化 -> 存DB




'use server';

import { prisma } from '@/lib/db/prisma';
import { openai } from '@ai-sdk/openai';
import { embedMany } from 'ai';
import { recursiveChunking } from '@/lib/rag/chunking';
import { v4 as uuidv4 } from 'uuid';
import { insertEmbedding } from '@prisma/client/sql'; // 导入pnpx prisma generate自动生成的函数
import { qwen } from '@/lib/ai/ai';

export async function ingestDocument(content: string, metadata: any = {}) {
  try {
    console.log('🚀 开始入库流程...');

    if (typeof content !== 'string') {
      console.error('❌ content 参数类型错误:', typeof content, content);
      throw new Error('content 必须是字符串类型');
    }

    if (content.trim().length === 0) {
      throw new Error('content 不能为空');
    }

    // 直接创建一条记录。
    const resource = await prisma.resource.create({
      data: {
        content: content,
        metadata: metadata || {},
      },
    });

    console.log(`✅ Resource 创建成功: ${resource.id}`);

    // 2. 切片 (Chunking)
    const chunks = recursiveChunking(content);
    console.log(`🔪 切分为 ${chunks.length} 个片段`);

    if (chunks.length === 0) {
      throw new Error('切片后没有生成任何片段');
    }

    // 3. 批量向量化 (Embedding)
    const { embeddings } = await embedMany({
      model: qwen.embedding('text-embedding-v2'),
      values: chunks,
    });

    console.log(`🧠 向量化完成，生成 ${embeddings.length} 个向量`);

    if (!embeddings || embeddings.length !== chunks.length) {
      throw new Error(`向量数量不匹配: chunks=${chunks.length}, embeddings=${embeddings?.length}`);
    }

    // 并发了这个

    // await Promise.all(
    //   chunks.map(async (chunk, i) => {
    //     // 将向量数组转换为 Postgres 认识的字符串格式 '[0.1, 0.2, ...]'
    //     if (!embeddings[i]) {
    //       throw new Error(`embeddings[${i}] is undefined`);
    //     }
    //     const vectors = embeddings[i];

    //     // 生成一个新的 UUID 给这个 embedding 片段
    //     const embeddingId = uuidv4();
    //     // 这里的解法是通过queryRawTyped方式来解决prisma对vector支持不足的问题。
    //     await prisma.$queryRawTyped(insertEmbedding(embeddingId, chunk, vectors, resource.id));
    //   })
    // );

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) {
        throw new Error(`chunks[${i}] is undefined`);
      }

      // 添加简单的日志，看进度
      console.log(`正在写入第 ${i + 1}/${chunks.length} 个片段...`);

      const embeddingId = uuidv4();
      const vector = embeddings[i];

      if (!vector) {
        throw new Error(`Embedding generation failed for chunk ${i}`);
      }

      await prisma.$queryRawTyped(insertEmbedding(embeddingId, chunk, vector, resource.id));
    }

    console.log(`🎉 入库完成！已存储 ${chunks.length} 条记忆`);
    return { success: true, resourceId: resource.id };
  } catch (error) {
    console.error('❌ 入库失败:', error);
    return { success: false, error: String(error) };
  }
}
