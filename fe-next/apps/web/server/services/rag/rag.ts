'use server';

import { retrieveEmbeddings } from '@/server/services/rag/retrieve';
import { queryEmbeddings } from '@prisma/client/sql';

export async function retrieveContext(
  query: string,
  limit?: number
): Promise<queryEmbeddings.Result[]> {
  return retrieveEmbeddings(query, limit);
}
