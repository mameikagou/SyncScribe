import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';

import '@workspace/ui/globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner'; // 1. 引入组件

// const fontSans = Geist({
//   subsets: ['latin'],
//   variable: '--font-sans',
// });

// const fontMono = Geist_Mono({
//   subsets: ['latin'],
//   variable: '--font-mono',
// });

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
});
const sourceSerif4 = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`
          ${inter.variable} ${jetbrainsMono.variable} ${sourceSerif4.variable}
          h-screen w-screen overflow-hidden
          bg-desk text-ink font-serif antialiased
          selection:bg-action/20 selection:text-action-hover
        `}
      >
        <Providers>
          {/* === 阶段一：空间架构 (Spatial Metaphor) === */}
          <div className="flex h-full w-full">
            {/* A. Left Bookend (Library) */}
            {/* 实体背景 bg-sidebar，右侧有物理边界 */}
            <aside className="w-64 shrink-0 bg-sidebar border-r border-stone-200/80 z-10 flex flex-col">
              <div className="p-6">
                <div className="text-xs font-bold text-stone-400 tracking-widest uppercase">
                  Library
                </div>
                {/* 暂时留空 */}
              </div>
            </aside>

            {/* B. The Desk (Center Stage) */}
            {/* 占据剩余空间 flex-1，背景色 bg-desk (#f0f0ef) */}
            <main className="flex-1 relative bg-desk flex flex-col min-w-0 overflow-hidden">
              {/* 这里渲染 app/page.tsx 的内容 */}
              {children}
            </main>

            {/* C. Right Bookend (Assistant) */}
            {/* 实体背景 bg-sidebar，左侧有物理边界，对称结构 */}
            <aside className="w-[380px] shrink-0 bg-sidebar border-l border-stone-200/80 z-10 hidden xl:flex flex-col">
              <div className="p-6">
                <div className="text-xs font-bold text-stone-400 tracking-widest uppercase">
                  Assistant
                </div>
                {/* 暂时留空 */}
              </div>
            </aside>
          </div>

          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
