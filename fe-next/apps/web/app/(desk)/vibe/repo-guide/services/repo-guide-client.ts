// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-024-repo-guide-client.md

import type {
  GuideDoc,
  GuideManifest,
  RepoGuideIndexStatus,
  RepoTreeNode,
} from '@/server/services/vibe/repo-guide/types';
import type { FileSnapshot, IndexKickoffResponse, SessionResponse } from '@/app/(desk)/vibe/repo-guide/types';

const API_BASE = '/api/vibe/repo-guide';

const withQuery = (path: string, query: Record<string, string | number | undefined>) => {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value == null || value === '') {
      continue;
    }
    params.set(key, String(value));
  }

  const queryString = params.toString();
  return `${API_BASE}${path}${queryString ? `?${queryString}` : ''}`;
};

export const requestJson = async <T>(input: RequestInfo, init?: RequestInit): Promise<T> => {
  const response = await fetch(input, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json().catch(() => ({}))) as { error?: string } & T;

  if (!response.ok) {
    throw new Error(body.error || `请求失败: ${response.status}`);
  }

  return body as T;
};

export const repoGuideClient = {
  createSession(payload: { repoUrl: string; branch?: string }) {
    return requestJson<SessionResponse>(`${API_BASE}/session`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  startIndex(payload: { sessionId: string; force?: boolean }) {
    return requestJson<IndexKickoffResponse>(`${API_BASE}/index`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getStatus(sessionId: string) {
    return requestJson<RepoGuideIndexStatus>(withQuery('/status', { sessionId }));
  },

  getGuideManifest(sessionId: string) {
    return requestJson<GuideManifest>(withQuery('/guide/manifest', { sessionId }));
  },

  getGuideDoc(input: { sessionId: string; docId: string }) {
    return requestJson<GuideDoc>(
      withQuery('/guide/doc', {
        sessionId: input.sessionId,
        docId: input.docId,
      }),
    );
  },

  getRepoTree(input: { sessionId: string; path?: string }) {
    return requestJson<RepoTreeNode[]>(
      withQuery('/repo/tree', {
        sessionId: input.sessionId,
        path: input.path,
      }),
    );
  },

  getRepoFile(input: { sessionId: string; path: string; startLine?: number; endLine?: number }) {
    return requestJson<FileSnapshot>(
      withQuery('/repo/file', {
        sessionId: input.sessionId,
        path: input.path,
        startLine: input.startLine,
        endLine: input.endLine,
      }),
    );
  },
};
