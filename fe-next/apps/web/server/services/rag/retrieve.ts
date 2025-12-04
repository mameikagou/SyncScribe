'use server';

import { embed } from 'ai';
import { qwen } from '@/lib/ai';
import { prisma } from '@/lib/db/prisma';
import { queryEmbeddings } from '@prisma/client/sql';

const DEFAULT_LIMIT = 5;
const MAX_LIMIT = 50;

export async function retrieveEmbeddings(
  query: string,
  limit = DEFAULT_LIMIT
): Promise<queryEmbeddings.Result[]> {
  if (!query || !query.trim()) {
    throw new Error('query 参数不能为空');
  }

  const { embedding } = await embed({
    model: qwen.embedding('text-embedding-v2'),
    value: query,
  });

  const normalizedLimit = Math.min(Math.max(Math.trunc(limit), 1), MAX_LIMIT);

  const rows = await prisma.$queryRawTyped(queryEmbeddings(normalizedLimit, embedding));

  return rows;
}
