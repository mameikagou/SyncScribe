import type { ParsePdfOptions, PdfChunk, RawPdfBlock } from '../types';

const DEFAULT_CHUNK_SIZE = 900;

/** 按照页码、栏位、原始顺序先排序，避免乱序拼接 */
const sortLayoutBlocks = (blocks: RawPdfBlock[]): RawPdfBlock[] =>
  blocks
    .filter((block) => Boolean(block.text?.trim()))
    .sort((a, b) => {
      // 页码
      if (a.page !== b.page) return a.page - b.page;
      // 列
      if ((a.column ?? 0) !== (b.column ?? 0)) return (a.column ?? 0) - (b.column ?? 0);
      // 解析器层级（阅读顺序）
      if ((a.order ?? 0) !== (b.order ?? 0)) return (a.order ?? 0) - (b.order ?? 0);
      // 字典序
      return String(a.sectionId ?? '').localeCompare(String(b.sectionId ?? ''));
    });

const shouldStartNewChunk = (
  block: RawPdfBlock,
  current: RawPdfBlock | null,
  bufferedLength: number,
  limit: number
) => {
  // 不存在，直接短返回
  if (!current) return false;
  // 页码不同
  if (block.page !== current.page) return true;
  // 段落不同
  if (block.sectionId && block.sectionId !== current.sectionId) return true;
  // 栏位不同
  if ((block.column ?? 0) !== (current.column ?? 0) && bufferedLength > 0) return true;
  // 长度超了
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

  // 封箱，切分chunk；包括增加counter，清空buffer，重置meta；
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
    // 先判空
    if (!piece) return;
    // 再封箱
    if (shouldStartNewChunk(block, currentMetaBlock, buffer.length, limit)) {
      flushChunk();
    }
    // 再判空并初始化，使用第一块的元数据。
    if (!currentMetaBlock) {
      currentMetaBlock = block;
    }
    // 这里才是buffer的累加
    // \n\n表示硬换行，表示“新段落”，
    buffer = buffer ? `${buffer}\n\n${piece}` : piece;
  });

  flushChunk();
  return chunks;
};
