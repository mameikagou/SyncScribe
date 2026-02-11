import { readRepositoryFile } from '@/server/services/vibe/repo-guide/github';
import { getSkeletonByRepoKey } from '@/server/services/vibe/repo-guide/index-store';
import { requireRepoContextBySession, requireRepoGuideSession } from '@/server/services/vibe/repo-guide/session';
import type { ImplementationSnapshot } from '@/server/services/vibe/repo-guide/types';

type ReadImplementationInput = {
  sessionId: string;
  path: string;
  symbolName?: string;
  startLine?: number;
  endLine?: number;
  windowSize?: number;
  maxChars?: number;
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const DEFAULT_WINDOW = 140;

const findSymbolLine = (sessionId: string, path: string, symbolName?: string) => {
  if (!symbolName) return undefined;

  const session = requireRepoGuideSession(sessionId);
  const skeleton = getSkeletonByRepoKey(session.repoKey);
  if (!skeleton) return undefined;

  const targetPath = path.trim();
  const targetName = symbolName.trim().toLowerCase();

  const file = skeleton.files.find((item) => item.path === targetPath);
  if (!file) return undefined;

  return file.symbols.find((symbol) => symbol.name.toLowerCase() === targetName)?.line;
};

export const readImplementationSnapshot = async (
  input: ReadImplementationInput,
): Promise<ImplementationSnapshot> => {
  const repo = requireRepoContextBySession(input.sessionId);

  const lineBySymbol = findSymbolLine(input.sessionId, input.path, input.symbolName);
  const windowSize = clamp(input.windowSize ?? DEFAULT_WINDOW, 50, 260);

  let startLine = input.startLine;
  let endLine = input.endLine;

  if (!startLine && lineBySymbol) {
    startLine = Math.max(1, lineBySymbol - 24);
  }

  if (!startLine) {
    startLine = 1;
  }

  if (!endLine) {
    endLine = startLine + windowSize - 1;
  }

  const snapshot = await readRepositoryFile(repo, input.path, {
    startLine,
    endLine,
    maxChars: input.maxChars ?? 26000,
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
