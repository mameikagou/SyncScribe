import { runRepoGuideAgentLoop } from '@/server/services/vibe/repo-guide/agent-loop';
import { buildRepoManifest } from '@/server/services/vibe/repo-guide/discovery';
import {
  buildIndexStats,
  ensureRepoGuideIndexStatus,
  getManifestByRepoKey,
  getRepoGuideIndexStatus,
  getSkeletonByRepoKey,
  markRepoGuideIndexFailed,
  markRepoGuideIndexReady,
  markRepoGuideIndexing,
  patchRepoGuideIndexStatus,
  setManifestByRepoKey,
  setSkeletonByRepoKey,
} from '@/server/services/vibe/repo-guide/index-store';
import { clearSessionMemory } from '@/server/services/vibe/repo-guide/memory';
import {
  createRepoGuideSession,
  requireRepoGuideSession,
  setRepoGuideSessionState,
} from '@/server/services/vibe/repo-guide/session';
import { buildSkeletonIndex } from '@/server/services/vibe/repo-guide/skeleton-indexer';
import type {
  RepoGuideAnswer,
  RepoGuideIndexStatus,
  RepoGuideSession,
} from '@/server/services/vibe/repo-guide/types';

const runningIndexJobs = new Map<string, Promise<void>>();

const runIndexPipeline = async (sessionId: string, force = false) => {
  const session = requireRepoGuideSession(sessionId);

  markRepoGuideIndexing(sessionId, session.repoKey);
  setRepoGuideSessionState(sessionId, 'INDEXING');

  try {
    let manifest = getManifestByRepoKey(session.repoKey);
    let skeleton = getSkeletonByRepoKey(session.repoKey);

    if (force || !manifest) {
      manifest = await buildRepoManifest(sessionId);
      setManifestByRepoKey(session.repoKey, manifest);
      patchRepoGuideIndexStatus(sessionId, {
        progress: 45,
        stats: buildIndexStats(manifest, skeleton),
      });
    }

    if (force || !skeleton) {
      skeleton = await buildSkeletonIndex(sessionId, manifest);
      setSkeletonByRepoKey(session.repoKey, skeleton);
      patchRepoGuideIndexStatus(sessionId, {
        progress: 85,
        stats: buildIndexStats(manifest, skeleton),
      });
    }

    markRepoGuideIndexReady(sessionId, session.repoKey, buildIndexStats(manifest, skeleton));
    setRepoGuideSessionState(sessionId, 'READY');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    markRepoGuideIndexFailed(sessionId, session.repoKey, message);
    setRepoGuideSessionState(sessionId, 'FAILED', message);
    throw error;
  }
};

export const createRepoGuideSessionOrchestration = async (input: {
  repoUrl: string;
  branch?: string;
}): Promise<RepoGuideSession> => {
  const session = await createRepoGuideSession(input.repoUrl, input.branch);
  clearSessionMemory(session.sessionId);
  ensureRepoGuideIndexStatus(session.sessionId, session.repoKey);
  return session;
};

export const startRepoGuideIndexing = async (input: {
  sessionId: string;
  force?: boolean;
}) => {
  const { sessionId, force = false } = input;
  const session = requireRepoGuideSession(sessionId);

  const currentStatus = ensureRepoGuideIndexStatus(sessionId, session.repoKey);

  if (runningIndexJobs.has(sessionId)) {
    return {
      accepted: true,
      running: true,
      status: currentStatus,
    };
  }

  const job = runIndexPipeline(sessionId, force).finally(() => {
    runningIndexJobs.delete(sessionId);
  });

  runningIndexJobs.set(sessionId, job);

  return {
    accepted: true,
    running: true,
    status: currentStatus,
  };
};

export const getRepoGuideStatus = (sessionId: string): RepoGuideIndexStatus => {
  const session = requireRepoGuideSession(sessionId);
  return getRepoGuideIndexStatus(sessionId) ?? ensureRepoGuideIndexStatus(sessionId, session.repoKey);
};

export const askRepoGuideQuestion = async (input: {
  sessionId: string;
  question: string;
  maxSteps?: number;
}): Promise<RepoGuideAnswer> => {
  const session = requireRepoGuideSession(input.sessionId);
  if (session.state !== 'READY') {
    throw new Error('索引尚未就绪，请先构建索引');
  }

  return runRepoGuideAgentLoop({
    sessionId: input.sessionId,
    question: input.question,
    maxSteps: input.maxSteps,
  });
};
