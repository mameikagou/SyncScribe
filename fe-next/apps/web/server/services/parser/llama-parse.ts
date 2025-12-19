

// TODO：深入这些代码的细节，并修复红色报错；

const LLAMA_CLOUD_API_KEY = process.env.LLAMA_CLOUD_API_KEY;
if(!LLAMA_CLOUD_API_KEY) {
    throw new Error('Missing LLAMA_CLOUD_API_KEY');
}
const BASE_URL = 'https://api.cloud.llamaindex.ai/api/v1';

export async function parsePdfWithLlama(buffer: Buffer, fileName: string) {
  // 1. 上传文件
  const formData = new FormData();
  // 注意：在 Node 环境下，buffer 需要转成 Blob 才能被 fetch 发送
  const blob = new Blob([buffer], { type: 'application/pdf' });
  formData.append('file', blob, fileName);
  
  // 配置参数
  formData.append('premium_mode', 'true'); 
  formData.append('parse_mode', 'parse_page_with_agent'); // 你的高级模式
  formData.append('model', 'gemini-2.5-flash'); // 指定模型
  formData.append('output_type', 'json'); // 关键：我们要 JSON 来拿坐标
  // ... 其他参数按需添加

  console.log('📤 Uploading to LlamaCloud...');
  const uploadRes = await fetch(`${BASE_URL}/parsing/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}` },
    body: formData,
  });

  if (!uploadRes.ok) {
    throw new Error(`LlamaParse Upload Failed: ${uploadRes.statusText}`);
  }

  const { id: jobId } = await uploadRes.json();
  console.log(`⏳ Job ID: ${jobId}, waiting for completion...`);

  // 2. 轮询检查状态
  const maxRetries = 60; // 最多等 60 秒
  let result = null;

  for (let i = 0; i < maxRetries; i++) {
    await new Promise(r => setTimeout(r, 1000)); // 等 1 秒

    const checkRes = await fetch(`${BASE_URL}/parsing/job/${jobId}`, {
      headers: { Authorization: `Bearer ${LLAMA_CLOUD_API_KEY}` },
    });
    
    if (!checkRes.ok) continue;
    
    const statusData = await checkRes.json();

    if (statusData.status === 'SUCCESS') {
      // 3. 获取结果
      // 注意：SUCCESS 后，result 字段里直接就有 markdown 或 json 的下载链接
      const resultUrl = statusData.json_result_url; // 或者 markdown_result_url
      if(!resultUrl) throw new Error('No result URL found');

      const downloadRes = await fetch(resultUrl);
      result = await downloadRes.json();
      break;
    } else if (statusData.status === 'FAILED') {
      throw new Error(`LlamaParse Job Failed: ${JSON.stringify(statusData)}`);
    }
    // 如果是 PENDING，继续循环
  }

  if (!result) throw new Error('Parsing timed out');

  return result;
}