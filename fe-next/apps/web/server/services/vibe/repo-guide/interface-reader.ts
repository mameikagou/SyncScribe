import { readRepositoryFile } from '@/server/services/vibe/repo-guide/github';
import { requireRepoContextBySession } from '@/server/services/vibe/repo-guide/session';
import type { InterfaceSnapshot } from '@/server/services/vibe/repo-guide/types';

type ReadInterfaceOptions = {
  maxLines?: number;
  maxChars?: number;
};

const DEFAULT_OPTIONS: Required<ReadInterfaceOptions> = {
  maxLines: 420,
  maxChars: 32000,
};

const isImportLine = (line: string) => {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('import ') ||
    (/^export\s+.*from\s+['"].+['"];?$/.test(trimmed) && !trimmed.startsWith('export class'))
  );
};

const isCommentLine = (line: string) => {
  const trimmed = line.trim();
  return (
    trimmed.startsWith('//') ||
    trimmed.startsWith('/*') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('*/')
  );
};

const isDeclarationLine = (line: string) => {
  const trimmed = line.trim();
  return (
    /^(?:export\s+)?(?:abstract\s+)?class\s+/.test(trimmed) ||
    /^(?:export\s+)?interface\s+/.test(trimmed) ||
    /^(?:export\s+)?type\s+/.test(trimmed) ||
    /^(?:export\s+)?(?:async\s+)?function\s+/.test(trimmed) ||
    /^(?:export\s+)?const\s+/.test(trimmed) ||
    /^(?:public|private|protected|static|readonly|async|\s)*[A-Za-z_$][\w$]*\s*\([^)]*\)\s*(?::\s*[^={]+)?\s*[;{]/.test(
      trimmed,
    )
  );
};

const foldLine = (line: string) => {
  const trimmed = line.trim();
  if (!trimmed.endsWith('{')) {
    return line;
  }

  const shouldFold =
    !trimmed.includes('class ') &&
    !trimmed.startsWith('interface ') &&
    !trimmed.startsWith('type ') &&
    !trimmed.startsWith('if ') &&
    !trimmed.startsWith('for ') &&
    !trimmed.startsWith('while ') &&
    !trimmed.startsWith('switch ') &&
    !trimmed.startsWith('catch ') &&
    !trimmed.startsWith('try ');

  if (!shouldFold) {
    return line;
  }

  return `${line.replace(/\{\s*$/, '{')} // ... implementation hidden`;
};

const buildInterfaceView = (source: string) => {
  const lines = source.split(/\r?\n/);
  const keepIndices = new Set<number>();

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    if (isImportLine(line)) {
      keepIndices.add(index);
      continue;
    }

    if (isDeclarationLine(line)) {
      keepIndices.add(index);

      for (let lookback = index - 1; lookback >= 0 && lookback >= index - 3; lookback -= 1) {
        const candidate = lines[lookback] ?? '';
        if (isCommentLine(candidate)) {
          keepIndices.add(lookback);
        } else if (candidate.trim() !== '') {
          break;
        }
      }
    }
  }

  const sorted = [...keepIndices].sort((a, b) => a - b);
  if (sorted.length === 0) {
    return source.slice(0, 2000);
  }

  const rendered: string[] = [];
  let previous = -2;

  for (const index of sorted) {
    if (index - previous > 1 && rendered.length > 0) {
      rendered.push('// ...');
    }

    const line = lines[index] ?? '';
    rendered.push(foldLine(line));
    previous = index;
  }

  return rendered.join('\n').trim();
};

export const readInterfaceSnapshot = async (
  sessionId: string,
  path: string,
  options?: ReadInterfaceOptions,
): Promise<InterfaceSnapshot> => {
  const repo = requireRepoContextBySession(sessionId);
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const snapshot = await readRepositoryFile(repo, path, {
    startLine: 1,
    endLine: config.maxLines,
    maxChars: config.maxChars,
  });

  return {
    path: snapshot.path,
    language: snapshot.language,
    content: buildInterfaceView(snapshot.content),
    startLine: snapshot.startLine,
    endLine: snapshot.endLine,
    blobUrl: snapshot.blobUrl,
  };
};
