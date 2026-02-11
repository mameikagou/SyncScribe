'use client';

import { useEffect, useRef } from 'react';
import RepoGuideWorkbench from './RepoGuideWorkbench';

type RepoGuideMockScenario = 'happy' | 'failed';

type RepoGuideWorkbenchMockProps = {
  scenario?: RepoGuideMockScenario;
};

type MockIndexStatus = {
  sessionId: string;
  repoKey: string;
  state: 'CREATED' | 'INDEXING' | 'READY' | 'FAILED';
  progress: number;
  stats: {
    totalFiles: number;
    indexableFiles: number;
    skeletonFiles: number;
    symbolCount: number;
  };
  updatedAt: string;
  error?: string;
};

const sessionId = 'story-repo-guide-session';
const repoKey = 'HKUDS/nanobot@mock-sha';

const baseStats = {
  totalFiles: 420,
  indexableFiles: 198,
  skeletonFiles: 162,
  symbolCount: 1387,
};

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

function createMockFetch(
  scenario: RepoGuideMockScenario,
): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  let statusPollCount = 0;

  return async (input, init) => {
    const url = getRequestUrl(input);
    const method = (init?.method ?? 'GET').toUpperCase();
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
      const status: MockIndexStatus = {
        sessionId,
        repoKey,
        state: scenario === 'failed' ? 'FAILED' : 'INDEXING',
        progress: scenario === 'failed' ? 100 : 42,
        stats: baseStats,
        updatedAt: now,
        error: scenario === 'failed' ? 'Mock: 索引任务失败（演示）' : undefined,
      };

      return toJsonResponse({ accepted: true, status });
    }

    if (url.includes('/api/vibe/repo-guide/status') && method === 'GET') {
      statusPollCount += 1;

      const status: MockIndexStatus = {
        sessionId,
        repoKey,
        state: 'INDEXING',
        progress: 72,
        stats: baseStats,
        updatedAt: now,
      };

      if (scenario === 'failed') {
        status.state = 'FAILED';
        status.progress = 100;
        status.error = 'Mock: skeleton 构建失败，检查日志';
      } else if (statusPollCount > 1) {
        status.state = 'READY';
        status.progress = 100;
      }

      return toJsonResponse(status);
    }

    if (url.includes('/api/vibe/repo-guide/ask') && method === 'POST') {
      if (scenario === 'failed') {
        return toJsonResponse({ error: '索引失败，无法提问。' }, 400);
      }

      return toJsonResponse({
        answer: [
          '直觉：这个项目把鉴权拆成 API 入口校验 + 中间件会话校验 + 服务层权限判断三段。',
          '',
          '心智模型：先在路由层做“能不能进来”，再在 service 层做“能不能做这件事”。',
          '',
          '链路：route.ts -> auth middleware -> auth service -> token validator。',
        ].join('\n'),
        phase: 'ANSWER',
        stepsUsed: 4,
        evidence: [
          {
            kind: 'interface',
            path: 'apps/web/server/routers/auth.ts',
            startLine: 12,
            endLine: 66,
            blobUrl: 'https://github.com/HKUDS/nanobot/blob/main/apps/web/server/routers/auth.ts#L12-L66',
            snippet: 'export const authRouter = ...',
          },
          {
            kind: 'implementation',
            path: 'apps/web/server/services/auth/validator.ts',
            startLine: 20,
            endLine: 97,
            blobUrl: 'https://github.com/HKUDS/nanobot/blob/main/apps/web/server/services/auth/validator.ts#L20-L97',
            snippet: 'function verifyToken(...)',
          },
        ],
        toolTrace: [
          {
            step: 1,
            phase: 'LOCATE',
            tool: 'searchSkeleton',
            input: { query: 'auth token middleware', limit: 5 },
            observation: '命中 auth router / validator / middleware 三个文件',
          },
          {
            step: 2,
            phase: 'OVERVIEW',
            tool: 'readInterface',
            input: { path: 'apps/web/server/routers/auth.ts' },
            observation: '确认路由层先做 token presence 校验',
          },
          {
            step: 3,
            phase: 'DIG',
            tool: 'readImplementation',
            input: { path: 'apps/web/server/services/auth/validator.ts', startLine: 20, endLine: 97 },
            observation: '核心逻辑在 verifyToken，包含过期检查和签名校验',
          },
        ],
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
