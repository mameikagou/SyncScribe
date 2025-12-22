import { Inter, JetBrains_Mono, Source_Serif_4 } from 'next/font/google';

import '@workspace/ui/globals.css';
import { Providers } from '@/components/providers';
import { Toaster } from 'sonner';
import { Menu } from 'lucide-react';

import { ChatContainer } from '@/components/ChatContainer';
import { SiderBar } from '@/components/SiderBar/SiderBar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@workspace/ui/components/sheet';

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
            {/* Desktop Sidebar */}
            <aside className="hidden lg:flex w-[30vw] shrink-0 flex-col bg-sidebar border-r border-stone-200/80 gap-6">
              <SiderBar />
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
              <Sheet>
                <SheetTrigger asChild>
                  <button className="p-2 bg-white/80 backdrop-blur-sm border border-stone-200 rounded-full shadow-sm hover:bg-white transition-colors">
                    <Menu size={20} className="text-stone-600" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0 w-[80vw] sm:max-w-[320px] border-r-0">
                  <SheetTitle className="sr-only">Menu</SheetTitle>
                  <div className="h-full">
                    <SiderBar />
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* B. The Desk (Center Stage) */}
            {/* 占据剩余空间 flex-1，背景色 bg-desk (#f0f0ef) */}
            <main className="flex-1 relative bg-desk flex flex-col min-w-0 overflow-hidden">
              {/* 这里渲染 app/page.tsx 的内容 */}
              {children}
            </main>

            {/* C. Right Bookend (Assistant) */}
            {/* 实体背景 bg-sidebar，左侧有物理边界，对称结构 */}
            <aside className="w-[20vw] shrink-0 bg-sidebar border-l border-stone-200/80 z-10 hidden xl:flex flex-col">
              <div className="p-6">
                <div className="text-xs font-bold text-stone-400 tracking-widest uppercase">
                  Assistant
                </div>
                {/* 暂时留空 */}
                <ChatContainer />
              </div>
            </aside>
          </div>

          <Toaster position="top-center" richColors />
        </Providers>
      </body>
    </html>
  );
}
