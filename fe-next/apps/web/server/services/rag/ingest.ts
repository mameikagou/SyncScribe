// 入库流程：接收文件 -> 切片 -> 向量化 -> 存DB

'use server';

import { v4 as uuidv4 } from 'uuid';
import type {
  ExtractedMetadataResult,
  IngestDocumentOptions,
  NormalizedIngestOptions,
  PdfChunk,
  PdfDataInput,
} from '@/lib/types';
import { qwen } from '@/lib/ai';
import { parsePdfBuffer } from '@/server/services/parser/parser';
import { prisma } from '@/lib/db/prisma';
import { chunkPlainText } from '@/server/services/rag/chunking';
import { embedMany } from 'ai';
import { insertEmbedding } from '@prisma/client/sql';
import { InputJsonObject, InputJsonValue } from '@prisma/client/runtime/client';

const DEFAULT_FILE_NAME = 'document.txt';
const DEFAULT_FILE_TYPE = 'text/plain';

const RESERVED_METADATA_KEYS = new Set(['fileName', 'fileType', 'sourceTag']);

// 数据清洗，只留保留字段。其余的放到cleaned
const extractMetadata = (value?: Record<string, unknown>): ExtractedMetadataResult => {
  if (!value || typeof value !== 'object') {
    return { cleaned: {} };
  }
  const cleaned: Record<string, unknown> = {};
  let fileName: string | undefined;
  let fileType: string | undefined;
  let sourceTag: string | undefined;

  Object.entries(value).forEach(([key, val]) => {
    if (key === 'fileName' && typeof val === 'string') {
      fileName = val;
      return;
    }
    if (key === 'fileType' && typeof val === 'string') {
      fileType = val;
      return;
    }
    if (key === 'sourceTag' && typeof val === 'string') {
      sourceTag = val;
      return;
    }
    if (!RESERVED_METADATA_KEYS.has(key)) {
      cleaned[key] = val;
    }
  });

  return { cleaned, fileName, fileType, sourceTag };
};

const normalizeInput = (
  input: string | IngestDocumentOptions,
  legacyMetadata: Record<string, unknown> = {}
): NormalizedIngestOptions => {
  const legacyExtraction = extractMetadata(legacyMetadata);

  if (typeof input === 'string') {
    return {
      content: input,
      fileName: legacyExtraction.fileName ?? DEFAULT_FILE_NAME,
      fileType: legacyExtraction.fileType ?? DEFAULT_FILE_TYPE,
      metadata: legacyExtraction.cleaned,
      sourceTag: legacyExtraction.sourceTag ?? legacyExtraction.fileName ?? DEFAULT_FILE_NAME,
    };
  }

  const inputExtraction = extractMetadata(input.metadata);
  const combinedMetadata = {
    ...legacyExtraction.cleaned,
    ...inputExtraction.cleaned,
  };

  return {
    content: input.content,
    data: input.data ?? input.pdfData,
    fileName:
      input.fileName ?? inputExtraction.fileName ?? legacyExtraction.fileName ?? DEFAULT_FILE_NAME,
    fileType:
      input.fileType ?? inputExtraction.fileType ?? legacyExtraction.fileType ?? DEFAULT_FILE_TYPE,
    metadata: combinedMetadata,
    chunkSize: input.chunkSize,
    overlap: input.overlap,
    sourceTag:
      input.sourceTag ??
      inputExtraction.sourceTag ??
      legacyExtraction.sourceTag ??
      input.fileName ??
      inputExtraction.fileName ??
      legacyExtraction.fileName ??
      DEFAULT_FILE_NAME,
  };
};

const shouldParseAsPdf = (
  payload: NormalizedIngestOptions
): payload is NormalizedIngestOptions & { data: PdfDataInput } =>
  Boolean(payload.data && payload.fileType.toLowerCase().includes('pdf'));

const buildLayoutPayload = (chunk: PdfChunk) => {
  const base =
    chunk.metadata.layoutInfo && typeof chunk.metadata.layoutInfo === 'object'
      ? { ...chunk.metadata.layoutInfo }
      : {};

  const enriched: Record<string, unknown> = { ...base };
  if (typeof chunk.metadata.column === 'number') enriched.column = chunk.metadata.column;
  if (chunk.metadata.sectionId) enriched.sectionId = chunk.metadata.sectionId;
  if (chunk.metadata.chunkId) enriched.chunkId = chunk.metadata.chunkId;
  if (chunk.metadata.source) enriched.source = chunk.metadata.source;

  return Object.keys(enriched).length > 0 ? enriched : null;
};

export async function ingestDocument(
  input: string | IngestDocumentOptions,
  legacyMetadata: Record<string, unknown> = {}
) {
  try {
    console.log('🚀 开始入库流程...');
    const normalized = normalizeInput(input, legacyMetadata);
    const { content, data, fileName, fileType } = normalized;

    if (!content && !data) {
      throw new Error('content 或 data 至少需要一个');
    }

    const sourceTag = normalized.sourceTag ?? fileName;
    let chunks: PdfChunk[] = [];

    if (shouldParseAsPdf(normalized)) {
      chunks = await parsePdfBuffer(normalized.data, {
        chunkSize: normalized.chunkSize,
        sourceTag,
      });
    } else {
      if (!content || !content.trim()) {
        throw new Error('content 不能为空');
      }
      chunks = chunkPlainText(content, {
        chunkSize: normalized.chunkSize,
        overlap: normalized.overlap,
        sourceTag,
      });
    }

    if (chunks.length === 0) {
      throw new Error('切片后没有生成任何片段');
    }

    const resource = await prisma.resource.create({
      data: {
        content: content ?? '',
        fileName,
        fileType,
        metadata: normalized.metadata as InputJsonValue,
      },
    });

    console.log(`✅ Resource 创建成功: ${resource.id}`);

    const { embeddings } = await embedMany({
      model: qwen.embedding('text-embedding-v2'),
      values: chunks.map((chunk) => chunk.text),
    });

    console.log(`🧠 向量化完成，生成 ${embeddings.length} 个向量`);

    if (!embeddings || embeddings.length !== chunks.length) {
      throw new Error(`向量数量不匹配: chunks=${chunks.length}, embeddings=${embeddings?.length}`);
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk) {
        throw new Error(`Chunk generation failed for chunk ${i}`);
      }
      const vector = embeddings[i];

      if (!vector) {
        throw new Error(`Embedding generation failed for chunk ${i}`);
      }

      const embeddingId = uuidv4();
      const layoutPayload = buildLayoutPayload(chunk);
      if (!layoutPayload) {
        throw new Error(`Layout payload generation failed for chunk ${i}`);
      }

      await prisma.$queryRawTyped(
        insertEmbedding(
          embeddingId,
          chunk.text,
          vector,
          resource.id,
          chunk.metadata.pageNumber ?? null,
          chunk.metadata.chunkIndex,
          chunk.metadata.category ?? 'text',
          layoutPayload as InputJsonObject
        )
      );

      console.log(`正在写入第 ${i + 1}/${chunks.length} 个片段...`);
    }

    console.log(`🎉 入库完成！已存储 ${chunks.length} 条记忆`);
    return { success: true, resourceId: resource.id };
  } catch (error) {
    console.error('❌ 入库失败:', error);
    return { success: false, error: String(error) };
  }
}
