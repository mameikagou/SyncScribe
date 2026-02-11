import { readRepositoryFile } from '@/server/services/vibe/repo-guide/github';
import { requireRepoContextBySession, requireRepoGuideSession } from '@/server/services/vibe/repo-guide/session';
import type {
  RepoManifest,
  SkeletonFile,
  SkeletonIndex,
  SkeletonSymbol,
} from '@/server/services/vibe/repo-guide/types';

type BuildSkeletonOptions = {
  maxFilesToParse?: number;
  maxLinesPerFile?: number;
  maxCharsPerFile?: number;
};

const DEFAULT_OPTIONS: Required<BuildSkeletonOptions> = {
  maxFilesToParse: 240,
  maxLinesPerFile: 520,
  maxCharsPerFile: 36000,
};

const CONTROL_WORDS = new Set(['if', 'for', 'while', 'switch', 'catch', 'return', 'do', 'try']);

const uniqSymbols = (symbols: SkeletonSymbol[]) => {
  const seen = new Set<string>();
  const result: SkeletonSymbol[] = [];

  for (const symbol of symbols) {
    const key = `${symbol.kind}:${symbol.name}:${symbol.line ?? 0}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(symbol);
  }

  return result;
};

const shortSignature = (line: string) => {
  const compact = line.trim().replace(/\s+/g, ' ');
  if (compact.length <= 180) return compact;
  return `${compact.slice(0, 177)}...`;
};

const pushSymbol = (
  symbols: SkeletonSymbol[],
  kind: SkeletonSymbol['kind'],
  name: string,
  line: number,
  signature?: string,
) => {
  if (!name) return;
  symbols.push({
    kind,
    name,
    line,
    signature,
  });
};

const extractSymbolsFromCode = (source: string): SkeletonSymbol[] => {
  const symbols: SkeletonSymbol[] = [];
  const lines = source.split(/\r?\n/);

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('*')) {
      continue;
    }

    const lineNumber = index + 1;

    let match = trimmed.match(/^(?:export\s+)?(?:abstract\s+)?class\s+([A-Za-z_$][\w$]*)/);
    if (match) {
      pushSymbol(symbols, 'class', match[1]!, lineNumber, shortSignature(line));
      continue;
    }

    match = trimmed.match(/^(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/);
    if (match) {
      pushSymbol(symbols, 'function', match[1]!, lineNumber, shortSignature(line));
      continue;
    }

    match = trimmed.match(/^(?:export\s+)?interface\s+([A-Za-z_$][\w$]*)/);
    if (match) {
      pushSymbol(symbols, 'interface', match[1]!, lineNumber, shortSignature(line));
      continue;
    }

    match = trimmed.match(/^(?:export\s+)?type\s+([A-Za-z_$][\w$]*)\s*=/);
    if (match) {
      pushSymbol(symbols, 'type', match[1]!, lineNumber, shortSignature(line));
      continue;
    }

    match = trimmed.match(/^(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=/);
    if (match) {
      pushSymbol(symbols, 'const', match[1]!, lineNumber, shortSignature(line));
      continue;
    }

    match = trimmed.match(
      /^(?:public|private|protected|static|readonly|async|\s)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*(?::\s*[^={]+)?\s*[;{]/,
    );
    if (match) {
      const methodName = match[1]!.trim();
      if (!CONTROL_WORDS.has(methodName)) {
        pushSymbol(symbols, 'method', methodName, lineNumber, shortSignature(line));
      }
      continue;
    }

    match = trimmed.match(/^export\s+\{([^}]*)\}/);
    if (match) {
      const names = match[1]!
        .split(',')
        .map((chunk) => chunk.trim().split(/\s+as\s+/i)[0] ?? '')
        .filter(Boolean);

      for (const name of names) {
        pushSymbol(symbols, 'export', name, lineNumber, shortSignature(line));
      }
    }
  }

  return uniqSymbols(symbols);
};

const fileToSkeleton = async (
  sessionId: string,
  filePath: string,
  options: Required<BuildSkeletonOptions>,
): Promise<SkeletonFile | null> => {
  const repo = requireRepoContextBySession(sessionId);

  const snapshot = await readRepositoryFile(repo, filePath, {
    startLine: 1,
    endLine: options.maxLinesPerFile,
    maxChars: options.maxCharsPerFile,
  });

  const symbols = extractSymbolsFromCode(snapshot.content);
  if (symbols.length === 0) {
    return null;
  }

  return {
    path: snapshot.path,
    language: snapshot.language,
    symbols,
  };
};

export const buildSkeletonIndex = async (
  sessionId: string,
  manifest: RepoManifest,
  options?: BuildSkeletonOptions,
): Promise<SkeletonIndex> => {
  const session = requireRepoGuideSession(sessionId);

  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
  };

  const candidateFiles = manifest.entries
    .filter((entry) => entry.indexable)
    .slice(0, config.maxFilesToParse);

  const files: SkeletonFile[] = [];

  for (const entry of candidateFiles) {
    try {
      const skeletonFile = await fileToSkeleton(sessionId, entry.path, config);
      if (skeletonFile) {
        files.push(skeletonFile);
      }
    } catch {
      // 读取失败时跳过，避免单文件错误阻塞整个索引流程。
    }
  }

  return {
    repoKey: session.repoKey,
    generatedAt: new Date().toISOString(),
    files,
  };
};
