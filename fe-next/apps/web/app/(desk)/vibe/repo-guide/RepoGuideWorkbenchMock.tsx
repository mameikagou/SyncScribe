'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-018-workbench-mock.md

import { useEffect, useRef } from 'react';
import RepoGuideWorkbench from './RepoGuideWorkbench';

type RepoGuideMockScenario = 'happy' | 'failed';

type RepoGuideWorkbenchMockProps = {
  scenario?: RepoGuideMockScenario;
};

const sessionId = 'mock-session-repo-guide';
const repoKey = 'HKUDS/nanobot@mock-main';
const docId = 'doc:server%2Fservices%2Frepo-guide%2Forchestrator.ts';

function toJsonResponse(payload: unknown, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => payload,
  } as Response;
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.toString();
  return input.url;
}

const repoTreeByPath: Record<string, Array<{ name: string; path: string; type: 'file' | 'dir'; size: number }>> = {
  '': [
    { name: 'server', path: 'server', type: 'dir', size: 0 },
    { name: 'app', path: 'app', type: 'dir', size: 0 },
    { name: 'README.md', path: 'README.md', type: 'file', size: 980 },
  ],
  server: [
    { name: 'services', path: 'server/services', type: 'dir', size: 0 },
    { name: 'routers', path: 'server/routers', type: 'dir', size: 0 },
  ],
  'server/services': [
    { name: 'repo-guide', path: 'server/services/repo-guide', type: 'dir', size: 0 },
  ],
  'server/services/repo-guide': [
    {
      name: 'orchestrator.ts',
      path: 'server/services/repo-guide/orchestrator.ts',
      type: 'file',
      size: 3221,
    },
  ],
};

function createMockFetch(
  scenario: RepoGuideMockScenario,
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  let statusPollCount = 0;

  return async (input, init) => {
    const url = getRequestUrl(input);
    const method = (init?.method ?? 'GET').toUpperCase();
    const query = new URL(url, 'http://localhost').searchParams;
    const now = new Date().toISOString();

    if (url.includes('/api/vibe/repo-guide/session') && method === 'POST') {
      return toJsonResponse({
        sessionId,
        repoKey,
        state: 'CREATED',
        branch: 'main',
      });
    }

    if (url.includes('/api/vibe/repo-guide/index') && method === 'POST') {
      return toJsonResponse({
        accepted: true,
        running: true,
        status: {
          sessionId,
          repoKey,
          state: scenario === 'failed' ? 'FAILED' : 'INDEXING',
          progress: scenario === 'failed' ? 100 : 35,
          stats: {
            totalFiles: 280,
            indexableFiles: 180,
            skeletonFiles: 96,
            symbolCount: 1200,
          },
          updatedAt: now,
          error: scenario === 'failed' ? 'Mock: 索引任务失败' : undefined,
        },
      });
    }

    if (url.includes('/api/vibe/repo-guide/status') && method === 'GET') {
      statusPollCount += 1;

      const state =
        scenario === 'failed' ? 'FAILED' : statusPollCount >= 2 ? 'READY' : 'INDEXING';

      return toJsonResponse({
        sessionId,
        repoKey,
        state,
        progress: state === 'READY' || state === 'FAILED' ? 100 : 78,
        stats: {
          totalFiles: 280,
          indexableFiles: 180,
          skeletonFiles: 96,
          symbolCount: 1200,
        },
        updatedAt: now,
        error: state === 'FAILED' ? 'Mock: 索引失败，无法生成导游文档' : undefined,
      });
    }

    if (url.includes('/api/vibe/repo-guide/guide/manifest') && method === 'GET') {
      if (scenario === 'failed') {
        return toJsonResponse({ error: 'Mock: 索引失败，manifest 不可用' }, 400);
      }

      return toJsonResponse({
        categories: [
          {
            id: 'service-core',
            title: '业务服务',
            docs: [
              {
                id: docId,
                title: 'orchestrator.ts 实现解读',
                summary: '梳理 session/index/doc/tree/file 的核心编排流程。',
              },
            ],
          },
        ],
      });
    }

    if (url.includes('/api/vibe/repo-guide/guide/doc') && method === 'GET') {
      if (scenario === 'failed') {
        return toJsonResponse({ error: 'Mock: 文档生成失败' }, 400);
      }

      return toJsonResponse({
        id: query.get('docId') || docId,
        title: 'orchestrator.ts 实现解读',
        markdown: [
          '# orchestrator.ts 实现解读',
          '',
          '## 直觉',
          '这个模块把 session、索引、导游文档、仓库读取统一编排。',
          '',
          '## 源码链路',
          '- [打开索引入口](guide://open?file=server/services/repo-guide/orchestrator.ts&startLine=20&endLine=120)',
          '- [聚焦 startRepoGuideIndexing](guide://focus?file=server/services/repo-guide/orchestrator.ts&symbol=startRepoGuideIndexing)',
          '- [定位目录](guide://tree?path=server/services/repo-guide)',
        ].join('\n'),
        anchors: [
          {
            label: '打开索引入口',
            path: 'server/services/repo-guide/orchestrator.ts',
            startLine: 20,
            endLine: 120,
          },
        ],
      });
    }

    if (url.includes('/api/vibe/repo-guide/repo/tree') && method === 'GET') {
      if (scenario === 'failed') {
        return toJsonResponse({ error: 'Mock: 文件树读取失败' }, 400);
      }

      const treePath = (query.get('path') || '').replace(/^\/+/, '');
      return toJsonResponse(repoTreeByPath[treePath] || []);
    }

    if (url.includes('/api/vibe/repo-guide/repo/file') && method === 'GET') {
      if (scenario === 'failed') {
        return toJsonResponse({ error: 'Mock: 文件读取失败' }, 400);
      }

      const filePath = query.get('path') || 'server/services/repo-guide/orchestrator.ts';
      return toJsonResponse({
        path: filePath,
        language: 'ts',
        content: [
          "export const startRepoGuideIndexing = async (input) => {",
          '  const status = ensureRepoGuideIndexStatus(input.sessionId, session.repoKey);',
          '  if (runningIndexJobs.has(input.sessionId)) return { accepted: true, running: true, status };',
          '  // ...',
          '};',
        ].join('\n'),
        startLine: 1,
        endLine: 40,
        blobUrl: 'https://github.com/example/repo/blob/main/server/services/repo-guide/orchestrator.ts#L1-L40',
      });
    }

    // legacy 标记：旧 ask 接口 mock，待你后续清理。
    if (url.includes('/api/vibe/repo-guide/ask') && method === 'POST') {
      return toJsonResponse({
        answer: 'Mock answer',
        phase: 'ANSWER',
        stepsUsed: 3,
        evidence: [],
        toolTrace: [],
      });
    }

    return toJsonResponse({ error: `Mock route not found: ${method} ${url}` }, 404);
  };
}

export default function RepoGuideWorkbenchMock({ scenario = 'happy' }: RepoGuideWorkbenchMockProps) {
  const originalFetchRef = useRef<typeof globalThis.fetch | null>(null);

  useEffect(() => {
    if (!originalFetchRef.current) {
      originalFetchRef.current = globalThis.fetch.bind(globalThis);
    }

    const originalFetch = originalFetchRef.current;
    const mockFetch = createMockFetch(scenario) as unknown as typeof globalThis.fetch;
    globalThis.fetch = mockFetch;

    return () => {
      globalThis.fetch = originalFetch;
    };
  }, [scenario]);

  return <RepoGuideWorkbench />;
}
