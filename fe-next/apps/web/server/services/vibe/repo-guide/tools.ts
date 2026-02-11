import { getSkeletonByRepoKey } from '@/server/services/vibe/repo-guide/index-store';
import { readImplementationSnapshot } from '@/server/services/vibe/repo-guide/implementation-reader';
import { readInterfaceSnapshot } from '@/server/services/vibe/repo-guide/interface-reader';
import { appendEvidence, rememberKeyFact, rememberVisitedFile } from '@/server/services/vibe/repo-guide/memory';
import { requireRepoGuideSession } from '@/server/services/vibe/repo-guide/session';
import type {
  ImplementationSnapshot,
  InterfaceSnapshot,
  SearchSkeletonHit,
} from '@/server/services/vibe/repo-guide/types';

type ReadImplementationToolInput = {
  sessionId: string;
  path: string;
  symbolName?: string;
  startLine?: number;
  endLine?: number;
};

const tokenize = (value: string) =>
  value
    .toLowerCase()
    .split(/[^a-z0-9_一-龥]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

const scoreFileHit = (path: string, symbols: string[], tokens: string[]) => {
  const lowerPath = path.toLowerCase();
  let score = 0;
  const matchedSymbols: string[] = [];

  for (const token of tokens) {
    if (lowerPath.includes(token)) {
      score += 120;
    }

    for (const symbol of symbols) {
      const lowerSymbol = symbol.toLowerCase();
      if (lowerSymbol.includes(token)) {
        score += lowerSymbol.startsWith(token) ? 90 : 70;
        if (!matchedSymbols.includes(symbol)) {
          matchedSymbols.push(symbol);
        }
      }
    }
  }

  score -= Math.max(0, lowerPath.split('/').length - 3) * 8;

  return {
    score,
    matchedSymbols,
  };
};

export const searchSkeleton = (
  sessionId: string,
  query: string,
  limit = 8,
): SearchSkeletonHit[] => {
  const session = requireRepoGuideSession(sessionId);
  const skeleton = getSkeletonByRepoKey(session.repoKey);

  if (!skeleton) {
    throw new Error('Skeleton 索引不存在，请先执行 /index');
  }

  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const hits: SearchSkeletonHit[] = skeleton.files
    .map((file) => {
      const symbols = file.symbols.map((symbol) => symbol.name);
      const { score, matchedSymbols } = scoreFileHit(file.path, symbols, tokens);

      return {
        path: file.path,
        score,
        matchedSymbols,
      };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));

  if (hits.length > 0) {
    rememberKeyFact(sessionId, `search(${query}) 命中 ${hits[0]!.path}`);
  }

  return hits;
};

export const readInterface = async (
  sessionId: string,
  path: string,
): Promise<InterfaceSnapshot> => {
  const snapshot = await readInterfaceSnapshot(sessionId, path);

  rememberVisitedFile(sessionId, snapshot.path);
  appendEvidence(sessionId, {
    kind: 'interface',
    path: snapshot.path,
    startLine: snapshot.startLine,
    endLine: snapshot.endLine,
    blobUrl: snapshot.blobUrl,
    snippet: snapshot.content.slice(0, 1200),
  });

  return snapshot;
};

export const readImplementation = async (
  input: ReadImplementationToolInput,
): Promise<ImplementationSnapshot> => {
  const snapshot = await readImplementationSnapshot(input);

  rememberVisitedFile(input.sessionId, snapshot.path);
  appendEvidence(input.sessionId, {
    kind: 'implementation',
    path: snapshot.path,
    startLine: snapshot.startLine,
    endLine: snapshot.endLine,
    blobUrl: snapshot.blobUrl,
    snippet: snapshot.content.slice(0, 1600),
  });

  return snapshot;
};
