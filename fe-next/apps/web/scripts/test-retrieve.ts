
import { retrieveEmbeddings } from '@/server/services/rag/retrieve';

async function main() {
  // Bun 会自动读取当前目录下的 .env.local
  // 如果你想确认一下，可以打印看看
  // console.log("DB URL:", process.env.POSTGRES_PRISMA_URL); 

  const query = '博格公式';
  
  console.log(`⚡️ [Bun] 正在检索: "${query}"`);
  console.log('-----------------------------------');

  try {
    const results = await retrieveEmbeddings(query);

    if (results.length === 0) {
      console.log('❌ 未找到结果。');
    } else {
      results.forEach((row, i) => {
        console.log(`\n📄 [Result ${i + 1}] (Score: ${row.similarity?.toFixed(4)})`);
        console.log(`Content: ${row.content.substring(0, 100).replace(/\n/g, ' ')}...`);
      });
      console.log('\n✅ 测试通过！(Powered by Bun)');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

main();