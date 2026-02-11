'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-017-workbench-ui.md

import type { GuideExplorerVM } from '@/app/(desk)/vibe/repo-guide/types';

type GuideExplorerProps = {
  vm: GuideExplorerVM;
};

export default function GuideExplorer({ vm }: GuideExplorerProps) {
  if (vm.isLoading) {
    return <div className="p-3 text-sm text-stone-500">导游目录加载中...</div>;
  }

  if (vm.categories.length === 0) {
    return <div className="p-3 text-sm text-stone-500">还没有导游目录，请先完成索引。</div>;
  }

  return (
    <div className="h-full overflow-y-auto px-3 py-3">
      <div className="space-y-4">
        {vm.categories.map((category) => (
          <section key={category.id} className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-stone-500">{category.title}</h3>
            <ul className="space-y-1">
              {category.docs.map((doc) => {
                const isActive = vm.activeDocId === doc.id;
                return (
                  <li key={doc.id}>
                    <button
                      type="button"
                      onClick={() => vm.onSelectDoc(doc.id)}
                      className={`w-full rounded-md border px-3 py-2 text-left transition ${
                        isActive
                          ? 'border-stone-900 bg-stone-900/5'
                          : 'border-transparent bg-transparent hover:border-stone-200 hover:bg-stone-50'
                      }`}
                    >
                      <p className="text-sm font-medium text-stone-900">{doc.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-stone-500">{doc.summary}</p>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
