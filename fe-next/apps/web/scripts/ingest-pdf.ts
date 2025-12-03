'use server';

import path from 'path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { ingestDocument } from '../server/services/rag/ingest';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_PDF = '../../../packages/docs/pdfs/alibaba2025Q3.pdf';

async function main() {
  const userInput = process.argv[2];
  const absolutePath = userInput
    ? path.resolve(userInput)
    : path.resolve(__dirname, DEFAULT_PDF);

  console.log(`📄 解析并入库：${absolutePath}`);

  const pdfBuffer = await readFile(absolutePath);

  const result = await ingestDocument(
    {
      data: pdfBuffer,
      fileName: path.basename(absolutePath),
      fileType: 'application/pdf',
      metadata: {
        sourceTag: 'manual-script',
        ingestedAt: new Date().toISOString(),
      },
    },
    {
      fileName: path.basename(absolutePath),
    }
  );

  if (result.success) {
    console.log(`✅ 入库成功，Resource ID: ${result.resourceId}`);
  } else {
    console.error('❌ 入库失败：', result.error);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('脚本异常：', error);
    process.exitCode = 1;
  });
}
