import type {
  RepoGuideIndexStatus,
  RepoGuideIndexStats,
  RepoManifest,
  SkeletonIndex,
} from '@/server/services/vibe/repo-guide/types';

const manifestStore = new Map<string, RepoManifest>();
const skeletonStore = new Map<string, SkeletonIndex>();
const statusStore = new Map<string, RepoGuideIndexStatus>();

const nowIso = () => new Date().toISOString();

const emptyStats = (): RepoGuideIndexStats => ({
  totalFiles: 0,
  indexableFiles: 0,
  skeletonFiles: 0,
  symbolCount: 0,
});

export const getManifestByRepoKey = (repoKey: string) => manifestStore.get(repoKey);

export const setManifestByRepoKey = (repoKey: string, manifest: RepoManifest) => {
  manifestStore.set(repoKey, manifest);
};

export const getSkeletonByRepoKey = (repoKey: string) => skeletonStore.get(repoKey);

export const setSkeletonByRepoKey = (repoKey: string, skeleton: SkeletonIndex) => {
  skeletonStore.set(repoKey, skeleton);
};

export const getRepoGuideIndexStatus = (sessionId: string) => statusStore.get(sessionId);

export const ensureRepoGuideIndexStatus = (sessionId: string, repoKey: string) => {
  const existing = statusStore.get(sessionId);
  if (existing) return existing;

  const created: RepoGuideIndexStatus = {
    sessionId,
    repoKey,
    state: 'CREATED',
    progress: 0,
    stats: emptyStats(),
    updatedAt: nowIso(),
  };

  statusStore.set(sessionId, created);
  return created;
};

export const patchRepoGuideIndexStatus = (
  sessionId: string,
  patch: Partial<Omit<RepoGuideIndexStatus, 'sessionId'>>,
) => {
  const current = statusStore.get(sessionId);
  if (!current) {
    throw new Error(`Index status 不存在: ${sessionId}`);
  }

  const merged: RepoGuideIndexStatus = {
    ...current,
    ...patch,
    progress: patch.progress == null ? current.progress : Math.max(0, Math.min(100, patch.progress)),
    stats: patch.stats ?? current.stats,
    updatedAt: nowIso(),
  };

  statusStore.set(sessionId, merged);
  return merged;
};

export const markRepoGuideIndexing = (sessionId: string, repoKey: string) => {
  ensureRepoGuideIndexStatus(sessionId, repoKey);
  return patchRepoGuideIndexStatus(sessionId, {
    repoKey,
    state: 'INDEXING',
    progress: 5,
    error: undefined,
  });
};

export const markRepoGuideIndexReady = (
  sessionId: string,
  repoKey: string,
  stats: RepoGuideIndexStats,
) => {
  ensureRepoGuideIndexStatus(sessionId, repoKey);
  return patchRepoGuideIndexStatus(sessionId, {
    repoKey,
    state: 'READY',
    progress: 100,
    stats,
    error: undefined,
  });
};

export const markRepoGuideIndexFailed = (sessionId: string, repoKey: string, error: string) => {
  ensureRepoGuideIndexStatus(sessionId, repoKey);
  return patchRepoGuideIndexStatus(sessionId, {
    repoKey,
    state: 'FAILED',
    error,
  });
};

export const buildIndexStats = (manifest?: RepoManifest, skeleton?: SkeletonIndex): RepoGuideIndexStats => {
  const totalFiles = manifest?.totalFiles ?? 0;
  const indexableFiles = manifest?.entries.filter((entry) => entry.indexable).length ?? 0;
  const skeletonFiles = skeleton?.files.length ?? 0;
  const symbolCount = skeleton?.files.reduce((acc, file) => acc + file.symbols.length, 0) ?? 0;

  return {
    totalFiles,
    indexableFiles,
    skeletonFiles,
    symbolCount,
  };
};
