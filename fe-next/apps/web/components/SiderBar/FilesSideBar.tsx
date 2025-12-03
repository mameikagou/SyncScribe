'use client';

import React from 'react';

const statusHints = [
  { title: 'Supported', detail: 'PDF · DOCX · TXT · Markdown' },
  { title: 'Max size', detail: 'Up to 200MB per upload' },
  { title: 'Max size', detail: 'Up to 200MB per upload' },
  { title: 'Max size', detail: 'Up to 200MB per upload' },
  

];

export function SidebarShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-[#F7F7F5] rounded-[32px] shadow-inner w-full h-full border border-white/80 ring-1 ring-stone-900/5 p-6 overflow-hidden">
      <div className="flex h-full flex-col gap-4">
        <div className="flex-1 overflow-y-auto scrollbar-thin-custom">{children}</div>
        <div className="border-t border-stone-200 pt-3 text-[11px] text-stone-500 font-sans flex items-center justify-between">
          <span>Need help with uploads?</span>
          <button className="text-xs uppercase tracking-wide text-action hover:text-action-hover">
            Contact team
          </button>
        </div>
      </div>
    </div>
  );
}

export function FilesSideBar() {
  return (
    <SidebarShell>
      <p className="text-sm text-stone-500 leading-relaxed font-sans">
        尽可能把原始资料带进来：会议纪要、研究报告、审阅稿。我们会像档案管理员一样，先用实体感十足的空间把它们安置好。
      </p>

        <div className="rounded-2xl bg-paper border border-stone-100 shadow-sm p-6 flex flex-col gap-3">
        <div className="border-2 border-dashed border-stone-200 rounded-[26px] px-5 py-8 flex flex-col items-center justify-center gap-2 text-center bg-stone-100/40">
          <div className="w-10 h-10 text-thought">⌂</div>
          <p className="text-sm font-semibold text-ink">拖拽文件至此</p>
          <p className="text-xs text-ink-muted leading-snug">
            或者点击下方按钮，手动挑选你的资料。
          </p>
          <button
            type="button"
            className="mt-3 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-sm bg-action text-white hover:bg-action-hover transition-colors focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-action"
          >
            Select files
          </button>
        </div>
        <p className="text-[11px] text-stone-500 leading-relaxed font-sans">
          后台会自动拆解并归档，上传完成后可在本侧边查看已处理文件。
        </p>
      </div>

        <div className="space-y-3 mt-4">
        {statusHints.map((hint) => (
          <div
            key={hint.title}
            className="bg-white p-4 rounded-xl border border-stone-100 shadow-sm flex items-start gap-3"
          >
            <div className="mt-1 w-2 h-2 rounded-full bg-action shrink-0" />
            <div>
              <div className="text-[10px] font-bold text-stone-400 tracking-widest mb-1 uppercase">
                {hint.title}
              </div>
              <div className="font-serif text-stone-800">{hint.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </SidebarShell>
  );
}
