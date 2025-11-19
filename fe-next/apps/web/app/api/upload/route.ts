import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    // 1. 获取文件名 (如果没有则使用默认名)
    const filename = searchParams.get('filename') || 'upload.png';

    // 2. 检查是否有 Body
    if (!request.body) {
      return NextResponse.json({ error: 'No file body' }, { status: 400 });
    }

    // 3. 上传到 Vercel Blob
    // access: 'public' 表示文件上传后可以通过 URL 公开访问
    const blob = await put(filename, request.body, {
      access: 'public',
    });

    // 4. 返回结果 (包含 url)
    return NextResponse.json(blob);
  } catch (error) {
    console.error('Upload failed:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
