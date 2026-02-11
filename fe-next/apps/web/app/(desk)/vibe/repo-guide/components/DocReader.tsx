'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-017-workbench-ui.md
// - specs/02-specs/vibe-repo-guide/RG-021-magic-markdown-renderer.md

import MagicMarkdownRenderer from '@/app/(desk)/vibe/repo-guide/components/MagicMarkdownRenderer';
import type { DocReaderVM } from '@/app/(desk)/vibe/repo-guide/types';

type DocReaderProps = {
  vm: DocReaderVM;
};

export default function DocReader({ vm }: DocReaderProps) {
  if (vm.isLoading) {
    return <div className="p-4 text-sm text-stone-500">文档加载中...</div>;
  }

  if (!vm.doc) {
    return <div className="p-4 text-sm text-stone-500">从左侧选择一个章节开始阅读。</div>;
  }

  return (
    <article className="h-full overflow-y-auto p-4">
      <header className="mb-4 border-b border-stone-200 pb-3">
        <h2 className="text-xl font-semibold text-stone-900">{vm.doc.title}</h2>
        <p className="mt-1 text-xs text-stone-500">支持 guide:// 魔法链接，点击即可联动代码与文件树。</p>
      </header>
      <MagicMarkdownRenderer
        markdown={vm.doc.markdown}
        onCommand={vm.onMagicCommand}
        onExternalLink={(href) => {
          window.open(href, '_blank', 'noopener,noreferrer');
        }}
      />
    </article>
  );
}
