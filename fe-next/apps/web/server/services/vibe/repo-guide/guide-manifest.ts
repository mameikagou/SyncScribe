// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-013-orchestrator.md
// - specs/02-specs/vibe-repo-guide/RG-025-guide-manifest-service.md

import { getManifest, setManifest } from '@/server/repositories/vibe/repo-guide-manifest-repo';
import { getSkeletonByRepoKey } from '@/server/services/vibe/repo-guide/index-store';
import { requireRepoGuideSession } from '@/server/services/vibe/repo-guide/session';
import type {
  GuideManifest,
  GuideManifestCategory,
  GuideManifestDoc,
  SkeletonFile,
} from '@/server/services/vibe/repo-guide/types';

type TopicRule = {
  id: string;
  title: string;
  test: (path: string) => boolean;
};

const TOPIC_RULES: TopicRule[] = [
  {
    id: 'entry-router',
    title: '入口与路由',
    test: (path) => path.includes('/router') || path.includes('/route') || path.includes('/app.ts'),
  },
  {
    id: 'service-core',
    title: '业务服务',
    test: (path) => path.includes('/service') || path.includes('/orchestrator'),
  },
  {
    id: 'data-model',
    title: '数据模型与状态',
    test: (path) => path.includes('/model') || path.includes('/types') || path.includes('/store'),
  },
  {
    id: 'view-ui',
    title: '视图与交互',
    test: (path) => path.includes('/component') || path.includes('/page') || path.includes('/view'),
  },
  {
    id: 'hooks-flow',
    title: 'Hook 与流程编排',
    test: (path) => path.includes('/hook') || path.includes('use'),
  },
];

const FALLBACK_CATEGORY: Pick<GuideManifestCategory, 'id' | 'title'> = {
  id: 'core-overview',
  title: '核心实现总览',
};

const toFileName = (path: string) => {
  const normalized = path.replace(/\\/g, '/');
  const parts = normalized.split('/').filter(Boolean);
  return parts.at(-1) ?? normalized;
};

const toDocTitle = (path: string) => {
  const file = toFileName(path);
  return `${file} 实现解读`;
};

const buildDocSummary = (file: SkeletonFile): string => {
  if (file.symbols.length === 0) {
    return `聚焦文件 ${file.path} 的结构与职责。`;
  }

  const names = file.symbols.slice(0, 3).map((item) => item.name);
  const moreCount = Math.max(0, file.symbols.length - names.length);
  const more = moreCount > 0 ? `，另有 ${moreCount} 个符号` : '';

  return `重点阅读 ${names.join('、')}${more}。`;
};

const matchTopic = (path: string): Pick<GuideManifestCategory, 'id' | 'title'> => {
  const normalized = path.toLowerCase();
  const rule = TOPIC_RULES.find((item) => item.test(normalized));
  if (rule) {
    return {
      id: rule.id,
      title: rule.title,
    };
  }

  return FALLBACK_CATEGORY;
};

export const encodeGuideDocId = (path: string) => {
  return `doc:${encodeURIComponent(path)}`;
};

export const decodeGuideDocId = (docId: string) => {
  if (!docId.startsWith('doc:')) {
    throw new Error(`文档标识不存在: ${docId}`);
  }

  const encodedPath = docId.slice(4);
  if (!encodedPath) {
    throw new Error(`文档标识不存在: ${docId}`);
  }

  return decodeURIComponent(encodedPath);
};

const pushDocToCategory = (
  buckets: Map<string, GuideManifestCategory>,
  categoryMeta: Pick<GuideManifestCategory, 'id' | 'title'>,
  doc: GuideManifestDoc,
) => {
  if (!buckets.has(categoryMeta.id)) {
    buckets.set(categoryMeta.id, {
      id: categoryMeta.id,
      title: categoryMeta.title,
      docs: [],
    });
  }

  buckets.get(categoryMeta.id)!.docs.push(doc);
};

export const buildGuideManifest = async (sessionId: string): Promise<GuideManifest> => {
  const cached = getManifest(sessionId);
  if (cached) {
    return cached;
  }

  const session = requireRepoGuideSession(sessionId);
  const skeleton = getSkeletonByRepoKey(session.repoKey);

  if (!skeleton) {
    throw new Error('索引尚未准备，请先完成索引');
  }

  if (skeleton.files.length === 0) {
    const emptyManifest: GuideManifest = {
      categories: [],
    };

    setManifest(sessionId, emptyManifest);
    return emptyManifest;
  }

  const buckets = new Map<string, GuideManifestCategory>();

  for (const file of skeleton.files) {
    const category = matchTopic(file.path);

    pushDocToCategory(buckets, category, {
      id: encodeGuideDocId(file.path),
      title: toDocTitle(file.path),
      summary: buildDocSummary(file),
    });
  }

  const categories = [...buckets.values()]
    .map((category) => ({
      ...category,
      docs: [...category.docs].sort((a, b) => a.title.localeCompare(b.title)),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const manifest: GuideManifest = {
    categories,
  };

  setManifest(sessionId, manifest);
  return manifest;
};
