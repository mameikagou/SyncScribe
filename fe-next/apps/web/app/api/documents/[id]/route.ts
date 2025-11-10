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
