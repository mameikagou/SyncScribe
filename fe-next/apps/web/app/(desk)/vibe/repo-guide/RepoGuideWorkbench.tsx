'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-016-page-entry.md
// - specs/02-specs/vibe-repo-guide/RG-017-workbench-ui.md
// legacy 标记：旧版单页直连 fetch 的实现可由你后续手动清理。

import CodeEditorPane from '@/app/(desk)/vibe/repo-guide/components/CodeEditorPane';
import DocReader from '@/app/(desk)/vibe/repo-guide/components/DocReader';
import GuideExplorer from '@/app/(desk)/vibe/repo-guide/components/GuideExplorer';
import QuadWorkbenchLayout from '@/app/(desk)/vibe/repo-guide/components/QuadWorkbenchLayout';
import RepoTree from '@/app/(desk)/vibe/repo-guide/components/RepoTree';
import { useRepoGuideWorkbench } from '@/app/(desk)/vibe/repo-guide/hooks/useRepoGuideWorkbench';
import type { RepoGuideIndexStatus } from '@/server/services/vibe/repo-guide/types';

const STATUS_COLOR_MAP: Record<RepoGuideIndexStatus['state'], string> = {
  CREATED: 'bg-stone-100 text-stone-700',
  INDEXING: 'bg-amber-100 text-amber-800',
  READY: 'bg-emerald-100 text-emerald-800',
  FAILED: 'bg-rose-100 text-rose-800',
};

export default function RepoGuideWorkbench() {
  const vm = useRepoGuideWorkbench();

  const canIndex = Boolean(vm.session?.sessionId);
  const canPoll = Boolean(vm.session?.sessionId);

  return (
    <div className="min-h-screen bg-stone-50 px-6 py-6 text-stone-900">
      <div className="mx-auto max-w-[1700px] space-y-4">
        <header className="space-y-3 rounded-md border border-stone-200 bg-white p-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">Vibe · Repo Guide Workbench</p>
            <h1 className="text-2xl font-semibold">Repo Guide 四列工作台</h1>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1.6fr,0.8fr,auto]">
            <input
              value={vm.repoUrl}
              onChange={(event) => vm.setRepoUrl(event.target.value)}
              className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
              placeholder="仓库 URL 或本地绝对路径"
            />
            <input
              value={vm.branch}
              onChange={(event) => vm.setBranch(event.target.value)}
              className="rounded-md border border-stone-200 bg-white px-3 py-2 text-sm"
              placeholder="branch（可选）"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void vm.createSession()}
                disabled={vm.isBootstrapping}
                className="rounded-md bg-stone-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {vm.isBootstrapping ? '创建中...' : '创建 Session'}
              </button>
              <button
                type="button"
                onClick={() => void vm.startIndex()}
                disabled={!canIndex || vm.isIndexing}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
              >
                {vm.isIndexing ? '索引中...' : '开始索引'}
              </button>
              <button
                type="button"
                onClick={() => void vm.pollStatus()}
                disabled={!canPoll}
                className="rounded-md border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-stone-700 disabled:opacity-60"
              >
                刷新状态
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
            <span>session: {vm.session?.sessionId || '-'}</span>
            {vm.status && (
              <>
                <span className={`rounded-full px-2 py-1 text-xs font-semibold ${STATUS_COLOR_MAP[vm.status.state]}`}>
                  {vm.status.state}
                </span>
                <span>progress: {vm.status.progress}%</span>
                <span>
                  files {vm.status.stats.totalFiles} / symbols {vm.status.stats.symbolCount}
                </span>
              </>
            )}
          </div>
        </header>

        {vm.error && (
          <div className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {vm.error}
          </div>
        )}

        <QuadWorkbenchLayout
          panelSizes={vm.panelSizes}
          explorer={
            <GuideExplorer
              vm={{
                ...vm.guideExplorer,
                onSelectDoc: (docId) => {
                  void vm.loadDoc(docId);
                },
              }}
            />
          }
          doc={<DocReader vm={vm.docReader} />}
          code={<CodeEditorPane vm={vm.codeEditor} />}
          tree={<RepoTree vm={vm.repoTree} />}
        />
      </div>
    </div>
  );
}
