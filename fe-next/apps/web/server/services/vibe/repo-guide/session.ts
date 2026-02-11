import { randomUUID } from 'node:crypto';

import type { RepoContext } from '@/server/services/vibe/repo-guide/github';
import { resolveRepoContext } from '@/server/services/vibe/repo-guide/github';
import type { IndexState, RepoGuideSession } from '@/server/services/vibe/repo-guide/types';

const sessionStore = new Map<string, RepoGuideSession>();
const repoContextStore = new Map<string, RepoContext>();

const nowIso = () => new Date().toISOString();

const toRepoKey = (repo: RepoContext) => {
  if (repo.source === 'local') {
    const localRoot = repo.localRoot ?? `${repo.owner}/${repo.repo}`;
    return `local:${localRoot}@${repo.branch}`;
  }

  return `${repo.owner}/${repo.repo}@${repo.branch}`;
};

export const createRepoGuideSession = async (repoUrl: string, branch?: string) => {
  const trimmedUrl = repoUrl.trim();
  if (!trimmedUrl) {
    throw new Error('repoUrl 不能为空');
  }

  const repoContext = await resolveRepoContext(trimmedUrl, branch);
  const sessionId = randomUUID();
  const createdAt = nowIso();

  const session: RepoGuideSession = {
    sessionId,
    repoUrl: trimmedUrl,
    branch: repoContext.branch,
    repoKey: toRepoKey(repoContext),
    state: 'CREATED',
    createdAt,
    updatedAt: createdAt,
  };

  sessionStore.set(sessionId, session);
  repoContextStore.set(sessionId, repoContext);

  return session;
};

export const getRepoGuideSession = (sessionId: string) => sessionStore.get(sessionId);

export const getRepoContextBySession = (sessionId: string) => repoContextStore.get(sessionId);

export const requireRepoGuideSession = (sessionId: string) => {
  const session = getRepoGuideSession(sessionId);
  if (!session) {
    throw new Error(`Session 不存在: ${sessionId}`);
  }
  return session;
};

export const requireRepoContextBySession = (sessionId: string) => {
  const context = getRepoContextBySession(sessionId);
  if (!context) {
    throw new Error(`Session 缺少仓库上下文: ${sessionId}`);
  }
  return context;
};

export const patchRepoGuideSession = (
  sessionId: string,
  patch: Partial<Pick<RepoGuideSession, 'state' | 'error' | 'branch' | 'repoKey'>>,
) => {
  const session = requireRepoGuideSession(sessionId);
  const nextState = patch.state ?? session.state;

  const updated: RepoGuideSession = {
    ...session,
    ...patch,
    state: nextState,
    updatedAt: nowIso(),
  };

  sessionStore.set(sessionId, updated);
  return updated;
};

export const setRepoGuideSessionState = (
  sessionId: string,
  state: IndexState,
  error?: string,
) => {
  return patchRepoGuideSession(sessionId, {
    state,
    error,
  });
};

export const listRepoGuideSessions = () => [...sessionStore.values()];
