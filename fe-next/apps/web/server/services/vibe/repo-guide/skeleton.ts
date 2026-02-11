import { promises as fs } from 'node:fs';
import * as path from 'node:path';

import { Lang, parse } from '@ast-grep/napi';

import { normalizeRepoPath, shouldIgnorePath } from './github';

const DEFAULT_MAX_FILES = 3000;
const DEFAULT_MAX_FILE_SIZE_BYTES = 384 * 1024;

type LanguageKey = 'javascript' | 'typescript' | 'tsx' | 'python' | 'go' | 'rust' | 'java';

type SymbolKind =
  | 'class'
  | 'constructor'
  | 'enum'
  | 'function'
  | 'impl'
  | 'interface'
  | 'method'
  | 'module'
  | 'record'
  | 'struct'
  | 'trait'
  | 'type';

export type SkeletonSymbol = {
  name: string;
  kind: SymbolKind;
  nodeType: string;
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
};

export type SkeletonFile = {
  path: string;
  language: LanguageKey;
  byteSize: number;
  symbolCount: number;
  symbols: SkeletonSymbol[];
};

export type SkeletonSummary = {
  rootPath: string;
  generatedAt: string;
  scannedFileCount: number;
  parsedFileCount: number;
  skippedBySizeCount: number;
  skippedBinaryCount: number;
  skippedUnsupportedCount: number;
  skippedIgnoredCount: number;
  skippedByLimit: number;
  filesWithSymbols: number;
  totalSymbols: number;
};

export type RepoSkeleton = {
  repoPath: string;
  generatedAt: string;
  summary: SkeletonSummary;
  files: SkeletonFile[];
  errors: Array<{
    path: string;
    message: string;
  }>;
};

export type GenerateRepoSkeletonOptions = {
  repoPath: string;
  maxFiles?: number;
  maxFileSizeBytes?: number;
};

type CandidateFile = {
  relativePath: string;
  absolutePath: string;
  language: LanguageKey;
  lang: Lang;
  byteSize: number;
};

type AstPointLike = {
  line?: number;
  row?: number;
  column?: number;
};

type AstRangeLike = {
  start?: AstPointLike;
  end?: AstPointLike;
};

type AstNodeLike = {
  text(): string;
  range(): AstRangeLike;
};

type SymbolRule = {
  nodeKind: string;
  symbolKind: SymbolKind;
  extractName: (nodeText: string) => string | null;
};

type LanguageConfig = {
  language: LanguageKey;
  primaryLangKey: string;
  fallbackLangKey?: string;
};

const toPosixPath = (value: string) => value.replace(/\\/g, '/');

const LANG_REGISTRY = Lang as unknown as Record<string, Lang | undefined>;

const LANGUAGE_CONFIG_BY_EXT: Record<string, LanguageConfig> = {
  '.cjs': { language: 'javascript', primaryLangKey: 'JavaScript' },
  '.go': { language: 'go', primaryLangKey: 'Go' },
  '.java': { language: 'java', primaryLangKey: 'Java' },
  '.js': { language: 'javascript', primaryLangKey: 'JavaScript' },
  '.jsx': { language: 'javascript', primaryLangKey: 'JavaScript' },
  '.mjs': { language: 'javascript', primaryLangKey: 'JavaScript' },
  '.py': { language: 'python', primaryLangKey: 'Python' },
  '.rs': { language: 'rust', primaryLangKey: 'Rust' },
  '.ts': { language: 'typescript', primaryLangKey: 'TypeScript' },
  '.tsx': { language: 'tsx', primaryLangKey: 'Tsx', fallbackLangKey: 'TypeScript' },
};

const trimName = (value: string | undefined) => {
  if (!value) return null;
  const cleaned = value.trim().replace(/^['"`]+/, '').replace(/['"`]+$/, '');
  return cleaned || null;
};

const extractByRegex = (nodeText: string, pattern: RegExp) => {
  const match = nodeText.match(pattern);
  return trimName(match?.[1]);
};

const parseJsLikeMethodName = (nodeText: string) => {
  const firstLine = nodeText.split(/\r?\n/, 1)[0] ?? nodeText;
  return extractByRegex(
    firstLine,
    /^(?:async\s+)?(?:static\s+)?(?:public\s+|private\s+|protected\s+)?(?:get\s+|set\s+)?\*?\s*([A-Za-z_$][\w$]*)\s*\(/,
  );
};

const parseGoTypeName = (nodeText: string) => {
  const firstLine = nodeText.split(/\r?\n/, 1)[0] ?? nodeText;
  return extractByRegex(firstLine, /^([A-Za-z_][\w]*)/);
};

const parseRustImplName = (nodeText: string) => {
  const firstLine = nodeText.split(/\r?\n/, 1)[0] ?? nodeText;
  return extractByRegex(firstLine, /^impl(?:\s*<[^>]+>)?\s+([A-Za-z_][\w:]*)/) ?? 'impl';
};

const parseJavaMethodName = (nodeText: string) => {
  const firstLine = nodeText.split(/\r?\n/, 1)[0] ?? nodeText;
  return extractByRegex(firstLine, /([A-Za-z_][\w]*)\s*\(/);
};

const RULES_BY_LANGUAGE: Record<LanguageKey, SymbolRule[]> = {
  javascript: [
    {
      nodeKind: 'function_declaration',
      symbolKind: 'function',
      extractName: (text) => extractByRegex(text, /^function\*?\s+([A-Za-z_$][\w$]*)\s*\(/),
    },
    {
      nodeKind: 'generator_function_declaration',
      symbolKind: 'function',
      extractName: (text) => extractByRegex(text, /^function\*\s+([A-Za-z_$][\w$]*)\s*\(/),
    },
    {
      nodeKind: 'class_declaration',
      symbolKind: 'class',
      extractName: (text) => extractByRegex(text, /^class\s+([A-Za-z_$][\w$]*)/),
    },
    {
      nodeKind: 'method_definition',
      symbolKind: 'method',
      extractName: parseJsLikeMethodName,
    },
    {
      nodeKind: 'variable_declarator',
      symbolKind: 'function',
      extractName: (text) =>
        extractByRegex(text, /^([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/),
    },
  ],
  typescript: [
    {
      nodeKind: 'function_declaration',
      symbolKind: 'function',
      extractName: (text) => extractByRegex(text, /^function\*?\s+([A-Za-z_$][\w$]*)\s*\(/),
    },
    {
      nodeKind: 'generator_function_declaration',
      symbolKind: 'function',
      extractName: (text) => extractByRegex(text, /^function\*\s+([A-Za-z_$][\w$]*)\s*\(/),
    },
    {
      nodeKind: 'class_declaration',
      symbolKind: 'class',
      extractName: (text) => extractByRegex(text, /^class\s+([A-Za-z_$][\w$]*)/),
    },
    {
      nodeKind: 'method_definition',
      symbolKind: 'method',
      extractName: parseJsLikeMethodName,
    },
    {
      nodeKind: 'interface_declaration',
      symbolKind: 'interface',
      extractName: (text) => extractByRegex(text, /^interface\s+([A-Za-z_$][\w$]*)/),
    },
    {
      nodeKind: 'type_alias_declaration',
      symbolKind: 'type',
      extractName: (text) => extractByRegex(text, /^type\s+([A-Za-z_$][\w$]*)\s*=/),
    },
    {
      nodeKind: 'enum_declaration',
      symbolKind: 'enum',
      extractName: (text) => extractByRegex(text, /^enum\s+([A-Za-z_$][\w$]*)/),
    },
    {
      nodeKind: 'variable_declarator',
      symbolKind: 'function',
      extractName: (text) =>
        extractByRegex(text, /^([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/),
    },
  ],
  tsx: [
    {
      nodeKind: 'function_declaration',
      symbolKind: 'function',
      extractName: (text) => extractByRegex(text, /^function\*?\s+([A-Za-z_$][\w$]*)\s*\(/),
    },
    {
      nodeKind: 'generator_function_declaration',
      symbolKind: 'function',
      extractName: (text) => extractByRegex(text, /^function\*\s+([A-Za-z_$][\w$]*)\s*\(/),
    },
    {
      nodeKind: 'class_declaration',
      symbolKind: 'class',
      extractName: (text) => extractByRegex(text, /^class\s+([A-Za-z_$][\w$]*)/),
    },
    {
      nodeKind: 'method_definition',
      symbolKind: 'method',
      extractName: parseJsLikeMethodName,
    },
    {
      nodeKind: 'interface_declaration',
      symbolKind: 'interface',
      extractName: (text) => extractByRegex(text, /^interface\s+([A-Za-z_$][\w$]*)/),
    },
    {
      nodeKind: 'type_alias_declaration',
      symbolKind: 'type',
      extractName: (text) => extractByRegex(text, /^type\s+([A-Za-z_$][\w$]*)\s*=/),
    },
    {
      nodeKind: 'enum_declaration',
      symbolKind: 'enum',
      extractName: (text) => extractByRegex(text, /^enum\s+([A-Za-z_$][\w$]*)/),
    },
    {
      nodeKind: 'variable_declarator',
      symbolKind: 'function',
      extractName: (text) =>
        extractByRegex(text, /^([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/),
    },
  ],
  python: [
    {
      nodeKind: 'function_definition',
      symbolKind: 'function',
      extractName: (text) => extractByRegex(text, /^def\s+([A-Za-z_][\w]*)\s*\(/),
    },
    {
      nodeKind: 'class_definition',
      symbolKind: 'class',
      extractName: (text) => extractByRegex(text, /^class\s+([A-Za-z_][\w]*)/),
    },
  ],
  go: [
    {
      nodeKind: 'function_declaration',
      symbolKind: 'function',
      extractName: (text) => extractByRegex(text, /^func\s+([A-Za-z_][\w]*)\s*\(/),
    },
    {
      nodeKind: 'method_declaration',
      symbolKind: 'method',
      extractName: (text) => extractByRegex(text, /^func\s*\([^)]*\)\s*([A-Za-z_][\w]*)\s*\(/),
    },
    {
      nodeKind: 'type_spec',
      symbolKind: 'type',
      extractName: parseGoTypeName,
    },
  ],
  rust: [
    {
      nodeKind: 'function_item',
      symbolKind: 'function',
      extractName: (text) => extractByRegex(text, /^fn\s+([A-Za-z_][\w]*)\s*\(/),
    },
    {
      nodeKind: 'struct_item',
      symbolKind: 'struct',
      extractName: (text) => extractByRegex(text, /^struct\s+([A-Za-z_][\w]*)/),
    },
    {
      nodeKind: 'enum_item',
      symbolKind: 'enum',
      extractName: (text) => extractByRegex(text, /^enum\s+([A-Za-z_][\w]*)/),
    },
    {
      nodeKind: 'trait_item',
      symbolKind: 'trait',
      extractName: (text) => extractByRegex(text, /^trait\s+([A-Za-z_][\w]*)/),
    },
    {
      nodeKind: 'impl_item',
      symbolKind: 'impl',
      extractName: parseRustImplName,
    },
    {
      nodeKind: 'mod_item',
      symbolKind: 'module',
      extractName: (text) => extractByRegex(text, /^mod\s+([A-Za-z_][\w]*)/),
    },
  ],
  java: [
    {
      nodeKind: 'class_declaration',
      symbolKind: 'class',
      extractName: (text) => extractByRegex(text, /^class\s+([A-Za-z_][\w]*)/),
    },
    {
      nodeKind: 'interface_declaration',
      symbolKind: 'interface',
      extractName: (text) => extractByRegex(text, /^interface\s+([A-Za-z_][\w]*)/),
    },
    {
      nodeKind: 'enum_declaration',
      symbolKind: 'enum',
      extractName: (text) => extractByRegex(text, /^enum\s+([A-Za-z_][\w]*)/),
    },
    {
      nodeKind: 'record_declaration',
      symbolKind: 'record',
      extractName: (text) => extractByRegex(text, /^record\s+([A-Za-z_][\w]*)/),
    },
    {
      nodeKind: 'constructor_declaration',
      symbolKind: 'constructor',
      extractName: parseJavaMethodName,
    },
    {
      nodeKind: 'method_declaration',
      symbolKind: 'method',
      extractName: parseJavaMethodName,
    },
  ],
};

const oneBasedLine = (point: AstPointLike | undefined) => {
  const line = point?.line ?? point?.row ?? 0;
  return line + 1;
};

const oneBasedColumn = (point: AstPointLike | undefined) => {
  const column = point?.column ?? 0;
  return column + 1;
};

const toSymbolKey = (symbol: SkeletonSymbol) => {
  return [
    symbol.kind,
    symbol.name,
    symbol.startLine,
    symbol.startColumn,
    symbol.endLine,
    symbol.endColumn,
  ].join(':');
};

const resolveAstLanguage = (config: LanguageConfig) => {
  const primary = LANG_REGISTRY[config.primaryLangKey];
  if (primary) return primary;

  if (!config.fallbackLangKey) return null;
  return LANG_REGISTRY[config.fallbackLangKey] ?? null;
};

const resolveLanguageFromPath = (repoPath: string) => {
  const ext = path.extname(repoPath).toLowerCase();
  const config = LANGUAGE_CONFIG_BY_EXT[ext];
  if (!config) return null;

  const lang = resolveAstLanguage(config);
  if (!lang) return null;

  return {
    language: config.language,
    lang,
  };
};

const collectSymbolsWithAstGrep = (source: string, language: LanguageKey, lang: Lang): SkeletonSymbol[] => {
  const ast = parse(lang, source);
  const root = ast.root() as {
    findAll(query: unknown): AstNodeLike[];
  };

  const rules = RULES_BY_LANGUAGE[language];
  const symbols: SkeletonSymbol[] = [];
  const seen = new Set<string>();

  for (const rule of rules) {
    const nodes = root.findAll({ rule: { kind: rule.nodeKind } });

    for (const node of nodes) {
      const nodeText = node.text();
      const name = rule.extractName(nodeText);
      if (!name) continue;

      const range = node.range();
      const symbol: SkeletonSymbol = {
        name,
        kind: rule.symbolKind,
        nodeType: rule.nodeKind,
        startLine: oneBasedLine(range.start),
        startColumn: oneBasedColumn(range.start),
        endLine: oneBasedLine(range.end),
        endColumn: oneBasedColumn(range.end),
      };

      const key = toSymbolKey(symbol);
      if (seen.has(key)) continue;

      seen.add(key);
      symbols.push(symbol);
    }
  }

  return symbols.sort((left, right) => {
    if (left.startLine !== right.startLine) return left.startLine - right.startLine;
    if (left.startColumn !== right.startColumn) return left.startColumn - right.startColumn;
    return left.name.localeCompare(right.name);
  });
};

const expandHome = (value: string) => {
  if (!value.startsWith('~')) return value;
  const home = process.env.HOME ?? process.env.USERPROFILE;
  if (!home) {
    throw new Error('Cannot resolve ~ without HOME or USERPROFILE');
  }
  if (value === '~') return home;
  return path.join(home, value.slice(2));
};

const resolveRepoRoot = async (rawRepoPath: string) => {
  const trimmed = rawRepoPath.trim();
  if (!trimmed) {
    throw new Error('repoPath is required');
  }

  const absolutePath = path.resolve(expandHome(trimmed));

  let stat;
  try {
    stat = await fs.stat(absolutePath);
  } catch {
    throw new Error(`Repository path does not exist: ${absolutePath}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`Repository path is not a directory: ${absolutePath}`);
  }

  return absolutePath;
};

const collectCandidateFiles = async (
  rootPath: string,
  maxFiles: number,
): Promise<{
  files: CandidateFile[];
  skippedIgnoredCount: number;
  skippedUnsupportedCount: number;
  skippedByLimit: number;
}> => {
  const files: CandidateFile[] = [];
  const directories: string[] = [''];
  let skippedIgnoredCount = 0;
  let skippedUnsupportedCount = 0;
  let skippedByLimit = 0;

  while (directories.length > 0) {
    const relativeDir = directories.pop() ?? '';
    const absoluteDir = path.join(rootPath, relativeDir);

    let dirEntries;
    try {
      dirEntries = await fs.readdir(absoluteDir, { withFileTypes: true });
    } catch {
      continue;
    }

    dirEntries.sort((left, right) => left.name.localeCompare(right.name));

    for (const entry of dirEntries) {
      const relativePath = normalizeRepoPath(toPosixPath(path.join(relativeDir, entry.name)));
      if (!relativePath) continue;

      if (entry.isDirectory()) {
        if (shouldIgnorePath(relativePath, 'dir')) {
          skippedIgnoredCount += 1;
          continue;
        }
        directories.push(relativePath);
        continue;
      }

      if (!entry.isFile()) continue;

      if (shouldIgnorePath(relativePath, 'file')) {
        skippedIgnoredCount += 1;
        continue;
      }

      const languageInfo = resolveLanguageFromPath(relativePath);
      if (!languageInfo) {
        skippedUnsupportedCount += 1;
        continue;
      }

      if (files.length >= maxFiles) {
        skippedByLimit += 1;
        continue;
      }

      const absolutePath = path.join(rootPath, relativePath);
      let stat;
      try {
        stat = await fs.stat(absolutePath);
      } catch {
        continue;
      }

      files.push({
        relativePath,
        absolutePath,
        language: languageInfo.language,
        lang: languageInfo.lang,
        byteSize: stat.size,
      });
    }
  }

  return {
    files,
    skippedIgnoredCount,
    skippedUnsupportedCount,
    skippedByLimit,
  };
};

export const generateRepoSkeleton = async (
  options: GenerateRepoSkeletonOptions,
): Promise<RepoSkeleton> => {
  const rootPath = await resolveRepoRoot(options.repoPath);
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE_BYTES;

  const candidateResult = await collectCandidateFiles(rootPath, maxFiles);

  const files: SkeletonFile[] = [];
  const errors: RepoSkeleton['errors'] = [];

  let parsedFileCount = 0;
  let skippedBySizeCount = 0;
  let skippedBinaryCount = 0;
  let totalSymbols = 0;

  for (const candidate of candidateResult.files) {
    if (candidate.byteSize > maxFileSizeBytes) {
      skippedBySizeCount += 1;
      continue;
    }

    let rawText: string;
    try {
      rawText = await fs.readFile(candidate.absolutePath, 'utf-8');
    } catch (error) {
      errors.push({
        path: candidate.relativePath,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    if (rawText.includes('\u0000')) {
      skippedBinaryCount += 1;
      continue;
    }

    let symbols: SkeletonSymbol[] = [];
    try {
      symbols = collectSymbolsWithAstGrep(rawText, candidate.language, candidate.lang);
    } catch (error) {
      errors.push({
        path: candidate.relativePath,
        message: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    parsedFileCount += 1;

    if (!symbols.length) continue;

    totalSymbols += symbols.length;

    files.push({
      path: candidate.relativePath,
      language: candidate.language,
      byteSize: candidate.byteSize,
      symbolCount: symbols.length,
      symbols,
    });
  }

  files.sort((left, right) => left.path.localeCompare(right.path));

  const generatedAt = new Date().toISOString();

  return {
    repoPath: rootPath,
    generatedAt,
    summary: {
      rootPath,
      generatedAt,
      scannedFileCount: candidateResult.files.length,
      parsedFileCount,
      skippedBySizeCount,
      skippedBinaryCount,
      skippedUnsupportedCount: candidateResult.skippedUnsupportedCount,
      skippedIgnoredCount: candidateResult.skippedIgnoredCount,
      skippedByLimit: candidateResult.skippedByLimit,
      filesWithSymbols: files.length,
      totalSymbols,
    },
    files,
    errors,
  };
};

export const saveRepoSkeletonToFile = async (skeleton: RepoSkeleton, outputPath: string) => {
  const absoluteOutputPath = path.resolve(expandHome(outputPath.trim()));
  const outputDir = path.dirname(absoluteOutputPath);

  await fs.mkdir(outputDir, { recursive: true });
  await fs.writeFile(absoluteOutputPath, `${JSON.stringify(skeleton, null, 2)}\n`, 'utf-8');

  return absoluteOutputPath;
};
