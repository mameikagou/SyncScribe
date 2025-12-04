'use server';

import { retrieveEmbeddings } from '@/server/services/rag/retrieve';
import { RetrievedEmbeddingChunk } from '@/server/services/types';

export async function retrieveContext(
  query: string,
  limit?: number
): Promise<RetrievedEmbeddingChunk[]> {
  return retrieveEmbeddings(query, limit);
}
