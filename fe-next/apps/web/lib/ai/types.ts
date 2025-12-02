export type ColumnId = number;
export type BoundingBox = [number, number, number, number];

export interface PdfLayoutInfo {
  /** 提供原始坐标，便于在前端高亮位置 */
  bbox?: BoundingBox;
  /** 允许自由附加更多 OCR/解析细节 */
  [key: string]: unknown;
}

export interface RawPdfBlock {
  /** 解析器已经识别出来的文本 */
  text: string;
  /** 所属页码，方便后续定位 */
  page: number;
  /** 如果存在多栏，此值帮助保留阅读顺序 */
  column?: ColumnId;
  /** 可选的章节或标题标签 */
  sectionId?: string;
  /** 解析器层级顺序，数值越小越靠前 */
  order?: number;
  /** 来源信息/路径 */
  source?: string;
  /** 标识块类型：标题/正文/表格... */
  category?: string;
  /** 原始布局信息 (bbox、旋转等) */
  layoutInfo?: PdfLayoutInfo;
}

export interface PdfChunk {
  text: string;
  metadata: {
    pageNumber: number;
    column: ColumnId;
    sectionId: string;
    chunkId: string;
    source: string;
    chunkIndex: number;
    category: string;
    layoutInfo?: PdfLayoutInfo;
  };
}

export interface ParsePdfOptions {
  /** 控制每个 chunk 的近似字数 */
  chunkSize?: number;
  /** 额外的标签，便于后续检索打标 */
  sourceTag?: string;
  /** 将来可选：是否将表格块也纳入输出 */
  includeTables?: boolean;
}

export type PdfDataInput = ArrayBuffer | ArrayBufferView;
