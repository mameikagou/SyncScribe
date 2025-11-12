import { put } from '@vercel/blob';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename') || 'unknown.jpg';

  if (!request.body || !filename) {
    return NextResponse.json({ error: 'File or filename is missing' }, { status: 400 });
  }
  // 1. 这里的 request.body 是文件流
  // 2. access: 'public' 是关键，这样 Qwen 才能读取图片
  const blob = await put(filename, request.body, {
    access: 'public',
  });

  // 返回 blob 对象，里面包含 .url
  return NextResponse.json(blob);
}
