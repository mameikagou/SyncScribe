import { PDFParse } from 'pdf-parse';

import { parsePdfFromLayout } from '@/server/services/parser/parsePdfFromLayout';
import type { ParsePdfOptions, PdfChunk, PdfDataInput, RawPdfBlock } from '@/lib/types';

const DEFAULT_PDF_SOURCE = 'pdf-parse';

const normalizePdfBuffer = (input: PdfDataInput): Uint8Array => {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);

  if (ArrayBuffer.isView(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }

  throw new TypeError('Unsupported PDF data input. Provide ArrayBuffer or TypedArray.');
};

const buildRawBlocksFromPages = (
  pages: { num: number; text: string }[] = [],
  sourceTag?: string
): RawPdfBlock[] => {
  const source = sourceTag ?? DEFAULT_PDF_SOURCE;
  return pages
    .map((page, index) => {
      const text = page.text?.trim();
      if (!text) return null;
      const pageNumber = typeof page.num === 'number' && page.num > 0 ? page.num : index + 1;
      const block: RawPdfBlock = {
        text,
        page: pageNumber,
        column: 0,
        sectionId: `page-${pageNumber}`,
        order: index,
        source,
        category: 'text',
        layoutInfo: undefined,
      };
      return block;
    })
    .filter((block): block is RawPdfBlock => Boolean(block));
};

/**
 * 简易版解析：直接走 pdf-parse → 文本 → RawBlock → Chunk。
 * 缺点是没有 layout 信息，不过能够快速验证流程。
 */
export const parsePdfBuffer = async (
  pdf: PdfDataInput,
  options: ParsePdfOptions = {}
): Promise<PdfChunk[]> => {
  const parser = new PDFParse({ data: normalizePdfBuffer(pdf) });
  try {
    const { pages } = await parser.getText();
    const blocks = buildRawBlocksFromPages(pages, options.sourceTag);
    if (blocks.length === 0) {
      return [];
    }
    return parsePdfFromLayout(blocks, options);
  } finally {
    try {
      await parser.destroy();
    } catch {
      // 忽略 destroy 报错，通常由重复销毁导致
    }
  }
};
