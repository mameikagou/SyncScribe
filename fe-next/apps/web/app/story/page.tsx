'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPONENT_REGISTRY } from './registry';

export default function StoryLabPage() {
  const registryEntries = useMemo(() => Object.entries(COMPONENT_REGISTRY), []);
  const [activeKey, setActiveKey] = useState<string>(registryEntries[0]?.[0] ?? '');
  const [previewWidth, setPreviewWidth] = useState<number>(1024);
  const [dragging, setDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragStartWidth = useRef(1024);
  const STORAGE_KEY = 'story-preview-width';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = window.sessionStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = Number(saved);
      if (!Number.isNaN(parsed)) {
        setPreviewWidth(parsed);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.sessionStorage.setItem(STORAGE_KEY, String(previewWidth));
  }, [previewWidth]);

  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e: MouseEvent) => {
      const delta = e.clientX - dragStartX.current;
      const next = Math.min(1600, Math.max(640, dragStartWidth.current + delta));
      setPreviewWidth(next);
    };
    const handleUp = () => {
      setDragging(false);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [dragging]);

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
        <div className="w-full flex justify-center">
          <article
            className="bg-paper min-h-[80vh] shadow-page rounded-md ring-1 ring-stone-200 relative overflow-hidden"
            style={{ width: `${previewWidth}px` }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,#e5e7eb_1px,transparent_0)] bg-[length:24px_24px] opacity-40 pointer-events-none" />
            <div className="relative p-8 flex items-center justify-center">
              <div className="w-full h-[70vh]">
                {ActiveComponent ? <ActiveComponent {...activeProps} /> : null}
              </div>
            </div>
            <button
              type="button"
              aria-label="Resize preview"
              onMouseDown={(e) => {
                setDragging(true);
                dragStartX.current = e.clientX;
                dragStartWidth.current = previewWidth;
              }}
              className="absolute top-0 right-0 h-full w-3 cursor-col-resize bg-transparent hover:bg-action/10 active:bg-action/20 transition-colors"
            />
          </article>
        </div>
      </main>
    </div>
  );
}
