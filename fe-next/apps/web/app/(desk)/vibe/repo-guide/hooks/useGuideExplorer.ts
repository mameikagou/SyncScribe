'use client';

// Spec 来源：
// - specs/02-specs/vibe-repo-guide/RG-023-view-hooks.md

import { useCallback, useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { repoGuideClient } from '@/app/(desk)/vibe/repo-guide/services/repo-guide-client';
import { activeDocIdAtom } from '@/app/(desk)/vibe/repo-guide/store/workbench-atoms';
import type { GuideExplorerVM } from '@/app/(desk)/vibe/repo-guide/types';
import type { GuideManifest } from '@/server/services/vibe/repo-guide/types';

const EMPTY_CATEGORIES: GuideManifest['categories'] = [];

export const useGuideExplorer = (params: {
  sessionId: string | null;
}): GuideExplorerVM => {
  const [activeDocId, setActiveDocId] = useAtom(activeDocIdAtom);
  const [categories, setCategories] = useState<GuideManifest['categories']>(EMPTY_CATEGORIES);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!params.sessionId) {
      setCategories(EMPTY_CATEGORIES);
      setActiveDocId(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const manifest = await repoGuideClient.getGuideManifest(params.sessionId);
      setCategories(manifest.categories);

      const firstDoc = manifest.categories[0]?.docs[0]?.id ?? null;
      if (firstDoc) {
        setActiveDocId((current) => current ?? firstDoc);
      }
    } catch (requestError) {
      setError((requestError as Error).message);
      setCategories(EMPTY_CATEGORIES);
    } finally {
      setIsLoading(false);
    }
  }, [params.sessionId, setActiveDocId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const onSelectDoc = useCallback(
    (docId: string) => {
      setActiveDocId(docId);
    },
    [setActiveDocId],
  );

  return {
    categories,
    activeDocId,
    isLoading,
    error,
    onSelectDoc,
    reload,
  };
};
