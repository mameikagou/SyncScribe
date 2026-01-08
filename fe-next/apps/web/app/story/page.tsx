'use client';

import { useMemo, useState } from 'react';
import { COMPONENT_REGISTRY } from './registry';

export default function StoryLabPage() {
  const registryEntries = useMemo(() => Object.entries(COMPONENT_REGISTRY), []);
  const [activeKey, setActiveKey] = useState<string>(registryEntries[0]?.[0] ?? '');

  if (!registryEntries.length) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-500">
        暂无可预览的组件
      </div>
    );
  }

  const activeEntry = COMPONENT_REGISTRY[activeKey];
  const ActiveComponent = activeEntry?.component;
  const activeProps = activeEntry?.props ?? {};

  return (
    <div className="min-h-screen bg-desk text-ink flex font-sans">
      {/* 左侧 Tab 列表：书挡 */}
      <aside className="w-72 border-r border-stone-200 bg-sidebar/80 backdrop-blur-sm flex flex-col shadow-card">
        <div className="px-4 py-3 text-xs uppercase tracking-[0.2em] text-stone-500">Story Lab</div>
        <div className="flex-1 overflow-y-auto">
          {registryEntries.map(([key, entry]) => {
            const isActive = key === activeKey;
            return (
              <button
                key={key}
                onClick={() => setActiveKey(key)}
                className={`w-full text-left px-4 py-3 transition-colors border-l-2 ${
                  isActive
                    ? 'bg-white border-action text-ink shadow-sm'
                    : 'border-transparent hover:bg-white/60 text-stone-600'
                }`}
              >
                <div className="text-sm font-semibold">{entry.label}</div>
                {entry.description ? (
                  <div className="text-xs text-stone-500 mt-0.5 line-clamp-2">{entry.description}</div>
                ) : null}
              </button>
            );
          })}
        </div>
      </aside>

      {/* 中央纸张区域 */}
      <main className="flex-1 flex justify-center py-12 px-6">
        <div className="w-full max-w-6xl">
          <article className="bg-paper w-full min-h-[80vh] shadow-page rounded-md ring-1 ring-stone-200 relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#e5e7eb_1px,transparent_0)] bg-[length:24px_24px] opacity-40 pointer-events-none" />
            <div className="relative p-8 flex items-center justify-center">
              <div className="w-full h-[70vh]">
                {ActiveComponent ? <ActiveComponent {...activeProps} /> : null}
              </div>
            </div>
          </article>
        </div>
      </main>
    </div>
  );
}
