// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-013-orchestrator.md

import { runRepoGuideAgentLoop } from '@/server/services/vibe/repo-guide/agent-loop';
import { buildRepoManifest } from '@/server/services/vibe/repo-guide/discovery';
import { listDirectoryContent, readRepositoryFile } from '@/server/services/vibe/repo-guide/github';
import { buildGuideManifest } from '@/server/services/vibe/repo-guide/guide-manifest';
import { buildGuideMarkdown } from '@/server/services/vibe/repo-guide/guide-markdown';
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
  requireRepoContextBySession,
  requireRepoGuideSession,
  setRepoGuideSessionState,
} from '@/server/services/vibe/repo-guide/session';
import { buildSkeletonIndex } from '@/server/services/vibe/repo-guide/skeleton-indexer';
import type {
  GuideDoc,
  GuideManifest,
  ImplementationSnapshot,
  RepoGuideAnswer,
  RepoGuideIndexStatus,
  RepoGuideSession,
  RepoTreeNode,
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

const toRepoTreeNode = (entry: {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
}): RepoTreeNode => {
  return {
    name: entry.name,
    path: entry.path,
    type: entry.type,
    size: entry.size,
    children: entry.type === 'dir' ? [] : undefined,
    isExpanded: false,
  };
};

const ensureSessionReadyForGuide = (sessionId: string) => {
  const session = requireRepoGuideSession(sessionId);
  const status = getRepoGuideIndexStatus(sessionId);

  if (session.state !== 'READY' || status?.state !== 'READY') {
    throw new Error('索引尚未完成，暂时无法生成导游内容');
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
}): Promise<{ accepted: true; running: true; status: RepoGuideIndexStatus }> => {
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

export const getGuideManifestOrchestration = async (sessionId: string): Promise<GuideManifest> => {
  ensureSessionReadyForGuide(sessionId);
  return buildGuideManifest(sessionId);
};

export const getGuideDocOrchestration = async (input: {
  sessionId: string;
  docId: string;
}): Promise<GuideDoc> => {
  ensureSessionReadyForGuide(input.sessionId);

  const manifest = await buildGuideManifest(input.sessionId);
  const exists = manifest.categories.some((category) =>
    category.docs.some((doc) => doc.id === input.docId),
  );

  if (!exists) {
    throw new Error(`文档标识不存在: ${input.docId}`);
  }

  return buildGuideMarkdown(input);
};

export const getRepoTreeOrchestration = async (input: {
  sessionId: string;
  path?: string;
}): Promise<RepoTreeNode[]> => {
  requireRepoGuideSession(input.sessionId);
  const repo = requireRepoContextBySession(input.sessionId);
  const entries = await listDirectoryContent(repo, input.path);
  return entries.map(toRepoTreeNode);
};

export const getRepoFileOrchestration = async (input: {
  sessionId: string;
  path: string;
  startLine?: number;
  endLine?: number;
}): Promise<ImplementationSnapshot> => {
  requireRepoGuideSession(input.sessionId);
  const repo = requireRepoContextBySession(input.sessionId);

  const snapshot = await readRepositoryFile(repo, input.path, {
    startLine: input.startLine,
    endLine: input.endLine,
  });

  return {
    path: snapshot.path,
    language: snapshot.language,
    content: snapshot.content,
    startLine: snapshot.startLine,
    endLine: snapshot.endLine,
    blobUrl: snapshot.blobUrl,
  };
};

// legacy 标记：保留旧 ask 能力，便于兼容既有 demo。
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
