import type { ParsePdfOptions, PdfChunk, RawPdfBlock } from '../types';

const DEFAULT_CHUNK_SIZE = 900;

/** 按照页码、栏位、原始顺序先排序，避免乱序拼接 */
const sortLayoutBlocks = (blocks: RawPdfBlock[]): RawPdfBlock[] =>
  blocks
    .filter((block) => Boolean(block.text?.trim()))
    .sort((a, b) => {
      if (a.page !== b.page) return a.page - b.page;
      if ((a.column ?? 0) !== (b.column ?? 0)) return (a.column ?? 0) - (b.column ?? 0);
      if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
      return String(a.sectionId ?? '').localeCompare(String(b.sectionId ?? ''));
    });

const shouldStartNewChunk = (
  block: RawPdfBlock,
  current: RawPdfBlock | null,
  bufferedLength: number,
  limit: number
) => {
  if (!current) return false;
  if (block.page !== current.page) return true;
  if (block.sectionId && block.sectionId !== current.sectionId) return true;
  if ((block.column ?? 0) !== (current.column ?? 0) && bufferedLength > 0) return true;
  return bufferedLength + block.text.trim().length > limit;
};

const buildChunkMeta = (
  anchor: RawPdfBlock,
  chunkIndex: number,
  sourceTag?: string
): PdfChunk['metadata'] => ({
  pageNumber: anchor.page,
  column: anchor.column ?? 0,
  sectionId: anchor.sectionId ?? 'body',
  chunkId: `pdf-${anchor.page}-${chunkIndex}`,
  source: anchor.source ?? sourceTag ?? 'pdf',
  chunkIndex,
  category: anchor.category ?? 'text',
  layoutInfo: anchor.layoutInfo,
});

/**
 * 参考文档解析流程：排序 -> 合并 -> 打标签，避免结构断裂。
 * 暂时仅依赖上游解析器产出的Layout信息，便于后续集成OCR/布局组件。
 */
export const parsePdfFromLayout = (
  blocks: RawPdfBlock[],
  options: ParsePdfOptions = {}
): PdfChunk[] => {
  const limit = options.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const sorted = sortLayoutBlocks(blocks);
  const chunks: PdfChunk[] = [];
  let buffer = '';
  let currentMetaBlock: RawPdfBlock | null = null;
  let chunkCounter = 0;

  const flushChunk = () => {
    if (!buffer.trim() || !currentMetaBlock) return;
    chunks.push({
      text: buffer.trim(),
      metadata: buildChunkMeta(currentMetaBlock, chunkCounter, options.sourceTag),
    });
    chunkCounter += 1;
    buffer = '';
    currentMetaBlock = null;
  };

  sorted.forEach((block) => {
    const piece = block.text.trim();
    if (!piece) return;
    if (shouldStartNewChunk(block, currentMetaBlock, buffer.length, limit)) {
      flushChunk();
    }
    if (!currentMetaBlock) {
      currentMetaBlock = block;
    }
    buffer = buffer ? `${buffer}\n\n${piece}` : piece;
  });

  flushChunk();
  return chunks;
};
