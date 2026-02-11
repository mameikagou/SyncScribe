'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-017-workbench-ui.md

import { useMemo } from 'react';
import type { RepoTreeVM } from '@/app/(desk)/vibe/repo-guide/types';
import type { RepoTreeNode } from '@/server/services/vibe/repo-guide/types';

type RepoTreeProps = {
  vm: RepoTreeVM;
};

type FlatTreeRow = {
  node: RepoTreeNode;
  depth: number;
};

const flattenVisibleTreeRows = (roots: RepoTreeNode[]): FlatTreeRow[] => {
  const rows: FlatTreeRow[] = [];
  const stack: FlatTreeRow[] = [];

  for (let index = roots.length - 1; index >= 0; index -= 1) {
    stack.push({
      node: roots[index]!,
      depth: 0,
    });
  }

  while (stack.length > 0) {
    const current = stack.pop();
    if (!current) {
      continue;
    }

    rows.push(current);

    const node = current.node;
    if (node.type !== 'dir' || !node.isExpanded || !node.children || node.children.length === 0) {
      continue;
    }

    for (let index = node.children.length - 1; index >= 0; index -= 1) {
      stack.push({
        node: node.children[index]!,
        depth: current.depth + 1,
      });
    }
  }

  return rows;
};

export default function RepoTree({ vm }: RepoTreeProps) {
  const rows = useMemo(() => flattenVisibleTreeRows(vm.nodes), [vm.nodes]);

  if (vm.isLoading && vm.nodes.length === 0) {
    return <div className="p-3 text-sm text-stone-500">文件树加载中...</div>;
  }

  if (vm.nodes.length === 0) {
    return <div className="p-3 text-sm text-stone-500">暂无可展示文件树。</div>;
  }

  return (
    <div className="h-full overflow-y-auto py-2">
      <ul>
        {rows.map(({ node, depth }) => {
          const isDir = node.type === 'dir';
          const isSelected = vm.selectedPath === node.path;

          return (
            <li key={node.path}>
              <div
                className={`flex items-center gap-1 rounded px-2 py-1 text-sm ${isSelected ? 'bg-stone-900/10 text-stone-900' : 'text-stone-700 hover:bg-stone-100'}`}
                style={{ paddingLeft: `${depth * 14 + 8}px` }}
              >
                {isDir ? (
                  <button type="button" className="w-4" onClick={() => vm.onExpand(node.path)}>
                    {node.isExpanded ? '▾' : '▸'}
                  </button>
                ) : (
                  <span className="w-4" />
                )}

                <button
                  type="button"
                  className="flex-1 truncate text-left"
                  onClick={() => {
                    if (isDir) {
                      vm.onExpand(node.path);
                      return;
                    }
                    vm.onSelect(node.path);
                  }}
                >
                  {node.name}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
