import { Menu } from 'lucide-react';
import { ChatContainer } from '@/components/ChatContainer';
import { SiderBar } from '@/components/SiderBar/SiderBar';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@workspace/ui/components/sheet';

export default function DeskLayout({ children }: { children: React.ReactNode }) {
  return (
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

      {/* Center Stage */}
      <main className="flex-1 relative bg-desk flex flex-col min-w-0 overflow-hidden">{children}</main>

      {/* Right Bookend */}
      <aside className="w-[20vw] shrink-0 bg-sidebar border-l border-stone-200/80 z-10 hidden xl:flex flex-col">
        <div className="p-6">
          <div className="text-xs font-bold text-stone-400 tracking-widest uppercase">Assistant</div>
          <ChatContainer />
        </div>
      </aside>
    </div>
  );
}
