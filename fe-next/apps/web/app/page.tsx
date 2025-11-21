import { CrystalBar } from '@/components/CrystalBar';
import { EditorHost } from '@/components/EditorHost';

export default function Page() {
  const fakeInitialContent = `
    <p>
      当我们在谈论“周期性”的时候，半导体行业通常是最好的观察样本。
      然而，这一轮的 AI 浪潮似乎打破了传统的库存周期规律。
    </p>
    <p>
      根据最新的电话会议纪要，管理层对 Q4 的指引依然保持乐观，
      但我注意到一个细节：<strong>毛利率 (Gross Margin)</strong> 的指引区间开始收窄。
    </p>
  `;

  return (
    // 1. 桌面区域 (可滚动)
    <div className="w-full h-full overflow-y-auto scrollbar-hide">
      <div className="py-12 px-4 md:px-0 flex flex-col items-center">
        {/* 2. 纸张容器 (The Paper) */}
        {/* - bg-paper: 纯白背景
           - shadow-page: 实体纸张投影
           - min-h-[1100px]: 保证它看起来像一张长长的 A4 纸
        */}
        <article
          className="
            bg-paper 
            w-full max-w-[820px] 
            min-h-[90vh] 
            mx-auto 
            shadow-page 
            rounded-sm 
            ring-1 ring-black/[0.02] 
            px-12 py-16 
            relative
        "
        >
          {/* 3. 富文本编辑器 (Content) */}
          {/* 我们在外层加了 'prose' (Tailwind Typography)，
               这样 Tiptap 生成的 h1, p, list 就会自动应用我们的字体风格
            */}
          <div className="prose prose-stone prose-lg max-w-none font-serif text-ink leading-loose">
            <EditorHost initialContent={fakeInitialContent} />
          </div>
          <CrystalBar />
        </article>

        {/* 底部留白，方便滚动 */}
        {/* <div className="h-32"></div> */}
      </div>
    </div>
  );
}
