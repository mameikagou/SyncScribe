import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const GITHUB_API_BASE = 'https://api.github.com';

const IGNORED_DIRECTORY_NAMES = new Set([
  '.git',
  '.idea',
  '.vscode',
  '.next',
  '.vercel',
  'node_modules',
  'dist',
  'build',
  'coverage',
  'target',
  '__pycache__',
  '.venv',
  'venv',
]);

const IGNORED_FILE_NAMES = new Set([
  'pnpm-lock.yaml',
  'yarn.lock',
  'package-lock.json',
  'bun.lockb',
  'cargo.lock',
  '.ds_store',
]);

const IGNORED_FILE_EXTENSIONS = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.webp',
  '.svg',
  '.ico',
  '.bmp',
  '.pdf',
  '.zip',
  '.gz',
  '.tar',
  '.7z',
  '.mp4',
  '.mp3',
  '.wav',
  '.mov',
  '.ttf',
  '.woff',
  '.woff2',
]);

type GitHubRepoMeta = {
  default_branch: string;
};

type GitHubContentItem = {
  type: 'file' | 'dir' | 'submodule' | string;
  name: string;
  path: string;
  size?: number;
  sha: string;
  download_url?: string | null;
  html_url?: string;
  encoding?: string;
  content?: string;
};

type GitHubTreeItem = {
  path: string;
  mode: string;
  type: 'blob' | 'tree' | string;
  size?: number;
};

type GitHubTreeResponse = {
  sha: string;
  url: string;
  truncated: boolean;
  tree: GitHubTreeItem[];
};

export type ParsedGitHubRepo = {
  owner: string;
  repo: string;
  branchHint?: string;
  pathHint?: string;
};

export type RepoContext = {
  owner: string;
  repo: string;
  branch: string;
  htmlUrl: string;
  source: 'github' | 'local';
  localRoot?: string;
};

export type RepoDirectoryEntry = {
  name: string;
  path: string;
  type: 'file' | 'dir';
  size: number;
  htmlUrl: string;
};

export type RepoFileSnapshot = {
  path: string;
  content: string;
  language: string;
  startLine: number;
  endLine: number;
  totalLines: number;
  truncated: boolean;
  blobUrl: string;
};

export type RepoSearchHit = {
  path: string;
  score: number;
  url: string;
};

const defaultBranchCache = new Map<string, string>();

const getGitHubHeaders = () => {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'SyncScribe-Vibe-RepoGuide',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  return headers;
};

const toRepoPath = (rawPath: string | undefined) => {
  const value = (rawPath ?? '').trim().replace(/\\/g, '/');
  if (!value) return '';

  const segments = value
    .replace(/^\/+/, '')
    .split('/')
    .filter(Boolean);

  const normalized: string[] = [];
  for (const segment of segments) {
    if (segment === '.') continue;
    if (segment === '..') {
      normalized.pop();
      continue;
    }
    normalized.push(segment);
  }

  return normalized.join('/');
};

const toPosixPath = (value: string) => value.replace(/\\/g, '/');

const encodeRepoPath = (value: string) =>
  value
    .split('/')
    .filter(Boolean)
    .map((part) => encodeURIComponent(part))
    .join('/');

const normalizeExt = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot >= 0 ? name.slice(dot).toLowerCase() : '';
};

const ensureInsideRoot = (root: string, absolutePath: string) => {
  const relative = toPosixPath(path.relative(root, absolutePath));
  if (relative === '') {
    return '';
  }

  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('访问路径超出仓库根目录');
  }

  return toRepoPath(relative);
};

const resolveLocalPath = (repo: RepoContext, rawPath = '') => {
  const root = repo.localRoot;
  if (!root) {
    throw new Error('本地仓库上下文缺少根目录信息');
  }

  const normalized = toRepoPath(rawPath);
  const absolute = path.resolve(root, normalized || '.');
  const relative = ensureInsideRoot(root, absolute);

  return {
    root,
    absolute,
    relative,
  };
};

export const shouldIgnorePath = (rawPath: string, type: 'file' | 'dir') => {
  const pathValue = toRepoPath(rawPath).toLowerCase();
  const segments = pathValue.split('/').filter(Boolean);

  if (segments.some((segment) => IGNORED_DIRECTORY_NAMES.has(segment))) {
    return true;
  }

  const fileName = segments.at(-1) ?? '';

  if (type === 'file') {
    if (IGNORED_FILE_NAMES.has(fileName)) {
      return true;
    }

    if (IGNORED_FILE_EXTENSIONS.has(normalizeExt(fileName))) {
      return true;
    }
  }

  return false;
};

const requestGitHubJson = async <T>(targetPath: string): Promise<T> => {
  const response = await fetch(`${GITHUB_API_BASE}${targetPath}`, {
    method: 'GET',
    headers: getGitHubHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.text();
    const safeBody = body.slice(0, 240);
    throw new Error(`GitHub API ${response.status}: ${safeBody || response.statusText}`);
  }

  return (await response.json()) as T;
};

const requestGitHubText = async (url: string) => {
  const response = await fetch(url, {
    method: 'GET',
    headers: getGitHubHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Download failed: ${response.status} ${response.statusText}`);
  }

  return response.text();
};

const isLikelyLocalPath = (repoUrl: string) => {
  const value = repoUrl.trim();
  return value.startsWith('file://') || path.isAbsolute(value) || value.startsWith('~');
};

const tryResolveLocalDirectory = async (repoUrl: string) => {
  const value = repoUrl.trim();
  if (!isLikelyLocalPath(value)) {
    return null;
  }

  let candidate = value;
  if (value.startsWith('file://')) {
    try {
      candidate = fileURLToPath(new URL(value));
    } catch {
      throw new Error(`本地路径无效：${value}`);
    }
  }

  if (candidate.startsWith('~')) {
    const home = process.env.HOME ?? process.env.USERPROFILE;
    if (!home) {
      throw new Error('无法解析 ~，请改用绝对路径');
    }
    candidate = path.join(home, candidate.slice(1));
  }

  const absolute = path.resolve(candidate);
  let stat;
  try {
    stat = await fs.stat(absolute);
  } catch {
    throw new Error(`本地仓库目录不存在：${absolute}`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`本地仓库路径不是目录：${absolute}`);
  }

  return absolute;
};

const detectLocalGitBranch = async (localRoot: string) => {
  const headPath = path.join(localRoot, '.git', 'HEAD');

  try {
    const head = (await fs.readFile(headPath, 'utf-8')).trim();
    if (!head) return undefined;

    if (head.startsWith('ref:')) {
      const ref = head.replace(/^ref:\s*/, '');
      if (ref.startsWith('refs/heads/')) {
        return ref.slice('refs/heads/'.length) || undefined;
      }
      return ref;
    }

    return 'detached';
  } catch {
    return undefined;
  }
};

export const parseGitHubRepoUrl = (repoUrl: string): ParsedGitHubRepo => {
  const value = repoUrl.trim();
  let parsed: URL;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error('仓库地址无效，请输入 GitHub URL 或本地目录绝对路径');
  }

  if (parsed.hostname !== 'github.com') {
    throw new Error('目前仅支持 github.com URL，或者直接传本地目录路径');
  }

  const segments = parsed.pathname.split('/').filter(Boolean);
  if (segments.length < 2) {
    throw new Error('仓库地址缺少 owner 或 repo');
  }

  const owner = decodeURIComponent(segments[0]!);
  const repo = decodeURIComponent(segments[1]!).replace(/\.git$/i, '');

  let branchHint: string | undefined;
  let pathHint: string | undefined;

  if ((segments[2] === 'tree' || segments[2] === 'blob') && segments[3]) {
    branchHint = decodeURIComponent(segments[3]);
    pathHint = toRepoPath(decodeURIComponent(segments.slice(4).join('/')));
  }

  return {
    owner,
    repo,
    branchHint,
    pathHint,
  };
};

export const resolveRepoContext = async (repoUrl: string, branch?: string): Promise<RepoContext> => {
  const localRoot = await tryResolveLocalDirectory(repoUrl);

  if (localRoot) {
    const owner = path.basename(path.dirname(localRoot)) || 'local';
    const repo = path.basename(localRoot) || 'local-repo';
    const localBranch = branch?.trim() || (await detectLocalGitBranch(localRoot)) || 'local';

    return {
      owner,
      repo,
      branch: localBranch,
      htmlUrl: localRoot,
      source: 'local',
      localRoot,
    };
  }

  const parsed = parseGitHubRepoUrl(repoUrl);
  const cacheKey = `${parsed.owner}/${parsed.repo}`;

  if (!defaultBranchCache.has(cacheKey)) {
    const meta = await requestGitHubJson<GitHubRepoMeta>(`/repos/${parsed.owner}/${parsed.repo}`);
    defaultBranchCache.set(cacheKey, meta.default_branch || 'main');
  }

  const resolvedBranch = branch?.trim() || parsed.branchHint || defaultBranchCache.get(cacheKey) || 'main';

  return {
    owner: parsed.owner,
    repo: parsed.repo,
    branch: resolvedBranch,
    htmlUrl: `https://github.com/${parsed.owner}/${parsed.repo}`,
    source: 'github',
  };
};

export const buildBlobUrl = (
  repo: RepoContext,
  rawPath: string,
  startLine?: number,
  endLine?: number,
) => {
  const lineAnchor = startLine
    ? `#L${startLine}${endLine && endLine !== startLine ? `-L${endLine}` : ''}`
    : '';

  if (repo.source === 'local') {
    const { root } = resolveLocalPath(repo, '');
    const normalized = toRepoPath(rawPath);
    const absolute = toPosixPath(path.join(root, normalized));
    return `file:${absolute}${lineAnchor}`;
  }

  const normalized = encodeRepoPath(toRepoPath(rawPath));
  const encodedBranch = encodeURIComponent(repo.branch).replace(/%2F/g, '/');
  return `${repo.htmlUrl}/blob/${encodedBranch}/${normalized}${lineAnchor}`;
};

const sortDirectoryEntries = (entries: RepoDirectoryEntry[]) =>
  entries.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'dir' ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

const listLocalDirectoryContent = async (
  repo: RepoContext,
  rawPath = '',
): Promise<RepoDirectoryEntry[]> => {
  const { absolute, relative } = resolveLocalPath(repo, rawPath);

  let stat;
  try {
    stat = await fs.stat(absolute);
  } catch {
    throw new Error(`${rawPath || '/'} 不存在`);
  }

  if (!stat.isDirectory()) {
    throw new Error(`${rawPath || '/'} 是文件，不是目录`);
  }

  const dirents = await fs.readdir(absolute, { withFileTypes: true });
  const mapped = await Promise.all(
    dirents.map(async (dirent) => {
      const type = dirent.isDirectory() ? 'dir' : dirent.isFile() ? 'file' : null;
      if (!type) {
        return null;
      }

      const entryPath = toRepoPath(toPosixPath(path.join(relative, dirent.name)));
      if (!entryPath || shouldIgnorePath(entryPath, type)) {
        return null;
      }

      let size = 0;
      if (type === 'file') {
        try {
          const fileStat = await fs.stat(path.join(absolute, dirent.name));
          size = fileStat.size;
        } catch {
          size = 0;
        }
      }

      return {
        name: dirent.name,
        path: entryPath,
        type,
        size,
        htmlUrl: buildBlobUrl(repo, entryPath),
      } satisfies RepoDirectoryEntry;
    }),
  );

  return sortDirectoryEntries(mapped.filter((item): item is RepoDirectoryEntry => Boolean(item)));
};

export const listDirectoryContent = async (
  repo: RepoContext,
  rawPath = '',
): Promise<RepoDirectoryEntry[]> => {
  if (repo.source === 'local') {
    return listLocalDirectoryContent(repo, rawPath);
  }

  const normalized = toRepoPath(rawPath);
  const encodedPath = encodeRepoPath(normalized);
  const endpoint = `/repos/${repo.owner}/${repo.repo}/contents${encodedPath ? `/${encodedPath}` : ''}?ref=${encodeURIComponent(repo.branch)}`;

  const payload = await requestGitHubJson<GitHubContentItem[] | GitHubContentItem>(endpoint);

  if (!Array.isArray(payload)) {
    if (payload.type === 'file') {
      throw new Error(`${normalized || '/'} 是文件，不是目录`);
    }
    return [];
  }

  const entries = payload
    .map((item) => {
      const type = item.type === 'dir' ? 'dir' : 'file';
      return {
        name: item.name,
        path: item.path,
        type,
        size: item.size ?? 0,
        htmlUrl: item.html_url ?? buildBlobUrl(repo, item.path),
      } satisfies RepoDirectoryEntry;
    })
    .filter((item) => !shouldIgnorePath(item.path, item.type));

  return sortDirectoryEntries(entries);
};

const decodeFileContent = async (file: GitHubContentItem) => {
  if (file.encoding === 'base64' && file.content) {
    const normalized = file.content.replace(/\n/g, '');
    return Buffer.from(normalized, 'base64').toString('utf-8');
  }

  if (file.download_url) {
    return requestGitHubText(file.download_url);
  }

  throw new Error(`无法读取 ${file.path}`);
};

const inferLanguage = (repoPath: string) => {
  const ext = normalizeExt(repoPath);

  const map: Record<string, string> = {
    '.ts': 'ts',
    '.tsx': 'tsx',
    '.js': 'js',
    '.jsx': 'jsx',
    '.py': 'python',
    '.go': 'go',
    '.java': 'java',
    '.rs': 'rust',
    '.md': 'markdown',
    '.json': 'json',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.toml': 'toml',
    '.css': 'css',
    '.scss': 'scss',
    '.html': 'html',
    '.xml': 'xml',
    '.sh': 'bash',
  };

  return map[ext] ?? 'text';
};

const clampLine = (line: number, total: number) => {
  if (line < 1) return 1;
  if (line > total) return total;
  return line;
};

const toFileSnapshot = (
  repo: RepoContext,
  filePath: string,
  rawText: string,
  options?: {
    startLine?: number;
    endLine?: number;
    maxChars?: number;
  },
): RepoFileSnapshot => {
  if (rawText.includes('\u0000')) {
    throw new Error(`${filePath} 看起来是二进制文件，暂不展示`);
  }

  const lines = rawText.split(/\r?\n/);
  const totalLines = lines.length;

  const startLine = clampLine(options?.startLine ?? 1, totalLines);
  const targetEnd = options?.endLine ?? Math.min(totalLines, startLine + 220);
  const endLine = clampLine(targetEnd, totalLines);

  let content = lines.slice(startLine - 1, endLine).join('\n');
  let truncated = endLine < totalLines;

  const maxChars = options?.maxChars ?? 22000;
  if (content.length > maxChars) {
    content = `${content.slice(0, maxChars)}\n\n// ... 内容已截断`;
    truncated = true;
  }

  return {
    path: filePath,
    content,
    language: inferLanguage(filePath),
    startLine,
    endLine,
    totalLines,
    truncated,
    blobUrl: buildBlobUrl(repo, filePath, startLine, endLine),
  };
};

const readLocalRepositoryFile = async (
  repo: RepoContext,
  rawPath: string,
  options?: {
    startLine?: number;
    endLine?: number;
    maxChars?: number;
  },
): Promise<RepoFileSnapshot> => {
  const normalized = toRepoPath(rawPath);
  if (!normalized) {
    throw new Error('请选择具体文件路径');
  }

  const { absolute, relative } = resolveLocalPath(repo, normalized);

  let stat;
  try {
    stat = await fs.stat(absolute);
  } catch {
    throw new Error(`${normalized} 不存在`);
  }

  if (stat.isDirectory()) {
    throw new Error(`${normalized} 是目录，不是文件`);
  }

  const rawText = await fs.readFile(absolute, 'utf-8');
  return toFileSnapshot(repo, relative, rawText, options);
};

export const readRepositoryFile = async (
  repo: RepoContext,
  rawPath: string,
  options?: {
    startLine?: number;
    endLine?: number;
    maxChars?: number;
  },
): Promise<RepoFileSnapshot> => {
  if (repo.source === 'local') {
    return readLocalRepositoryFile(repo, rawPath, options);
  }

  const normalized = toRepoPath(rawPath);
  if (!normalized) {
    throw new Error('请选择具体文件路径');
  }

  const endpoint = `/repos/${repo.owner}/${repo.repo}/contents/${encodeRepoPath(normalized)}?ref=${encodeURIComponent(repo.branch)}`;

  const payload = await requestGitHubJson<GitHubContentItem[] | GitHubContentItem>(endpoint);

  if (Array.isArray(payload)) {
    throw new Error(`${normalized} 是目录，不是文件`);
  }

  if (payload.type !== 'file') {
    throw new Error(`暂不支持读取 ${payload.type} 类型`);
  }

  const rawText = await decodeFileContent(payload);
  return toFileSnapshot(repo, normalized, rawText, options);
};

const scoreSearchHit = (pathValue: string, query: string) => {
  const lower = pathValue.toLowerCase();
  const index = lower.indexOf(query);
  if (index === -1) return null;

  const fileName = lower.split('/').at(-1) ?? lower;
  const nameBonus = fileName.startsWith(query) ? 120 : fileName.includes(query) ? 80 : 40;
  const depthPenalty = Math.max(0, lower.split('/').length - 3) * 8;
  const positionPenalty = index;
  return nameBonus - depthPenalty - positionPenalty;
};

const searchLocalRepositoryFiles = async (
  repo: RepoContext,
  keyword: string,
  limit = 20,
): Promise<RepoSearchHit[]> => {
  const query = keyword.trim().toLowerCase();
  if (query.length < 2) return [];

  const { root } = resolveLocalPath(repo, '');
  const stack: string[] = [''];
  const hits: RepoSearchHit[] = [];

  while (stack.length > 0) {
    const relativeDir = stack.pop() ?? '';
    const absoluteDir = path.join(root, relativeDir);

    let dirents;
    try {
      dirents = await fs.readdir(absoluteDir, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const dirent of dirents) {
      const entryPath = toRepoPath(toPosixPath(path.join(relativeDir, dirent.name)));
      if (!entryPath) continue;

      if (dirent.isDirectory()) {
        if (!shouldIgnorePath(entryPath, 'dir')) {
          stack.push(entryPath);
        }
        continue;
      }

      if (!dirent.isFile() || shouldIgnorePath(entryPath, 'file')) {
        continue;
      }

      const score = scoreSearchHit(entryPath, query);
      if (score === null) {
        continue;
      }

      hits.push({
        path: entryPath,
        score,
        url: buildBlobUrl(repo, entryPath),
      });
    }
  }

  return hits
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
};

export const searchRepositoryFiles = async (
  repo: RepoContext,
  keyword: string,
  limit = 20,
): Promise<RepoSearchHit[]> => {
  if (repo.source === 'local') {
    return searchLocalRepositoryFiles(repo, keyword, limit);
  }

  const query = keyword.trim().toLowerCase();
  if (query.length < 2) return [];

  const endpoint = `/repos/${repo.owner}/${repo.repo}/git/trees/${encodeURIComponent(repo.branch)}?recursive=1`;
  const payload = await requestGitHubJson<GitHubTreeResponse>(endpoint);

  return payload.tree
    .filter((item) => item.type === 'blob' && !shouldIgnorePath(item.path, 'file'))
    .map((item) => {
      const score = scoreSearchHit(item.path, query);
      if (score === null) {
        return null;
      }

      return {
        path: item.path,
        score,
        url: buildBlobUrl(repo, item.path),
      } satisfies RepoSearchHit;
    })
    .filter((item): item is RepoSearchHit => Boolean(item))
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.max(1, limit));
};

export const normalizeRepoPath = toRepoPath;
