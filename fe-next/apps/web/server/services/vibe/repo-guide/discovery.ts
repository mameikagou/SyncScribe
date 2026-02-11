import { createHash } from 'node:crypto';

import { listDirectoryContent } from '@/server/services/vibe/repo-guide/github';
import { requireRepoContextBySession, requireRepoGuideSession } from '@/server/services/vibe/repo-guide/session';
import type { RepoManifest, RepoManifestEntry } from '@/server/services/vibe/repo-guide/types';

type BuildManifestOptions = {
  maxDepth?: number;
  maxFiles?: number;
  maxFileSizeBytes?: number;
};

const INDEXABLE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.py',
  '.go',
  '.java',
  '.rs',
  '.json',
  '.yaml',
  '.yml',
  '.toml',
  '.md',
  '.sql',
  '.sh',
  '.prisma',
]);

const DEFAULT_OPTIONS: Required<BuildManifestOptions> = {
  maxDepth: 6,
  maxFiles: 1800,
  maxFileSizeBytes: 320 * 1024,
};

const extensionOf = (filePath: string) => {
  const index = filePath.lastIndexOf('.');
  if (index < 0) return '';
  return filePath.slice(index).toLowerCase();
};

const inferLanguage = (filePath: string) => {
  const ext = extensionOf(filePath);
  const map: Record<string, string> = {
    '.ts': 'ts',
    '.tsx': 'tsx',
    '.js': 'js',
    '.jsx': 'jsx',
    '.py': 'python',
    '.go': 'go',
    '.java': 'java',
    '.rs': 'rust',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.md': 'markdown',
    '.sql': 'sql',
    '.sh': 'bash',
    '.prisma': 'prisma',
  };

  return map[ext] ?? 'text';
};

const toHash = (value: string) => createHash('sha1').update(value).digest('hex').slice(0, 16);

const toManifestEntry = (
  path: string,
  size: number,
  maxFileSizeBytes: number,
): RepoManifestEntry => {
  const ext = extensionOf(path);
  const language = inferLanguage(path);
  const indexable = INDEXABLE_EXTENSIONS.has(ext) && size <= maxFileSizeBytes;

  return {
    path,
    language,
    size,
    hash: toHash(`${path}:${size}:${language}`),
    indexable,
  };
};

export const buildRepoManifest = async (
  sessionId: string,
  options?: BuildManifestOptions,
): Promise<RepoManifest> => {
  const session = requireRepoGuideSession(sessionId);
  const repo = requireRepoContextBySession(sessionId);

  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const queue: Array<{ path: string; depth: number }> = [{ path: '', depth: 0 }];
  const entries: RepoManifestEntry[] = [];

  let totalDirectories = 0;
  let totalFiles = 0;
  let truncated = false;

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    totalDirectories += 1;

    const children = await listDirectoryContent(repo, current.path);

    for (const item of children) {
      if (item.type === 'dir') {
        if (current.depth < config.maxDepth) {
          queue.push({ path: item.path, depth: current.depth + 1 });
        }
        continue;
      }

      totalFiles += 1;
      entries.push(toManifestEntry(item.path, item.size ?? 0, config.maxFileSizeBytes));

      if (entries.length >= config.maxFiles) {
        truncated = true;
        queue.length = 0;
        break;
      }
    }
  }

  return {
    repoKey: session.repoKey,
    generatedAt: new Date().toISOString(),
    totalDirectories,
    totalFiles,
    truncated,
    entries,
  };
};
