/**
 * Endpoint Description: GET/PUT /api/documents/:id，用于读取或保存 Tiptap JSON 文档。
 * Request Example (GET): 无请求体，路径参数 id 如 "doc-123".
 * Request Example (PUT):
 * {
 *   "type": "doc",
 *   "content": [{ "type": "paragraph", "content": [{ "text": "hello", "type": "text" }] }]
 * }
 * Response Example (200 GET): { "type": "doc", "content": [...] }; PUT 成功返回空响应（204/200），缺失文档返回 404，数据库错误返回 500。
 * Test Command:
 * curl http://localhost:3000/api/documents/doc-123
 * curl -X PUT http://localhost:3000/api/documents/doc-123 \
 *   -H "Content-Type: application/json" \
 *   -d '{\"type\":\"doc\",\"content\":[{\"type\":\"paragraph\",\"content\":[{\"type\":\"text\",\"text\":\"hello\"}]}]}'
 */
import { db } from '@vercel/postgres';
import { NextResponse } from 'next/server';

/**
 * [GET] /api/documents/[id]
 * 根据 ID 获取文档内容
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;

  try {
    const { rows } = await db.sql`
        SELECT content FROM documents WHERE id = ${id}
        `;

    if (rows.length === 0) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(rows[0]?.content);
  } catch (error) {
    console.error('Failed to fetch document:', error);
    return NextResponse.json({ error: 'Failed to fetch document' }, { status: 500 });
  }
}

/**
 * [PUT] /api/documents/[id]
 * 保存/更新文档内容
 */
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  // 1. 从请求体中解析 Tiptap 的 JSON
  const content = await request.json();

  const stringifyCcontent = JSON.stringify(content);
  try {
    await db.sql`
    INSET INTO documents (id, content) VALUES (${id}, ${stringifyCcontent}) ON CONFLICT (id) DO UPDATE SET content= ${stringifyCcontent}`;
  } catch (error) {
    console.error('Failed to save document:', error);
    return NextResponse.json({ error: 'Failed to save document' }, { status: 500 });
  }
}
