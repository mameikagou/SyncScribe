'use client';

import React from 'react';

const statusHints = [
  { title: 'Supported', detail: 'PDF · DOCX · TXT · Markdown' },
  { title: 'Max size', detail: 'Up to 200MB per upload' },
];

export function FilesSideBar() {
  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <p className="text-[10px] uppercase tracking-[0.4em] text-stone-400 font-semibold">
          Library
        </p>
        <h2 className="mt-3 text-xl font-serif text-ink leading-tight">
          Upload Repository
        </h2>
        <p className="mt-2 text-sm text-ink-muted leading-relaxed">
          尽可能把原始资料带进来：会议纪要、研究报告、审阅稿。我们会像档案管理员一样，先用实体感十足的空间把它们安置好。
        </p>
      </div>

      <div className="flex-1 flex flex-col gap-4">
        <div className="rounded-md bg-white/90 border border-stone-200 shadow-card p-4 flex flex-col gap-3">
          <div className="border border-dashed border-stone-300 rounded-[18px] px-4 py-6 flex flex-col items-center justify-center gap-2 text-center">
            <div className="text-3xl text-thought">⌂</div>
            <p className="text-sm font-semibold text-ink">拖拽文件至此</p>
            <p className="text-xs text-ink-muted leading-snug">
              或者点击下方按钮，手动挑选你的资料。
            </p>
            <button
              type="button"
              className="mt-3 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide rounded-sm bg-action text-white hover:bg-action-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-action"
            >
              Select files
            </button>
          </div>
          <div className="text-[11px] text-stone-500 leading-relaxed font-sans">
            <p>后台会自动拆解并归档，上传完成后可在本侧边查看已处理文件。</p>
          </div>
        </div>

        <div className="space-y-3">
          {statusHints.map((hint) => (
            <div
              key={hint.title}
              className="flex items-start gap-3 rounded-md bg-paper border border-stone-100 px-3 py-2 shadow-sm"
            >
              <div className="w-2 h-2 mt-1 rounded-full bg-action" />
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-500">{hint.title}</p>
                <p className="text-sm text-ink">{hint.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
