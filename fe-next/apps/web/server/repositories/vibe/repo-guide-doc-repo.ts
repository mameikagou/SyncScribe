// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-026-guide-markdown-service.md

import type { GuideDoc } from '@/server/services/vibe/repo-guide/types';

const docStore = new Map<string, Map<string, GuideDoc>>();

export const getDoc = (sessionId: string, docId: string): GuideDoc | null => {
  return docStore.get(sessionId)?.get(docId) ?? null;
};

export const setDoc = (sessionId: string, doc: GuideDoc): void => {
  if (!docStore.has(sessionId)) {
    docStore.set(sessionId, new Map<string, GuideDoc>());
  }

  docStore.get(sessionId)!.set(doc.id, doc);
};
