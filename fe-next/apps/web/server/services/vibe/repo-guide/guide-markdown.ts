// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-013-orchestrator.md
// - specs/02-specs/vibe-repo-guide/RG-026-guide-markdown-service.md

import { getDoc, setDoc } from '@/server/repositories/vibe/repo-guide-doc-repo';
import { parseGuideLink, formatGuideLink } from '@/app/(desk)/vibe/repo-guide/lib/magic-link';
import {
  buildGuideManifest,
  decodeGuideDocId,
  encodeGuideDocId,
} from '@/server/services/vibe/repo-guide/guide-manifest';
import { readImplementationSnapshot } from '@/server/services/vibe/repo-guide/implementation-reader';
import { readInterfaceSnapshot } from '@/server/services/vibe/repo-guide/interface-reader';
import type { GuideDoc, GuideDocAnchor } from '@/server/services/vibe/repo-guide/types';

type NormalizeResult = {
  markdown: string;
  anchors: GuideDocAnchor[];
};

const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;

const toFileName = (path: string) => {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts.at(-1) ?? normalized;
};

const toDirectoryPath = (path: string) => {
  const normalized = path.replace(/\\/g, '/');
  const index = normalized.lastIndexOf('/');
  if (index < 0) return '';
  return normalized.slice(0, index);
};

const inferSymbolName = (path: string) => {
  const fileName = toFileName(path);
  return fileName.replace(/\.[^.]+$/, '') || 'main';
};

const createFallbackMarkdown = (input: {
  title: string;
  filePath: string;
  interfaceExcerpt: string;
  implementationExcerpt: string;
}) => {
  const openLink = formatGuideLink({
    action: 'open',
    file: input.filePath,
    startLine: 1,
    endLine: 120,
  });

  const focusLink = formatGuideLink({
    action: 'focus',
    file: input.filePath,
    symbol: inferSymbolName(input.filePath),
  });

  const treeLink = formatGuideLink({
    action: 'tree',
    path: toDirectoryPath(input.filePath),
  });

  return [
    `# ${input.title}`,
    '',
    '## 直觉',
    `这个文档聚焦 ${toFileName(input.filePath)} 的职责与调用关系，帮助你先建立定位感再深入实现细节。`,
    '',
    '## 心智模型',
    '你可以把它看作“入口协议 + 业务实现”两层：先看暴露接口，再看具体分支。',
    '',
    '## 源码链路',
    `- [打开核心片段](${openLink})`,
    `- [聚焦核心符号](${focusLink})`,
    `- [在文件树定位](${treeLink})`,
    '',
    '## 接口摘录',
    '```txt',
    input.interfaceExcerpt || '证据不足：未能读取接口层内容。',
    '```',
    '',
    '## 实现摘录',
    '```txt',
    input.implementationExcerpt || '证据不足：未能读取实现层内容。',
    '```',
  ].join('\n');
};

export const normalizeGuideAnchors = (markdown: string): NormalizeResult => {
  if (!markdown.trim()) {
    return {
      markdown,
      anchors: [],
    };
  }

  const anchors: GuideDocAnchor[] = [];
  let normalizedMarkdown = markdown;

  for (const match of markdown.matchAll(LINK_PATTERN)) {
    const label = match[1]?.trim();
    const href = match[2]?.trim();

    if (!label || !href) {
      continue;
    }

    const command = parseGuideLink(href);
    if (!command) {
      continue;
    }

    const normalizedHref = formatGuideLink(command);
    normalizedMarkdown = normalizedMarkdown.replace(href, normalizedHref);

    if (command.action === 'tree') {
      anchors.push({
        label,
        path: command.path,
        startLine: 1,
        endLine: 1,
      });
      continue;
    }

    if (command.action === 'focus') {
      anchors.push({
        label,
        path: command.file,
        startLine: 1,
        endLine: 1,
      });
      continue;
    }

    anchors.push({
      label,
      path: command.file,
      startLine: command.startLine,
      endLine: command.endLine,
    });
  }

  return {
    markdown: normalizedMarkdown,
    anchors,
  };
};


export const buildGuideMarkdown = async (input: {
  sessionId: string;
  docId: string;
}): Promise<GuideDoc> => {
  const cached = getDoc(input.sessionId, input.docId);
  if (cached) {
    return cached;
  }

  const manifest = await buildGuideManifest(input.sessionId);
  const docMeta = manifest.categories
    .flatMap((category) => category.docs)
    .find((doc) => doc.id === input.docId);

  if (!docMeta) {
    throw new Error(`文档标识不存在: ${input.docId}`);
  }

  const filePath = decodeGuideDocId(docMeta.id);

  let interfaceExcerpt = '';
  let implementationExcerpt = '';

  try {
    const snapshot = await readInterfaceSnapshot(input.sessionId, filePath, {
      maxLines: 200,
      maxChars: 10000,
    });
    interfaceExcerpt = snapshot.content.slice(0, 1200);
  } catch {
    interfaceExcerpt = '证据不足：接口快照读取失败。';
  }

  try {
    const snapshot = await readImplementationSnapshot({
      sessionId: input.sessionId,
      path: filePath,
      startLine: 1,
      endLine: 160,
      maxChars: 12000,
    });
    implementationExcerpt = snapshot.content.slice(0, 1500);
  } catch {
    implementationExcerpt = '证据不足：实现快照读取失败。';
  }

  const rawMarkdown = createFallbackMarkdown({
    title: docMeta.title,
    filePath,
    interfaceExcerpt,
    implementationExcerpt,
  });

  let normalized = normalizeGuideAnchors(rawMarkdown);

  if (normalized.anchors.length === 0) {
    const fallbackLink = formatGuideLink({
      action: 'open',
      file: filePath,
      startLine: 1,
      endLine: 80,
    });

    normalized = normalizeGuideAnchors(`${rawMarkdown}\n\n- [打开源码](${fallbackLink})`);
  }

  const doc: GuideDoc = {
    id: docMeta.id,
    title: docMeta.title,
    markdown: normalized.markdown,
    anchors: normalized.anchors,
  };

  setDoc(input.sessionId, doc);
  return doc;
};

export const isGuideDocId = (value: string) => {
  try {
    return decodeGuideDocId(value).length > 0;
  } catch {
    return false;
  }
};

export const createGuideDocId = (path: string) => {
  return encodeGuideDocId(path);
};
