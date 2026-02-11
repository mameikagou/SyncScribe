// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-025-guide-manifest-service.md

import type { GuideManifest } from '@/server/services/vibe/repo-guide/types';

const manifestStore = new Map<string, GuideManifest>();

export const getManifest = (sessionId: string): GuideManifest | null => {
  return manifestStore.get(sessionId) ?? null;
};

export const setManifest = (sessionId: string, manifest: GuideManifest): void => {
  manifestStore.set(sessionId, manifest);
};
