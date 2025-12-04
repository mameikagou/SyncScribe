#!/usr/bin/env bun
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ingestDocument } from '@/server/services/rag/ingest'; // 确保你的 tsconfig.json 配置了 paths

// 1. 获取当前脚本目录 (ESM 标准写法)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. 默认文件路径
// 从web目录，退两层到fe-next
const DEFAULT_PDF = '../../packages/docs/pdfs/alibaba2025Q3.pdf';

// 3. 核心逻辑 (Bun 支持顶层 await，不需要包在 main 函数里)
try {
  // Bun.argv 和 process.argv 类似: [0]=bun执行程序, [1]=脚本文件, [2]=参数
  const userInput = Bun.argv[2];

  // 路径解析逻辑：
  // - 如果有参数：基于当前执行命令的目录 (cwd) 解析
  // - 如果没参数：基于脚本所在目录 (__dirname) 找默认文件
  const absolutePath = userInput
    ? path.resolve(process.cwd(), userInput)
    : path.resolve(__dirname, DEFAULT_PDF);

  console.log(`🚀 [Bun] 正在读取文件: ${absolutePath}`);

  const file = Bun.file(absolutePath);

  // 检查文件是否存在
  if (!(await file.exists())) {
    console.error(`❌ 文件不存在: ${absolutePath}`);
    process.exit(1);
  }

  // 4. 读取文件 (Bun.file 是懒加载的，性能极高)
  // ingestDocument 通常需要 Buffer 或 ArrayBuffer
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer); // 转为 Node Buffer 以兼容大多数库

  console.log(`📦 文件大小: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

  // 5. 调用入库逻辑
  const result = await ingestDocument(
    {
      data: buffer,
      fileName: path.basename(absolutePath),
      fileType: 'application/pdf',
      metadata: {
        sourceTag: 'bun-script',
        ingestedAt: new Date().toISOString(),
      },
    },
    {
      fileName: path.basename(absolutePath),
    }
  );

  if (result.success) {
    console.log(`✅ 入库成功! Resource ID: ${result.resourceId}`);
  } else {
    console.error('❌ 入库失败:', result.error);
    process.exit(1);
  }
} catch (error) {
  console.error('🔥 脚本发生异常:', error);
  process.exit(1);
}
